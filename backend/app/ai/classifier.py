"""
classifier.py — Project integration wrapper for component_classifier.py
========================================================================
Single import point for the rest of the backend:

    from app.ai.classifier import classify, classify_batch

Returns unified dicts with all fields the backend + frontend expect:
  label, category, description_he, confidence, low_confidence, attributes
"""

import logging
import warnings
from functools import lru_cache
from typing import Optional

logger = logging.getLogger(__name__)

# ── Label → internal category slug ────────────────────────────────────────────
LABEL_TO_CATEGORY: dict[str, str] = {
    "כבל":          "cable",
    "ג'יביק":       "sfp-qsfp",
    "גיביק":        "sfp-qsfp",
    "כרטיסיה":      "io-card",
    "דיסק":         "disk",
    "מדף דיסקים":   "disk-shelf",
    "מתג":          "switch",
    "שרת אחסון":    "server-storage",
    "שרת":          "server",
    "רישוי ותמיכה": "license",
    "ציוד נלווה":   "accessory",
    "אחר":          "other",
    "לא בטוח":      "other",
}

# ── Keyword override rules (applied when model is uncertain) ───────────────────
# Each rule: (regex_pattern, result_label, result_category, description_he_template)
import re as _re_k
_KEYWORD_RULES = [
    # Storage arrays — NetApp AFF / FAS / ASA series (hardware)
    (_re_k.compile(r'\bAFF[-\s]?[AC]?\d+|\bFAS\d+|\bASA\s?A?\d+', _re_k.I),
     "שרת אחסון", "server-storage"),
    # StorageGRID software → license (SW prefix = software upgrade)
    (_re_k.compile(r'^SW[,\s].*StorageGRID|^SW[,\s].*(software|license|pack|bundle|subscription)', _re_k.I),
     "רישוי ותמיכה", "license"),
    # Support / maintenance contracts and license packs
    (_re_k.compile(r'(support|maintenance|warranty|svc|service).*(contract|annual|yr|year)', _re_k.I),
     "רישוי ותמיכה", "license"),
    (_re_k.compile(r'(foundation|base|starter|essentials)\s*(pack|bundle|license)', _re_k.I),
     "רישוי ותמיכה", "license"),
    (_re_k.compile(r'(SaaS|subscription|backup).*(pack|bundle|\d+yr|\d+\s*year)', _re_k.I),
     "רישוי ותמיכה", "license"),
    # Transceivers / SFP family
    (_re_k.compile(r'\b(SFP\+?|QSFP\+?|QSFP28|QSFP56|QSFP-DD|XFP|OSFP|QSFP112)\b', _re_k.I),
     "ג'יביק", "sfp-qsfp"),
    # Disk shelves
    (_re_k.compile(r'\b(DS\d{3}[A-Z]?|Disk Shelf|shelf)', _re_k.I),
     "מדף דיסקים", "disk-shelf"),
    # Individual drives / drive packs
    (_re_k.compile(r'\b(Drive Pack|Drive,|\bNVMe\b|\bHDD\b|\bSSD\b).*\d+\.?\d*(TB|GB)', _re_k.I),
     "דיסק", "disk"),
    (_re_k.compile(r'^(HDD|SSD|NVMe)[,\s].*\d+\.?\d*(TB|GB)', _re_k.I),
     "דיסק", "disk"),
    # Switches — Cisco Nexus / NetApp CN
    (_re_k.compile(r'\b(N9K|N3K|N5K|Nexus\s*\d+|Cluster\s+Switch)', _re_k.I),
     "מתג", "switch"),
]

# ── Hebrew value formatter (mirrors frontend formatAttrValue) ─────────────────
import re as _re

_PROTOCOL_HE   = {"ETH": "ETH", "FC": "FC", "FC+ETH": "FC+ETH", "NVMe": "NVMe"}
_MODE_HE       = {"MMF": "רב-מצב", "SMF": "חד-מצב"}
_DISK_TYPE_HE  = {"NVMe": "NVMe", "SSD": "SSD", "HDD": "HDD"}
_CABLE_TYPE_HE = {
    "MPO-MPO": "MPO-MPO", "MPO-LC": "MPO-LC", "LC-LC": "LC-LC",
    "DAC": "נחושת (DAC)", "AOC": "AOC אופטי", "MiniSAS": "MiniSAS",
    "QSFP-QSFP": "QSFP-QSFP", "Breakout": "Breakout", "Fiber": "סיב אופטי",
    "Ethernet Patch": "כבל רשת", "Power": "כבל חשמל",
}
_FIBER_HE      = {"OM4/MMF": "OM4 / רב-מצב", "SMF": "חד-מצב (SMF)"}
_INTERFACE_HE  = {"12G SAS": "SAS 12G", "NVMe": "NVMe"}


def _fmt(key: str, value) -> str:
    """Translate a raw attribute value to Hebrew display string."""
    if not value and value != 0:
        return str(value)
    v = str(value).strip()

    # Ports: "4 ports" → "4 פורטים"
    m = _re.match(r'^(\d+)\s*ports?$', v, _re.I)
    if m:
        return f"{m.group(1)} פורטים"

    # Slots: "60 slots" → "60 מקומות"
    m = _re.match(r'^(\d+)\s*slots?$', v, _re.I)
    if m:
        return f"{m.group(1)} מקומות"

    # Length: "5m" → "5 מטר", "3ft" → "3 רגל"
    m = _re.match(r'^(\d+\.?\d*)\s*m$', v, _re.I)
    if m:
        return f"{m.group(1)} מטר"
    m = _re.match(r'^(\d+)\s*ft$', v, _re.I)
    if m:
        return f"{m.group(1)} רגל"

    # Speed: "100G" → "100 גיגה", "25G/100G" → "25 גיגה / 100 גיגה"
    if _re.match(r'^\d+G(/\d+G)*$', v):
        return " / ".join(f"{s[:-1]} גיגה" for s in v.split("/"))
    m = _re.match(r'^(\d+)GbE$', v, _re.I)
    if m:
        return f"{m.group(1)} גיגה"

    # Drive count (bare number)
    if key == "drive_count" and _re.match(r'^\d+$', v):
        return f"{v} יחידות"

    # Capacity: keep as-is but uppercase
    if _re.match(r'^\d+\.?\d*(TB|GB)$', v, _re.I):
        return v.upper()

    # Named lookups
    if key == "protocol":
        return _PROTOCOL_HE.get(v, v)
    if key == "mode":
        return _MODE_HE.get(v, v)
    if key == "fiber":
        return _FIBER_HE.get(v, v)
    if key == "disk_type":
        return _DISK_TYPE_HE.get(v, v)
    if key == "disk_type_support":
        return " + ".join(_DISK_TYPE_HE.get(t.strip(), t.strip()) for t in v.split("+"))
    if key == "cable_type":
        return _CABLE_TYPE_HE.get(v, v)
    if key == "interface":
        return _INTERFACE_HE.get(v, v)

    return v


# ── Auto description_he builders ──────────────────────────────────────────────
def _desc_cable(label: str, attrs: dict) -> str:
    parts = ["כבל"]
    if ct := attrs.get("cable_type"):
        parts.append(_fmt("cable_type", ct))
    if ln := attrs.get("length"):
        parts.append(f"אורך {_fmt('length', ln)}")
    if sp := attrs.get("speed"):
        parts.append(f"מהירות {_fmt('speed', sp)}")
    return " ".join(parts)

def _desc_transceiver(label: str, attrs: dict) -> str:
    parts = ["ג'יביק"]
    if ff := attrs.get("form_factor"):
        parts.append(ff)                          # QSFP28, SFP28 — keep as-is
    if sp := attrs.get("speed"):
        parts.append(f"מהירות {_fmt('speed', sp)}")
    if pr := attrs.get("protocol"):
        parts.append(_fmt("protocol", pr))
    return " ".join(parts)

def _desc_nic(label: str, attrs: dict) -> str:
    parts = ["כרטיסיה"]
    if pr := attrs.get("protocol"):
        parts.append(_fmt("protocol", pr))
    if pt := attrs.get("ports"):
        parts.append(_fmt("ports", pt))
    if sp := attrs.get("speed"):
        parts.append(f"מהירות {_fmt('speed', sp)}")
    if ct := attrs.get("connector_type"):
        parts.append(ct)                          # SFP, QSFP28, miniSAS — keep as-is
    return " ".join(parts)

def _desc_disk(label: str, attrs: dict) -> str:
    parts = ["דיסק"]
    if dc := attrs.get("drive_count"):
        parts.append(f"{dc}x")
    if dt := attrs.get("disk_type"):
        parts.append(_fmt("disk_type", dt))
    if cap := attrs.get("capacity"):
        parts.append(_fmt("capacity", cap))
    return " ".join(parts)

def _desc_switch(label: str, attrs: dict) -> str:
    parts = ["מתג"]
    if pt := attrs.get("ports"):
        parts.append(_fmt("ports", pt))
    if sp := attrs.get("speed"):
        parts.append(_fmt("speed", sp))
    if pr := attrs.get("protocol"):
        parts.append(_fmt("protocol", pr))
    return " ".join(parts)

def _desc_shelf(label: str, attrs: dict) -> str:
    parts = ["מדף דיסקים"]
    if sl := attrs.get("slots"):
        parts.append(_fmt("slots", sl))
    if dt := attrs.get("disk_type_support"):
        parts.append(_fmt("disk_type_support", dt))
    return " ".join(parts)

_DESC_BUILDERS = {
    "cable":        _desc_cable,
    "sfp-qsfp":     _desc_transceiver,
    "io-card":      _desc_nic,
    "disk":         _desc_disk,
    "switch":       _desc_switch,
    "disk-shelf":   _desc_shelf,
}



# ── Model loader (singleton) ───────────────────────────────────────────────────
@lru_cache(maxsize=1)
def _get_classifier():
    """Import component_classifier once; cache the module object."""
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            import app.ai.component_classifier as cc
        logger.info("component_classifier loaded (model: component_classifier_v2.pkl)")
        return cc
    except Exception as exc:
        logger.error("Failed to load component_classifier: %s", exc)
        return None


# ── Internal builder ──────────────────────────────────────────────────────────
def _build_result(raw: dict) -> dict:
    """Convert component_classifier output to the unified project format."""
    label = raw.get("label", "אחר")
    confidence = raw.get("confidence", 0.0)
    attrs = raw.get("attributes", {}) or {}

    category = LABEL_TO_CATEGORY.get(label, "other")
    low_confidence = (label == "לא בטוח") or (confidence < 0.40)

    # Build auto Hebrew description from attrs; fall back to bare label
    builder = _DESC_BUILDERS.get(category)
    if builder and attrs:
        description_he = builder(label, attrs)
    else:
        description_he = label if label not in ("לא בטוח", "אחר") else ""

    return {
        "label":          label,
        "category":       category,
        "description_he": description_he,
        "confidence":     round(confidence, 3),
        "low_confidence": low_confidence,
        "attributes":     attrs,
    }


def _fallback() -> dict:
    return {
        "label":          "אחר",
        "category":       "other",
        "description_he": "",
        "confidence":     0.0,
        "low_confidence": True,
        "attributes":     {},
    }


def _keyword_override(description: str) -> Optional[dict]:
    """Return a high-confidence result when the description matches a known keyword rule.
    Runs AFTER the ML model so we only override 'uncertain' results.
    For disk/transceiver rules, also runs the real attribute extractor."""
    from app.ai.component_classifier import (
        _extract_disk, _extract_transceiver, _extract_nic, _extract_switch
    )
    _EXTRACTORS = {
        "disk":      _extract_disk,
        "sfp-qsfp":  _extract_transceiver,
        "io-card":   _extract_nic,
        "switch":    _extract_switch,
    }
    d = description.strip()
    for pattern, label, category in _KEYWORD_RULES:
        if pattern.search(d):
            # Run the attribute extractor if one exists for this category
            attrs = {}
            extractor = _EXTRACTORS.get(category)
            if extractor:
                try:
                    attrs = extractor(d)
                except Exception:
                    pass
            # Build Hebrew description from attrs
            builder = _DESC_BUILDERS.get(category)
            if builder and attrs:
                desc_he = builder(label, attrs)
            else:
                desc_he = label if label not in ("לא בטוח", "אחר") else ""
            return {
                "label":          label,
                "category":       category,
                "description_he": desc_he,
                "confidence":     0.80,
                "low_confidence": False,
                "attributes":     attrs,
            }
    return None


# ── Public API ────────────────────────────────────────────────────────────────
def classify(description: str) -> dict:
    """Classify a single product description. Returns unified result dict."""
    if not description or not description.strip():
        return _fallback()
    cc = _get_classifier()
    if cc is None:
        return _fallback()
    try:
        raw = cc.classify(description.strip())
        result = _build_result(raw)
        # If model is uncertain, try keyword rules
        if result["category"] == "other" or result["low_confidence"]:
            override = _keyword_override(description)
            if override:
                return override
        return result
    except Exception as exc:
        logger.warning("classify() error for %r: %s", description[:80], exc)
        return _fallback()


def classify_batch(descriptions: list[str]) -> list[dict]:
    """Classify a list of descriptions. Returns one result dict per input."""
    if not descriptions:
        return []
    return [classify(d) for d in descriptions]

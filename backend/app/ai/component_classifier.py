"""
component_classifier.py
========================
קובץ יחיד לשימוש בפרודקשן.
מכיל את כל ה-extractors + טעינת המודל + פונקציית classify אחת.

שימוש:
    from component_classifier import classify

    result = classify("QSFP28,100GbE,SR,-C")
    print(result)
"""

import re
import os
import joblib

# ─────────────────────────────────────────────────────────────────
# טעינת מודל (פעם אחת בעת import)
# ─────────────────────────────────────────────────────────────────
_MODEL_PATH = os.path.join(os.path.dirname(__file__), "component_classifier_v2.pkl")
_model = joblib.load(_MODEL_PATH)
_CLASSES = _model.classes_.tolist()

CONFIDENCE_THRESHOLD = 0.40   # מתחת לסף → label = "לא בטוח" (הועמד לסף נמוך כדי להפחית "אחר")


# ─────────────────────────────────────────────────────────────────
# Text normaliser — run BEFORE attribute extraction
# ─────────────────────────────────────────────────────────────────

def _normalize(t: str) -> str:
    """Normalise verbose English phrases to the compact forms the extractors expect."""
    import re as _r
    # Lengths: "3 meter" / "3 meters" / "3 metre" → "3m"
    t = _r.sub(r'(\d+\.?\d*)\s*met(?:er|re)s?', lambda m: m.group(1) + 'm', t, flags=_r.I)
    # Lengths: "3 foot" / "3 feet" → "3ft"
    t = _r.sub(r'(\d+)\s*f(?:oo|ee)t\b', lambda m: m.group(1) + 'ft', t, flags=_r.I)
    # Port words → compact form
    t = _r.sub(r'\bsingle[\s-]port\b',  '1pt',  t, flags=_r.I)
    t = _r.sub(r'\bdual[\s-]port\b',    '2pt',  t, flags=_r.I)
    t = _r.sub(r'\bdouble[\s-]port\b',  '2pt',  t, flags=_r.I)
    t = _r.sub(r'\btriple[\s-]port\b',  '3pt',  t, flags=_r.I)
    t = _r.sub(r'\bquad[\s-]port\b',    '4pt',  t, flags=_r.I)
    t = _r.sub(r'\bocta[\s-]port\b',    '8pt',  t, flags=_r.I)
    # "2-Port" / "4 Port" (capital P) → "2pt"
    t = _r.sub(r'\b(\d+)[\s-]port\b',  lambda m: m.group(1) + 'pt', t, flags=_r.I)
    return t


# ─────────────────────────────────────────────────────────────────
# Extractors
# ─────────────────────────────────────────────────────────────────

def _extract_cable(t: str) -> dict:
    t  = _normalize(t)
    tl = t.lower()
    attrs = {}
    if re.search(r'mini.?sas', tl):               attrs["cable_type"] = "MiniSAS"
    elif re.search(r'mpo.?lc|lc.?mpo', tl):       attrs["cable_type"] = "MPO-LC"
    elif re.search(r'mpo.?mpo|mpo type b', tl):    attrs["cable_type"] = "MPO-MPO"
    elif re.search(r'lc.?lc|lc-lc', tl):           attrs["cable_type"] = "LC-LC"
    elif re.search(r'qsfp28.qsfp28|qsfp.*cu', tl): attrs["cable_type"] = "QSFP-QSFP"
    elif re.search(r'breakout|4sfp28|4x25g|4x10g', tl): attrs["cable_type"] = "Breakout"
    elif re.search(r'aoc|active optical', tl):      attrs["cable_type"] = "AOC"
    elif re.search(r'cat6a|cat6|patch cable', tl):  attrs["cable_type"] = "Ethernet Patch"
    elif re.search(r'c13.c14|jumper crd|power cord', tl): attrs["cable_type"] = "Power"
    elif re.search(r'dac|\bcu\b', tl):              attrs["cable_type"] = "DAC"
    else:                                              attrs["cable_type"] = "Fiber"

    m = re.search(r'(\d+\.?\d*)\s*m\b', tl)
    if m:
        attrs["length"] = f"{m.group(1)}m"
    else:
        m2 = re.search(r'(\d+)\s*ft\b', tl)
        if m2: attrs["length"] = f"{m2.group(1)}ft"

    if re.search(r'om4|mmf|multi.?mode|sr\b', tl): attrs["fiber"] = "OM4/MMF"
    elif re.search(r'smf|single.?mode|lr\b|lx', tl): attrs["fiber"] = "SMF"

    spd = re.search(r'(100|40|25|12|10)gb[e/]?', tl)
    if spd: attrs["speed"] = f"{spd.group(1)}G"
    return attrs


def _extract_transceiver(t: str) -> dict:
    tl = t.lower()
    attrs = {}
    if re.search(r'qsfp112', tl):    attrs["form_factor"] = "QSFP112"
    elif re.search(r'qsfp28', tl):   attrs["form_factor"] = "QSFP28"
    elif re.search(r'\bqsfp\b', tl): attrs["form_factor"] = "QSFP"
    elif re.search(r'sfp28', tl):    attrs["form_factor"] = "SFP28"
    elif re.search(r'\bsfp\b', tl):  attrs["form_factor"] = "SFP"

    if re.search(r'\bfc\b|fibre channel|ficon', tl): attrs["protocol"] = "FC"
    elif re.search(r'gbe|eth', tl):                    attrs["protocol"] = "ETH"

    speeds = re.findall(r'(\d+)gbe|(\d+)g\b', tl)
    sv = sorted(
        {(s[0] or s[1]) + "G" for s in speeds if (s[0] or s[1]) and int(s[0] or s[1]) >= 10},
        key=lambda x: int(x[:-1])
    )
    if sv: attrs["speed"] = "/".join(sv)

    if re.search(r'\bmpo\b', tl):             attrs["connector"] = "MPO"
    elif re.search(r'\blc\b|duplex lc', tl):  attrs["connector"] = "LC"

    if re.search(r'sr\b|mmf|om4', tl):    attrs["mode"] = "MMF"
    elif re.search(r'lr\b|lx|smf', tl):   attrs["mode"] = "SMF"
    return attrs


def _extract_nic(t: str) -> dict:
    t  = _normalize(t)
    tl = t.lower()
    attrs = {}
    m = re.search(r'(\d+).?p[to]|(\d+).?port|\b(\d+)-pt\b|\b(\d+)pt\b', tl)
    if m:
        p = m.group(1) or m.group(2) or m.group(3) or m.group(4)
        attrs["ports"] = p + " ports"

    if re.search(r'mini.?sas|minisas', tl):   attrs["connector_type"] = "miniSAS"
    elif re.search(r'qsfp112', tl):            attrs["connector_type"] = "QSFP112"
    elif re.search(r'qsfp28', tl):             attrs["connector_type"] = "QSFP28"
    elif re.search(r'\bqsfp\b', tl):           attrs["connector_type"] = "QSFP"
    elif re.search(r'sfp28', tl):              attrs["connector_type"] = "SFP28"
    elif re.search(r'\bsfp\b', tl):            attrs["connector_type"] = "SFP"
    elif re.search(r'rj45', tl):               attrs["connector_type"] = "RJ45"

    if re.search(r'\bfc\b|fibre channel|ficon', tl): attrs["protocol"] = "FC"
    elif re.search(r'gbe|eth', tl):                    attrs["protocol"] = "ETH"
    if attrs.get("protocol") == "FC" and re.search(r'gbe|eth', tl):
        attrs["protocol"] = "FC+ETH"

    speeds = re.findall(r'(\d+)gbe|(\d+)gb[e/]?\b', tl)
    sv = sorted(
        {(s[0] or s[1]) + "G" for s in speeds if (s[0] or s[1]) and int(s[0] or s[1]) >= 10},
        key=lambda x: int(x[:-1])
    )
    if sv: attrs["speed"] = "/".join(sv)
    return attrs


def _extract_disk(t: str) -> dict:
    t  = _normalize(t)
    tl = t.lower()
    attrs = {}
    # disk_type — NVMe matches NVMe4/NVMe-4 etc., HDD matches nl-sas
    if re.search(r'\bnvme(?:\d+|-\d+)?|\bread.?intensive|u\.2.*gen', tl):
        attrs["disk_type"] = "NVMe"
    elif re.search(r'\bssd\b', tl):
        attrs["disk_type"] = "SSD"
    elif re.search(r'\bhdd\b|nl.?sas', tl):
        attrs["disk_type"] = "HDD"

    # drive_count — matches "2X15.3TB", "10x22TB", "2x1.92TB"
    m = re.search(r'(\d+)[xX](\d+\.?\d*)\s*(tb|gb)', t, re.I)
    if m:
        attrs["drive_count"] = m.group(1)
        attrs["capacity"] = f"{m.group(2)}{m.group(3).upper()}"
    else:
        # capacity without count — largest TB/GB value in string
        caps = re.findall(r'(\d+\.?\d*)\s*(tb|gb)\b', tl)
        if caps:
            best = max(caps, key=lambda x: float(x[0]) * (1024 if x[1] == "tb" else 1))
            attrs["capacity"] = f"{best[0]}{best[1].upper()}"

    return attrs


def _extract_switch(t: str) -> dict:
    t  = _normalize(t)
    tl = t.lower()
    attrs = {}
    port_map = {
        "n9336c": "36", "z9264": "64", "9364": "64", "9332": "32",
        "36pt": "36",   "64pt": "64",
        "9300 series 32": "32", "9300 series 64": "64",
        "9300 with 48p": "48", "24-node": "24",
    }
    for pat, val in port_map.items():
        if pat in tl:
            attrs["ports"] = val + " ports"
            break
    if "ports" not in attrs:
        m = re.search(r'(\d+).?port|(\d+)pt\b|(\d+)-pt\b', tl)
        if m:
            p = m.group(1) or m.group(2) or m.group(3)
            attrs["ports"] = p + " ports"

    if re.search(r'\bfc\b|fibre channel|san\b', tl): attrs["protocol"] = "FC"
    if re.search(r'gbe|eth|100g|40g', tl):
        attrs["protocol"] = "FC+ETH" if attrs.get("protocol") == "FC" else "ETH"

    sv = sorted(
        {(s[0] or s[1]) + "G" for s in re.findall(r'(\d+)gbe|(\d+)g\b', tl)
         if (s[0] or s[1]) and int(s[0] or s[1]) >= 10},
        key=lambda x: int(x[:-1])
    )
    if sv: attrs["speed"] = "/".join(sv)
    return attrs


def _extract_shelf(t: str) -> dict:
    tl = t.lower()
    attrs = {}
    slot_map = {
        "4u60": "60", "ds460c": "60", "2u24": "24", "ds224c": "24",
        "ns224": "24", "nvme shlf": "24", "48 slt": "48", "dme": "48",
    }
    for pat, val in slot_map.items():
        if pat in tl:
            attrs["slots"] = val + " slots"
            break

    disk_types = []
    if re.search(r'\bnvme\b', tl):          disk_types.append("NVMe")
    if re.search(r'\bssd\b', tl):           disk_types.append("SSD")
    if re.search(r'\bhdd\b|nlsas|sas\b', tl): disk_types.append("HDD")
    if disk_types: attrs["disk_type_support"] = "+".join(disk_types)

    if re.search(r'12g|12gb', tl):    attrs["interface"] = "12G SAS"
    elif re.search(r'nvme|gen4', tl): attrs["interface"] = "NVMe"
    return attrs


_EXTRACTORS = {
    "כבל":         _extract_cable,
    "גיביק":       _extract_transceiver,
    "כרטיסיה":    _extract_nic,
    "דיסק":        _extract_disk,
    "מתג":         _extract_switch,
    "מדף דיסקים": _extract_shelf,
}
# תמיכה בשתי האיותים
_EXTRACTORS["ג'יביק"] = _extract_transceiver


# ─────────────────────────────────────────────────────────────────
# פונקציה ציבורית יחידה
# ─────────────────────────────────────────────────────────────────

def classify(text: str) -> dict:
    """
    מסווג תיאור מוצר ומחזיר label + confidence + attributes.

    Args:
        text: תיאור המוצר (מחרוזת חופשית)

    Returns:
        {
            "label":      str,   # קטגוריה
            "confidence": float, # 0.0 - 1.0
            "attributes": dict,  # פרטים נוספים לפי קטגוריה
            "all_probs":  dict   # הסתברות לכל קטגוריה
        }

    Example:
        >>> classify("QSFP28,100GbE,SR,-C")
        {
            "label": "גיביק",
            "confidence": 0.94,
            "attributes": {
                "form_factor": "QSFP28",
                "protocol": "ETH",
                "speed": "100G",
                "mode": "MMF"
            },
            "all_probs": { ... }
        }
    """
    if not text or not text.strip():
        return {"label": "שגיאה", "confidence": 0.0,
                "attributes": {}, "all_probs": {},
                "error": "text is empty"}

    probs    = _model.predict_proba([text])[0]
    prob_map = {c: round(float(p), 4) for c, p in zip(_CLASSES, probs)}
    label    = max(prob_map, key=prob_map.get)
    conf     = prob_map[label]

    if conf < CONFIDENCE_THRESHOLD:
        label = "לא בטוח"

    attrs = _EXTRACTORS.get(label, lambda x: {})(text)

    return {
        "label":      label,
        "confidence": conf,
        "attributes": attrs,
        "all_probs":  prob_map,
    }

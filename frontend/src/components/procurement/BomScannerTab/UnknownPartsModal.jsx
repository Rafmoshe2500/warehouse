import React, { useState } from 'react';
import { CATEGORY_CONFIG, CategoryIcon } from './CategoryIcons';
import './UnknownPartsModal.css';

const CATEGORIES = Object.keys(CATEGORY_CONFIG);

// ── AI-based initialisation ───────────────────────────────────────────────────
// Each part now carries ai_category / ai_description_he / ai_confidence from the
// backend ML model.  We use those instead of the old static keyword-rules.

const getAiDefaults = (part) => {
  const category = part.ai_category || 'other';
  const description_he = part.ai_description_he || '';
  return { category, description_he };
};

const ConfidenceBadge = ({ confidence, lowConfidence }) => {
  if (confidence == null || confidence === 0) return null;
  const pct = Math.round(confidence * 100);
  const color = lowConfidence ? '#f59e0b' : confidence >= 0.85 ? '#22c55e' : '#3b82f6';
  return (
    <span className="upm-confidence-badge" style={{ color, borderColor: color }}>
      🤖 {pct}%{lowConfidence ? ' — בדוק' : ''}
    </span>
  );
};

// ── Attribute key labels (Hebrew) ─────────────────────────────────────────────
const ATTR_LABELS = {
  cable_type:        'סוג כבל',
  length:            'אורך',
  fiber:             'סיב',
  speed:             'מהירות',
  form_factor:       'פורמט',
  protocol:          'פרוטוקול',
  connector:         'חיבור',
  connector_type:    'חיבור',
  mode:              'מצב',
  ports:             'פורטים',
  disk_type:         'סוג דיסק',
  capacity:          'נפח',
  drive_count:       'כמות',
  slots:             'מקומות',
  disk_type_support: 'תמיכה',
  interface:         'ממשק',
};

// ── Attribute value → Hebrew translator ───────────────────────────────────────
const PROTOCOL_HE  = { 'ETH': 'ETH', 'FC': 'FC', 'FC+ETH': 'FC+ETH', 'NVMe': 'NVMe' };
const MODE_HE      = { 'MMF': 'רב-מצב', 'SMF': 'חד-מצב' };
const DISK_TYPE_HE = { 'NVMe': 'NVMe', 'SSD': 'SSD', 'HDD': 'HDD' };
const CABLE_TYPE_HE = {
  'MPO-MPO': 'MPO-MPO', 'MPO-LC': 'MPO-LC', 'LC-LC': 'LC-LC',
  'DAC': 'נחושת (DAC)', 'AOC': 'AOC אופטי', 'MiniSAS': 'MiniSAS',
  'QSFP-QSFP': 'QSFP-QSFP', 'Breakout': 'Breakout', 'Fiber': 'סיב אופטי',
  'Ethernet Patch': 'כבל רשת', 'Power': 'כבל חשמל',
};
const FIBER_HE = {
  'OM4/MMF': 'OM4 / רב-מצב', 'SMF': 'חד-מצב (SMF)',
};
const INTERFACE_HE = { '12G SAS': 'SAS 12G', 'NVMe': 'NVMe' };

/**
 * Translate a raw attribute value to a Hebrew display string.
 * Handles: speeds (100G→100 גיגה), lengths (5m→5 מטר), ports (4 ports→4 פורטים),
 * slots, drive counts, protocols, modes, disk types, cable types, fiber types.
 */
const formatAttrValue = (key, value) => {
  if (!value && value !== 0) return value;
  const v = String(value).trim();

  // ── Ports:  "4 ports" ── "2 ports"
  const portsMatch = v.match(/^(\d+)\s*ports?$/i);
  if (portsMatch) return `${portsMatch[1]} פורטים`;

  // ── Slots: "60 slots" ── "24 slots"
  const slotsMatch = v.match(/^(\d+)\s*slots?$/i);
  if (slotsMatch) return `${slotsMatch[1]} מקומות`;

  // ── Length: "5m", "0.5m", "3ft"
  const mMatch = v.match(/^(\d+\.?\d*)\s*m$/i);
  if (mMatch) return `${mMatch[1]} מטר`;
  const ftMatch = v.match(/^(\d+)\s*ft$/i);
  if (ftMatch) return `${ftMatch[1]} רגל`;

  // ── Speed: "100G", "25G/100G" (split on /)
  if (/^\d+(G)(\/\d+G)*$/.test(v)) {
    return v.split('/').map(s => s.replace(/(\d+)G/, '$1 גיגה')).join(' / ');
  }
  // Speed ending with GbE: "100GbE"
  const gbeMatch = v.match(/^(\d+)GbE$/i);
  if (gbeMatch) return `${gbeMatch[1]} גיגה`;

  // ── Drive count (bare number for drive_count key)
  if (key === 'drive_count' && /^\d+$/.test(v)) return `${v} יחידות`;

  // ── Capacity: "15.3TB", "800GB" — keep as-is (already clear)
  if (/^\d+\.?\d*(TB|GB)$/i.test(v)) return v.toUpperCase();

  // ── Named lookups
  if (key === 'protocol')         return PROTOCOL_HE[v]  || v;
  if (key === 'mode')             return MODE_HE[v]       || v;
  if (key === 'fiber')            return FIBER_HE[v]      || v;
  if (key === 'disk_type')        return DISK_TYPE_HE[v]  || v;
  if (key === 'disk_type_support') {
    // may be "NVMe+HDD" etc.
    return v.split('+').map(t => DISK_TYPE_HE[t.trim()] || t.trim()).join(' + ');
  }
  if (key === 'cable_type')       return CABLE_TYPE_HE[v] || v;
  if (key === 'interface')        return INTERFACE_HE[v]  || v;

  return v;
};

// ── Attributes tags component ─────────────────────────────────────────────────
const AttributesTags = ({ attributes }) => {
  if (!attributes || Object.keys(attributes).length === 0) return null;
  return (
    <div className="upm-attrs-row">
      {Object.entries(attributes).map(([k, v]) => (
        <span key={k} className="upm-attr-tag">
          <span className="upm-attr-key">{ATTR_LABELS[k] || k}</span>
          <span className="upm-attr-val">{formatAttrValue(k, v)}</span>
        </span>
      ))}
    </div>
  );
};

const UnknownPartsModal = ({ unknownParts, onSave, onDone }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [descriptions, setDescriptions] = useState(() =>
    Object.fromEntries(
      unknownParts.map(p => {
        const { description_he } = getAiDefaults(p);
        return [p.part_number, description_he];
      })
    )
  );
  const [categories, setCategories] = useState(() =>
    Object.fromEntries(
      unknownParts.map(p => {
        const { category } = getAiDefaults(p);
        return [p.part_number, category];
      })
    )
  );
  const [importantFlags, setImportantFlags] = useState(() =>
    Object.fromEntries(unknownParts.map(p => [p.part_number, true]))
  );
  const [saving, setSaving] = useState(false);

  const total = unknownParts.length;
  const current = unknownParts[currentIndex];
  const progress = Math.round(((currentIndex) / total) * 100);

  const handleSaveAndNext = async () => {
    setSaving(true);
    try {
      await onSave(current.part_number, {
        description_he: descriptions[current.part_number],
        category: categories[current.part_number],
        important: importantFlags[current.part_number],
        excel_description: current.excel_description,
      });
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
    goNext();
  };

  const handleSkip = () => goNext();

  const goNext = () => {
    if (currentIndex + 1 >= total) {
      onDone();
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  const handleMarkUnimportant = async () => {
    setSaving(true);
    try {
      await onSave(current.part_number, {
        description_he: descriptions[current.part_number] || current.excel_description,
        category: 'other',
        important: false,
        excel_description: current.excel_description,
      });
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
    goNext();
  };

  return (
    <div className="unknown-parts-overlay">
      <div className="unknown-parts-modal" dir="rtl">
        {/* Header */}
        <div className="upm-header">
          <div className="upm-title">חלקים חדשים לזיהוי</div>
          <div className="upm-counter">
            {currentIndex + 1} מתוך {total}
          </div>
        </div>

        {/* Progress bar */}
        <div className="upm-progress-bar">
          <div className="upm-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Part info */}
        <div className="upm-part-info">
          <div className="upm-part-number">{current.part_number}</div>
          {current.excel_description && (
            <div className="upm-excel-desc">{current.excel_description}</div>
          )}
          {/* AI confidence badge + extracted attributes */}
          <div className="upm-ai-row">
            <ConfidenceBadge
              confidence={current.ai_confidence}
              lowConfidence={current.ai_low_confidence}
            />
          </div>
          <AttributesTags attributes={current.ai_attributes} />
        </div>

        {/* Hebrew description */}
        <div className="upm-field">
          <label className="upm-label">תיאור בעברית</label>
          <input
            className="upm-input"
            type="text"
            placeholder="לדוגמא: כרטיסיית רשת 100GbE"
            value={descriptions[current.part_number]}
            onChange={e =>
              setDescriptions(prev => ({ ...prev, [current.part_number]: e.target.value }))
            }
            maxLength={80}
          />
          <span className="upm-char-count">
            {descriptions[current.part_number].length}/80
          </span>
        </div>

        {/* Category icon grid */}
        <div className="upm-field">
          <label className="upm-label">קטגוריה</label>
          <div className="upm-category-grid">
            {CATEGORIES.map(cat => {
              const cfg = CATEGORY_CONFIG[cat];
              if (!cfg) return null;
              const selected = categories[current.part_number] === cat;
              return (
                <button
                  key={cat}
                  className={`upm-cat-tile ${selected ? 'selected' : ''}`}
                  style={selected ? { '--cat-color': cfg.color, '--cat-bg': cfg.bg } : {}}
                  onClick={() =>
                    setCategories(prev => ({ ...prev, [current.part_number]: cat }))
                  }
                  title={cfg.label}
                >
                  <cfg.Icon size={24} color={selected ? cfg.color : 'var(--text-muted)'} />
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="upm-actions">
          <button className="upm-btn upm-btn-unimportant" onClick={handleMarkUnimportant} disabled={saving}>
            לא חשוב
          </button>
          <button className="upm-btn upm-btn-skip" onClick={handleSkip} disabled={saving}>
            דלג
          </button>
          <button
            className="upm-btn upm-btn-save"
            onClick={handleSaveAndNext}
            disabled={saving || !descriptions[current.part_number].trim()}
          >
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnknownPartsModal;

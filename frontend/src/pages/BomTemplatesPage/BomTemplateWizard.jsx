/* ── BomTemplateWizard ────────────────────────────────────────────────
   Multi-step form for creating / editing a BOM template.
   Steps:
     1. Basic Info  — vendor_name + format_id (auto-slugified)
     2. Header      — keywords + scan_rows
     3. Column Map  — Excel header → field key mapping
     4. Group       — group detection mode + options
     5. Filter      — optional data row filter (regex)
     6. Review      — summary before save
───────────────────────────────────────────────────────────────────────── */
import React, { useState, useCallback, useMemo } from 'react';
import { Button, Input } from '../../components/common';
import './BomTemplateWizard.css';

/* ── Inline tooltip component ──────────────────────────────────────────── */
const Tip = ({ text }) => (
  <span className="wiz-tip-wrap">
    <span className="wiz-tip-icon">?</span>
    <span className="wiz-tip-bubble">{text}</span>
  </span>
);

const FIELD_KEYS = [
  { value: 'part_number', label: 'מק"ט (part_number)' },
  { value: 'product', label: 'תיאור מוצר (product)' },
  { value: 'ext_qty', label: 'כמות (ext_qty)' },
  { value: 'ext_list_price', label: 'מחיר רשימה (ext_list_price)' },
  { value: 'ext_net_price', label: 'מחיר נטו (ext_net_price)' },
  { value: 'net_discount', label: 'הנחה (net_discount)' },
  { value: 'mod_group', label: 'קבוצה (mod_group)' },
  { value: 'unit_list_price', label: 'מחיר יח\' (unit_list_price)' },
  { value: 'unit_net_price', label: 'מחיר נטו יח\' (unit_net_price)' },
  { value: 'line_number', label: 'מספר שורה (line_number)' },
  { value: 'line', label: 'שורה (line)' },
  { value: 'service_duration', label: 'משך שירות (service_duration)' },
];

const GROUP_MODES = [
  { value: 'color_fill', label: 'צבע מילוי (עמודת מק"ט)' },
  { value: 'color_fill_any', label: 'צבע מילוי (כל תא)' },
  { value: 'line_number_depth', label: 'עומק מספר שורה (regex)' },
  { value: 'all_rows', label: 'כל שורה = קבוצה נפרדת' },
  { value: 'value_change', label: 'שינוי ערך + כמות = 1' },
];

const STEPS = ['פרטי ספק', 'זיהוי כותרת', 'מיפוי עמודות', 'זיהוי קבוצות', 'סינון שורות', 'סיכום'];

const STEP_DESCRIPTIONS = [
  'הגדירו את שם הספק ומזהה הפורמט. המזהה משמש כמפתח פנימי ייחודי — ניתן לקבל אותו אוטומטית משם הספק.',
  'ציינו מילת מפתח שמופיעה בשורת הכותרת של קובץ ה-Excel (למשל "part number" או "sku"). המערכת תסרוק את השורות הראשונות כדי למצוא אותה.',
  'מפו כל כותרת עמודה ב-Excel לשדה פנימי במערכת. חובה למפות לפחות עמודה אחת למק"ט (part_number).',
  'בחרו כיצד המערכת תזהה כותרות קבוצות (headers) בתוך ה-BOM — לפי צבע תא, עומק מספר שורה, שינוי ערך, וכו\'.',
  'שלב אופציונלי — סנן שורות נתונים לפי ביטוי רגולרי (Regex) כדי להתעלם משורות שאינן פריטים אמיתיים.',
  'בדקו את פרטי התבנית לפני השמירה.',
];

function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0590-\u05FF]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

const BomTemplateWizard = ({ initial, onSubmit, onCancel, saving }) => {
  const isEdit = !!initial;

  const [step, setStep] = useState(0);

  // ─── Form state ──────────────────────────────────────────────────────

  const [vendorName, setVendorName] = useState(initial?.vendor_name || '');
  const [formatId, setFormatId] = useState(initial?.format_id || '');
  const [autoSlug, setAutoSlug] = useState(!isEdit);

  // Header detection
  const [keywords, setKeywords] = useState(
    (initial?.header_detection?.keywords || []).join(', ')
  );
  const [scanRows, setScanRows] = useState(
    initial?.header_detection?.scan_rows || 25
  );

  // Column map  — array of { excel, field }
  const [columns, setColumns] = useState(() => {
    if (initial?.column_map) {
      return Object.entries(initial.column_map).map(([excel, field]) => ({
        excel,
        field,
      }));
    }
    return [{ excel: '', field: 'part_number' }];
  });

  // Group detection
  const [groupMode, setGroupMode] = useState(
    initial?.group_detection?.mode || 'color_fill'
  );
  const [fillColors, setFillColors] = useState(
    (initial?.group_detection?.fill_colors || []).join(', ')
  );
  const [lineNumberRegex, setLineNumberRegex] = useState(
    initial?.group_detection?.line_number_regex || ''
  );

  // Data row filter
  const [filterEnabled, setFilterEnabled] = useState(!!initial?.data_row_filter);
  const [filterField, setFilterField] = useState(
    initial?.data_row_filter?.field || 'line_number'
  );
  const [filterPattern, setFilterPattern] = useState(
    initial?.data_row_filter?.pattern || ''
  );

  // ─── Derived ─────────────────────────────────────────────────────────

  const handleVendorChange = useCallback(
    (e) => {
      const v = e.target.value;
      setVendorName(v);
      if (autoSlug) setFormatId(slugify(v));
    },
    [autoSlug]
  );

  const addColumn = () => setColumns((c) => [...c, { excel: '', field: 'product' }]);
  const removeColumn = (idx) => setColumns((c) => c.filter((_, i) => i !== idx));
  const updateColumn = (idx, key, val) =>
    setColumns((c) => c.map((col, i) => (i === idx ? { ...col, [key]: val } : col)));

  // ─── Build payload ───────────────────────────────────────────────────

  const buildPayload = useMemo(() => {
    const colMap = {};
    columns.forEach(({ excel, field }) => {
      if (excel.trim()) colMap[excel.trim()] = field;
    });

    const kw = keywords
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const groupDetection = { mode: groupMode };
    if (groupMode === 'color_fill' || groupMode === 'color_fill_any') {
      groupDetection.fill_colors = fillColors
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (groupMode === 'line_number_depth') {
      groupDetection.line_number_regex = lineNumberRegex;
    }

    const payload = {
      vendor_name: vendorName.trim(),
      header_detection: {
        mode: 'keyword_scan',
        keywords: kw,
        scan_rows: Number(scanRows) || 25,
      },
      column_map: colMap,
      group_detection: groupDetection,
      data_row_filter: filterEnabled
        ? { mode: 'regex', field: filterField, pattern: filterPattern }
        : null,
    };

    if (!isEdit) {
      payload.format_id = formatId || slugify(vendorName);
    }

    return payload;
  }, [
    vendorName, formatId, keywords, scanRows, columns,
    groupMode, fillColors, lineNumberRegex,
    filterEnabled, filterField, filterPattern, isEdit,
  ]);

  // ─── Validation per step ─────────────────────────────────────────────

  const canProceed = useMemo(() => {
    switch (step) {
      case 0: return vendorName.trim().length >= 2;
      case 1: return keywords.trim().length > 0;
      case 2: return columns.some((c) => c.excel.trim() && c.field === 'part_number');
      case 3: return true;
      case 4: return !filterEnabled || (filterField && filterPattern);
      case 5: return true;
      default: return true;
    }
  }, [step, vendorName, keywords, columns, filterEnabled, filterField, filterPattern]);

  // ─── Step renderers ──────────────────────────────────────────────────

  const renderBasicInfo = () => (
    <div className="bom-wiz-step-content">
      <label>
        שם הספק
        <Tip text="השם שיופיע בממשק — לדוגמה: Lenovo, Juniper. יכול להכיל רווחים." />
      </label>
      <Input
        value={vendorName}
        onChange={handleVendorChange}
        placeholder='לדוגמה: "Lenovo"'
        data-testid="wiz-vendor-name"
      />
      <label>
        מזהה פורמט (slug)
        <Tip text='מחרוזת ייחודית לזיהוי הפורמט, כוללת אותיות, מספרים וקו תחתי בלבד. לדוגמה: "lenovo_quote". נוצר אוטומטית משם הספק, אך ניתן לשנות ידנית. לא ניתן לשינוי לאחר יצירה.' />
      </label>
      <div className="bom-wiz-slug-row">
        <Input
          value={formatId}
          onChange={(e) => { setFormatId(e.target.value); setAutoSlug(false); }}
          disabled={isEdit}
          placeholder="lenovo_quote"
          data-testid="wiz-format-id"
        />
        {!isEdit && (
          <Button
            variant="secondary"
            onClick={() => { setAutoSlug(true); setFormatId(slugify(vendorName)); }}
          >
            אוטומטי
          </Button>
        )}
      </div>
    </div>
  );

  const renderHeaderDetection = () => (
    <div className="bom-wiz-step-content">
      <label>
        מילות מפתח לזיהוי שורת הכותרת
        <Tip text='המערכת תחפש בכל תא בשורות הראשונות את המחרוזת הזו (לא רגיש לרישיות). לדוגמה: "part number" ימצא שורה שמכילה "Part Number". ניתן להזין מספר מילות מפתח מופרדות בפסיק — תספיק התאמה לאחת מהן.' />
      </label>
      <Input
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
        placeholder="part number, sku"
        data-testid="wiz-keywords"
      />
      <label>
        מספר שורות לסריקה
        <Tip text="כמה שורות מתחילת הגיליון לסרוק בחיפוש אחר שורת הכותרת. ברוב הקבצים הכותרת נמצאת בשורות 1–30. הגדר ערך גבוה יותר אם הכותרת מופיעה מאוחר יותר בקובץ." />
      </label>
      <Input
        type="number"
        value={scanRows}
        onChange={(e) => setScanRows(e.target.value)}
        min={1}
        max={100}
        data-testid="wiz-scan-rows"
      />
    </div>
  );

  const colMapValid = columns.some((c) => c.excel.trim() && c.field === 'part_number');

  const renderColumnMap = () => (
    <div className="bom-wiz-step-content">
      <p className="bom-wiz-hint">
        מפה כל כותרת עמודה באקסל לשדה פנימי. חייב לכלול לפחות מיפוי אחד ל-<strong>מק&quot;ט (part_number)</strong>.
      </p>
      {columns.map((col, idx) => (
        <div key={idx} className="bom-wiz-col-row">
          <div className="bom-wiz-col-label-wrap">
            <Input
              placeholder="כותרת באקסל"
              value={col.excel}
              onChange={(e) => updateColumn(idx, 'excel', e.target.value)}
              data-testid={`wiz-col-excel-${idx}`}
            />
            <Tip text="הזן את הכותרת בדיוק כפי שהיא מופיעה בשורת הכותרת בקובץ ה-Excel (לא רגיש לרישיות). לדוגמה: 'Part Number' או 'SKU'." />
          </div>
          <div className="bom-wiz-col-label-wrap">
            <select
              value={col.field}
              onChange={(e) => updateColumn(idx, 'field', e.target.value)}
              data-testid={`wiz-col-field-${idx}`}
              className="bom-wiz-select"
            >
              {FIELD_KEYS.map((fk) => (
                <option key={fk.value} value={fk.value}>
                  {fk.label}
                </option>
              ))}
            </select>
            <Tip text="השדה הפנימי שאליו תמופה העמודה. part_number = מק&quot;ט חובה. product = תיאור. ext_qty = כמות. ext_list_price / ext_net_price = מחירים. השאר — שדות עזר." />
          </div>
          {columns.length > 1 && (
            <button className="bom-wiz-remove-btn" onClick={() => removeColumn(idx)} title="הסר">
              ✕
            </button>
          )}
        </div>
      ))}
      <Button variant="secondary" onClick={addColumn}>
        + הוסף עמודה
      </Button>
      {!colMapValid && columns.some((c) => c.excel.trim()) && (
        <p className="bom-wiz-col-error">
          ⚠️ כדי להמשיך, יש למפות לפחות עמודה אחת לשדה <strong>מק&quot;ט (part_number)</strong>.
          בחר את השדה המתאים ברשימה הנפתחת.
        </p>
      )}
      {!columns.some((c) => c.excel.trim()) && (
        <p className="bom-wiz-col-error">
          ⚠️ יש למלא לפחות שורת מיפוי אחת עם שם העמודה באקסל.
        </p>
      )}
    </div>
  );

  const renderGroupDetection = () => (
    <div className="bom-wiz-step-content">
      <label>
        מצב זיהוי קבוצות
        <Tip text="כיצד המערכת מזהה שורה היא 'כותרת קבוצה' (header) ולא שורת נתונים רגילה. בחר לפי מבנה קובץ ה-Excel של הספק." />
      </label>
      <select
        className="bom-wiz-select full"
        value={groupMode}
        onChange={(e) => setGroupMode(e.target.value)}
        data-testid="wiz-group-mode"
      >
        {GROUP_MODES.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>

      <div className="bom-wiz-mode-desc">
        {groupMode === 'color_fill' && <span>שורה נחשבת לכותרת קבוצה כאשר תא המק&quot;ט שלה צבוע בצבע מסוים (לדוגמה צהוב ב-NetApp).</span>}
        {groupMode === 'color_fill_any' && <span>שורה נחשבת לכותרת קבוצה כאשר כל תא בשורה שיש בו ערך — צבוע (לדוגמה Dell שצובעת את כל השורות הראשיות).</span>}
        {groupMode === 'line_number_depth' && <span>שורה נחשבת לכותרת קבוצה כאשר ערך עמודת מספר השורה תואם לתבנית regex (לדוגמה "1.0" = קבוצה, "1.1" = פריט בן).</span>}
        {groupMode === 'all_rows' && <span>כל שורת נתונים מטופלת כקבוצה נפרדת (לדוגמה HPE שאין בה היררכיה).</span>}
        {groupMode === 'value_change' && <span>שורה נחשבת לכותרת קבוצה כאשר ערך העמודה הראשונה משתנה וכמותה = 1 (לדוגמה BOM גנרי).</span>}
      </div>

      {(groupMode === 'color_fill' || groupMode === 'color_fill_any') && (
        <>
          <label>
            קודי צבע (hex, מופרדים בפסיק)
            <Tip text='קודי צבע של המילוי שמאפיין כותרת קבוצה, בפורמט hex ללא #. לדוגמה: "FFFFFF00" (צהוב). אם השדה ריק, המערכת תחפש כל צבע שאינו לבן/שקוף.' />
          </label>
          <Input
            value={fillColors}
            onChange={(e) => setFillColors(e.target.value)}
            placeholder="FFFFFF00, FFFFFF99"
            data-testid="wiz-fill-colors"
          />
        </>
      )}

      {groupMode === 'line_number_depth' && (
        <>
          <label>
            Regex לזיהוי כותרת קבוצה
            <Tip text='ביטוי רגולרי שמתאים לערכי עמודת "Line Number" שמייצגים כותרת קבוצה. לדוגמה: "^\d+\.\d+$" מתאים ל-"1.0", "2.0" וכן הלאה.' />
          </label>
          <Input
            value={lineNumberRegex}
            onChange={(e) => setLineNumberRegex(e.target.value)}
            placeholder="^\d+\.\d+$"
            data-testid="wiz-line-regex"
          />
        </>
      )}
    </div>
  );

  const renderDataRowFilter = () => (
    <div className="bom-wiz-step-content">
      <label className="bom-wiz-checkbox-label">
        <input
          type="checkbox"
          checked={filterEnabled}
          onChange={(e) => setFilterEnabled(e.target.checked)}
          data-testid="wiz-filter-enabled"
        />
        הפעל סינון שורות נתונים
        <Tip text="אם הקובץ מכיל שורות ריקות, שורות סיכום או טקסט שאינם פריטים — ניתן לסנן אותן לפי תבנית regex על עמודה מסוימת. שורות שלא תואמות יתעלמו." />
      </label>
      {filterEnabled && (
        <>
          <label>
            שדה לסינון
            <Tip text="בחר עמודה שבה מופיע ערך אמין המבדיל שורת נתון אמיתית משורה לא רלוונטית. לרוב משתמשים ב-line_number או part_number." />
          </label>
          <select
            className="bom-wiz-select full"
            value={filterField}
            onChange={(e) => setFilterField(e.target.value)}
          >
            {FIELD_KEYS.map((fk) => (
              <option key={fk.value} value={fk.value}>
                {fk.label}
              </option>
            ))}
          </select>
          <label>
            ביטוי רגולרי (Regex)
            <Tip text='שורה תיכלל בתוצאה רק אם ערך השדה שנבחר תואם לביטוי זה. לדוגמה: "^\d+[\.\d]*$" ישמור רק שורות שבהן line_number הוא מספר כמו "1", "1.2".' />
          </label>
          <Input
            value={filterPattern}
            onChange={(e) => setFilterPattern(e.target.value)}
            placeholder="^\d+[\.\d]*$"
            data-testid="wiz-filter-pattern"
          />
        </>
      )}
    </div>
  );

  const renderReview = () => {
    const p = buildPayload;
    return (
      <div className="bom-wiz-step-content bom-wiz-review">
        <h3>סיכום תבנית</h3>
        <table className="bom-wiz-review-table">
          <tbody>
            <tr><td>ספק</td><td>{p.vendor_name}</td></tr>
            {!isEdit && <tr><td>מזהה</td><td><code>{p.format_id || formatId}</code></td></tr>}
            <tr><td>מילות מפתח</td><td>{p.header_detection.keywords.join(', ')}</td></tr>
            <tr><td>שורות סריקה</td><td>{p.header_detection.scan_rows}</td></tr>
            <tr><td>מיפויים</td><td>{Object.keys(p.column_map).length} עמודות</td></tr>
            <tr><td>מצב קבוצות</td><td>{p.group_detection.mode}</td></tr>
            {p.data_row_filter && (
              <tr><td>פילטר שורות</td><td>{p.data_row_filter.field}: {p.data_row_filter.pattern}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const STEP_RENDERERS = [
    renderBasicInfo,
    renderHeaderDetection,
    renderColumnMap,
    renderGroupDetection,
    renderDataRowFilter,
    renderReview,
  ];

  // ─── Main render ─────────────────────────────────────────────────────

  return (
    <div className="bom-wiz-page" data-testid="bom-template-wizard">
      <div className="bom-wiz-card">
        {/* ── Step indicator ── */}
        <div className="bom-wiz-steps">
          {STEPS.map((label, i) => (
            <div
              key={i}
              className={`bom-wiz-step-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
              onClick={() => i < step && setStep(i)}
            >
              <span className="bom-wiz-dot-num">{i < step ? '✓' : i + 1}</span>
              <span className="bom-wiz-dot-label">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Step content ── */}
        <div className="bom-wiz-step-desc">{STEP_DESCRIPTIONS[step]}</div>
        <div className="bom-wiz-body">{STEP_RENDERERS[step]()}</div>

        {/* ── Navigation ── */}
        <div className="bom-wiz-footer">
          <Button variant="secondary" onClick={step === 0 ? onCancel : () => setStep((s) => s - 1)}>
            {step === 0 ? 'ביטול' : 'הקודם'}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              variant="primary"
              disabled={!canProceed}
              onClick={() => setStep((s) => s + 1)}
            >
              הבא
            </Button>
          ) : (
            <Button
              variant="primary"
              disabled={saving}
              onClick={() => onSubmit(buildPayload)}
              data-testid="wiz-submit"
            >
              {saving ? 'שומר...' : isEdit ? 'עדכן תבנית' : 'צור תבנית'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BomTemplateWizard;

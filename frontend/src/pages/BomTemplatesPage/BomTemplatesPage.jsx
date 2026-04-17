/* ── BOM Templates Management ────────────────────────────────────────────
   Admin page for viewing, creating, editing, and deleting
   dynamic BOM vendor templates.
   Two-panel RTL layout matching existing admin pages.
───────────────────────────────────────────────────────────────────────── */
import React, { useState, useMemo } from 'react';
import { Button, Spinner, Input } from '../../components/common';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/common/Toast/ToastContainer';
import useBomTemplates from '../../hooks/useBomTemplates';
import BomTemplateWizard from './BomTemplateWizard';
import './BomTemplatesPage.css';

const GROUP_MODE_LABELS = {
  color_fill: 'צבע מילוי (עמודה ראשית)',
  color_fill_any: 'צבע מילוי (כל תא)',
  line_number_depth: 'עומק מספר שורה',
  all_rows: 'כל שורה = קבוצה',
  value_change: 'שינוי ערך',
};

const BomTemplatesPage = () => {
  const {
    templates,
    loading,
    error,
    refetch,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  } = useBomTemplates();

  const { toasts, success, error: toastError, removeToast } = useToast();
  const [selected, setSelected] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    if (!searchQuery) return templates;
    const q = searchQuery.toLowerCase();
    return templates.filter(
      (t) =>
        t.vendor_name.toLowerCase().includes(q) ||
        t.format_id.toLowerCase().includes(q)
    );
  }, [templates, searchQuery]);

  const handleCreate = () => {
    setEditingTemplate(null);
    setShowWizard(true);
  };

  const handleEdit = (tmpl) => {
    setEditingTemplate(tmpl);
    setShowWizard(true);
  };

  const handleDelete = async (tmpl) => {
    if (!window.confirm(`למחוק את תבנית "${tmpl.vendor_name}"?`)) return;
    try {
      await deleteTemplate(tmpl.format_id);
      success('התבנית נמחקה');
      if (selected?.format_id === tmpl.format_id) setSelected(null);
    } catch {
      toastError('שגיאה במחיקת התבנית');
    }
  };

  const handleWizardSubmit = async (data) => {
    setSaving(true);
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.format_id, data);
        success('התבנית עודכנה בהצלחה');
      } else {
        await createTemplate(data);
        success('התבנית נוצרה בהצלחה');
      }
      setShowWizard(false);
    } catch (err) {
      toastError(err?.response?.data?.detail || 'שגיאה בשמירת התבנית');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bom-tpl-loading">
        <Spinner size="large" text="טוען תבניות BOM..." />
      </div>
    );
  }

  if (showWizard) {
    return (
      <BomTemplateWizard
        initial={editingTemplate}
        onSubmit={handleWizardSubmit}
        onCancel={() => setShowWizard(false)}
        saving={saving}
      />
    );
  }

  return (
    <div className="bom-tpl-page" data-testid="bom-templates-page">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="bom-tpl-header">
        <h1>ניהול תבניות BOM</h1>
        <p className="bom-tpl-subtitle">
          הגדרת פורמטי ייבוא Excel לכל ספק — מיפוי עמודות, זיהוי כותרות וקבוצות
        </p>
      </div>

      <div className="bom-tpl-panels">
        {/* ─ RIGHT: list panel ─ */}
        <div className="bom-tpl-list-panel">
          <div className="bom-tpl-list-toolbar">
            <Input
              placeholder="חיפוש ספק..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="bom-tpl-search"
            />
            <Button variant="primary" onClick={handleCreate} data-testid="bom-tpl-add">
              + תבנית חדשה
            </Button>
          </div>

          <div className="bom-tpl-list">
            {filtered.length === 0 && (
              <div className="bom-tpl-empty">
                {searchQuery ? 'לא נמצאו תבניות' : 'אין תבניות — צור תבנית ראשונה'}
              </div>
            )}
            {filtered.map((t) => (
              <div
                key={t.format_id}
                className={`bom-tpl-card ${selected?.format_id === t.format_id ? 'active' : ''}`}
                onClick={() => setSelected(t)}
                data-testid={`bom-tpl-card-${t.format_id}`}
              >
                <div className="bom-tpl-card-avatar">
                  {t.vendor_name.charAt(0).toUpperCase()}
                </div>
                <div className="bom-tpl-card-info">
                  <span className="bom-tpl-card-name">{t.vendor_name}</span>
                  <span className="bom-tpl-card-id">{t.format_id}</span>
                </div>
                {t.is_builtin && <span className="bom-tpl-badge builtin">מובנה</span>}
              </div>
            ))}
          </div>
        </div>

        {/* ─ LEFT: detail panel ─ */}
        <div className="bom-tpl-detail-panel">
          {!selected ? (
            <div className="bom-tpl-detail-empty">
              <span className="bom-tpl-detail-icon">📋</span>
              <p>בחר תבנית מהרשימה כדי לצפות בפרטים</p>
            </div>
          ) : (
            <div className="bom-tpl-detail">
              <div className="bom-tpl-detail-header">
                <h2>{selected.vendor_name}</h2>
                <div className="bom-tpl-detail-actions">
                  <Button variant="secondary" onClick={() => handleEdit(selected)}>
                    ערוך
                  </Button>
                  {!selected.is_builtin && (
                    <Button variant="danger" onClick={() => handleDelete(selected)}>
                      מחק
                    </Button>
                  )}
                </div>
              </div>

              <div className="bom-tpl-detail-section">
                <h3>מזהה פורמט</h3>
                <code>{selected.format_id}</code>
              </div>

              <div className="bom-tpl-detail-section">
                <h3>זיהוי כותרת</h3>
                <p>
                  מילות מפתח:{' '}
                  <strong>
                    {selected.header_detection?.keywords?.join(', ') || '—'}
                  </strong>
                </p>
                <p>טווח סריקה: שורות 1–{selected.header_detection?.scan_rows || 25}</p>
              </div>

              <div className="bom-tpl-detail-section">
                <h3>זיהוי קבוצות</h3>
                <p>
                  מצב:{' '}
                  <strong>
                    {GROUP_MODE_LABELS[selected.group_detection?.mode] || selected.group_detection?.mode}
                  </strong>
                </p>
                {selected.group_detection?.fill_colors?.length > 0 && (
                  <div className="bom-tpl-color-swatches">
                    {selected.group_detection.fill_colors.map((c) => (
                      <span
                        key={c}
                        className="bom-tpl-swatch"
                        style={{ background: `#${c.replace(/^00/, '')}` }}
                        title={c}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="bom-tpl-detail-section">
                <h3>מיפוי עמודות</h3>
                <table className="bom-tpl-colmap-table">
                  <thead>
                    <tr>
                      <th>כותרת באקסל</th>
                      <th>שדה פנימי</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(selected.column_map || {}).map(([excel, field]) => (
                      <tr key={excel}>
                        <td>{excel}</td>
                        <td><code>{field}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selected.data_row_filter && (
                <div className="bom-tpl-detail-section">
                  <h3>סינון שורות</h3>
                  <p>
                    שדה: <code>{selected.data_row_filter.field}</code> | תבנית:{' '}
                    <code>{selected.data_row_filter.pattern}</code>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {error && <div className="bom-tpl-error">{error}</div>}
    </div>
  );
};

export default BomTemplatesPage;

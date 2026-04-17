import React from 'react';
import useBomTemplates from '../../hooks/useBomTemplates';
import './PermissionSelector.css';

/**
 * PermissionSelector
 *
 * מבנה הרשאות:
 *  - מלאי:    inventory:ro  |  inventory:rw
 *  - קריאה:   procurement:ro  (כל ספק) + vendor-level procurement:<v>:ro
 *  - עריכה:   procurement:rw  (כל ספק) + vendor-level procurement:<v>:rw
 *  - מחירים:  procurement:view_prices | procurement:compare_prices
 *  - מערכת:   admin
 */
const PermissionSelector = ({ selectedPermissions = [], onChange }) => {
  const { templates } = useBomTemplates();

  // Build VENDORS dynamically from BOM templates (hook provides fallback if API unavailable)
  const VENDORS = templates.map(t => ({ id: t.vendor_name.toLowerCase(), label: t.vendor_name }));

  const has = (id) => selectedPermissions.includes(id);

  const toggle = (id) => {
    has(id)
      ? onChange(selectedPermissions.filter(p => p !== id))
      : onChange([...selectedPermissions, id]);
  };

  // ── כפתורי ספקים (ro / rw) ─────────────────────────────────────────────
  const VendorRow = ({ mode, accentColor, globalPerm }) => {
    const allSelected = has(globalPerm);

    const toggleAll = () => {
      if (allSelected) {
        // הסר גלובלי + כל הספקים
        const vendorPerms = VENDORS.map(v => `procurement:${v.id}:${mode}`);
        onChange(selectedPermissions.filter(p => p !== globalPerm && !vendorPerms.includes(p)));
      } else {
        // הוסף גלובלי, הסר ספקים ספציפיים (מיותרים)
        const vendorPerms = VENDORS.map(v => `procurement:${v.id}:${mode}`);
        const cleaned = selectedPermissions.filter(p => !vendorPerms.includes(p));
        onChange([...cleaned, globalPerm]);
      }
    };

    const toggleVendor = (vendorId) => {
      const perm = `procurement:${vendorId}:${mode}`;
      // אם "הכל" נבחר — לא ניתן לבחור ספציפי בנפרד (הכל כבר כלול)
      if (allSelected) return;
      toggle(perm);
    };

    return (
      <div className="ps-vendor-row">
        {/* "הכל" */}
        <button
          type="button"
          className={`ps-chip ps-chip-all ${allSelected ? 'active' : ''}`}
          style={allSelected ? { borderColor: accentColor, background: `${accentColor}20`, color: accentColor } : {}}
          onClick={toggleAll}
          data-testid={`perm-${globalPerm.replace(/:/g, '-')}-all`}
        >
          <span className="ps-chip-dot" style={allSelected ? { background: accentColor } : {}} />
          כל הספקים
        </button>

        <span className="ps-vendor-sep">|</span>

        {/* ספדים ספציפיים */}
        {VENDORS.map(v => {
          const perm = `procurement:${v.id}:${mode}`;
          const active = allSelected || has(perm);
          const implied = allSelected; // כלול בגלובלי
          return (
            <button
              key={v.id}
              type="button"
              className={`ps-chip ${active ? 'active' : ''} ${implied ? 'implied' : ''}`}
              style={active ? { borderColor: accentColor, background: `${accentColor}15`, color: accentColor } : {}}
              onClick={() => toggleVendor(v.id)}
              title={implied ? 'כלול בהרשאת "כל הספקים"' : undefined}
              data-testid={`perm-procurement-${v.id}-${mode}`}
            >
              <span className="ps-chip-dot" style={active ? { background: accentColor } : {}} />
              {v.label}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="ps-root" data-testid="permission-selector">

      {/* ─── מלאי ─────────────────────────────── */}
      <div className="ps-group">
        <span className="ps-group-label" style={{ color: '#3b82f6' }}>מלאי</span>
        <div className="ps-chips">
          {[
            { id: 'inventory:ro', label: 'קריאה'        },
            { id: 'inventory:rw', label: 'קריאה/כתיבה'  },
          ].map(p => {
            const active = has(p.id);
            return (
              <button key={p.id} type="button"
                className={`ps-chip ${active ? 'active' : ''}`}
                style={active ? { borderColor: '#3b82f6', background: '#3b82f620', color: '#3b82f6' } : {}}
                onClick={() => toggle(p.id)}
                data-testid={`perm-${p.id.replace(':', '-')}`}
              >
                <span className="ps-chip-dot" style={active ? { background: '#3b82f6' } : {}} />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── רכש — קריאה ─────────────────────── */}
      <div className="ps-group">
        <span className="ps-group-label" style={{ color: '#10b981' }}>רכש — קריאה</span>
        <VendorRow mode="ro" accentColor="#10b981" globalPerm="procurement:ro" />
      </div>

      {/* ─── רכש — עריכה ─────────────────────── */}
      <div className="ps-group">
        <span className="ps-group-label" style={{ color: '#f59e0b' }}>רכש — עריכה</span>
        <VendorRow mode="rw" accentColor="#f59e0b" globalPerm="procurement:rw" />
      </div>

      {/* ─── מחירים ──────────────────────────── */}
      <div className="ps-group">
        <span className="ps-group-label" style={{ color: '#a855f7' }}>רכש — מחירים</span>
        <div className="ps-chips">
          {[
            { id: 'procurement:view_prices',    label: '💰 צפייה במחירים'  },
            { id: 'procurement:compare_prices', label: '📊 השוואת מחירים'  },
          ].map(p => {
            const active = has(p.id);
            return (
              <button key={p.id} type="button"
                className={`ps-chip ${active ? 'active' : ''}`}
                style={active ? { borderColor: '#a855f7', background: '#a855f720', color: '#a855f7' } : {}}
                onClick={() => toggle(p.id)}
              >
                <span className="ps-chip-dot" style={active ? { background: '#a855f7' } : {}} />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── מערכת ───────────────────────────── */}
      <div className="ps-group">
        <span className="ps-group-label" style={{ color: '#8b5cf6' }}>מערכת</span>
        <div className="ps-chips">
          {(() => {
            const active = has('admin');
            return (
              <button type="button"
                className={`ps-chip ${active ? 'active' : ''}`}
                style={active ? { borderColor: '#8b5cf6', background: '#8b5cf620', color: '#8b5cf6' } : {}}
                onClick={() => toggle('admin')}
              >
                <span className="ps-chip-dot" style={active ? { background: '#8b5cf6' } : {}} />
                אדמין
              </button>
            );
          })()}
        </div>
      </div>

    </div>
  );
};

export default PermissionSelector;

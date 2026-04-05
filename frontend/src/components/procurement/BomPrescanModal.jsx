import React, { useState, useRef, useCallback } from 'react';
import { FiUploadCloud, FiRefreshCw } from 'react-icons/fi';
import UploadAnimation from '../common/UploadAnimation/UploadAnimation';
import bomService from '../../api/services/bomService';
import { useAuth } from '../../context/AuthContext';
import './BomPrescanModal.css';

const BOM_VENDORS = [
  { id: 'NETAPP', label: 'NetApp', logo: '🟣', color: '#a855f7', format: 'netapp_pricing_template' },
  { id: 'HPE',    label: 'HPE',    logo: '🟢', color: '#22c55e', format: 'hpe_quote'               },
  { id: 'CISCO',  label: 'Cisco',  logo: '🟠', color: '#f97316', format: 'cisco_quote'             },
  { id: 'DELL',   label: 'Dell',   logo: '🔵', color: '#3b82f6', format: 'dell_quote'              },
];

const BomPrescanModal = ({ isOpen, onClose, onDone }) => {
  const { hasVendorAccess } = useAuth();

  // סנן רק ספקים שיש למשתמש הרשאת עריכה עלייהם
  const allowedVendors = BOM_VENDORS.filter(v => hasVendorAccess(v.id, 'rw'));

  const [phase, setPhase] = useState('vendor');
  const [vendor, setVendor] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [scanError, setScanError] = useState('');
  const fileInputRef = useRef(null);

  const reset = () => { setPhase('vendor'); setVendor(null); setFileName(''); setScanError(''); };

  const handleFile = async (file) => {
    if (!file?.name.match(/\.(xlsx|xls)$/i)) {
      setScanError('יש להעלות קובץ Excel בלבד (.xlsx)');
      setPhase('error');
      return;
    }
    setFileName(file.name);
    setPhase('scanning');
    setScanError('');
    try {
      const result = await bomService.scanBomFile(file, vendor.format);
      setPhase('success');
      setTimeout(() => {
        onDone({ result, vendor });
        reset();
      }, 1400);
    } catch (err) {
      setScanError(err?.response?.data?.detail || err?.message || 'שגיאה בסריקת הקובץ');
      setPhase('error');
    }
  };

  const onFileInput = (e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; };
  const onDragOver  = useCallback((e) => { e.preventDefault(); setDragging(true); }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);
  const onDrop      = useCallback((e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }, [vendor]); // eslint-disable-line

  if (!isOpen) return null;

  return (
    <div className="bps-overlay" onClick={onClose}>
      <div className="bps-modal" onClick={e => e.stopPropagation()}>
        <button className="bps-close" onClick={onClose}>✕</button>

        <div className="bps-header">
          <span className="bps-header-icon">📊</span>
          <h2 className="bps-title">העלאת BOM</h2>
          <p className="bps-subtitle">סרוק את קובץ ה-BOM לפני יצירת ההזמנה</p>
        </div>

        {/* Phase: vendor selection */}
        {phase === 'vendor' && (
          <div className="bps-vendors">
            <p className="bps-label">בחר יצרן:</p>
            {allowedVendors.length === 0 ? (
              <p className="bps-label" style={{ color: 'var(--color-text-muted)' }}>
                אין לך הרשאות יצירת הזמנות BOM לאף ספק
              </p>
            ) : (
              <div className="bps-vendor-grid">
                {allowedVendors.map(v => (
                  <button
                    key={v.id}
                    className="bps-vendor-card"
                    style={{ '--vc': v.color }}
                    onClick={() => { setVendor(v); setPhase('upload'); }}
                  >
                    <span className="bps-vendor-logo">{v.logo}</span>
                    <span className="bps-vendor-name">{v.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Phase: upload */}
        {phase === 'upload' && vendor && (
          <div className="bps-upload">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={onFileInput} style={{ display: 'none' }} />
            <div
              className={`bps-dropzone ${dragging ? 'dragging' : ''}`}
              style={{ '--vc': vendor.color }}
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <FiUploadCloud size={36} style={{ color: vendor.color }} />
              <p className="bps-dz-title">{vendor.logo} {vendor.label} BOM</p>
              <p className="bps-dz-hint">גרור קובץ Excel לכאן או לחץ לבחירה</p>
            </div>
            <button className="bps-back-btn" onClick={() => setPhase('vendor')}>← החלף יצרן</button>
          </div>
        )}

        {/* Phase: scanning / success */}
        {(phase === 'scanning' || phase === 'success') && (
          <div className="bps-scanning">
            <UploadAnimation type="excel" status={phase === 'success' ? 'success' : 'scanning'} fileName={fileName} />
          </div>
        )}

        {/* Phase: error */}
        {phase === 'error' && (
          <div className="bps-error">
            <p className="bps-error-text">⚠️ {scanError}</p>
            <div className="bps-error-actions">
              <button className="bps-back-btn" onClick={() => setPhase('upload')}>
                <FiRefreshCw size={13} /> נסה שוב
              </button>
              <button className="bps-back-btn" onClick={() => setPhase('vendor')}>← יצרן אחר</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BomPrescanModal;

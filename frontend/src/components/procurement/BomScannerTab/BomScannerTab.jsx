import React, { useState, useRef, useCallback } from 'react';
import UploadAnimation from '../../common/UploadAnimation/UploadAnimation';
import BomGroupCard from './BomGroupCard';
import UnknownPartsModal from './UnknownPartsModal';
import bomService from '../../../api/services/bomService';
import { FiUploadCloud, FiRefreshCw, FiChevronRight } from 'react-icons/fi';
import './BomScannerTab.css';

// ── Vendor Registry ────────────────────────────────────────────────────────────
// To add a new vendor, just add an entry here.
const VENDORS = [
  {
    id: 'netapp',
    name: 'NetApp',
    description: 'Pricing Template',
    logo: '🟠',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.30)',
    format: 'netapp_pricing_template',
    accept: '.xlsx,.xls',
  },
  {
    id: 'dell',
    name: 'Dell',
    description: 'Quote Summary',
    logo: '🔵',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.10)',
    border: 'rgba(59,130,246,0.30)',
    format: 'dell_quote',
    accept: '.xlsx,.xls',
  },
  {
    id: 'hpe',
    name: 'HPE',
    description: 'Quote Summary',
    logo: '🟢',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.10)',
    border: 'rgba(34,197,94,0.30)',
    format: 'hpe_quote',
    accept: '.xlsx,.xls',
  },
];

// ── BomScannerTab ──────────────────────────────────────────────────────────────
const BomScannerTab = () => {
  // phase: 'select' | 'upload' | 'scanning' | 'resolve' | 'results' | 'error'
  const [phase, setPhase] = useState('select');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [enrichedGroups, setEnrichedGroups] = useState([]);
  const [unresolvedParts, setUnresolvedParts] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  // ── Vendor Selection ────────────────────────────────────────────────────────

  const handleSelectVendor = (vendor) => {
    setSelectedVendor(vendor);
    setPhase('upload');
  };

  // ── File Handling ───────────────────────────────────────────────────────────

  const handleFile = async (file) => {
    if (!file || !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setErrorMsg('יש להעלות קובץ Excel בלבד (.xlsx)');
      setPhase('error');
      return;
    }
    setFileName(file.name);
    setPhase('scanning');
    setErrorMsg('');

    try {
      const result = await bomService.scanBomFile(file, selectedVendor.format);
      setScanResult(result);
      setEnrichedGroups(result.groups);

      if (result.unknown_parts && result.unknown_parts.length > 0) {
        setUnresolvedParts(result.unknown_parts);
        setPhase('resolve');
      } else {
        setPhase('results');
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'שגיאה בסריקת הקובץ';
      setErrorMsg(msg);
      setPhase('error');
    }
  };

  const onFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  // ── Drag & Drop ─────────────────────────────────────────────────────────────

  const onDragOver = useCallback((e) => { e.preventDefault(); setDragging(true); }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [selectedVendor]);

  // ── Unknown Part Save ───────────────────────────────────────────────────────

  const handleSavePart = async (partNumber, data) => {
    await bomService.savePart(partNumber, data);
    setEnrichedGroups(prev =>
      prev.map(group => ({
        ...group,
        main: group.main.part_number === partNumber
          ? { ...group.main, catalog: { ...data } }
          : group.main,
        children: group.children.map(child =>
          child.part_number === partNumber
            ? { ...child, catalog: { ...data } }
            : child
        ),
      }))
    );
  };

  const handleResolveDone = () => {
    setUnresolvedParts([]);
    setPhase('results');
  };

  // ── Reset ───────────────────────────────────────────────────────────────────

  const handleReset = (backToVendors = false) => {
    setPhase(backToVendors ? 'select' : 'upload');
    setScanResult(null);
    setEnrichedGroups([]);
    setUnresolvedParts([]);
    setErrorMsg('');
    setFileName('');
    if (backToVendors) setSelectedVendor(null);
  };

  // ── Price ───────────────────────────────────────────────────────────────────

  const totalNetPrice = enrichedGroups.reduce((sum, g) => sum + (g.total_net_price || 0), 0);
  const formatPrice = (val) =>
    val > 0
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
      : null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="bom-scanner-tab" dir="rtl">

      {/* ── PHASE: VENDOR SELECTION ── */}
      {phase === 'select' && (
        <div className="bst-vendor-select">
          <div className="bst-vendor-grid">
            {VENDORS.map(vendor => (
              <button
                key={vendor.id}
                className="bst-vendor-card"
                style={{ '--v-color': vendor.color, '--v-bg': vendor.bg, '--v-border': vendor.border }}
                onClick={() => handleSelectVendor(vendor)}
              >
                <div className="bst-vendor-logo">{vendor.logo}</div>
                <div className="bst-vendor-name">{vendor.name}</div>
                <div className="bst-vendor-desc">{vendor.description}</div>
                <div className="bst-vendor-arrow"><FiChevronRight /></div>
              </button>
            ))}

            {/* Placeholder "coming soon" card */}
            <div className="bst-vendor-card bst-vendor-soon">
              <div className="bst-vendor-logo" style={{ opacity: 0.3 }}>＋</div>
              <div className="bst-vendor-name" style={{ opacity: 0.4 }}>בקרוב</div>
              <div className="bst-vendor-desc" style={{ opacity: 0.3 }}>יצרנים נוספים</div>
            </div>
          </div>
        </div>
      )}

      {/* ── PHASE: UPLOAD ── */}
      {phase === 'upload' && (
        <>
          <div className="bst-breadcrumb" onClick={() => handleReset(true)}>
            ← חזור לבחירת יצרן
          </div>
          <div className="bst-selected-vendor" style={{ '--v-color': selectedVendor?.color }}>
            <span className="bst-vendor-logo-sm">{selectedVendor?.logo}</span>
            <span>{selectedVendor?.name}</span>
            <span className="bst-vendor-format-badge">{selectedVendor?.description}</span>
          </div>
          <div
            className={`bst-dropzone ${dragging ? 'dragging' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={selectedVendor?.accept || '.xlsx,.xls'}
              onChange={onFileInputChange}
              style={{ display: 'none' }}
            />
            <div className="bst-dropzone-icon" style={{ color: selectedVendor?.color }}>
              <FiUploadCloud size={48} />
            </div>
            <div className="bst-dropzone-title">גרור קובץ BOM של {selectedVendor?.name}</div>
            <div className="bst-dropzone-sub">או לחץ לבחירת קובץ {selectedVendor?.accept}</div>
            <div className="bst-dropzone-badge" style={{ background: selectedVendor?.bg, color: selectedVendor?.color, borderColor: selectedVendor?.border }}>
              {selectedVendor?.description}
            </div>
          </div>
        </>
      )}

      {/* ── PHASE: SCANNING ── */}
      {phase === 'scanning' && (
        <div className="bst-scanning-wrap">
          <UploadAnimation type="excel" status="scanning" fileName={fileName} />
        </div>
      )}

      {/* ── PHASE: ERROR ── */}
      {phase === 'error' && (
        <div className="bst-error-wrap">
          <div className="bst-error-box">
            <div className="bst-error-title">שגיאה בסריקה</div>
            <div className="bst-error-msg">{errorMsg}</div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="bst-retry-btn" onClick={() => handleReset(false)}>
                <FiRefreshCw size={16} /> נסה שוב
              </button>
              <button className="bst-retry-btn" style={{ opacity: 0.7 }} onClick={() => handleReset(true)}>
                ← יצרן אחר
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PHASE: RESOLVE UNKNOWN PARTS ── */}
      {phase === 'resolve' && unresolvedParts.length > 0 && (
        <UnknownPartsModal
          unknownParts={unresolvedParts}
          onSave={handleSavePart}
          onDone={handleResolveDone}
        />
      )}

      {/* ── PHASE: RESULTS ── */}
      {phase === 'results' && (
        <div className="bst-results">
          {/* Summary bar */}
          <div className="bst-summary-bar">
            <div className="bst-summary-left">
              <span className="bst-summary-vendor" style={{ color: selectedVendor?.color }}>
                {selectedVendor?.logo} {selectedVendor?.name}
              </span>
              <span className="bst-summary-count">{enrichedGroups.length} מערכות</span>
              {formatPrice(totalNetPrice) && (
                <span className="bst-summary-total">
                  סה״כ: <strong>{formatPrice(totalNetPrice)}</strong>
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button className="bst-new-scan-btn" onClick={() => handleReset(false)}>
                <FiUploadCloud size={15} /> סריקה חדשה
              </button>
              <button className="bst-new-scan-btn" style={{ opacity: 0.7 }} onClick={() => handleReset(true)}>
                ← יצרן אחר
              </button>
            </div>
          </div>

          {/* BOM Cards grid */}
          <div className="bst-cards-grid">
            {enrichedGroups.map((group, idx) => (
              <BomGroupCard key={idx} group={group} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BomScannerTab;

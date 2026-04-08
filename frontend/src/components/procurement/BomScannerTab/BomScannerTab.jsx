import React, { useState, useRef, useCallback } from 'react';
import UploadAnimation from '../../common/UploadAnimation/UploadAnimation';
import BomGroupCard from './BomGroupCard';
import UnknownPartsModal from './UnknownPartsModal';
import bomService from '../../../api/services/bomService';
import { useAuth } from '../../../context/AuthContext';
import { FiUploadCloud, FiRefreshCw, FiChevronRight, FiCpu } from 'react-icons/fi';
import './BomScannerTab.css';

// ── Vendor Registry ────────────────────────────────────────────────────────────
// To add a new vendor, just add an entry here.
const VENDORS = [
  {
    id: 'netapp',
    name: 'NetApp',
    description: 'Pricing Template',
    logo: '🟣',
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.10)',
    border: 'rgba(168,85,247,0.30)',
    format: 'netapp_pricing_template',
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
  {
    id: 'cisco',
    name: 'Cisco',
    description: 'Quote Summary',
    logo: '🟠',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.10)',
    border: 'rgba(249,115,22,0.30)',
    format: 'cisco_quote',
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

  const { hasVendorAccess, isAdmin, isSuperAdmin } = useAuth();
  const canEdit = selectedVendor ? hasVendorAccess(selectedVendor.id, 'rw') : false;
  const canRetrain = isAdmin || isSuperAdmin;

  const [retraining, setRetraining] = useState(false);
  const [retrainResult, setRetrainResult] = useState(null);

  // ── Save Edited Items ───────────────────────────────────────────────────────

  const handleSaveEdits = useCallback(async (editedItems) => {
    if (!selectedVendor || !editedItems.length) return;
    const result = await bomService.updateBomItems(selectedVendor.id, editedItems);
    // Update local state with saved edits
    setEnrichedGroups(prev =>
      prev.map(group => {
        const updatedMain = editedItems.find(e => e.part_number === group.main.part_number);
        const newMain = updatedMain
          ? { ...group.main, catalog: { ...group.main.catalog, ...updatedMain }, part_alias: updatedMain.part_alias ?? group.main.part_alias }
          : group.main;
        const newChildren = group.children.map(child => {
          const upd = editedItems.find(e => e.part_number === child.part_number);
          return upd ? { ...child, catalog: { ...child.catalog, ...upd } } : child;
        });
        return { ...group, main: newMain, children: newChildren };
      })
    );
    return result;
  }, [selectedVendor]);

  // ── Retrain AI Model ────────────────────────────────────────────────────────

  const handleRetrain = useCallback(async () => {
    setRetraining(true);
    setRetrainResult(null);
    try {
      const result = await bomService.retrainModel();
      setRetrainResult({ ok: true, metrics: result });
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'שגיאה בעדכון המודל';
      setRetrainResult({ ok: false, msg });
    } finally {
      setRetraining(false);
    }
  }, []);

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
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              {canRetrain && (
                <button
                  className="bst-retrain-btn"
                  onClick={handleRetrain}
                  disabled={retraining}
                  title="עדכן מחדש את מודל ה-AI מנתוני הקטלוג"
                >
                  <FiCpu size={15} />
                  {retraining ? 'מאמן...' : 'Retrain AI'}
                </button>
              )}
              <button className="bst-new-scan-btn" onClick={() => handleReset(false)}>
                <FiUploadCloud size={15} /> סריקה חדשה
              </button>
              <button className="bst-new-scan-btn" style={{ opacity: 0.7 }} onClick={() => handleReset(true)}>
                ← יצרן אחר
              </button>
            </div>
          </div>

          {/* Retrain result toast */}
          {retrainResult && (
            <div className={`bst-retrain-result ${retrainResult.ok ? 'bst-retrain-ok' : 'bst-retrain-err'}`}>
              {retrainResult.ok ? (
                <>
                  ✅ המודל עודכן בהצלחה —{' '}
                  {retrainResult.metrics?.total_samples} דוגמאות,{' '}
                  דיוק: {retrainResult.metrics?.test_accuracy
                    ? `${(retrainResult.metrics.test_accuracy * 100).toFixed(1)}%`
                    : '—'}
                </>
              ) : (
                <>⚠ {retrainResult.msg}</>
              )}
              <button className="bst-retrain-result-close" onClick={() => setRetrainResult(null)}>✕</button>
            </div>
          )}

          {/* BOM Cards grid */}
          <div className="bst-cards-grid">
            {enrichedGroups.map((group, idx) => (
              <BomGroupCard key={idx} group={group} canEdit={canEdit} onSaveEdits={handleSaveEdits} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BomScannerTab;

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FiPlus, FiTrash2, FiUploadCloud, FiRefreshCw, FiEye, FiCheckCircle, FiX } from 'react-icons/fi';
import { Button, Input } from '../common';
import Spinner from '../common/Spinner/Spinner';
import UploadAnimation from '../common/UploadAnimation/UploadAnimation';
import UnknownPartsModal from './BomScannerTab/UnknownPartsModal';
import BomPreviewModal from './BomPreviewModal';
import BomGroupCard from './BomScannerTab/BomGroupCard';
import bomService from '../../api/services/bomService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useCatalog } from '../../hooks/useCatalog';
import { useDebounce } from '../../hooks/useDebounce';
import useBomTemplates from '../../hooks/useBomTemplates';
import './ProcurementModal.css';

// ── Vendor color palette ─────────────────────────────────────────────────────
const VENDOR_COLORS = [
  { logo: '🟠', color: '#f59e0b' },
  { logo: '🔵', color: '#3b82f6' },
  { logo: '🟢', color: '#22c55e' },
  { logo: '🟣', color: '#a855f7' },
  { logo: '🟡', color: '#eab308' },
  { logo: '🔴', color: '#ef4444' },
];

// ── Classification keywords ───────────────────────────────────────────────────
const MANUAL_CLASSIFY_KEYWORDS = ['server', 'switch', 'drive', 'cable', 'qsfp', 'disk', 'shelf', 'io module', 'sfp'];
const needsManualClassify = (product = '') =>
  MANUAL_CLASSIFY_KEYWORDS.some(kw => product.toLowerCase().includes(kw));

// ── Build BOM items from scan result ─────────────────────────────────────────
const buildBomItemsFromGroups = (groups, vendor) => {
  let nextId = 1;
  const items = [];
  for (const group of groups) {
    const { main, children } = group;
    const rep = children.length === 1 ? children[0] : main;
    if (!main.part_number && children.length === 0) continue;
    items.push({
      item_id: nextId++,
      product_name: main.part_alias || '',
      catalog_number: rep.part_number || main.part_number || '',
      manufacturer: vendor,
      description: rep.product || main.product || '',
      quantity: Math.round(main.ext_qty || rep.ext_qty || 1),
      bom_vendor: vendor,
    });
  }
  return items.length > 0 ? items : [{ item_id: 1, catalog_number: '', manufacturer: '', description: '', quantity: 1 }];
};

// ── Empty order template ──────────────────────────────────────────────────────
const emptyOrder = () => ({
  order_date: new Date().toISOString().split('T')[0],
  bom_items: [{ item_id: 1, product_name: '', catalog_number: '', manufacturer: '', description: '', quantity: 1 }],
  total_amount: 0,
  status: 'waiting_bom_emf',
  emf_number: '',
  received_bom: false,
  bom_vendor: null,
  bom_data: null,
});

const formatPrice = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

// ═══════════════════════════════════════════════════════════════════════════════
const ProcurementModal = ({
  isOpen, onClose, onSubmit,
  initialData = null, isEdit = false,
  orderType = null,       // 'bom' | 'manual' | null
  bomPrescanData = null,  // { result, vendor } from BomPrescanModal
}) => {
  const [formData, setFormData] = useState(emptyOrder());
  const [loading, setLoading] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState(1);
  const [showEmfInput, setShowEmfInput] = useState(false);
  const { showToast } = useToast();
  const { hasPricePermission, hasVendorAccess, isAdmin, isSuperAdmin } = useAuth();
  const { templates } = useBomTemplates();
  const showPrices = hasPricePermission();

  // Build vendor list dynamically from BOM templates
  const BOM_VENDORS = useMemo(() => templates.map((t, i) => ({
    id: t.vendor_name.toUpperCase(),
    label: t.vendor_name,
    logo: VENDOR_COLORS[i % VENDOR_COLORS.length].logo,
    color: VENDOR_COLORS[i % VENDOR_COLORS.length].color,
    format: t.format_id,
  })), [templates]);

  const canEdit = (isAdmin || isSuperAdmin) || (formData.bom_vendor
    ? hasVendorAccess(formData.bom_vendor.toLowerCase(), 'rw')
    : false);
  const toastError = (msg) => showToast(msg, 'error');

  // BOM inline scanner (for manual re-scan within form)
  const [bomPhase, setBomPhase] = useState('idle');
  const [bomVendor, setBomVendor] = useState(null);
  const [bomDragging, setBomDragging] = useState(false);
  const [bomFileName, setBomFileName] = useState('');
  const [bomScanError, setBomScanError] = useState('');
  const [unresolvedParts, setUnresolvedParts] = useState([]);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showBomPreview, setShowBomPreview] = useState(false);
  const fileInputRef = useRef(null);

  // Auto-complete
  const [activeSuggestionItemId, setActiveSuggestionItemId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { items: catalogSuggestions, loading: loadingSuggestions } = useCatalog({
    search: debouncedSearchQuery, limit: 10,
  });

  // ── Init / reset form ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      const mappedInitialItems = (initialData.bom_items || []).map((item, idx) => {
        const correspondingGroup = initialData.bom_data?.groups?.[idx];
        const alias = correspondingGroup?.main?.part_alias || item.part_alias || item.product_name || '';
        return { ...item, product_name: alias };
      });

      setFormData({
        ...initialData,
        bom_items: mappedInitialItems,
        order_date: new Date(initialData.order_date).toISOString().split('T')[0],
        emf_number: initialData.emf_number || '',
        bom_vendor: initialData.bom_vendor || null,
        bom_data: initialData.bom_data || null,
      });
      setBomPhase(initialData.bom_data ? 'done' : 'idle');
      setBomVendor(BOM_VENDORS.find(v => v.id === initialData.bom_vendor) || null);
    } else if (bomPrescanData) {
      // BOM order: pre-fill from prescan result
      const { result, vendor } = bomPrescanData;
      const newItems = buildBomItemsFromGroups(result.groups || [], vendor.id);
      const total = (result.groups || []).reduce((s, g) => s + (g.total_net_price || 0), 0);
      setFormData({
        ...emptyOrder(),
        received_bom: true,
        bom_vendor: vendor.id,
        bom_data: result,
        bom_items: newItems,
        total_amount: Math.round(total),
        // Store the S3 key so the backend can attach the file to the order
        bom_file_s3_key: result.bom_file_s3_key || null,
        bom_filename: result.bom_filename || null,
      });
      setBomPhase('done');
      setBomVendor(vendor);
      setBomFileName(result.bom_filename || '');
      // Handle unknown parts from prescan
      const unknown = (result.unknown_parts || []).filter(p => needsManualClassify(p.excel_description || ''));
      if (unknown.length > 0) { setUnresolvedParts(unknown); setShowResolveModal(true); }
    } else {
      const isBom = orderType === 'bom';
      setFormData({ ...emptyOrder(), received_bom: isBom });
      setBomPhase(isBom ? 'vendor' : 'idle');
      setBomVendor(null);
    }
    setBomScanError('');
    setShowEmfInput(false);
    setShowBomPreview(false);
    setExpandedItemId(1);
  }, [initialData, isOpen, orderType, bomPrescanData, BOM_VENDORS]);

  // ── Auto-complete exact match ─────────────────────────────────────────────
  useEffect(() => {
    if (!activeSuggestionItemId || debouncedSearchQuery.length < 5) return;
    const exact = catalogSuggestions?.find(
      c => c.catalog_number.trim().toLowerCase() === debouncedSearchQuery.trim().toLowerCase()
    );
    if (exact) {
      setFormData(prev => ({
        ...prev,
        bom_items: prev.bom_items.map(item =>
          item.item_id === activeSuggestionItemId
            ? { ...item, manufacturer: exact.manufacturer, description: exact.description }
            : item
        ),
      }));
    }
  }, [catalogSuggestions, debouncedSearchQuery, activeSuggestionItemId]);

  const handleSuggestionSelect = (itemId, suggestion) => {
    setFormData(prev => ({
      ...prev,
      bom_items: prev.bom_items.map(item =>
        item.item_id === itemId
          ? { ...item, catalog_number: suggestion.catalog_number, manufacturer: suggestion.manufacturer, description: suggestion.description }
          : item
      ),
    }));
    setActiveSuggestionItemId(null);
    setSearchQuery('');
  };

  // ── receivedBom toggle ────────────────────────────────────────────────────
  const handleReceivedBomToggle = (checked) => {
    setFormData(prev => ({ ...prev, received_bom: checked }));
    if (checked && bomPhase === 'idle' && !formData.bom_data) setBomPhase('vendor');
    else if (!checked) { setBomPhase('idle'); setBomVendor(null); }
  };

  // ── BOM inline scan (manual flow only) ───────────────────────────────────
  const handleSelectVendor = (vendor) => { setBomVendor(vendor); setBomPhase('upload'); };

  const handleBomFile = useCallback(async (file) => {
    if (!file?.name.match(/\.(xlsx|xls)$/i)) {
      setBomScanError('יש להעלות קובץ Excel בלבד (.xlsx)');
      setBomPhase('error');
      return;
    }
    setBomFileName(file.name);
    setBomPhase('scanning');
    setBomScanError('');
    try {
      const result = await bomService.scanBomFile(file, bomVendor.format);
      const unknown = (result.unknown_parts || []).filter(p => needsManualClassify(p.excel_description || ''));
      const newItems = buildBomItemsFromGroups(result.groups || [], bomVendor.id);
      const totalPrice = (result.groups || []).reduce((s, g) => s + (g.total_net_price || 0), 0);
      setFormData(prev => ({
        ...prev,
        bom_vendor: bomVendor.id,
        bom_data: result,
        bom_items: newItems,
        total_amount: Math.round(totalPrice),
        bom_file_s3_key: result.bom_file_s3_key || null,
        bom_filename: result.bom_filename || null,
      }));
      if (unknown.length > 0) { setUnresolvedParts(unknown); setShowResolveModal(true); }
      setBomPhase('success');
      setTimeout(() => setBomPhase('done'), 1500);
    } catch (err) {
      setBomScanError(err?.response?.data?.detail || err?.message || 'שגיאה בסריקת הקובץ');
      setBomPhase('error');
    }
  }, [bomVendor]);

  const onBomFileInputChange = (e) => { const f = e.target.files?.[0]; if (f) handleBomFile(f); e.target.value = ''; };
  const onBomDragOver  = useCallback((e) => { e.preventDefault(); setBomDragging(true); }, []);
  const onBomDragLeave = useCallback(() => setBomDragging(false), []);
  const onBomDrop      = useCallback((e) => { e.preventDefault(); setBomDragging(false); handleBomFile(e.dataTransfer.files?.[0]); }, [handleBomFile]);

  const handleRetryBomUpload = () => { setBomPhase('upload'); setBomFileName(''); setBomScanError(''); };
  const handleRescanBom = () => {
    setBomPhase('vendor'); setBomVendor(null); setBomFileName('');
    setFormData(prev => ({ ...prev, bom_vendor: null, bom_data: null, total_amount: 0 }));
  };

  const handleSaveEdits = useCallback(async (changedItems) => {
    await bomService.updateBomItems(formData.bom_vendor, changedItems);
    // Patch the local bom_data so cards immediately reflect the saved values
    const byPn = Object.fromEntries(changedItems.map(i => [i.part_number, i]));
    setFormData(prev => {
      if (!prev.bom_data?.groups) return prev;
      const newGroups = prev.bom_data.groups.map(g => ({
        ...g,
        main: byPn[g.main.part_number]
          ? { ...g.main, catalog: { ...(g.main.catalog || {}), ...byPn[g.main.part_number] } }
          : g.main,
        children: g.children.map(ch =>
          byPn[ch.part_number]
            ? { ...ch, catalog: { ...(ch.catalog || {}), ...byPn[ch.part_number] } }
            : ch
        ),
      }));
      return { ...prev, bom_data: { ...prev.bom_data, groups: newGroups } };
    });
  }, [formData.bom_vendor]);

  // ── Form helpers ──────────────────────────────────────────────────────────
  const addBomItem = () => {
    const newId = formData.bom_items.reduce((max, i) => Math.max(max, i.item_id), 0) + 1;
    setFormData(prev => ({
      ...prev,
      bom_items: [...prev.bom_items, { item_id: newId, product_name: '', catalog_number: '', manufacturer: '', description: '', quantity: 1 }],
    }));
    setExpandedItemId(newId);
  };

  const removeBomItem = (itemId) => {
    if (formData.bom_items.length > 1) {
      setFormData(prev => ({ ...prev, bom_items: prev.bom_items.filter(i => i.item_id !== itemId) }));
    }
  };

  const updateBomItem = (itemId, field, value) => {
    setFormData(prev => {
      const updatedItems = prev.bom_items.map(item =>
        item.item_id === itemId ? { ...item, [field]: value } : item
      );

      let updatedBomData = prev.bom_data;
      if (prev.bom_data?.groups) {
        const itemIdx = prev.bom_items.findIndex(i => i.item_id === itemId);
        if (itemIdx !== -1 && prev.bom_data.groups[itemIdx]) {
          let groupPatch = {};
          let catalogPatch = {};
          // description edit → update main.product AND overwrite catalog.description_he
          // so BomGroupCard shows the user's text, not the stale AI value
          if (field === 'description') {
            groupPatch.product = value;
            catalogPatch.description_he = value;
          }
          // product_name (alias) edit → update main.part_alias
          if (field === 'product_name') groupPatch.part_alias = value;

          if (Object.keys(groupPatch).length > 0) {
            const newGroups = prev.bom_data.groups.map((g, i) => {
              if (i !== itemIdx) return g;
              return {
                ...g,
                main: {
                  ...g.main,
                  ...groupPatch,
                  catalog: Object.keys(catalogPatch).length > 0
                    ? { ...(g.main.catalog || {}), ...catalogPatch }
                    : g.main.catalog,
                },
              };
            });
            updatedBomData = { ...prev.bom_data, groups: newGroups };
          }
        }
      }

      return { ...prev, bom_items: updatedItems, bom_data: updatedBomData };
    });
    if (field === 'catalog_number') {
      setSearchQuery(value);
      setActiveSuggestionItemId(value.length >= 5 ? itemId : null);
    }
  };

  const isItemValid = (itemId) => {
    const item = formData.bom_items.find(i => i.item_id === itemId);
    // product_name OR catalog_number must be filled (at least one identifier)
    return item
      ? (item.product_name?.trim() || item.catalog_number?.trim()) !== '' && item.manufacturer.trim() !== '' && item.quantity >= 1
      : false;
  };

  const canAddItem = () => isItemValid(formData.bom_items[formData.bom_items.length - 1].item_id);

  // ── Status helpers ────────────────────────────────────────────────────────
  const getStatusLabel = () => {
    const { status, received_bom, emf_number } = formData;
    if (status === 'received')         return '✓ התקבל';
    if (status === 'shipped')          return '✓ נשלח';
    if (status === 'waiting_shipment') return 'ממתין לשילוח';
    
    if (received_bom && !emf_number)   return 'ממתין ל-EMF';
    if (!received_bom && emf_number)   return 'ממתין ל-BOM';
    return 'ממתין ל-BOM ו-EMF';
  };

  const canMarkAsShipped   = () => formData.status === 'waiting_shipment';
  const canMarkAsReceived2 = () => formData.status === 'shipped';

  const handleEmfNumberChange = (e) => {
    const val = e.target.value;
    const updates = { emf_number: val };
    if (formData.status !== 'received' && formData.status !== 'shipped') {
      const hasEmf = !!val.trim();
      const hasBom = formData.received_bom;
      updates.status = (hasEmf && hasBom) ? 'waiting_shipment' : 'waiting_bom_emf';
    }
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const clearEmf = () => {
    setShowEmfInput(false);
    setFormData(prev => ({ ...prev, emf_number: '', status: 'waiting_bom_emf' }));
  };

  const buildSubmitPayload = (baseData, status) => {
    const normalizedItems = (baseData.bom_items || []).map(item => {
      const alias = (item.product_name || '').trim();
      return {
        ...item,
        part_alias: alias || item.part_alias || null,
      };
    });

    return {
      ...baseData,
      status,
      bom_items: normalizedItems,
    };
  };


  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e, submissionType = 'save') => {
    e.preventDefault();
    const allValid = formData.bom_items.every(
      item => (item.product_name?.trim() || item.catalog_number?.trim()) && item.manufacturer.trim() && item.quantity >= 1
    );
    if (!allValid) { toastError('יש למלא את כל הפרטים של כל הפריטים'); return; }

    const statusToSubmit = formData.status;
    setLoading(true);
    try {
      await onSubmit(buildSubmitPayload(formData, statusToSubmit));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkStatus = async (e, newStatus) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(buildSubmitPayload(formData, newStatus));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const activeBomVendorMeta = BOM_VENDORS.find(v => v.id === formData.bom_vendor);
  const hasBomData = !!formData.bom_data;

  return (
    <>
      {/* Backdrop */}
      <div className="pm-backdrop" onClick={onClose} />

      {/* Side Drawer */}
      <div className="pm-drawer">
        {/* ─── Drawer Header ───────────────────────────────────── */}
        <div className="pm-drawer-header">
          <div className="pm-drawer-title-row">
            <h2 className="pm-drawer-title">
              {isEdit ? 'עריכת הזמנה' : orderType === 'bom' ? '📊 הזמנה מ-BOM' : '✏️ הזמנה ידנית'}
            </h2>
            {activeBomVendorMeta && (
              <span className="pm-vendor-badge" style={{ color: activeBomVendorMeta.color }}>
                {activeBomVendorMeta.logo} {activeBomVendorMeta.label}
              </span>
            )}
          </div>
          <div className="pm-drawer-status">
            <span className="pm-status-label">סטטוס:</span>
            <span className="pm-status-value">{getStatusLabel()}</span>
          </div>
          <button className="pm-drawer-close" onClick={onClose}><FiX size={18} /></button>
        </div>

        {/* ─── Drawer Body (two columns) ────────────────────────── */}
        <div className="pm-drawer-body">

          {/* LEFT COLUMN — form */}
          <div className="pm-form-col">
            <form id="pm-form">

              {/* Date + Price */}
              <div className="pm-row">
                <Input
                  label="תאריך הזמנה"
                  type="date"
                  value={formData.order_date}
                  onChange={e => setFormData(prev => ({ ...prev, order_date: e.target.value }))}
                  required
                />
                {showPrices && (
                  <Input
                    label="סכום ההזמנה ($)"
                    type="number"
                    value={formData.total_amount || ''}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, total_amount: parseFloat(e.target.value) || 0 }));
                    }}
                    placeholder={!hasBomData && orderType === 'bom' ? "יתעדכן לאחר העלאת BOM" : "הכנס סכום"}
                    title={hasBomData ? 'ניתן לערוך במידה וחישוב הBOM איננו מדויק' : (orderType === 'bom' ? 'יתעדכן לאחר סריקת BOM' : 'סכום הזמנה (אופציונלי)')}
                    min="0"
                    step="0.01"
                  />
                )}
              </div>

              {/* BOM Items */}
              <div className="pm-section">
                <div className="pm-section-title">מק"טים בהזמנה</div>

                {/* Tabs */}
                <div className="bom-tabs-container">
                  <div className="bom-tabs">
                    {formData.bom_items.map((item, index) => (
                      <div key={item.item_id} className="bom-tab-wrapper">
                        <button
                          type="button"
                          className={`bom-tab ${expandedItemId === item.item_id ? 'active' : ''} ${isItemValid(item.item_id) ? 'valid' : 'invalid'}`}
                          onClick={() => setExpandedItemId(item.item_id)}
                        >
                          <span className="bom-tab-number">{index + 1}</span>
                          <span className="bom-tab-label">{item.product_name || item.catalog_number || 'פריט חדש'}</span>
                        </button>
                        {formData.bom_items.length > 1 && (
                          <button
                            type="button"
                            className="bom-tab-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeBomItem(item.item_id);
                              if (expandedItemId === item.item_id) setExpandedItemId(formData.bom_items[0].item_id);
                            }}
                            title="הסר"
                          ><FiTrash2 /></button>
                        )}
                      </div>
                    ))}
                  </div>

                  {formData.bom_items.map(item =>
                    expandedItemId === item.item_id && (
                      <div key={item.item_id} className="bom-item-content">
                        <div className="bom-item-grid">
                          <Input
                            label='כינוי (אופציונלי)'
                            value={item.product_name || ''}
                            onChange={e => updateBomItem(item.item_id, 'product_name', e.target.value)}
                            placeholder='כינוי קריא למק"ט'
                          />
                          <div className="autocomplete-container" style={{ position: 'relative' }}>
                            <Input
                              label='מק"ט'
                              value={item.catalog_number}
                              onChange={e => updateBomItem(item.item_id, 'catalog_number', e.target.value)}
                              onFocus={() => { if (item.catalog_number.length >= 5) { setSearchQuery(item.catalog_number); setActiveSuggestionItemId(item.item_id); } }}
                              onBlur={() => setTimeout(() => setActiveSuggestionItemId(null), 200)}
                              placeholder='מק"ט (אופציונלי)'
                            />
                            {activeSuggestionItemId === item.item_id && debouncedSearchQuery.length >= 5 && (
                              <div className="autocomplete-dropdown">
                                {loadingSuggestions ? (
                                  <div className="autocomplete-loading"><Spinner inline size="small" /> מחפש...</div>
                                ) : catalogSuggestions?.length > 0 ? (
                                  catalogSuggestions.map(s => (
                                    <div key={s._id} className="autocomplete-item"
                                      onMouseDown={e => { e.preventDefault(); handleSuggestionSelect(item.item_id, s); }}>
                                      <div className="ac-cat">{s.catalog_number}</div>
                                      <div className="ac-details">{s.manufacturer} | {s.description}</div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="autocomplete-empty">לא נמצאו התאמות</div>
                                )}
                              </div>
                            )}
                          </div>
                          <Input label="יצרן" value={item.manufacturer}
                            onChange={e => updateBomItem(item.item_id, 'manufacturer', e.target.value)} required placeholder="יצרן" />
                          <Input label="כמות" type="number" value={item.quantity}
                            onChange={e => updateBomItem(item.item_id, 'quantity', parseInt(e.target.value) || 1)} required min="1" />
                        </div>
                        <Input label="תיאור" value={item.description}
                          onChange={e => updateBomItem(item.item_id, 'description', e.target.value)}
                          placeholder='תיאור המק"ט' className="full-width-input" required />
                      </div>
                    )
                  )}
                </div>

                <button type="button" className="add-bom-item-btn" onClick={addBomItem} disabled={!canAddItem()}>
                  <FiPlus /> הוסף מק"ט נוסף
                </button>
              </div>

              {/* EMF + BOM checkboxes */}
              <div className="pm-section pm-controls-row">
                {/* EMF */}
                {!showEmfInput && !formData.emf_number?.trim() ? (
                  <label className="checkbox-label">
                    <input type="checkbox" checked={false}
                      onChange={e => { if (e.target.checked) setShowEmfInput(true); }} />
                    <span>התקבל EMF</span>
                  </label>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Input placeholder="מספר EMF..." value={formData.emf_number || ''}
                      onChange={handleEmfNumberChange}
                      autoFocus />
                    <Button variant="icon" type="button"
                      onClick={clearEmf} title="נקה EMF" className="delete-btn">
                      <FiTrash2 size={14} />
                    </Button>
                  </div>
                )}

                {/* BOM checkbox — manual mode: checkbox only, no scanner upload */}
                <label className="checkbox-label">
                  <input type="checkbox" checked={formData.received_bom}
                    onChange={e => {
                      if (orderType === 'manual' || !orderType) {
                        // Manual: just flag, no scanner
                        setFormData(prev => ({ ...prev, received_bom: e.target.checked }));
                      } else {
                        handleReceivedBomToggle(e.target.checked);
                      }
                    }} />
                  <span>התקבל BOM</span>
                </label>
              </div>

              {/* BOM inline scanner — only for non-manual (BOM) orders */}
              {formData.received_bom && orderType !== 'manual' && (
                <div className="bom-scanner-section">
                  {bomPhase === 'idle' && (
                    <div className="bom-inline-vendor" style={{ justifyContent: 'flex-end' }}>
                      <button type="button" className="bom-back-btn" onClick={() => setBomPhase('vendor')}>
                        <FiUploadCloud size={13} /> {hasBomData ? 'החלף BOM' : 'הוסף סריקת BOM'}
                      </button>
                    </div>
                  )}
                  {bomPhase === 'vendor' && (
                    <div className="bom-inline-vendor">
                      <div className="bom-inline-label">בחר יצרן BOM:</div>
                      <div className="bom-vendor-row">
                        {BOM_VENDORS.map(v => (
                          <button key={v.id} type="button" className="bom-vendor-pill"
                            style={{ '--v-color': v.color }} onClick={() => handleSelectVendor(v)}>
                            {v.logo} {v.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {bomPhase === 'upload' && bomVendor && (
                    <div className="bom-inline-upload">
                      <input ref={fileInputRef} type="file" accept=".xlsx,.xls"
                        onChange={onBomFileInputChange} style={{ display: 'none' }} />
                      <div className={`bom-inline-dropzone ${bomDragging ? 'dragging' : ''}`}
                        style={{ '--v-color': bomVendor.color }}
                        onDragOver={onBomDragOver} onDragLeave={onBomDragLeave} onDrop={onBomDrop}
                        onClick={() => fileInputRef.current?.click()}>
                        <FiUploadCloud size={28} style={{ color: bomVendor.color }} />
                        <span>{bomVendor.logo} גרור קובץ BOM של {bomVendor.label} או לחץ לבחירה</span>
                      </div>
                      <button type="button" className="bom-back-btn" onClick={() => setBomPhase('vendor')}>← יצרן אחר</button>
                    </div>
                  )}
                  {bomPhase === 'error' && (
                    <div className="bom-inline-error">
                      <span className="bom-error-text">⚠️ {bomScanError}</span>
                      <button type="button" className="bom-back-btn" onClick={handleRetryBomUpload}><FiRefreshCw size={14} /> נסה שוב</button>
                      <button type="button" className="bom-back-btn" onClick={() => setBomPhase('vendor')}>← יצרן אחר</button>
                    </div>
                  )}
                  {bomPhase === 'done' && hasBomData && (
                    <div className="bom-inline-done">
                      <FiCheckCircle size={18} className="bom-done-icon" />
                      <div className="bom-done-info">
                        <span className="bom-done-vendor" style={{ color: activeBomVendorMeta?.color }}>
                          {activeBomVendorMeta?.logo} {activeBomVendorMeta?.label}
                        </span>
                        <span className="bom-done-count">{(formData.bom_data.groups || []).length} מערכות</span>
                        {showPrices && <span className="bom-done-price">{formatPrice(formData.total_amount)}</span>}
                      </div>
                      <div className="bom-done-actions">
                        <button type="button" className="bom-preview-btn" onClick={() => setShowBomPreview(true)}>
                          <FiEye size={14} /> צפה
                        </button>
                        <button type="button" className="bom-rescan-btn" onClick={handleRescanBom}>
                          <FiRefreshCw size={13} /> החלף
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </form>
          </div>

          {/* RIGHT COLUMN — BOM live preview */}
          <div className="pm-preview-col">
            {hasBomData ? (
              <>
                <div className="pm-preview-header">
                  <span className="pm-preview-title">תוצאות BOM</span>
                  {showPrices && <span className="pm-preview-total">{formatPrice(formData.total_amount)}</span>}
                </div>
                <div className="pm-preview-cards">
                  {(formData.bom_data.groups || []).map((group, idx) => (
                    <BomGroupCard key={idx} group={group} canEdit={canEdit} onSaveEdits={handleSaveEdits} />
                  ))}
                </div>
              </>
            ) : (
              <div className="pm-preview-empty">
                <span className="pm-preview-empty-icon">📊</span>
                <p>תוצאות ה-BOM יוצגו כאן לאחר סריקת הקובץ</p>
              </div>
            )}
          </div>

        </div>

        {/* ─── Drawer Footer ───────────────────────────────────────── */}
        <div className="pm-drawer-footer">
          <Button variant="secondary" onClick={onClose} disabled={loading} type="button">ביטול</Button>
          {isEdit ? (
            <>
              <Button variant="primary" onClick={e => handleSubmit(e, 'save')} disabled={loading} type="button">
                {loading ? <Spinner size="small" /> : 'שמור שינויים'}
              </Button>
              {canMarkAsShipped() && (
                <Button variant="primary" onClick={e => handleMarkStatus(e, 'shipped')} disabled={loading} type="button">
                  {loading ? <Spinner size="small" /> : '🚚 סמן כנשלח'}
                </Button>
              )}
              {canMarkAsReceived2() && (
                <Button variant="success" onClick={e => handleMarkStatus(e, 'received')} disabled={loading} type="button">
                  {loading ? <Spinner size="small" /> : '✓ סמן כהתקבל'}
                </Button>
              )}
            </>
          ) : (
            <Button variant="primary" type="button" disabled={loading} onClick={e => handleSubmit(e, 'save')}>
              {loading ? <Spinner size="small" /> : 'צור הזמנה'}
            </Button>
          )}
        </div>
      </div>

      {/* ─── Full-screen scanning overlay ─────────────────────────── */}
      {(bomPhase === 'scanning' || bomPhase === 'success') && (
        <div className="bom-scanning-fullscreen" onClick={e => e.stopPropagation()}>
          <UploadAnimation type="excel" status={bomPhase === 'success' ? 'success' : 'scanning'} fileName={bomFileName} />
        </div>
      )}

      {/* Unknown parts modal */}
      {showResolveModal && unresolvedParts.length > 0 && (
        <div onClick={e => e.stopPropagation()}>
          <UnknownPartsModal
            unknownParts={unresolvedParts}
            onSave={async (partNumber, data) => {
              await bomService.savePart(partNumber, data);
              // Update bom_data.groups in local state so BomGroupCard
              // immediately reflects the user-corrected description/category
              setFormData(prev => {
                if (!prev.bom_data?.groups) return prev;
                const newGroups = prev.bom_data.groups.map(g => ({
                  ...g,
                  main: g.main.part_number === partNumber
                    ? { ...g.main, catalog: { ...(g.main.catalog || {}), ...data } }
                    : g.main,
                  children: g.children.map(ch =>
                    ch.part_number === partNumber
                      ? { ...ch, catalog: { ...(ch.catalog || {}), ...data } }
                      : ch
                  ),
                }));
                return { ...prev, bom_data: { ...prev.bom_data, groups: newGroups } };
              });
            }}
            onDone={() => { setShowResolveModal(false); setUnresolvedParts([]); }}
          />
        </div>
      )}

      {/* BOM preview modal */}
      <div onClick={e => e.stopPropagation()}>
        <BomPreviewModal
          isOpen={showBomPreview}
          onClose={() => setShowBomPreview(false)}
          bomData={formData.bom_data}
          vendor={formData.bom_vendor}
          canEdit={canEdit}
        />
      </div>
    </>
  );
};

export default ProcurementModal;

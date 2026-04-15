# UX Design Spec — 890Warehouse Redesign

> **Status:** In Progress
> **Author:** System Architect & UX Lead
> **Created:** April 2026
> **Last Updated:** April 14, 2026

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Design System Tokens](#2-design-system-tokens)
3. [Unified Header + Navigation](#3-unified-header--navigation)
4. [Inventory Page Redesign](#4-inventory-page-redesign)
5. [Dashboard Redesign](#5-dashboard-redesign)
6. [Procurement Redesign](#6-procurement-redesign)
7. [Global Search](#7-global-search)
8. [Accessibility Standards](#8-accessibility-standards)
9. [Implementation Phases](#9-implementation-phases)
10. [Change Log](#10-change-log)

---

## 1. Design Principles

| Principle | Description |
|-----------|-------------|
| **Information Density** | Show the maximum useful data without horizontal scrolling |
| **Contextual Actions** | Show relevant actions when and where they're needed |
| **Progressive Disclosure** | Summary first, details on demand (table → detail panel) |
| **Consistency** | One spacing scale, one typography scale, one pattern |
| **Zero Confusion** | Every filter, state, and action should be visible and obvious |

### Out of Scope
- Mobile-first responsive design (system is desktop-focused)
- Color-coded stock levels
- Theme variant changes (existing 5 themes unchanged)

---

## 2. Design System Tokens

### Spacing Scale
```css
--space-1: 0.25rem   /* 4px  — minimal gap */
--space-2: 0.5rem    /* 8px  — tight elements */
--space-3: 0.75rem   /* 12px — inner padding */
--space-4: 1rem      /* 16px — standard padding */
--space-5: 1.5rem    /* 24px — section gaps */
--space-6: 2rem      /* 32px — page margins */
--space-8: 3rem      /* 48px — major separation */
```

### Typography Scale
```css
--text-xs:   0.75rem   /* 12px — badges, labels */
--text-sm:   0.875rem  /* 14px — table data, secondary */
--text-base: 1rem      /* 16px — body text */
--text-lg:   1.125rem  /* 18px — section headers */
--text-xl:   1.25rem   /* 20px — page titles */
--text-2xl:  1.5rem    /* 24px — KPI numbers */
--text-3xl:  2rem      /* 32px — hero/dashboard numbers */
```

### Z-Index Scale
```css
--z-table-header:  10
--z-table-frozen:  20
--z-dropdown:      30
--z-sticky:        40
--z-floating-bar:  50
--z-detail-panel:  60
--z-modal-overlay: 100
--z-modal:         110
--z-toast:         200
--z-tooltip:       300
--z-global-search: 400
```

### Shadow Scale
```css
--shadow-sm:    0 1px 3px rgba(0, 0, 0, 0.1)
--shadow-md:    0 4px 8px rgba(0, 0, 0, 0.15)
--shadow-lg:    0 8px 24px rgba(0, 0, 0, 0.2)
--shadow-panel: -4px 0 24px rgba(0, 0, 0, 0.25)  /* detail panel */
```

### Animation Tokens
```css
--transition-fast:   150ms ease
--transition-normal: 250ms ease
--transition-slow:   350ms ease
```

---

## 3. Unified Header + Navigation

### Before (2 rows, ~100px)
```
┌──────────────────────────────────────────────────────────────┐
│ 890Warehouse Logo     │           │ Theme │ User Name │ Logout│  ← Header row
├──────────────────────────────────────────────────────────────┤
│ Dashboard │ Inventory │ Procurement │ MyComp │ Admin │ Guide │  ← Nav row
└──────────────────────────────────────────────────────────────┘
```

### After (1 row, ~50px)
```
┌──────────────────────────────────────────────────────────────────────┐
│ 890W │ דשבורד  מלאי  רכש  הקולקציות שלי  ניהול  מדריך │ 🔍 │ 👤 ▾ │
└──────────────────────────────────────────────────────────────────────┘
```

### Component: `UnifiedHeader`
- **Left:** Compact logo (icon + short text)
- **Center:** Navigation links (horizontal, same permission logic)
- **Right:** Global Search trigger (🔍 icon, opens Ctrl+K modal) + User avatar dropdown (theme toggle inside dropdown)
- **Height:** 48px fixed
- **Behavior:** Permission-based nav items remain identical
- **Breadcrumb row:** Below header, inside page content area — e.g. `📦 מלאי > נוכחי`

---

## 4. Inventory Page Redesign

### 4.1 Layout Structure

```
┌─ UnifiedHeader (48px) ──────────────────────────────────────────────┐
├─ Contextual Actions Bar ────────────────────────────────────────────┤
│ 📦 מלאי > נוכחי     [ייבוא ▼] [ייצוא] [+ פריט]     🔍 חיפוש...  │
│ ──── נוכחי ──── ישנים ──── קטלוג ──── לוגים ────                    │
├─ Active Filters Bar (conditional) ──────────────────────────────────┤
│ יצרן: Intel ✕  │  אתר: תל אביב ✕  │  כמות < 10 ✕  │  [נקה הכל] │
├─ Table + Detail Panel ──────────────────────────────────────────────┤
│                                          │                          │
│  ☑ │ מק"ט   │ תיאור    │ יצרן │ כמות │  │  Detail Panel (350px)   │
│  ──┼─────────┼──────────┼──────┼──────│  │  IC-7432                │
│  ☐ │ IC-7432 │ VReg 3.3V│ TI   │  45  │  │  ┌───────┬──────────┐  │
│  ☐ │ CAP-100 │ Cap 100µF│ Mur  │   3  │  │  │ כמות  │ מיקום    │  │
│  ☐ │ RES-10K │ Res 10KΩ │ Yag  │ 200  │  │  │  45   │ A-12-3   │  │
│                                          │  │  └───────┴──────────┘  │
│                                          │  │  אחריות: 12/2026      │
│                                          │  │  הערות: PCB v2.1      │
│                                          │  │  📜 היסטוריה →        │
├─ Pagination ────────────────────────────────────────────────────────┤
│                                                 [‹ 1 2 3 ... 47 ›] │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Active Filters Bar

- **Visibility:** Only shown when at least 1 filter is active
- **Component:** `ActiveFiltersBar`
- **Each filter** displayed as a removable chip: `label: value ✕`
- **"Clear All"** button at end to reset all filters
- **Advanced Filter button** (`⚡סינון מתקדם`) opens a filter side panel or dropdown with full filter options (date ranges, multi-select, numeric ranges)
- **Animation:** Slides down when first filter is applied, slides up when all cleared

### 4.3 Detail Panel (Slide-over)

- **Trigger:** Click on any table row
- **Position:** Right side of table, width: 350px, push layout (table shrinks)
- **Content:**
  - Item title (catalog number + description)
  - All fields organized in 2-column grid (label: value)
  - Associated collections (chips)
  - Notes (full text, editable)
  - Quick actions: Edit (✏️), Delete (🗑️), Add to Collection
  - Recent history (last 3 changes, expandable)
- **Close:** ✕ button or Escape key or click another row (updates panel)
- **Animation:** Slide in from right, 250ms ease
- **Persistence:** Panel state saved to localStorage (open/closed)

### 4.4 View Modes

Three display modes, toggled via segmented control in actions bar:

| Mode | Row Height | Use Case |
|------|-----------|----------|
| **Compact** | 35px | Power users scanning large lists |
| **Normal** | 48px | Default, comfortable reading |
| **Card** | Auto (~120px) | Visual browse, less columns |

- **State:** Saved to localStorage via `useLocalStorage`
- **Toggle UI:** Small 3-icon segmented button: `[≡] [☰] [▦]`

### 4.5 Table Column Reduction

Default visible columns (8 max):
1. Checkbox (selection)
2. Catalog Number (frozen)
3. Description
4. Manufacturer
5. Quantity
6. Location
7. Serial Number
8. Actions menu (⋯)

All other columns accessible via:
- Detail Panel (on row click)
- Column Toggle (existing feature, preserved)

### 4.6 Three-dot Row Menu (⋯)

Replaces need for some toolbar buttons on single items:
- ✏️ Edit
- 📋 Copy to clipboard
- 📁 Add to collection
- 🔄 View history
- 🗑️ Delete

---

## 5. Dashboard Redesign

### 5.1 Layout

```
┌─ UnifiedHeader ──────────────────────────────────────────────────┐
├──────────────────────────────────────────────────────────────────┤
│ Dashboard                                          [Date Range ▼]│
├──────────┬──────────┬──────────┬──────────┬─────────────────────┤
│ פריטים   │ חריגים   │ הזמנות   │ משתמשים  │ 🔔 התראות חכמות     │
│  1,247   │   23 ⚠   │  8 פעיל  │  12 אונל │ • 5 פריטים מתחת    │
│ +12 היום │ -3 מאתמול│ ₪45K     │          │   לסף מינימום       │
├──────────┴──────────┴──────────┴──────────┤ • 3 הזמנות > 48h    │
│                                           │ • BOM #127 חסר 2    │
│ ┌────────────┐ ┌────────────┐             │                     │
│ │ יצרנים PIE │ │ מגמות LINE │             ├─────────────────────┤
│ └────────────┘ └────────────┘             │ Quick Actions       │
│ ┌────────────┐ ┌────────────┐             │ [+ פריט] [+ הזמנה]  │
│ │ אתרים BAR  │ │ חיפוש TOP  │             │ [📥 ייבוא][📤 ייצוא]│
│ └────────────┘ └────────────┘             │                     │
└───────────────────────────────────────────┴─────────────────────┘
```

### 5.2 Clickable KPIs

Each stat card is an `<a>` / clickable:
- **Total Items** → `/inventory`
- **Stale Items** → `/inventory` with stale tab active
- **Active Orders** → `/procurement`
- **Online Users** → `/admin/users` (admin only, otherwise display-only)

### 5.3 Smart Alerts Panel

Replaces Activity Feed. Shows only **actionable** items:
- Items below minimum stock threshold
- Procurement orders pending > 48 hours
- BOM scans with missing components
- Items not updated > 90 days

Each alert is clickable → navigates to relevant filtered view.

### 5.4 Quick Actions

Shortcut buttons for common tasks:
- \+ New Item → opens item creation modal
- \+ New Order → opens procurement order modal
- Import → opens Excel import
- Export → triggers Excel export

---

## 6. Procurement Redesign

### 6.1 Kanban View (Default)

```
┌── ממתין (3) ─────┐ ┌── בתהליך (2) ────┐ ┌── הושלם (47) ────┐
│ ┌──────────────┐  │ │ ┌──────────────┐  │ │ ┌──────────────┐  │
│ │ #127 Intel   │  │ │ │ #125 Murata  │  │ │ │ #120 TI      │  │
│ │ 12 items     │  │ │ │ 5 items      │  │ │ │ 8 items      │  │
│ │ ₪15,200      │  │ │ │ ₪3,400       │  │ │ │ ₪8,900       │  │
│ │ ⏱ 2 days     │  │ │ │ ⏱ 5 days     │  │ │ │ ✅ 12/03     │  │
│ └──────────────┘  │ │ └──────────────┘  │ │ └──────────────┘  │
└───────────────────┘ └───────────────────┘ └───────────────────┘
```

### 6.2 Toggle: Kanban ↔ Table
- Segmented control: `[▦ Kanban] [≡ Table]`
- Table view uses existing ProcurementTable (preserved)
- Default: Kanban. Saved to localStorage.

### 6.3 Analytics Strip (Always Visible)
```
┌── Analytics ──────────────────────────────────────────────────────┐
│ 📊 החודש: ₪67K  │  ⏱ ממוצע: 4.2 ימים  │  📦 52 הזמנות  │  Top: Intel │
└───────────────────────────────────────────────────────────────────┘
```
- Fixed at bottom of Procurement page
- Replaces separate Analytics tab
- BOM Scanner remains accessible via `[📎 סריקת BOM]` button (opens wizard modal)

---

## 7. Global Search

### 7.1 Trigger
- Keyboard: `Ctrl+K` (Windows)
- UI: Search icon (🔍) in unified header
- Always available from any page

### 7.2 UI
```
┌── 🔍 חיפוש במערכת... ──────────────────────────────┐
│  [search input with autofocus]                       │
│  ─────────────────────────────────────────────────── │
│  📦 IC-7432 — Voltage Regulator 3.3V      (מלאי)    │
│  🛒 הזמנה #127 — כולל IC-7432             (רכש)     │
│  📁 קולקציה "מעגל X" — 3 פריטים           (קולקציה) │
│  ─────────────────────────────────────────────────── │
│  Enter to navigate │ ↑↓ to select │ Esc to close     │
└──────────────────────────────────────────────────────┘
```

### 7.3 Behavior
- **Debounce:** 300ms
- **Results:** Grouped by type (Items, Orders, Collections)
- **Max results:** 5 per category, 15 total
- **Navigation:** Arrow keys to select, Enter to navigate, Esc to close
- **Backend:** New endpoint `GET /api/search?q=...` returns unified results
- **Overlay:** Modal with backdrop blur, z-index: var(--z-global-search)

---

## 8. Accessibility Standards

### Focus Management
- All modals trap focus (Tab cycles within modal)
- Escape closes any overlay (modal, panel, dropdown, search)
- Focus returns to trigger element after close

### ARIA Attributes
- Tables: `role="grid"`, `aria-sort` on sortable headers
- Modals: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Buttons with icons only: `aria-label` required
- Live regions: `aria-live="polite"` for toast notifications

### Keyboard Navigation
- All interactive elements reachable via Tab
- Documented shortcuts: Ctrl+K (search), Escape (close), Ctrl+Z (undo)

---

## 9. Implementation Phases

### Phase 1 — Foundation
- [x] Create UX Design Spec (this file)
- [x] Design System Tokens (update variables.css)
- [x] Unified Header + Navigation
- [x] Basic Accessibility (focus trap, Escape handling, ARIA)

### Phase 2 — Inventory Overhaul
- [x] Active Filters Bar
- [x] Detail Panel (slide-over)
- [x] 3 View Modes (Compact/Normal/Card)
- [x] Contextual Actions Bar with breadcrumbs
- [x] Three-dot row menu

### Phase 3 — Dashboard & Procurement
- [x] Dashboard: Clickable KPIs + Smart Alerts
- [x] Dashboard: Quick Actions
- [x] Procurement: Kanban View
- [x] Procurement: Analytics Strip

### Phase 4 — Global Features
- [x] Global Search (Ctrl+K) — Frontend
- [x] Global Search — Backend endpoint
- [x] Final consistency pass (all tokens applied)

---

## 10. Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-13 | Initial spec created | Architect |
| 2026-04-13 | Phase 1 complete: tokens, header, search, accessibility | Architect |
| 2026-04-13 | Phase 2 partial: filters bar, detail panel, view modes | Architect |
| 2026-04-13 | Phase 3 partial: dashboard redesign, kanban view | Architect |
| 2026-04-13 | User Guide updated with all new features | Architect |
| 2026-04-14 | Phase 2 complete: Three-dot row menu (`RowActionsMenu`) with Edit/Copy/Add to Collection/Delete | Architect |
| 2026-04-14 | Phase 3 complete: Procurement Analytics Strip (`AnalyticsStrip`) + backend `GET /procurement/summary` endpoint | Architect |
| 2026-04-14 | Phase 4 partial: Global Search backend endpoint `GET /api/search` — unified results (items + orders + collections) | Architect |
| 2026-04-14 | Backend tests added: search service (6), procurement monthly summary repo (4), search routes integration (8), procurement summary integration (2) | Architect |
| 2026-04-13 | Phase 2 complete: Contextual Actions Bar — primary actions (import dropdown, export, add, search) lifted above tabs via React portal | Architect |
| 2026-04-13 | Phase 4 complete: Final CSS design token pass — added --space-9, --radius-2xl, --radius-round tokens; updated 6 CSS files to use tokens | Architect |


# 📡 API Reference — Warehouse Management System v2.0

## 📋 Quick Reference Table

| Module | Prefix | Count | Key Endpoints |
|--------|--------|-------|---------------|
| **Authentication** | `/api/auth` | 5 | login, domain-login, logout, me, password |
| **Inventory (Items)** | `/api/items` | 10 | CRUD, bulk-update, bulk-delete, delete-all, stale, fix-reserved-stock |
| **Excel Import/Export** | `/api/items` | 3 | import-excel, import-projects, export-excel |
| **Catalog** | `/api/catalog` | 1 | search catalog SKUs |
| **Collections** | `/api/collections` | 13 | CRUD, items management, permissions, export |
| **Procurement Orders** | `/api/procurement` | 8 | orders CRUD, file upload/download/delete |
| **BOM Scanner** | `/api/bom` | 4 | scan, parts CRUD, edit items |
| **BOM Analytics** | `/api/bom-analytics` | 6 | trends, vendor stats, seed, search |
| **AI** | `/api/ai` | 1 | retrain classifier |
| **Analytics** | `/api/analytics` | 3 | dashboard, activity, item stats |
| **Audit** | `/api/audit` | 3 | logs list, create, user activity |
| **Admin: Users** | `/api/admin/users` | 6 | CRUD, stats |
| **Admin: Groups** | `/api/admin/groups` | 5 | CRUD |
| **BOM Templates** | `/api/bom-templates` | 7 | template CRUD, preview-excel, validate (admin) |
| **User Search** | `/api/users` | 2 | search users, search groups |
| **System** | `/` | 2 | root info, health |
| **Total** | | **72** | |

---

## 🔐 Authentication & Authorization

### Permission Model

| Role | Description | Can Manage |
|------|-------------|------------|
| `superadmin` | Full control | Admins + all users |
| `admin` | Administrative access | Users (not other admins) |
| `user` | Standard user | Self only |

### Granular Permissions

| Permission | Description |
|-----------|-------------|
| `inventory:ro` | Read-only inventory access |
| `inventory:rw` | Read-write inventory access |
| `procurement:ro` | Read-only procurement access |
| `procurement:rw` | Read-write procurement access |
| `procurement:view_prices` | Can view prices in procurement orders |
| `procurement:compare_prices` | Can access price comparison analytics |
| `procurement:dell:ro` / `procurement:dell:rw` | Dell vendor-specific access |
| `procurement:hpe:ro` / `procurement:hpe:rw` | HPE vendor-specific access |
| `procurement:netapp:ro` / `procurement:netapp:rw` | NetApp vendor-specific access |
| `procurement:cisco:ro` / `procurement:cisco:rw` | Cisco vendor-specific access |
| `procurement:commvault:ro` / `procurement:commvault:rw` | Commvault vendor-specific access |
| `admin` | Full admin permission |

### Security Features
- **JWT Tokens**: 240-minute expiry (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- **Password Hashing**: bcrypt
- **HTTP-Only Cookies**: Token stored in secure cookies
- **Rate Limiting**: 5 login attempts per minute
- **IP Tracking**: All audit logs record IP address and user-agent
- **GZip Compression**: Responses > 1KB compressed automatically

---

## 🔐 Auth Module (`/api/auth`)

### POST `/api/auth/login`

Local authentication with username and password.

| Property | Value |
|----------|-------|
| **Rate Limit** | 5/min |
| **Auth Required** | ❌ |

**Request:**
```json
{
  "username": "john.doe",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Errors:** `401` Invalid credentials | `429` Rate limit exceeded

---

### POST `/api/auth/domain-login`

ADFS/Active Directory authentication. Auto-creates user on first domain login.

| Property | Value |
|----------|-------|
| **Auth Required** | ❌ |

**Request:**
```json
{
  "hashed_token": "base64-encoded-adfs-token"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

---

### POST `/api/auth/logout`

End session and clear HTTP-only cookies. Audit logged.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### GET `/api/auth/me`

Get current authenticated user info.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |

**Response (200):**
```json
{
  "username": "john.doe",
  "user_id": "507f1f77bcf86cd799439011",
  "role": "admin",
  "permissions": ["inventory:rw", "procurement:rw"],
  "groups": [{ "id": "...", "name": "Engineers", "permissions": [...] }]
}
```

---

### PUT `/api/auth/password`

Change password of current authenticated user.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |

**Request:**
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword456!"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Errors:** `400` Current password incorrect | `400` New password same as current

---

## 📦 Items Module (`/api/items`)

### GET `/api/items`

List all inventory items with filtering, searching, sorting, and pagination.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `inventory:ro` |

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | — | Free text search across all fields |
| `catalog_number` | string | — | Filter by catalog number |
| `serial` | string | — | Filter by serial number |
| `manufacturer` | string | — | Filter by manufacturer |
| `description` | string | — | Filter by description |
| `location` | string | — | Filter by warehouse location |
| `current_stock` | string | — | Filter by stock level |
| `purpose` | string | — | Filter by purpose |
| `notes` | string | — | Filter by notes |
| `sort_by` | string | — | Column to sort by |
| `sort_order` | `asc` / `desc` | `asc` | Sort direction |
| `page` | int | 1 | Page number |
| `limit` | int | 30 | Items per page |

**Response (200):**
```json
{
  "items": [
    {
      "id": "507f1f77bcf86cd799439011",
      "catalog_number": "X-SFP-100G-LR4",
      "description": "100G QSFP28 LR4 Transceiver",
      "manufacturer": "NetApp",
      "location": "מחסן מרכזי",
      "serial": "SN-12345",
      "current_stock": "5",
      "warranty_expiry": "2027-06-15",
      "reserved_stock": "פרויקט אלפא: 2",
      "project_allocations": { "פרויקט אלפא": 2 },
      "purpose": "שדרוג רשת",
      "target_site": "חדר שרתים",
      "notes": "בדיקה רבעונית",
      "created_at": "2026-01-15T10:30:00Z",
      "updated_at": "2026-03-22T14:20:00Z",
      "created_by": "admin"
    }
  ],
  "total": 1250,
  "page": 1,
  "limit": 30,
  "pages": 42
}
```

---

### GET `/api/items/stale`

Get items not updated within specified number of days.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `inventory:ro` |

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `days` | int | 30 | Minimum days since last update |
| `page` | int | 1 | Page number |
| `limit` | int | 30 | Items per page |

**Response:** Same structure as GET `/api/items`

---

### GET `/api/items/{item_id}/collections`

Get all collections containing a specific item.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `inventory:ro` |

**Response (200):**
```json
[
  {
    "collection_id": "507f...",
    "collection_name": "פרויקט אלפא",
    "assigned_at": "2026-03-01T10:00:00Z"
  }
]
```

---

### POST `/api/items`

Create a new inventory item. Auto-updates the catalog.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `inventory:rw` |
| **Audit** | ✅ `item_create` |

**Request:**
```json
{
  "catalog_number": "X-SFP-100G-LR4",
  "description": "100G QSFP28 LR4 Transceiver",
  "manufacturer": "NetApp",
  "location": "מחסן מרכזי",
  "serial": "SN-12345",
  "current_stock": "5",
  "warranty_expiry": "2027-06-15",
  "purpose": "שדרוג רשת",
  "target_site": "חדר שרתים",
  "notes": ""
}
```

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `undo_log_id` | string | Audit log ID for undo operations |

**Response (201):** Created item object

---

### PATCH `/api/items/{item_id}`

Update a single field in an item. Supports undo workflow.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `inventory:rw` |
| **Audit** | ✅ `item_update` |

**Request:**
```json
{
  "field": "current_stock",
  "value": "10"
}
```

**Response (200):** Updated item object

**Immutable Fields:** `serial`, `catalog_number`, `location`, `manufacturer`, `project_allocations` — cannot be edited through this endpoint.

---

### POST `/api/items/bulk-update`

Update multiple items at once.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `inventory:rw` |
| **Audit** | ✅ `item_bulk_update` |

**Request:**
```json
{
  "ids": ["507f...", "508a...", "509b..."],
  "notes": "בדיקה תקופתית",
  "purpose": "שמורה",
  "target_site": "אתר דרום"
}
```

**Response (200):**
```json
{
  "message": "3 items updated",
  "modified_count": 3
}
```

---

### POST `/api/items/fix-reserved-stock`

Admin migration tool: sync `reserved_stock` string from `project_allocations` dict for all items.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | Admin only |

---

### DELETE `/api/items/{item_id}`

Delete a single inventory item. Requires reason for audit trail.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `inventory:rw` |
| **Audit** | ✅ `item_delete` |

**Request Body:**
```json
{
  "reason": "ציוד פגום"
}
```

---

### POST `/api/items/bulk-delete`

Delete multiple items at once.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `inventory:rw` |
| **Audit** | ✅ `item_bulk_delete` |

**Request:**
```json
{
  "ids": ["507f...", "508a..."],
  "reason": "ציוד מיושן"
}
```

**Response (200):**
```json
{
  "message": "2 items deleted",
  "deleted_count": 2
}
```

---

### POST `/api/items/delete-all`

**⚠ DANGER** — Delete entire inventory database. Admin only.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | Admin/SuperAdmin only |
| **Audit** | ✅ `item_delete` |

**Request:**
```json
{
  "reason": "איפוס מלא — מעבר למערכת חדשה"
}
```

---

## 📊 Excel Import/Export (`/api/items`)

### POST `/api/items/import-excel`

Import inventory items from Excel file.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `inventory:rw` |
| **Content-Type** | `multipart/form-data` |
| **File Types** | `.xlsx`, `.xls` |

**Smart Import Logic:**
- If item has **serial number** → match by serial for update, else create
- If item has **no serial** → match by `catalog_number` + `location`, else create
- `notes` and `purpose` fields are **never overwritten** during import (preserves manual edits)

**Response (200):**
```json
{
  "added": 15,
  "updated": 8,
  "skipped": 2,
  "errors": ["Row 45: Missing catalog_number"]
}
```

---

### POST `/api/items/import-projects`

Import project allocations from Excel. Updates `project_allocations` and `reserved_stock` on matching items.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `inventory:rw` |
| **Content-Type** | `multipart/form-data` |

**Response (200):**
```json
{
  "updated": 42,
  "total_groups": 6
}
```

---

### GET `/api/items/export-excel`

Export inventory to Excel file with applied filters.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `inventory:ro` |
| **Response Type** | `StreamingResponse` (`.xlsx`) |

**Query Parameters:** Same filters as GET `/api/items` plus:

| Param | Type | Description |
|-------|------|-------------|
| `export_mode` | `all` / `current` | Export all items or only filtered results |

---

## 📋 Catalog Module (`/api/catalog`)

### GET `/api/catalog`

List unique catalog items (aggregated SKUs with calculated stock quantities across locations).

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `inventory:ro` |

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | — | Free text search |
| `catalog_number` | string | — | Filter by catalog number |
| `description` | string | — | Filter by description |
| `manufacturer` | string | — | Filter by manufacturer |
| `sort_by` | string | — | Sort column |
| `sort_order` | `asc`/`desc` | `asc` | Sort direction |
| `page` | int | 1 | Page |
| `limit` | int | 30 | Per page |

**Response (200):**
```json
{
  "items": [
    {
      "catalog_number": "X-SFP-100G-LR4",
      "description": "100G QSFP28 LR4 Transceiver",
      "manufacturer": "NetApp",
      "total_stock": 12,
      "locations": 3
    }
  ],
  "total": 350,
  "page": 1,
  "limit": 30,
  "pages": 12
}
```

---

## 📚 Collections Module (`/api/collections`)

### POST `/api/collections`

Create a new collection. Creator becomes owner.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |

**Request:**
```json
{
  "name": "פרויקט אלפא",
  "description": "ציוד לשדרוג חדר שרתים"
}
```

---

### GET `/api/collections`

List all collections accessible to the user (owned or has permission). Admin/SuperAdmin see all collections.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |

---

### GET `/api/collections/{collection_id}`

Get collection details.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |

---

### PUT `/api/collections/{collection_id}`

Update collection name/description.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | Owner or RW |

**Request:**
```json
{
  "name": "פרויקט אלפא v2",
  "description": "ציוד מעודכן"
}
```

---

### DELETE `/api/collections/{collection_id}`

Delete collection and all its item assignments.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | Owner or Admin |

---

### GET `/api/collections/{collection_id}/items`

Get enriched items in collection — full inventory data merged with collection-specific data. Deleted items display as `[Item deleted]` with snapshot data.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |

---

### GET `/api/collections/{collection_id}/export`

Export collection items to Excel file.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Response Type** | `StreamingResponse` (`.xlsx`) |

---

### POST `/api/collections/{collection_id}/items`

Add single item to collection. Snapshots `catalog_number` and `serial` at assignment time.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | Owner or RW |

**Request:**
```json
{
  "item_id": "507f...",
  "custom_values": { "כמות נדרשת": "3" }
}
```

---

### POST `/api/collections/{collection_id}/items/bulk`

Bulk add items to collection.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | Owner or RW |

**Request:**
```json
{
  "item_ids": ["507f...", "508a...", "509b..."],
  "custom_values": {}
}
```

**Response (200):**
```json
{
  "requested": 3,
  "added": 2,
  "skipped": 1
}
```

---

### PUT `/api/collections/{collection_id}/items/{item_id}`

Update custom values for an item in a collection.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | Owner or RW |

**Request:**
```json
{
  "custom_values": { "כמות נדרשת": "5", "הערות פרויקט": "דחוף" }
}
```

---

### DELETE `/api/collections/{collection_id}/items/{item_id}`

Remove single item from collection (does NOT delete from inventory).

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | Owner or RW |

---

### POST `/api/collections/{collection_id}/items/bulk-delete`

Remove multiple items from collection.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | Owner or RW |

**Request:**
```json
{
  "item_ids": ["507f...", "508a..."]
}
```

**Response (200):**
```json
{
  "requested": 2,
  "deleted": 2
}
```

---

### POST `/api/collections/{collection_id}/permissions`

Grant permission to a user or group on a collection.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | Owner |

**Request:**
```json
{
  "target_id": "user_or_group_id",
  "target_type": "user",
  "permission_type": "RW"
}
```

Permission types: `RO` (read-only), `RW` (read-write), `OWNER`

---

### DELETE `/api/collections/{collection_id}/permissions/{target_id}`

Revoke permission from user or group.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | Owner |

---

## 🛒 Procurement Module (`/api/procurement`)

### GET `/api/procurement/orders`

List procurement orders with filters. Vendor-filtered based on user permissions. Price fields stripped for unauthorized users.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `procurement:ro` or vendor-specific |

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `page_size` | int | 20 | Items per page |
| `search` | string | — | Free text search |
| `catalog_number` | string | — | Filter by catalog number |
| `manufacturer` | string | — | Filter by manufacturer/vendor |
| `emf_number` | string | — | Filter by EMF number |
| `status_in` | string[] | — | Filter orders IN these statuses |
| `status_ne` | string | — | Filter orders NOT in this status |

**Procurement Statuses:**

| Status | Description |
|--------|-------------|
| `WAITING_BOM_EMF` | Initial — waiting for both BOM and EMF documents |
| `WAITING_SHIPMENT` | Both documents received — waiting for shipment |
| `SHIPPED` | Order shipped from vendor |
| `RECEIVED` | Order received and closed |

**Response (200):**
```json
{
  "orders": [
    {
      "id": "507f...",
      "order_date": "2026-03-15",
      "status": "WAITING_SHIPMENT",
      "emf_number": "EMF-2026-0045",
      "bom_vendor": "NetApp",
      "total_amount": 125000.00,
      "received_bom": true,
      "bom_items": [...],
      "bom_data": {...},
      "files": [...],
      "created_by": "john.doe",
      "created_at": "2026-03-15T10:00:00Z",
      "updated_at": "2026-03-20T14:30:00Z",
      "bom_received_at": "2026-03-16T09:00:00Z",
      "emf_received_at": "2026-03-17T11:00:00Z"
    }
  ],
  "total": 85
}
```

---

### POST `/api/procurement/orders`

Create a new procurement order. Auto-calculates status. Integrates with BOM Analytics for price tracking.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `procurement:rw` + vendor-specific write |
| **Audit** | ✅ `procurement_create` |

**Request:**
```json
{
  "order_date": "2026-03-15",
  "bom_items": [
    {
      "item_id": "1",
      "catalog_number": "X-SFP-100G-LR4",
      "manufacturer": "NetApp",
      "description": "100G QSFP28 LR4 Transceiver",
      "quantity": 10,
      "bom_vendor": "NetApp"
    }
  ],
  "total_amount": 125000.00,
  "emf_number": "EMF-2026-0045",
  "received_bom": true,
  "bom_vendor": "NetApp",
  "bom_data": { "groups": [...] }
}
```

---

### GET `/api/procurement/orders/{order_id}`

Get single order details.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `procurement:ro` or vendor-specific |

---

### PUT `/api/procurement/orders/{order_id}`

Update procurement order. Auto status transitions and milestone timestamps.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `procurement:rw` + vendor-specific write |
| **Audit** | ✅ `procurement_update` |

**Auto Status Logic:**
- When both `received_bom` + EMF confirmed → `WAITING_SHIPMENT`
- Milestone timestamps recorded: `bom_received_at`, `emf_received_at`, `shipped_at`

---

### DELETE `/api/procurement/orders/{order_id}`

Delete order, all files, and associated audit logs.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `procurement:rw` + vendor-specific write |
| **Audit** | ✅ `procurement_delete` |

---

### POST `/api/procurement/orders/{order_id}/files`

Upload file attachment to order.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `procurement:rw` |
| **Content-Type** | `multipart/form-data` |
| **Max Size** | 10MB |
| **Allowed Types** | PDF, JPG, PNG, GIF, XLSX, XLS, DOC, DOCX, TXT |
| **Audit** | ✅ `procurement_file_upload` |

---

### GET `/api/procurement/orders/{order_id}/files/{file_id}`

Download file attachment.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `procurement:ro` |

---

### DELETE `/api/procurement/orders/{order_id}/files/{file_id}`

Delete file attachment.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `procurement:rw` |
| **Audit** | ✅ `procurement_file_delete` |

---

## � BOM Templates Module (`/api/bom-templates`)

Admin-configurable BOM vendor format templates. Allows adding new vendor BOM formats without code changes.

### GET `/api/bom-templates`

List all BOM templates (optionally filter by `?active_only=true`).

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | Any authenticated user |

### GET `/api/bom-templates/{id}`

Get a single BOM template by MongoDB `_id`.

### POST `/api/bom-templates`

Create a new BOM template. Requires admin role.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | Admin/SuperAdmin |

**Request Body:**
```json
{
  "vendor_name": "Juniper",
  "header_detection": { "keyword": "part number", "max_scan_rows": 25 },
  "column_map": { "Part Number": "part_number", "Description": "product", "Qty": "ext_qty" },
  "group_detection": { "mode": "all_rows", "config": {} },
  "data_row_filter": null,
  "color": "#00B4D8",
  "logo": "🔧"
}
```

### PUT `/api/bom-templates/{id}`

Update an existing BOM template. Requires admin role.

### DELETE `/api/bom-templates/{id}`

Deactivate a BOM template (soft-delete). Requires admin role.

### POST `/api/bom-templates/preview-excel`

Upload an Excel file and return the first N rows for column mapping preview. `multipart/form-data` with `file` field and optional `max_rows` (default 50).

### POST `/api/bom-templates/validate`

Validate a template config against an uploaded Excel file. `multipart/form-data` with `file` and `config` (JSON string) fields.

---

## �🔍 BOM Scanner Module (`/api/bom`)

### POST `/api/bom/scan`

Scan and parse a BOM Excel file. Supports multiple vendor formats. AI classifier auto-categorizes components.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `procurement:rw` + vendor-specific write |
| **Content-Type** | `multipart/form-data` |

**Supported Formats:**

| Format Key | Vendor |
|-----------|--------|
| `netapp_pricing_template` | NetApp |
| `dell_quote` | Dell |
| `hpe_quote` | HPE |
| `cisco_quote` | Cisco |
| `generic_first_col` | Generic (any vendor) |
| *dynamic* | Any admin-configured template from `/api/bom-templates` |

**Response (200):**
```json
{
  "groups": [
    {
      "main": {
        "part_number": "AFF-A90",
        "description": "NetApp AFF A90 Storage System",
        "quantity": 1,
        "unit_price": 50000,
        "category": "server-storage",
        "confidence": 0.95,
        "description_he": "מערכת אחסון NetApp AFF A90"
      },
      "children": [
        {
          "part_number": "X-SFP-100G-LR4",
          "description": "100G QSFP28 LR4 Transceiver",
          "quantity": 10,
          "category": "sfp-qsfp",
          "confidence": 0.88,
          "description_he": "ג'יביק QSFP28 100G LR4"
        }
      ]
    }
  ],
  "unknown_parts": ["CUSTOM-PART-001"],
  "file_s3_key": "bom/2026/03/scan_abc123.xlsx"
}
```

**AI Classification Categories (16):**
`server-storage`, `disk-shelf`, `switch`, `io-card`, `disk`, `cable`, `sfp-qsfp`, `cpu`, `memory`, `fan`, `psu`, `license-capacity`, `license-software`, `support`, `server`, `other`

---

### POST `/api/bom/parts/{part_number}`

Save or update a part in the BOM catalog (for AI training and future lookups).

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |

**Request:**
```json
{
  "description_he": "מתג 48 פורטים 25G",
  "category": "switch",
  "important": true,
  "excel_description": "48-Port 25GbE Switch"
}
```

---

### GET `/api/bom/parts`

Get all saved parts from the BOM catalog.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |

---

### PATCH `/api/bom/scan/items`

Edit BOM items after AI classification (correct categories/descriptions). Requires vendor-specific write permission.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | Vendor-specific write |

**Request:**
```json
{
  "vendor": "netapp",
  "items": [
    {
      "part_number": "X-SFP-100G-LR4",
      "description_he": "ג'יביק QSFP28 100G LR4",
      "category": "sfp-qsfp",
      "part_alias": "",
      "excel_description": "100G QSFP28 LR4 Transceiver"
    }
  ]
}
```

---

## 📈 BOM Analytics Module (`/api/bom-analytics`)

### POST `/api/bom-analytics/seed`

Initialize historical price data from existing procurement orders. Run once to populate analytics.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |

---

### GET `/api/bom-analytics/search-parts`

Autocomplete search for part numbers.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search query |
| `item_type` | `main` / `component` | Filter by part type |
| `limit` | int | Max results |

---

### GET `/api/bom-analytics/trends/{part_number}`

Get historical pricing trends for a specific part number.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `procurement:compare_prices` |

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `item_type` | string | Optional: `main` or `component` |

**Response (200):**
```json
[
  {
    "date": "2026-01-15",
    "price": 1250.00,
    "vendor": "NetApp",
    "order_id": "507f..."
  }
]
```

---

### POST `/api/bom-analytics/aggregate-trends`

Cross-order price aggregation for product chains (e.g., product generations).

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `procurement:compare_prices` |

**Request:**
```json
{
  "main_part": "AFF-A800",
  "secondary_parts": ["AFF-A90"]
}
```

---

### GET `/api/bom-analytics/vendor-discounts`

Average discount percentages by vendor.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `procurement:compare_prices` |

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `months` | int | 12 | Lookback period in months |

---

### GET `/api/bom-analytics/vendor-spending`

Total spending per vendor with time-series resolution.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `procurement:compare_prices` |

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `resolution` | `daily` / `monthly` / `yearly` | `monthly` | Time granularity |
| `start_date` | date | — | Start date |
| `end_date` | date | — | End date |

---

## 🤖 AI Module (`/api/ai`)

### POST `/api/ai/retrain`

Retrain the BOM component classifier model. Merges verified MongoDB data with static CSV training set.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | Admin/SuperAdmin only |

**Response (200):**
```json
{
  "accuracy": 0.92,
  "cv_accuracy": 0.89,
  "labels": ["server-storage", "disk", "cable", "sfp-qsfp", "..."],
  "total_samples": 1250
}
```

**Requirements:** Minimum 20 samples in training set.

---

## 📊 Analytics Module (`/api/analytics`)

### GET `/api/analytics/dashboard`

Comprehensive dashboard statistics with optional date filtering.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `start_date` | date | Optional — filter procurement data by start date |
| `end_date` | date | Optional — filter procurement data by end date |

**Response (200):**
```json
{
  "projects": [{ "name": "פרויקט אלפא", "value": 45 }],
  "total_items": 1250,
  "active_allocations": 312,
  "serial_count": 870,
  "non_serial_count": 380,
  "target_sites": [{ "name": "חדר שרתים", "value": 80 }],
  "manufacturers": [{ "name": "NetApp", "value": 350 }],
  "locations": [{ "name": "מחסן מרכזי", "value": 600 }],
  "procurement": {
    "waiting_emf": 5,
    "waiting_bom": 3,
    "ordered": 12,
    "received": 45,
    "total_spend": 2500000
  }
}
```

---

### GET `/api/analytics/activity`

Activity counts for the last N days.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |

**Query Parameters:**

| Param | Type | Default |
|-------|------|---------|
| `days` | int | 7 |

**Response (200):**
```json
{
  "created": 15,
  "updated": 42,
  "deleted": 3
}
```

---

### GET `/api/analytics/item/{catalog_number}`

Project allocation statistics for a specific SKU.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | `inventory:ro` |

**Response (200):**
```json
[
  { "name": "פרויקט אלפא", "value": 5 },
  { "name": "פרויקט בטא", "value": 3 }
]
```

---

## 📝 Audit Module (`/api/audit`)

### GET `/api/audit/logs`

Get audit logs with filtering and pagination.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | Admin/SuperAdmin or inventory permissions |

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | int | Page number |
| `page_size` | int | Items per page |
| `action` | string | Filter by action type |
| `actor` | string | Filter by who performed the action |
| `target_user` | string | Filter by target user |
| `target_resource` | string | Filter by resource type |
| `resource_id` | string | Filter by specific resource |
| `search` | string | Free text search |
| `start_date` | date | Start of date range |
| `end_date` | date | End of date range |

**Response (200):**
```json
{
  "logs": [
    {
      "id": "507f...",
      "action": "item_update",
      "actor": "john.doe",
      "actor_role": "admin",
      "target_resource": "item",
      "resource_id": "508a...",
      "target_resource_name": "X-SFP-100G-LR4",
      "changes": { "current_stock": { "old": "5", "new": "10" } },
      "reason": "",
      "ip_address": "10.0.0.55",
      "user_agent": "Mozilla/5.0...",
      "timestamp": "2026-03-22T14:20:00Z"
    }
  ],
  "total": 5420,
  "page": 1,
  "page_size": 20
}
```

**All Audit Actions:**

| Category | Actions |
|----------|---------|
| Items | `item_create`, `item_update`, `item_delete`, `item_bulk_update`, `item_bulk_delete`, `item_import` |
| Users | `user_create`, `user_update`, `user_delete`, `user_search` |
| Groups | `group_create`, `group_update`, `group_delete` |
| Collections | `collection_create`, `collection_update`, `collection_delete`, `collection_add_item`, `collection_remove_item` |
| Procurement | `procurement_create`, `procurement_update`, `procurement_delete`, `procurement_file_upload`, `procurement_file_delete` |
| Auth | `auth_login`, `auth_logout`, `auth_domain_login` |

---

### POST `/api/audit/logs`

Create a manual audit entry (used internally for undo operations).

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |

---

### GET `/api/audit/users/{username}`

Get all audit activity for a specific user.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | Admin/SuperAdmin |

---

## 👥 Admin: Users Module (`/api/admin/users`)

### GET `/api/admin/users`

List all users.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | Admin/SuperAdmin |

---

### POST `/api/admin/users`

Create a new user account. Audit logged with IP and user-agent.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | Admin/SuperAdmin |
| **Audit** | ✅ `user_create` |

**Request:**
```json
{
  "username": "alice.smith",
  "password": "InitialPassword123!",
  "user_type": "local",
  "role": "user",
  "permissions": ["inventory:ro", "procurement:ro"]
}
```

**Constraints:**
- Username: 3–50 characters
- Password required for `local` users only (`ad` users authenticate via domain)
- Can only create users with lower role than creator

---

### GET `/api/admin/users/{user_id}`

Get specific user details.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | Admin/SuperAdmin |

**Response (200):**
```json
{
  "id": "507f...",
  "username": "alice.smith",
  "role": "user",
  "user_type": "local",
  "permissions": ["inventory:ro"],
  "is_active": true,
  "created_at": "2025-06-15T00:00:00Z",
  "updated_at": "2026-03-01T10:00:00Z",
  "created_by": "admin",
  "last_login": "2026-03-22T09:00:00Z"
}
```

---

### PUT `/api/admin/users/{user_id}`

Update user details (role, permissions, active status).

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | Admin/SuperAdmin |
| **Audit** | ✅ `user_update` |

**Request:**
```json
{
  "role": "admin",
  "permissions": ["inventory:rw", "procurement:rw"],
  "is_active": true
}
```

---

### DELETE `/api/admin/users/{user_id}`

Delete a user account.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | Admin/SuperAdmin |
| **Audit** | ✅ `user_delete` |

**Constraints:**
- Cannot delete the last Admin
- Cannot delete a SuperAdmin
- Reason required in request body

---

### GET `/api/admin/stats`

User statistics for admin dashboard.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |
| **Permission** | Admin/SuperAdmin |

**Response (200):**
```json
{
  "total_users": 45,
  "active_users": 42,
  "superadmins": 2,
  "admins": 5,
  "regular_users": 38
}
```

---

## 👥 Admin: Groups Module (`/api/admin/groups`)

### GET `/api/admin/groups`
List all groups. **Permission:** Admin/SuperAdmin

### POST `/api/admin/groups`
Create a new group. **Permission:** Admin/SuperAdmin

**Request:**
```json
{
  "name": "מהנדסי רשת",
  "role": "user",
  "permissions": ["inventory:ro", "procurement:netapp:ro"]
}
```

### GET `/api/admin/groups/{group_id}`
Get group details. **Permission:** Admin/SuperAdmin

### PUT `/api/admin/groups/{group_id}`
Update group (name, role, permissions, active status). **Permission:** Admin/SuperAdmin

### DELETE `/api/admin/groups/{group_id}`
Delete a group. **Permission:** Admin/SuperAdmin

---

## 🔍 User Search Module (`/api/users`)

### GET `/api/users/search`

Search users by username or email. Minimum 2 characters.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |

**Query:** `?q=john`

---

### GET `/api/users/groups/search`

Search groups by name.

| Property | Value |
|----------|-------|
| **Auth Required** | ✅ |

**Query:** `?q=מהנדסי`

---

## ⚙️ System Endpoints

### GET `/`

Root information endpoint — returns app name and version.

### GET `/health`

Health check — returns MongoDB connection status and app version.

**Response (200):**
```json
{
  "status": "healthy",
  "mongodb": "connected",
  "version": "2.0.0"
}
```

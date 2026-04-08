# 📡 API Endpoints - Extended Reference

## 📋 Quick Reference Table

| Module | Count | Endpoints |
|--------|-------|-----------|
| **Authentication** | 5 | /login, /domain-login, /logout, /me, /password |
| **Items** | 8 | GET, POST, PATCH, bulk-update, bulk-delete, delete-all, stale, collections |
| **Users** | 6 | GET all, GET one, POST, PUT, DELETE, /stats |
| **Groups** | 5 | GET all, GET one, POST, PUT, DELETE |
| **Excel** | 3 | /import-excel, /import-projects, /export-excel |
| **Collections** | 13 | GET all, POST, GET one, PUT, DELETE, /items/* (manage items), /permissions/* |
| **Procurement** | 8 | GET orders, POST, GET one, PUT, DELETE, /files/* (upload/download/delete) |
| **BOM Scanner** | 5 | POST /scan, POST /parts/{pn}, GET /parts, PATCH /scan/items, POST /ai/retrain |
| **Analytics** | 3 | /dashboard, /activity, /item/{catalog_number} |
| **Audit** | 3 | /logs, POST (create log), /users/{username} |
| **Users Search** | 2 | /search, /groups/search |
| **Total** | **55+** | Endpoints |

---

## 🔐 Authentication Module (`/api/auth`)

### 1. POST /login
**Description**: Local authentication with username and password

**Request**:
```json
{
  "username": "john.doe",
  "password": "SecurePassword123!"
}
```

**Response** (201 Created):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 14400,
  "user_id": "507f1f77bcf86cd799439011",
  "username": "john.doe",
  "role": "admin",
  "permissions": ["INVENTORY_RW", "PROCUREMENT_RW", "ADMIN"]
}
```

**Rate Limit**: 5 requests per minute
**Requires Auth**: ❌ No
**Requires Permission**: ❌ No

---

### 2. POST /domain-login
**Description**: Authentication via ADFS/Domain credentials

**Request**:
```json
{
  "domain": "company.com",
  "username": "john.doe",
  "password": "DomainPassword123!"
}
```

**Response** (201 Created):
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user_id": "507f...",
  "username": "john.doe",
  "role": "user",
  "permissions": ["INVENTORY_RO"],
  "domain_user": true
}
```

**Rate Limit**: 5 requests per minute
**Requires Auth**: ❌ No

---

### 3. POST /logout
**Description**: Logout current user and invalidate token

**Request**:
```
No body (uses Authorization header)
```

**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

**Requires Auth**: ✅ Yes (Bearer token)

---

### 4. GET /me
**Description**: Get current authenticated user info

**Response** (200 OK):
```json
{
  "username": "john.doe",
  "user_id": "507f1f77bcf86cd799439011",
  "role": "admin",
  "permissions": ["INVENTORY_RW", "PROCUREMENT_RW", "ADMIN"],
  "email": "john@company.com"
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: ❌ No

---

### 5. PUT /password
**Description**: Change password of current user

**Request**:
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword456!"
}
```

**Response** (200 OK):
```json
{
  "message": "Password changed successfully"
}
```

**Validation**:
- Current password must be correct
- New password must be different
- Password must be 8+ characters
- Password must contain upper, lower, number, special char

**Requires Auth**: ✅ Yes

---

## 📦 Items Module (`/api/items`)

### 1. GET / (List Items)
**Description**: Get all inventory items with filtering, searching, and pagination

**Query Parameters**:
```
?filter={"category":"Electronics"}&search=LED&sort=-price&page=1&limit=50
```

**Detailed Query Params**:
| Param | Type | Example | Default | Required |
|-------|------|---------|---------|----------|
| `filter` | JSON | {"status":"active"} | {} | ❌ |
| `search` | String | "LED 5mm" | "" | ❌ |
| `sort` | String | "-price" (descending) | "" | ❌ |
| `page` | Integer | 1 | 1 | ❌ |
| `limit` | Integer | 50 | 30 | ❌ |
| `fields` | String | "name,quantity,price" | All | ❌ |

**Response** (200 OK):
```json
{
  "items": [
    {
      "id": "507f1f77bcf86cd799439011",
      "catalog_number": "LED-001",
      "name": "LED Red 5mm",
      "category": "Electronics",
      "quantity": 500,
      "reserved_stock": 100,
      "available": 400,
      "unit": "PCS",
      "location": "A1-B2-C3",
      "supplier": "Supplier A",
      "cost": 0.50,
      "price": 1.50,
      "status": "active",
      "updated_at": "2026-02-17T14:30:00Z",
      "updated_by": "john.doe"
    }
  ],
  "total": 2450,
  "page": 1,
  "limit": 50,
  "total_pages": 49
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `INVENTORY_RO` or `INVENTORY_RW`

---

### 2. GET /stale
**Description**: Get items not updated within specified days

**Query Parameters**:
```
?days=30&page=1&limit=30
```

| Param | Type | Range | Default |
|-------|------|-------|---------|
| `days` | Integer | ≥ 1 | 30 |
| `page` | Integer | ≥ 1 | 1 |
| `limit` | Integer | 1-1000 | 30 |

**Response** (200 OK):
```json
{
  "items": [
    {
      "catalog_number": "OLD-ITEM-001",
      "last_updated": "2025-12-15T10:00:00Z",
      "days_since_update": 64,
      "quantity": 12
    }
  ],
  "total": 23,
  "stale_percentage": 0.94
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `INVENTORY_RO` or `INVENTORY_RW`

---

### 3. GET /{item_id}/collections
**Description**: Get all collections containing this item

**Response** (200 OK):
```json
{
  "collections": [
    {
      "collection_id": "507f...",
      "name": "Active Stock",
      "description": "Items in current use",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "total": 3
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `INVENTORY_RO` or `INVENTORY_RW`

---

### 4. POST / (Create Item)
**Description**: Create a new inventory item

**Request**:
```json
{
  "catalog_number": "LED-002",
  "name": "LED Green 5mm",
  "description": "Green light emitting diode",
  "category": "Electronics",
  "quantity": 1000,
  "unit": "PCS",
  "supplier": "Supplier A",
  "cost": 0.45,
  "price": 1.20,
  "location": "A1-B2-C3",
  "minimum_stock": 100,
  "reorder_point": 200
}
```

**Response** (201 Created):
```json
{
  "id": "507f1f77bcf86cd799439011",
  "catalog_number": "LED-002",
  "name": "LED Green 5mm",
  "quantity": 1000,
  "created_at": "2026-02-17T14:30:00Z",
  "created_by": "john.doe"
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `INVENTORY_RW`

---

### 5. PATCH /{item_id} (Update Single Field)
**Description**: Update a single field in an item

**Request**:
```json
{
  "field": "quantity",
  "value": 750
}
```

**Response** (200 OK):
```json
{
  "id": "507f...",
  "catalog_number": "LED-002",
  "quantity": 750,
  "updated_at": "2026-02-17T15:00:00Z"
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `INVENTORY_RW`

---

### 6. POST /bulk-update (Bulk Update)
**Description**: Update multiple items at once

**Request**:
```json
{
  "filters": {
    "_id": { "$in": ["507f...", "507g...", "507h..."] }
  },
  "updates": {
    "status": "inactive",
    "location": "Archive"
  }
}
```

**Response** (200 OK):
```json
{
  "matched_count": 3,
  "modified_count": 3,
  "items": [
    { "id": "507f...", "status": "inactive", "location": "Archive" }
  ]
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `INVENTORY_RW`

---

### 7. DELETE /{item_id} (Delete Single Item)
**Description**: Delete a single item

**Request**:
```json
{
  "reason": "Damaged beyond repair"
}
```

**Response** (200 OK):
```json
{
  "message": "Item deleted",
  "deleted_item": {
    "id": "507f...",
    "catalog_number": "LED-001",
    "deleted_at": "2026-02-17T15:00:00Z",
    "deleted_by": "john.doe"
  }
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `INVENTORY_RW`

---

### 8. POST /bulk-delete (Delete Multiple)
**Description**: Delete multiple items at once

**Request**:
```json
{
  "item_ids": ["507f...", "507g...", "507h..."],
  "reason": "Obsolete products"
}
```

**Response** (200 OK):
```json
{
  "deleted_count": 3,
  "message": "3 items deleted"
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `INVENTORY_RW`

---

### 9. POST /delete-all (Clear All Inventory)
**Description**: **DANGER** - Delete all items (admin only)

**Request**:
```json
{
  "reason": "Complete inventory reset - migration to new system"
}
```

**Response** (200 OK):
```json
{
  "deleted_count": 12450,
  "message": "All inventory cleared"
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `ADMIN` (Admin only)

---

## 👥 Users Module (`/api/admin/users`)

### 1. GET / (List Users)
**Description**: Get all users (admin only)

**Query Parameters**:
```
?page=1&limit=25&filter=active
```

**Response** (200 OK):
```json
{
  "users": [
    {
      "id": "507f...",
      "username": "john.doe",
      "email": "john@company.com",
      "role": "admin",
      "permissions": ["INVENTORY_RW", "ADMIN"],
      "is_active": true,
      "last_login": "2026-02-17T10:00:00Z",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 25
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `ADMIN`

---

### 2. POST / (Create User)
**Description**: Create a new user account

**Request**:
```json
{
  "username": "alice.smith",
  "email": "alice@company.com",
  "password": "InitialPassword123!",
  "role": "user",
  "permissions": ["INVENTORY_RO"],
  "is_active": true
}
```

**Response** (201 Created):
```json
{
  "id": "507f...",
  "username": "alice.smith",
  "email": "alice@company.com",
  "role": "user",
  "created_at": "2026-02-17T14:30:00Z",
  "created_by": "admin"
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `ADMIN`

---

### 3. GET /{user_id} (Get User)
**Description**: Get specific user details

**Response** (200 OK):
```json
{
  "id": "507f...",
  "username": "alice.smith",
  "email": "alice@company.com",
  "role": "user",
  "permissions": ["INVENTORY_RO"],
  "is_active": true,
  "groups": ["Engineers"],
  "last_login": "2026-02-16T18:00:00Z",
  "login_count": 142,
  "created_at": "2025-06-15T00:00:00Z",
  "created_by": "admin"
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `ADMIN`

---

### 4. PUT /{user_id} (Update User)
**Description**: Update user details

**Request**:
```json
{
  "email": "alice.smith@company.com",
  "role": "manager",
  "permissions": ["INVENTORY_RW", "PROCUREMENT_RO"],
  "is_active": true
}
```

**Response** (200 OK):
```json
{
  "id": "507f...",
  "username": "alice.smith",
  "role": "manager",
  "updated_at": "2026-02-17T15:00:00Z",
  "updated_by": "admin"
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `ADMIN`

---

### 5. DELETE /{user_id} (Delete User)
**Description**: Delete user account

**Request**:
```json
{
  "reason": "Left company"
}
```

**Response** (200 OK):
```json
{
  "message": "User deleted",
  "deleted_user": {
    "id": "507f...",
    "username": "alice.smith",
    "deleted_at": "2026-02-17T15:00:00Z"
  }
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `ADMIN`

---

### 6. GET /stats (User Statistics)
**Description**: Get user statistics for dashboard

**Response** (200 OK):
```json
{
  "total_users": 45,
  "active_users": 42,
  "inactive_users": 3,
  "by_role": {
    "admin": 3,
    "manager": 8,
    "user": 32,
    "procurement": 2
  },
  "by_permission": {
    "INVENTORY_RW": 12,
    "INVENTORY_RO": 33,
    "PROCUREMENT_RW": 2,
    "PROCUREMENT_RO": 5,
    "ADMIN": 3
  },
  "last_7_days_logins": 142,
  "new_users_this_month": 3
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `ADMIN`

---

## 🛒 Groups Module (`/api/groups`)

### 1-5. Groups CRUD Operations
Similar structure to Users. Endpoints:
- **GET** / - List all groups
- **POST** / - Create group
- **GET** /{group_id} - Get group details
- **PUT** /{group_id} - Update group
- **DELETE** /{group_id} - Delete group

---

## 📄 Excel Module (`/api/excel`)

### 1. POST /import-excel
**Description**: Import items from Excel file

**Request**: FormData
```
file: <xlsx/csv file>
```

**Response** (200 OK):
```json
{
  "imported_count": 47,
  "skipped_count": 3,
  "errors": [
    {
      "row": 15,
      "catalog_number": "DUP-001",
      "error": "Duplicate catalog number"
    }
  ],
  "warnings": [
    {
      "row": 8,
      "message": "Missing supplier - using default"
    }
  ]
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `INVENTORY_RW`

---

### 2. POST /import-projects
**Description**: Import projects (create collections)

**Request**: FormData
```
file: <xlsx file with project data>
```

**Response** (200 OK):
```json
{
  "imported_count": 5,
  "created_collections": [
    {
      "collection_id": "507f...",
      "name": "Project A",
      "items_added": 45
    }
  ]
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `ADMIN`

---

### 3. GET /export-excel
**Description**: Export inventory to Excel file

**Query Parameters**:
```
?format=xlsx&include_hidden=false&apply_filters=true
```

**Response** (200 OK):
```
Binary file: inventory-2026-02-17.xlsx
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `INVENTORY_RO` or `INVENTORY_RW`

---

## 📚 Collections Module (`/api/collections`)

### 1. GET / (List Collections)
**Description**: Get all collections user has access to

**Response** (200 OK):
```json
{
  "collections": [
    {
      "id": "507f...",
      "name": "Active Stock",
      "description": "Items in current use",
      "item_count": 145,
      "owner": "john.doe",
      "created_at": "2026-01-01T00:00:00Z",
      "permission_level": "manage"
    }
  ],
  "total": 8
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `INVENTORY_RO` or `INVENTORY_RW`

---

### 2. POST / (Create Collection)
**Description**: Create new collection

**Request**:
```json
{
  "name": "Urgent Stock",
  "description": "Items needed ASAP",
  "items": ["507f...", "507g..."]
}
```

**Response** (201 Created):
```json
{
  "id": "507f...",
  "name": "Urgent Stock",
  "item_count": 2,
  "created_at": "2026-02-17T14:30:00Z"
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `INVENTORY_RW`

---

### 3-5. Collection CRUD
- **GET** /{collection_id} - Get collection details
- **PUT** /{collection_id} - Update collection
- **DELETE** /{collection_id} - Delete collection

---

### 6. GET /{collection_id}/items
**Description**: Get items in collection

**Response** (200 OK):
```json
{
  "items": [
    {
      "item_id": "507f...",
      "catalog_number": "LED-001",
      "name": "LED Red 5mm",
      "quantity": 500,
      "price": 1.50
    }
  ],
  "total": 145
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `INVENTORY_RO` or `INVENTORY_RW`

---

### 7-13. Collection Items Management
- **POST** /{collection_id}/items - Add item
- **POST** /{collection_id}/items/bulk - Add multiple items
- **PUT** /{collection_id}/items/{item_id} - Update item in collection
- **DELETE** /{collection_id}/items/{item_id} - Remove item
- **POST** /{collection_id}/items/bulk-delete - Remove multiple
- **POST** /{collection_id}/permissions - Grant permission
- **DELETE** /{collection_id}/permissions/{target_id} - Revoke permission

---

## 🛒 Procurement Module (`/api/procurement/orders`)

### 1. GET / (List Orders)
**Description**: Get procurement orders

**Query Parameters**:
```
?status=pending&supplier=Supplier%20A&page=1&limit=25
```

**Response** (200 OK):
```json
{
  "orders": [
    {
      "id": "507f...",
      "order_number": "PO-001",
      "supplier": "Supplier A",
      "total_amount": 5200.00,
      "status": "pending",
      "expected_delivery": "2026-03-01",
      "created_at": "2026-02-17T10:00:00Z",
      "created_by": "john.doe",
      "item_count": 2
    }
  ],
  "total": 28,
  "page": 1
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `PROCUREMENT_RO` or `PROCUREMENT_RW`

---

### 2. POST / (Create Order)
**Description**: Create new procurement order

**Request**:
```json
{
  "supplier": "Supplier A",
  "items": [
    {
      "item_id": "507f...",
      "quantity": 100,
      "unit_price": 2.50
    }
  ],
  "total_amount": 250.00,
  "expected_delivery": "2026-03-01",
  "notes": "Urgent - needed for project X"
}
```

**Response** (201 Created):
```json
{
  "id": "507f...",
  "order_number": "PO-004",
  "status": "pending",
  "created_at": "2026-02-17T14:30:00Z"
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `PROCUREMENT_RW`

---

### 3-5. Order CRUD
- **GET** /{order_id} - Get order details
- **PUT** /{order_id} - Update order
- **DELETE** /{order_id} - Cancel order

---

### 6. POST /{order_id}/files
**Description**: Upload file to order

**Request**: FormData
```
file: <any file>
```

**Response** (201 Created):
```json
{
  "file_id": "507f...",
  "filename": "invoice.pdf",
  "size": 125000,
  "url": "/uploads/procurement/507f.pdf",
  "uploaded_at": "2026-02-17T15:00:00Z"
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `PROCUREMENT_RW`

---

### 7. GET /{order_id}/files/{file_id}
**Description**: Download file

**Response** (200 OK):
```
Binary file download
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `PROCUREMENT_RO` or `PROCUREMENT_RW`

---

### 8. DELETE /{order_id}/files/{file_id}
**Description**: Delete file from order

**Requires Auth**: ✅ Yes
**Requires Permission**: `PROCUREMENT_RW`

---

## � BOM Scanner Module (`/api/bom`)

### 1. POST /scan
**Description**: Upload and scan a vendor BOM Excel file

**Query Params**: `format` (e.g. `netapp_pricing_template`, `hpe_quote`, `cisco_quote`, `dell_quote`)

**Requires Auth**: ✅ Yes
**Requires Permission**: Vendor-specific write (`procurement:{vendor}:rw`) or global `PROCUREMENT_RW`

### 2. POST /parts/{part_number}
**Description**: Save or update a part in the BOM catalog

### 3. GET /parts
**Description**: Fetch all parts from the catalog

### 4. PATCH /scan/items
**Description**: Batch-edit BOM items after AI scan (before order finalization). Edits are persisted to catalog for future model improvement.

**Request**:
```json
{
  "vendor": "NETAPP",
  "items": [
    { "part_number": "X446B-R6", "description_he": "כונן SSD 800GB", "category": "disk" },
    { "part_number": "X6589-R6", "category": "cable" }
  ]
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: Vendor-specific write (`procurement:{vendor}:rw`) or SUPERADMIN/ADMIN

### 5. POST /api/ai/retrain
**Description**: Retrain the AI classification model from MongoDB catalog + CSV data. Admin only.

**Requires Auth**: ✅ Yes
**Requires Permission**: `ADMIN` or `SUPERADMIN`

---

## �📊 Analytics Module (`/api/analytics`)

### 1. GET /dashboard
**Description**: Get dashboard statistics

**Response** (200 OK):
```json
{
  "total_items": 12450,
  "total_users": 45,
  "active_orders": 8,
  "low_stock_count": 3,
  "stale_items_count": 15,
  "stats": {
    "items_by_category": {
      "Electronics": 4200,
      "Hardware": 3100,
      "Software": 2500
    },
    "orders_by_status": {
      "pending": 5,
      "in_transit": 2,
      "received": 1
    }
  }
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: (Any)

---

### 2. GET /activity
**Description**: Get recent activity feed

**Response** (200 OK):
```json
{
  "activities": [
    {
      "timestamp": "2026-02-17T15:00:00Z",
      "user": "john.doe",
      "action": "CREATE",
      "resource_type": "item",
      "resource_name": "LED-001",
      "details": "Added new LED component"
    }
  ],
  "total": 150
}
```

**Requires Auth**: ✅ Yes

---

### 3. GET /item/{catalog_number}
**Description**: Get detailed analytics for one item

**Response** (200 OK):
```json
{
  "catalog_number": "LED-001",
  "name": "LED Red 5mm",
  "history": [
    {
      "date": "2026-02-17",
      "quantity": 500,
      "reserved": 100,
      "change": -50
    }
  ],
  "usage_stats": {
    "times_ordered": 12,
    "total_quantity_sold": 600,
    "last_order_date": "2026-02-15"
  }
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `INVENTORY_RO` or `INVENTORY_RW`

---

## 📝 Audit Module (`/api/audit/logs`)

### 1. GET /logs
**Description**: Get audit logs

**Query Parameters**:
```
?user=john.doe&action=UPDATE&from=2026-02-01&to=2026-02-17&page=1
```

**Response** (200 OK):
```json
{
  "logs": [
    {
      "id": "507f...",
      "timestamp": "2026-02-17T15:00:00Z",
      "user": "john.doe",
      "action": "UPDATE",
      "resource_type": "item",
      "resource_id": "507f...",
      "changes": {
        "quantity": { "old": 500, "new": 450 },
        "reserved": { "old": 100, "new": 50 }
      },
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0..."
    }
  ],
  "total": 1250,
  "page": 1
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `ADMIN`

---

### 2. POST /logs
**Description**: Create audit log entry (internal use)

**Request**:
```json
{
  "action": "UPDATE",
  "resource_type": "item",
  "resource_id": "507f...",
  "details": { "field": "quantity", "old": 500, "new": 450 }
}
```

**Requires Auth**: ✅ Yes (System only)

---

### 3. GET /users/{username}
**Description**: Get audit logs for specific user

**Response** (200 OK):
```json
{
  "username": "john.doe",
  "logs": [
    {
      "timestamp": "2026-02-17T15:00:00Z",
      "action": "UPDATE",
      "resource": "item:LED-001"
    }
  ],
  "total": 342,
  "first_login": "2025-06-15T00:00:00Z",
  "last_login": "2026-02-17T10:00:00Z"
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `ADMIN`

---

## 🔍 Users Search Module (`/api/users`)

### 1. GET /search
**Description**: Search for users

**Query Parameters**:
```
?q=john&limit=10
```

**Response** (200 OK):
```json
{
  "users": [
    {
      "id": "507f...",
      "username": "john.doe",
      "email": "john@company.com",
      "role": "admin"
    }
  ],
  "total": 1
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `ADMIN` or `PROCUREMENT_RW`

---

### 2. GET /groups/search
**Description**: Search for groups

**Query Parameters**:
```
?q=engineer&limit=5
```

**Response** (200 OK):
```json
{
  "groups": [
    {
      "id": "507f...",
      "name": "Engineers",
      "member_count": 12
    }
  ],
  "total": 1
}
```

**Requires Auth**: ✅ Yes
**Requires Permission**: `ADMIN`

---

## ⏱️ Response Times (Typical)

| Endpoint | Small Load | Medium Load | Large Load |
|----------|-----------|-------------|-----------|
| GET /items | 50-100ms | 100-200ms | 200-500ms |
| POST /items | 30-50ms | 50-100ms | 100-200ms |
| POST /import-excel | 500ms-2s | 2-5s | 5-10s |
| GET /export-excel | 200-500ms | 500ms-2s | 2-5s |
| POST /login | 100-200ms | 200-300ms | 300-500ms |

---

## 🔄 Pagination Guidance

**Default**: 
- page = 1
- limit = 30

**Limits**:
- Minimum limit = 1
- Maximum limit = 1000

**Example**:
```
GET /api/items?page=3&limit=50
→ Skip first 100 items, return next 50
→ Response includes: items[], total, page, limit, total_pages
```

---

## 🔐 Authorization Header Format

```
Authorization: Bearer <access_token>
```

**Example**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqb2huLmRvZSIsInVzZXJfaWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3MDgxMjM0NTZ9.SIGNATURE
```

---

## 📊 Common Filter Examples

### Items Filtering
```json
// Only active Electronics with low stock
{
  "category": "Electronics",
  "status": "active",
  "quantity": { "$lt": 50 }
}

// Multiple statuses
{
  "status": { "$in": ["active", "pending_review"] }
}

// Date range
{
  "created_at": {
    "$gte": "2026-01-01T00:00:00Z",
    "$lt": "2026-02-01T00:00:00Z"
  }
}
```

---

## 🧪 Testing Endpoints

### With curl:
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# List items (with token)
curl -X GET http://localhost:8000/api/items \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create item
curl -X POST http://localhost:8000/api/items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"catalog_number":"NEW-001","name":"Test Item","quantity":100}'
```

### With Python:
```python
import requests

# Login
response = requests.post(
    'http://localhost:8000/api/auth/login',
    json={'username': 'admin', 'password': 'password'}
)
token = response.json()['access_token']

# Get items
headers = {'Authorization': f'Bearer {token}'}
items = requests.get(
    'http://localhost:8000/api/items',
    headers=headers
).json()
```

---

**Last Updated**: 17-02-2026
**API Version**: 2.0.0
**Base URL**: http://localhost:8000/api (development) or https://api.warehouse.company.com/api (production)
**Documentation**: http://localhost:8000/docs (Swagger UI)

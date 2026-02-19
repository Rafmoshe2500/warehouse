# 🔄 Data Flow & Interaction Diagrams

## 📊 System-wide Communication Flow

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Browser as 🖥️ Browser
    participant Frontend as ⚛️ React App
    participant API as 🔗 FastAPI
    participant Auth as 🔐 Auth Service
    participant DB as 💾 MongoDB
    
    User->>Browser: Opens /inventory
    Browser->>Frontend: React loads
    Frontend->>Frontend: Check localStorage for token
    
    alt No token
        Frontend->>Browser: Redirect to /login
    else Has token
        Frontend->>API: GET /auth/me with token
        API->>Auth: Verify JWT token
        Auth->>DB: Load user record
        DB->>Auth: User data + permissions
        Auth->>API: Token valid ✓
        API->>Frontend: { username, role, permissions }
        Frontend->>Frontend: Update AuthContext
        Frontend->>API: GET /items with filter
        API->>Auth: Check permission INVENTORY_RO
        Auth->>API: Permission granted ✓
        API->>DB: Query inventory collection
        DB->>API: Return items with pagination
        API->>Frontend: { items, total, page }
        Frontend->>Browser: Render InventoryTable
    end
```

---

## 🆕 Create Item Flow (Complete)

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant UI as 🎨 ItemForm
    participant Store as 📦 React Query
    participant API as 🔗 POST /items
    participant Service as 📋 ItemService
    participant DB as 💾 inventory
    participant Audit as 📝 audit_logs
    
    User->>UI: Fill form + Click Save
    UI->>UI: Validate form
    
    alt Validation fails
        UI->>UI: Show error messages
    else Valid
        UI->>Store: Show loading spinner
        UI->>API: POST /api/items with ItemCreate
        
        API->>API: Verify JWT token
        API->>API: Check permission INVENTORY_RW
        
        alt Permission denied
            API->>UI: 403 Forbidden
            UI->>UI: Show error toast
        else Permission granted
            API->>Service: Create item
            Service->>Service: Generate catalog_number if needed
            Service->>Service: Calculate available stock
            Service->>DB: Insert new document
            DB->>DB: Generate _id
            DB->>Service: Return created item
            Service->>Audit: Log action = "CREATE"
            Audit->>DB: Insert audit log
            DB->>Audit: Logged
            Service->>API: Return created item
            API->>UI: { item_id, catalog_number, ... }
            UI->>Store: React Query invalidates cache
            Store->>API: Refetch GET /items
            API->>DB: Query items
            DB->>API: Latest items list
            API->>Store: Updated items
            UI->>UI: Close modal, refresh table
            UI->>Browser: Show success toast
        end
    end
```

---

## ✏️ Bulk Update Flow

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Table as 📋 InventoryTable
    participant Modal as 🎨 BulkEditModal
    participant API as 🔗 POST /bulk-update
    participant Service as 📊 ItemService
    participant DB as 💾 MongoDB
    participant Audit as 📝 AuditService
    
    User->>Table: Select multiple items (checkboxes)
    User->>Table: Click "Bulk Edit"
    Table->>Modal: Pass selected item IDs
    
    Modal->>User: Show field selector
    User->>Modal: Select fields to update (e.g., status, location)
    User->>Modal: Enter new values
    User->>Modal: Click "Apply to All"
    
    Modal->>API: POST /bulk-update
    Note over API: {<br/>filters: { _id: { $in: [...] } },<br/>updates: { status: "active", location: "A1" }<br/>}
    
    API->>API: Verify JWT
    API->>API: Check INVENTORY_RW permission
    
    API->>Service: bulk_update_items(filters, updates)
    Service->>DB: updateMany(filters, { $set: updates })
    DB->>DB: Update matching documents
    DB->>Service: { matchedCount: 5, modifiedCount: 5 }
    
    Service->>Audit: For each updated item
    Audit->>DB: Insert audit log with old vs new values
    
    Service->>API: { updated_count: 5, updated_items: [...] }
    API->>Modal: Success response
    Modal->>Table: Close modal
    Modal->>Table: Invalidate React Query cache
    Table->>API: Refetch items
    Table->>Browser: Show updated table
    Browser->>User: Show success notification
```

---

## 📥 Import Excel Flow (Detailed)

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Browser as 📁 File Browser
    participant UI as 🎨 ExcelManager
    participant Parser as 🔍 ExcelParser
    participant Validator as ✅ Validator
    participant API as 🔗 POST /import-excel
    participant Service as 📊 ExcelService
    participant DB as 💾 MongoDB
    
    User->>Browser: Select .xlsx/.csv file
    Browser->>UI: File object
    UI->>Parser: Parse Excel file
    Parser->>Parser: Read rows
    Parser->>Parser: Extract headers
    Parser->>UI: { headers: [...], preview_rows: [...] }
    
    UI->>UI: Show preview + mapping UI
    User->>UI: Confirm mapping (catalog_number → Col A, etc.)
    User->>UI: Click "Import"
    
    UI->>Validator: Validate mapped data
    Validator->>Validator: Check required fields
    Validator->>Validator: Check data types
    Validator->>Validator: Check catalog_number duplicates
    
    alt Validation fails
        Validator->>UI: { errors: [...], warnings: [...] }
        UI->>Browser: Show error details
    else Valid
        UI->>API: POST /import-excel with file
        
        API->>Service: import_items(file)
        Service->>Parser: Parse file again
        Service->>Service: Map columns to ItemCreate
        Service->>Validator: Validate batch
        
        Service->>DB: insertMany([items])
        DB->>DB: Insert documents
        DB->>DB: Check unique constraint on catalog_number
        
        alt Duplicate found
            DB->>Service: BulkWriteError
            Service->>API: { imported: 4, errors: 1 }
        else All inserted
            DB->>Service: { insertedCount: 5 }
        end
        
        Service->>API: { imported_count: 5, skipped: 1, errors: [] }
        API->>UI: Import result summary
        UI->>Browser: Show success toast
        UI->>Browser: Show "5 items imported, 1 skipped"
    end
```

---

## 🔐 Login & Token Lifecycle

```mermaid
graph LR
    A["🔓 User at Login<br/>/login"] -->|username, password| B["🖥️ POST /auth/login"]
    B -->|Validate| C["🔍 Query users collection<br/>Find by username"]
    C -->|User exists?| D{Check Password}
    D -->|❌ Wrong| E["⛔ 401 Unauthorized"]
    E -->|Show error| A
    D -->|✅ Correct| F["🔑 Create JWT Token"]
    F -->|Claims| G["token = JWT<br/>sub: username<br/>user_id: id<br/>role: admin<br/>permissions: [...]<br/>exp: now + 240min"]
    G -->|Return| H["📦 Response:<br/>{access_token, token_type}"]
    H -->|Store| I["💾 localStorage<br/>authToken"]
    I -->|Redirect| J["📄 /dashboard"]
    J -->|GET /auth/me<br/>Header: Auth Bearer| K["🔍 Verify JWT"]
    K -->|Valid| L["📋 Return user info"]
    L -->|Update| M["🔐 AuthContext<br/>isAuthenticated = true"]
    M -->|Protected routes| N["✅ Access granted"]
    
    style A fill:#e1f5ff
    style B fill:#f3e5f5
    style D fill:#fff3e0
    style F fill:#e8f5e9
    style I fill:#fce4ec
    style N fill:#c8e6c9
```

---

## 🗑️ Delete Item Flow (with Audit)

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Table as 📋 InventoryTable
    participant Modal as 🎨 DeleteConfirmation
    participant API as 🔗 DELETE /items/{id}
    participant Service as 📊 ItemService
    participant DB as 💾 MongoDB
    participant Audit as 📝 AuditService
    
    User->>Table: Right-click item / Click delete icon
    Table->>Modal: Show confirmation dialog
    Modal->>User: "Why are you deleting this item?"
    User->>Modal: Type reason: "Obsolete product"
    User->>Modal: Click "Confirm Delete"
    
    Modal->>API: DELETE /items/{item_id}
    Note over API: RequestBody: { reason: "Obsolete product" }
    
    API->>API: Verify JWT + INVENTORY_RW permission
    
    API->>Service: delete_item(item_id, reason, user)
    Service->>DB: Find item by _id (snapshot)
    DB->>Service: { catalog_number, name, quantity, ... }
    Service->>Service: Store old_values for audit
    
    Service->>DB: Delete item
    DB->>Service: DeleteResult
    
    Service->>Audit: Log deletion
    Note over Audit: {<br/>action: "DELETE",<br/>resource_type: "item",<br/>resource_id: item_id,<br/>old_values: { ... },<br/>performed_by: username,<br/>reason: "Obsolete product",<br/>timestamp: now<br/>}
    Audit->>DB: Insert audit log
    
    Service->>API: { deleted_item: {...} }
    API->>Modal: { success: true }
    Modal->>Table: Close modal
    Modal->>Table: Invalidate cache
    Table->>API: Refetch GET /items
    Table->>Browser: Update table (item removed)
    Browser->>User: ✅ "Item deleted successfully"
```

---

## 👥 Admin User Management Flow

```mermaid
graph TB
    A["👨‍💼 Admin User"] -->|Click Admin Panel| B["📊 AdminPage"]
    B -->|Navigate to Users| C["👥 UserManagement"]
    C -->|GET /admin/users| D["📋 API"]
    D -->|Check: Admin role| E{Permission Check}
    E -->|✅ Granted| F["Query users collection"]
    E -->|❌ Denied| G["⛔ 403 Error"]
    F -->|Paginated list| H["📋 UserTable"]
    H -->|Display| C
    
    A -->|Click 'Edit User'| I["✏️ Edit user: john.doe"]
    I -->|Change role admin→user| J["Update form"]
    J -->|Revoke permissions| K["Select permissions"]
    J -->|Submit| L["PUT /admin/users/{id}"]
    L -->|Validate| M["Check admin permission"]
    M -->|✅ Valid| N["Update user document"]
    N -->|Log action| O["📝 Audit log:<br/>who, what, when, why"]
    O -->|Return| P["Updated user"]
    P -->|Refresh| H
    
    A -->|Click 'Delete User'| Q["🗑️ Delete Confirmation"]
    Q -->|Enter reason| R["Reason: Left company"]
    R -->|DELETE /admin/users/{id}| S["Backend deletes user"]
    S -->|Log deletion| O
    S -->|Response| T["✅ User deleted"]
    T -->|Refresh| H
    
    style A fill:#e1f5ff
    style B fill:#fff3e0
    style C fill:#f3e5f5
    style E fill:#fce4ec
    style H fill:#e8f5e9
    style O fill:#ffebee
```

---

## 🏷️ Collections Management

```mermaid
graph TB
    subgraph USER_VIEW["👤 User View"]
        A["MyComponentsDashboard<br/>/my-components"]
    end
    
    subgraph COLLECTION_OPS["📚 Collection Operations"]
        B["GET /collections<br/>List all collections"]
        C["POST /collections<br/>Create new collection"]
        D["PUT /collections/{id}<br/>Update collection"]
        E["DELETE /collections/{id}<br/>Delete collection"]
    end
    
    subgraph ITEM_IN_COLLECTION["📦 Item Management in Collection"]
        F["GET /collections/{id}/items<br/>List items in collection"]
        G["POST /collections/{id}/items<br/>Add item to collection"]
        H["DELETE /collections/{id}/items/{item}<br/>Remove item"]
        I["POST /collections/{id}/items/bulk<br/>Add multiple items"]
    end
    
    subgraph PERMISSIONS["🔐 Collection Permissions"]
        J["POST /collections/{id}/permissions<br/>Grant access"]
        K["DELETE /collections/{id}/permissions/{user}<br/>Revoke access"]
    end
    
    A -->|User clicks| C
    C -->|Form submission| C
    A -->|Display collections| B
    B -->|User selects| D
    D -->|Edit form| D
    B -->|User clicks| E
    E -->|Confirm delete| E
    
    A -->|View collection| F
    F -->|Show items list| F
    A -->|Add items| G
    G -->|Item picker| G
    G -->|Multiple items| I
    
    A -->|Share collection| J
    J -->|Select user/group| J
    J -->|Confirm| K
    
    style USER_VIEW fill:#e1f5ff
    style COLLECTION_OPS fill:#f3e5f5
    style ITEM_IN_COLLECTION fill:#fff3e0
    style PERMISSIONS fill:#fce4ec
```

---

## 📊 Filter & Search Flow

```
┌─────────────────────────────────────────────────────────────┐
│              🔍 Advanced Filter & Search Flow               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  USER INPUT                                                  │
│  ├─ Search box: "LED 5mm"                                   │
│  ├─ Filter by:                                              │
│  │  ├─ Category dropdown                                    │
│  │  ├─ Status checkbox                                      │
│  │  ├─ Location multi-select                                │
│  │  └─ Quantity range slider                                │
│  ├─ Sort: "Price: High to Low"                              │
│  └─ Pagination: Page 3, 50 items/page                       │
│        ↓                                                     │
│  BUILD QUERY                                                │
│  ├─ Filter: { category: "LED", status: "active" }           │
│  ├─ Text Search: { $text: { $search: "5mm" } }              │
│  ├─ Range: { quantity: { $gte: 10, $lte: 100 } }            │
│  └─ Sort: { price: -1 }                                     │
│        ↓                                                     │
│  API CALL                                                    │
│  GET /api/items?                                            │
│    filter={"category":"LED"}&                               │
│    search="5mm"&                                            │
│    sort=-price&                                             │
│    page=3&                                                  │
│    limit=50                                                 │
│        ↓                                                     │
│  BACKEND PROCESSING                                         │
│  ├─ Parse filters and sort                                  │
│  ├─ Execute MongoDB query                                   │
│  ├─ Count total matching documents                          │
│  ├─ Apply pagination: skip + limit                          │
│  └─ Return: { items, total, page, limit }                   │
│        ↓                                                     │
│  FRONTEND DISPLAY                                           │
│  ├─ Show filtered table                                     │
│  ├─ Display: "Showing 1-50 of 247"                          │
│  ├─ Enable "Next"/"Previous" buttons                        │
│  ├─ Highlight active filters                                │
│  └─ Show "Clear all" button                                 │
│                                                              │
│  SAVE FILTER (Optional)                                      │
│  ├─ Click "Save this filter"                                │
│  ├─ Enter name: "High value LED stock"                      │
│  ├─ Store in localStorage                                   │
│  └─ Load later with one click                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 Permission Check Flow

```
┌──────────────────────────────────────────────────────────┐
│         🔒 Permission Validation at Each Request         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  CLIENT REQUEST                                          │
│  GET /api/items                                          │
│  Header: Authorization: Bearer eyJhbGc...               │
│              ↓                                           │
│  MIDDLEWARE 1: JWT VERIFICATION                         │
│  ├─ Extract token from header                           │
│  ├─ Verify signature with SECRET_KEY                    │
│  ├─ Check expiration                                    │
│  └─ Decode claims → payload                             │
│              ↓                                           │
│  EXTRACTED CLAIMS                                        │
│  {                                                      │
│    "sub": "john.doe",                                   │
│    "user_id": "507f...",                               │
│    "role": "user",                                      │
│    "permissions": ["INVENTORY_RO"],                     │
│    "exp": 1708123456                                    │
│  }                                                      │
│              ↓                                           │
│  ROUTE HANDLER: REQUIRES PERMISSION                      │
│  @router.get("/items")                                  │
│  async def get_items(                                   │
│    current_user = Depends(require_permission(           │
│      Permission.INVENTORY_RO                             │
│    ))                                                   │
│  )                                                      │
│              ↓                                           │
│  PERMISSION CHECK                                        │
│  ├─ Get required permission: INVENTORY_RO               │
│  ├─ Get user permissions: ["INVENTORY_RO"]              │
│  ├─ Check if INVENTORY_RO in permissions                │
│  └─ Result: ✅ ALLOWED                                   │
│              ↓                                           │
│  EXECUTE HANDLER                                         │
│  ├─ Query MongoDB                                       │
│  ├─ Return results                                      │
│  └─ 200 OK                                              │
│                                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  ALTERNATIVE: INSUFFICIENT PERMISSIONS                   │
│              ↓                                           │
│  PERMISSION CHECK FAILS                                  │
│  ├─ Get required permission: INVENTORY_RW               │
│  ├─ Get user permissions: ["INVENTORY_RO"]              │
│  ├─ Check if INVENTORY_RW in permissions                │
│  └─ Result: ❌ DENIED                                    │
│              ↓                                           │
│  RETURN ERROR                                            │
│  403 Forbidden                                           │
│  {                                                      │
│    "detail": "Not enough permissions",                  │
│    "required": "INVENTORY_RW",                          │
│    "user_permissions": ["INVENTORY_RO"]                 │
│  }                                                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🌐 Request-Response Lifecycle

```
TIME
 ↓
 ├─ T0: Frontend generates request
 │   ├─ Method: POST
 │   ├─ URL: /api/items
 │   ├─ Body: { catalog_number: "LED-001", ... }
 │   ├─ Headers: { Authorization: Bearer ..., Content-Type: application/json }
 │   └─ Size: ~500 bytes
 │
 ├─ T1: Network transmission
 │   └─ ~50-200ms (depending on network)
 │
 ├─ T2: Backend receives request
 │   ├─ CORS check (preflight if needed)
 │   ├─ Parse JSON body
 │   └─ Extract headers
 │
 ├─ T3: FastAPI middleware
 │   ├─ JWT token verification
 │   ├─ Rate limit check
 │   └─ Logging
 │
 ├─ T4: Route handler
 │   ├─ Permission check (INVENTORY_RW)
 │   ├─ Input validation (Pydantic)
 │   └─ Extract current_user from token
 │
 ├─ T5: Service layer
 │   ├─ Business logic (calculate available, etc.)
 │   ├─ Generate catalog_number if needed
 │   └─ Prepare for database
 │
 ├─ T6: Database operations
 │   ├─ Insert item document
 │   ├─ Generate ObjectId
 │   └─ Create audit log entry
 │
 ├─ T7: Response preparation
 │   ├─ Serialize to JSON
 │   ├─ Add GZIP compression (if > 1KB)
 │   ├─ Add headers: X-Process-Time, Content-Type
 │   └─ Size: ~400 bytes (or less with GZIP)
 │
 ├─ T8: Network transmission (response)
 │   └─ ~50-200ms
 │
 ├─ T9: Frontend receives response
 │   ├─ Status: 201 Created
 │   ├─ Body: { item_id, catalog_number, ... }
 │   └─ Headers: { Content-Type, X-Process-Time: "0.045s" }
 │
 ├─ T10: React Query
 │   ├─ Invalidate cache (GET /items)
 │   └─ Trigger refetch
 │
 ├─ T11: UI Update
 │   ├─ Close modal
 │   ├─ Show success toast
 │   └─ Refresh table with new item
 │
 └─ T12: Total time: ~1-2 seconds
    └─ Network: 0.1-0.4s
       Logic: 0.01-0.05s
       UI: 0.85-1.85s
```

---

## 🔄 Undo/Redo System Architecture

```mermaid
graph TB
    subgraph OPERATION["🔄 Operation Stack"]
        A["Action History<br/>LinkedList or Array"]
    end
    
    subgraph UNDO["⬅️ Undo"]
        B["Current index -= 1<br/>Load previous state"]
        C["PUT /items/{id}<br/>Restore previous values"]
    end
    
    subgraph REDO["➡️ Redo"]
        D["Current index += 1<br/>Load next state"]
        E["PUT /items/{id}<br/>Apply next values"]
    end
    
    subgraph LIMITS["⚙️ Constraints"]
        F["Max history: 50<br/>Drop oldest when full"]
        G["Per-item tracking<br/>Global or per-session"]
    end
    
    A -->|User clicks Undo| B
    B -->|Restore| C
    C -->|Update DB| D
    D -->|Navigate forward| E
    E -->|Apply| D
    A -->|Limit check| F
    F -->|Manage| G
    
    style A fill:#e8f5e9
    style B fill:#c8e6c9
    style C fill:#a5d6a7
    style D fill:#81c784
    style E fill:#66bb6a
    style F fill:#fff3e0
    style G fill:#ffecb3
```

---

## 📱 State Management Overview

```
┌─────────────────────────────────────────────────────────────┐
│              ⚛️ React State Management Stack                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LOCAL STORAGE                                               │
│  └─ authToken (JWT, persisted)                              │
│     theme preference (light/dark)                           │
│     saved filters                                            │
│     user preferences                                        │
│              ↑                                              │
│  CONTEXT API                                                 │
│  ├─ AuthContext                                             │
│  │  ├─ isAuthenticated: boolean                             │
│  │  ├─ user: { username, role, permissions }                │
│  │  ├─ loading: boolean                                     │
│  │  └─ methods: login(), logout(), hasPermission()          │
│  │                                                           │
│  ├─ ThemeContext                                            │
│  │  ├─ theme: 'light' | 'dark'                              │
│  │  └─ toggleTheme()                                        │
│  │                                                           │
│  └─ ToastContext                                            │
│     ├─ toasts: [{ id, type, message }]                      │
│     └─ methods: showToast(), removeToast()                  │
│              ↑                                              │
│  REACT QUERY (Server State)                                 │
│  ├─ GET /api/items → useQuery('items')                      │
│  │  ├─ data: items array                                    │
│  │  ├─ isLoading: boolean                                   │
│  │  ├─ error: error object                                  │
│  │  └─ methods: refetch(), invalidate()                     │
│  │                                                           │
│  ├─ GET /api/users → useQuery('users')                      │
│  │                                                           │
│  └─ GET /api/analytics/dashboard → useQuery('dashboard')    │
│              ↑                                              │
│  COMPONENT STATE (useState)                                 │
│  ├─ Form inputs                                             │
│  ├─ Modal open/close                                        │
│  ├─ Selected rows in table                                  │
│  ├─ Current page, filters                                   │
│  ├─ Pending uploads                                         │
│  └─ Temporary UI state                                      │
│                                                              │
│  DATA FLOW                                                   │
│  Component State → Component renders                         │
│         ↓                                                    │
│  User interaction → Updates state                            │
│         ↓                                                    │
│  API call if needed (React Query)                            │
│         ↓                                                    │
│  Cache updated → Component re-renders                        │
│         ↓                                                    │
│  Optional: Persist to Context/localStorage                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Component Lifecycle in List View

```
MOUNT PHASE
    ↓
    └─ useEffect: GET /api/items
           ↓
    ├─ Show loading spinner
    ├─ React Query: isLoading = true
    └─ Fetch data from backend
           ↓
DATA RECEIVED
    ├─ React Query updates cache
    ├─ Component state: items = [...]
    └─ Render table with data
           ↓
USER INTERACTIONS
    ├─ Click "Edit" → ItemForm component mounts
    │  └─ useEffect: Fetch single item details
    ├─ Click "Delete" → DeleteConfirmation mounts
    │  └─ Confirm → DELETE /items/{id}
    │     └─ React Query invalidates 'items' query
    │        └─ Refetch triggered
    ├─ Change page → paginate() called
    │  └─ GET /items?page=2
    └─ Filter changed
       └─ GET /items?filter=...
           ↓
RE-RENDER
    ├─ Update table with new data
    ├─ Update pagination buttons
    └─ Scroll to top
           ↓
UNMOUNT
    └─ Cleanup subscriptions
```

---

**Generated**: 17-02-2026
**Architecture Version**: 2.0.0

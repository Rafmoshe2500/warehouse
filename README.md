# 🏭 מערכת ניהול מלאי - Warehouse Management System

<div dir="rtl">

## 📖 תיאור המערכת

מערכת מקיפה לניהול מלאי ומחסן עם ממשק משתמש מתקדם, ניהול משתמשים, הרשאות מורכבות, וכלים להנהלה יומיומית של מלאי.

## 🎯 תכונות עיקריות

### 📦 ניהול מלאי
- ✅ CRUD מלא לפריטים (Create, Read, Update, Delete)
- ✅ חיפוש מתקדם עם סינון רב-שכבתי
- ✅ ייבוא/ייצוא מ-Excel
- ✅ עריכה מרובה (bulk edit)
- ✅ מחיקה מרובה עם אישור
- ✅ עמודות לבחירה (column visibility)
- ✅ יומן שינויים מלא (audit log)
- ✅ Undo/Redo עד 50 פעולות

### 👥 ניהול משתמשים
- ✅ אימות משתמש (Local + ADFS/Domain)
- ✅ ניהול משתמשים מלא
- ✅ הצמדת תפקידים (roles)
- ✅ הרשאות granular (permissions)
- ✅ קבוצות משתמשים
- ✅ יומן התחברויות
- ✅ שינוי סיסמה עצמית
- ✅ החזקת סשן (token-based)

### 🔐 ביטחון
- ✅ bcrypt password hashing
- ✅ JWT token authentication (240 min)
- ✅ ROLE-BASED ACCESS CONTROL (RBAC)
- ✅ PERMISSION-BASED ACCESS CONTROL (PBAC)
- ✅ Rate limiting (5 login/min)
- ✅ CORS protection
- ✅ Audit trail של כל הפעולות
- ✅ IP logging ו-User-Agent tracking

### 📊 דיווחים וניתוח
- ✅ דשבורד עם סטטיסטיקות
- ✅ תרשימים ו-charts
- ✅ יומן פעילות אחרון
- ✅ אזהרות על מלאי נמוך
- ✅ רישום ביקורת מלא
- ✅ דיווחים ניתנים לייצוא

### 🛒 ניהול הזמנות
- ✅ יצירת הזמנות רכש
- ✅ ניהול סטטוס הזמנות
- ✅ העלאת קבצים (invoices, packing lists)
- ✅ ניהול ספקים
- ✅ ניהול התאריך הצפוי
- ✅ Timeline של הזמנה

### 🎨 ממשק משתמש
- ✅ עיצוב responsive (mobile/tablet/desktop)
- ✅ Dark mode / Light mode
- ✅ ממשק עברי מלא
- ✅ Accessibility (WCAG AA)
- ✅ טעינה חלקה (skeleton loading)
- ✅ Toast notifications
- ✅ Loading states
- ✅ Error handling

## 🛠️ טכנולוגיות

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: MongoDB
- **Authentication**: JWT + bcrypt
- **Validation**: Pydantic
- **Rate Limiting**: slowapi
- **Server**: Uvicorn (async)

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **Router**: React Router v6
- **State Management**: Context API + React Query
- **Styling**: Tailwind CSS / Custom CSS
- **HTTP Client**: Axios/Fetch
- **Charts**: Recharts / Chart.js
- **Testing**: Jest + Playwright

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes / OpenShift
- **Web Server**: Nginx (reverse proxy)

## 📋 דוקומנטציה

### 📚 קבצי תיעוד ראשיים

| קובץ | תיאור |
|------|--------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | דיאגרמות ארכיטקטורה וסקירה כללית |
| [DATA_FLOW_DIAGRAMS.md](./DATA_FLOW_DIAGRAMS.md) | תרשימי זרימת נתונים ודיאגרמות סדרתיות |
| [FRONTEND_COMPONENTS.md](./FRONTEND_COMPONENTS.md) | תיעוד רכיבי UI וממשק |
| [API_REFERENCE.md](./API_REFERENCE.md) | סימוכין מלא של כל ה-API endpoints |
| [DOCUMENTATION_SUMMARY.md](./DOCUMENTATION_SUMMARY.md) | ריכוז ותקציר של התיעוד |

### 🔗 קישורים מהירים

- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **ReDoc**: http://localhost:8000/redoc
- **Frontend**: http://localhost:5173 (development) or http://localhost:3000 (production)

## 🚀 התחלה מהירה

### דרישות מוקדמות
```
- Python 3.11+
- Node.js 18+
- MongoDB 5.0+
- Docker & Docker Compose (optional)
- Git
```

### Backend Setup

```bash
cd backend

# יצירת virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# התקנת dependencies
pip install -r requirements.txt

# יצירת .env file
cp .env.example .env
# ערוך את .env עם הגדרות שלך

# הפעלת MongoDB (אם לא בDocker)
mongod --dbpath ./data

# הפעלת המערכת
python run.py
```

Backend יתחיל ב: http://localhost:8000

### Frontend Setup

```bash
cd frontend

# התקנת dependencies
npm install

# הפעלה במצב development
npm run dev

# Build לייצור
npm run build

# הפעלת build
npm run preview
```

Frontend יתחיל ב: http://localhost:5173

### Docker Setup

```bash
# בנייה
docker-compose build

# הפעלה
docker-compose up

# כל המערכת תהיה זמינה:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:8000
# - MongoDB: localhost:27017
```

## 👤 משתמשי Test

### Credentials (Development Only)

| Username | Password | Role | Permissions |
|----------|----------|------|-------------|
| admin | password | admin | All |
| manager | password | manager | INVENTORY_RW, PROCUREMENT_RO |
| user | password | user | INVENTORY_RO |
| procurement | password | procurement | PROCUREMENT_RW |

**⚠️ שינוי סיסמאות בייצור!**

## 📡 API Overview

### נקודות קצה עיקריות

```
Authentication:
  POST   /api/auth/login
  POST   /api/auth/domain-login
  POST   /api/auth/logout
  GET    /api/auth/me
  PUT    /api/auth/password

Items:
  GET    /api/items (list with filters)
  POST   /api/items (create)
  PATCH  /api/items/{id} (update)
  DELETE /api/items/{id} (delete)
  POST   /api/items/bulk-update
  POST   /api/items/bulk-delete

Users (Admin):
  GET    /api/admin/users
  POST   /api/admin/users
  PUT    /api/admin/users/{id}
  DELETE /api/admin/users/{id}
  GET    /api/admin/users/{id}

Excel:
  POST   /api/excel/import-excel
  GET    /api/excel/export-excel
  POST   /api/excel/import-projects

Procurement:
  GET    /api/procurement/orders
  POST   /api/procurement/orders
  PUT    /api/procurement/orders/{id}
  DELETE /api/procurement/orders/{id}

Analytics:
  GET    /api/analytics/dashboard
  GET    /api/analytics/activity

Audit:
  GET    /api/audit/logs
  GET    /api/audit/logs/users/{username}

Collections:
  GET    /api/collections
  POST   /api/collections
  PUT    /api/collections/{id}
  DELETE /api/collections/{id}
  GET    /api/collections/{id}/items
  POST   /api/collections/{id}/items
```

ראה [API_REFERENCE.md](./API_REFERENCE.md) לפרטים מלאים.

## 🗄️ Database Schema

### Collections:

1. **inventory** - פריטים
   - catalog_number (unique)
   - name, category, quantity
   - supplier, location
   - cost, price
   - created_at, updated_at

2. **users** - משתמשים
   - username (unique)
   - email (unique)
   - password_hash (bcrypt)
   - role, permissions
   - last_login
   - created_at

3. **collections** - אוספים/פרויקטים
   - name
   - items: [ObjectId]
   - owner
   - permissions
   - created_at

4. **procurement_orders** - הזמנות
   - order_number (unique)
   - supplier
   - items: [{item_id, quantity, price}]
   - status
   - expected_delivery
   - created_at

5. **audit_logs** - יומן ביקורת
   - action (CREATE/UPDATE/DELETE)
   - resource_type
   - resource_id
   - performed_by
   - changes
   - timestamp

## 🔐 הרשאות ותפקידים

### Roles:

- **admin**: כל ההרשאות
- **manager**: ניהול מלאי + procurement read
- **user**: קריאה בלבד
- **procurement**: ניהול הזמנות

### Permissions:

- `INVENTORY_RO`: קריאת מלאי בלבד
- `INVENTORY_RW`: קריאה וכתיבה בעריכת מלאי
- `PROCUREMENT_RO`: קריאת הזמנות בלבד
- `PROCUREMENT_RW`: קריאה וכתיבה בהזמנות
- `ADMIN`: גישה admin מלאה
- `AUDIT_VIEW`: צפיה ביומן ביקורת
- `USER_MANAGE`: ניהול משתמשים

## 📊 Workflow Examples

### דוגמה 1: הוספת פריט חדש

```
1. User navigates to /inventory
2. Clicks "Add Item"
3. ItemForm modal opens
4. Fill in: catalog_number, name, quantity, supplier, etc.
5. Click "Save"
6. Frontend: POST /api/items with ItemCreate data
7. Backend: Validates data, inserts to DB, creates audit log
8. Returns: 201 Created with item details
9. Frontend: Toast notification, table refreshes
10. New item appears in table
```

### דוגמה 2: ייבוא מ-Excel

```
1. User navigates to /inventory → Excel tab
2. Drag-drop or select Excel file
3. System parses file, shows preview
4. User confirms column mapping
5. Click "Import"
6. POST /api/excel/import-excel with file
7. Backend: Parses, validates, batch inserts
8. Returns: Summary (imported, skipped, errors)
9. Toast shows results
10. Table refreshes with new items
```

### דוגמה 3: עריכה מרובה

```
1. Select multiple items in table (checkboxes)
2. Click "Bulk Edit"
3. Modal appears: choose fields to update
4. Enter new values
5. Click "Apply"
6. POST /api/items/bulk-update with filters & updates
7. Backend: Updates all matching items
8. Audit log: Creates entry for each item
9. Returns: Success count
10. Table refreshes, notification shows count
```

### דוגמה 4: צפייה בביקורת

```
1. Admin navigates to /admin → Audit Logs
2. (Optional) Filter by user, action, date
3. Table shows all logged actions
4. Click row → Detailed view
5. Shows: who, what, when, changes (old→new)
6. Can export as CSV
7. Search within logs
```

## 🧪 Testing

### Backend Tests

```bash
cd backend

# הפעלת כל ה-tests
pytest

# Tests with coverage
pytest --cov=app

# Specific test file
pytest tests/unit/test_auth.py

# Specific test
pytest tests/unit/test_auth.py::test_login_success
```

### Frontend Tests

```bash
cd frontend

# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Coverage
npm test -- --coverage
```

## 🔧 Configuration

### Backend (.env)

```env
# MongoDB
MONGODB_URL=mongodb://localhost:27017
DB_NAME=warehouse

# JWT
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=240

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]

# Environment
ENVIRONMENT=development
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=Warehouse System
```

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017

Solution:
1. Check MongoDB is running: mongod
2. Verify MONGODB_URL in .env
3. Check MongoDB is listening on correct port
```

### CORS Error
```
Error: Access to XMLHttpRequest blocked by CORS

Solution:
1. Add your domain to CORS_ORIGINS in backend config
2. Restart backend
3. Clear browser cache
```

### Token Expired
```
Error: 401 Unauthorized

Solution:
1. Re-login to get new token
2. Check TOKEN_EXPIRE_MINUTES setting
3. Verify system clock is correct
```

### Port Already in Use
```
Error: Port 8000 is already in use

Solution:
# Check what's using the port
lsof -i :8000  (Mac/Linux)
netstat -ano | findstr :8000  (Windows)

# Kill the process or use different port
# In backend: uvicorn app.main:app --port 8001
```

## 📈 Performance Tips

### Backend
- Enable Redis caching for frequently accessed data
- Add database indexes on filter columns
- Use connection pooling
- Implement query pagination (limit large results)
- Monitor slow queries

### Frontend
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Lazy load routes and components
- Use React Query for caching
- Optimize images
- Code splitting with Webpack/Vite

## 🔐 Security Checklist

- [ ] Change default passwords
- [ ] Use HTTPS in production
- [ ] Set strong SECRET_KEY
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Monitor audit logs regularly
- [ ] Backup database regularly
- [ ] Use environment variables for secrets

## 📞 Support

### Documentation Links
- [Full Architecture](./ARCHITECTURE.md)
- [Data Flow Diagrams](./DATA_FLOW_DIAGRAMS.md)
- [Frontend Components](./FRONTEND_COMPONENTS.md)
- [API Reference](./API_REFERENCE.md)

### Common Resources
- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Frontend: http://localhost:5173
- MongoDB: Use MongoDB Compass

### Reporting Issues

When reporting issues, include:
1. Error message (full text)
2. Steps to reproduce
3. Expected vs actual behavior
4. System info (OS, Python version, Node version)
5. Relevant logs

## 🤝 Contributing

### Code Style
- Backend: PEP 8 (flake8)
- Frontend: ESLint + Prettier
- Use type hints (Python), PropTypes (React)

### Commit Messages
```
format: [backend|frontend|devops] message

Examples:
- [backend] Add user authentication endpoint
- [frontend] Fix inventory table pagination
- [devops] Update Docker configuration
```

### Pull Request Process
1. Create feature branch: `git checkout -b feature/description`
2. Make changes with tests
3. Run linting and tests locally
4. Commit with clear messages
5. Push and create PR with description
6. Wait for review and address feedback
7. Merge when approved

## 📄 License

This project is proprietary software. Unauthorized copying, modification, or distribution is prohibited.

## 📅 Version History

| Version | Date | Key Changes |
|---------|------|------------|
| 2.0.0 | 2026-02-17 | Complete architecture documentation, procurement module |
| 1.5.0 | 2026-01-15 | Added procurement management |
| 1.0.0 | 2025-01-01 | Initial release |

## 👨‍💼 Project Team

- **Architecture**: Designed by system architects
- **Backend**: Python/FastAPI development
- **Frontend**: React development
- **DevOps**: Docker/Kubernetes deployment

---

**Last Updated**: 2026-02-17
**Status**: ✅ Production Ready
**Maintained By**: Development Team

</div>

---

## English Version

# 🏭 Warehouse Management System

A comprehensive inventory management system with advanced UI, user management, complex permissions, and tools for day-to-day warehouse operations.

## Key Features

### Inventory Management
- ✅ Full CRUD operations for items
- ✅ Advanced search with multi-level filtering
- ✅ Excel import/export
- ✅ Bulk editing and deletion
- ✅ Column visibility control
- ✅ Complete change history (audit log)
- ✅ Undo/Redo up to 50 operations

### User Management
- ✅ User authentication (Local + ADFS/Domain)
- ✅ Complete user administration
- ✅ Role assignment
- ✅ Granular permissions
- ✅ User groups
- ✅ Login history
- ✅ Self-service password change
- ✅ Session management (token-based)

### Security
- ✅ bcrypt password hashing
- ✅ JWT token authentication (240 min)
- ✅ Role-Based Access Control (RBAC)
- ✅ Permission-Based Access Control (PBAC)
- ✅ Rate limiting (5 login/min)
- ✅ CORS protection
- ✅ Complete audit trail
- ✅ IP logging and User-Agent tracking

### Reporting & Analytics
- ✅ Dashboard with statistics
- ✅ Charts and visualizations
- ✅ Recent activity feed
- ✅ Low stock alerts
- ✅ Complete audit log
- ✅ Exportable reports

### Order Management
- ✅ Purchase order creation
- ✅ Order status management
- ✅ File uploads (invoices, packing lists)
- ✅ Supplier management
- ✅ Expected delivery tracking
- ✅ Order timeline

### User Interface
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Dark mode / Light mode
- ✅ Full Hebrew support
- ✅ Accessibility (WCAG AA)
- ✅ Smooth loading (skeleton loading)
- ✅ Toast notifications
- ✅ Loading states
- ✅ Error handling

## Quick Start

[See Hebrew section above for detailed setup instructions]

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Docker
```bash
docker-compose up
```

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture and diagrams
- [DATA_FLOW_DIAGRAMS.md](./DATA_FLOW_DIAGRAMS.md) - Data flow and sequence diagrams
- [FRONTEND_COMPONENTS.md](./FRONTEND_COMPONENTS.md) - UI components reference
- [API_REFERENCE.md](./API_REFERENCE.md) - Complete API endpoints
- [DOCUMENTATION_SUMMARY.md](./DOCUMENTATION_SUMMARY.md) - Documentation summary

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Technology Stack

- **Backend**: Python, FastAPI, MongoDB
- **Frontend**: React, Vite, Tailwind CSS
- **Infrastructure**: Docker, Kubernetes
- **Security**: JWT, bcrypt, CORS

## Version

Current Version: **2.0.0** (2026-02-17)

---

**Created for**: Warehouse Management System
**Status**: ✅ Production Ready
**Last Updated**: 2026-02-17

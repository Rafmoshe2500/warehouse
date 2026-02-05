"""Debug script to check all imports"""
import sys
import traceback

def test_import(module_path, item_name=None):
    try:
        if item_name:
            exec(f"from {module_path} import {item_name}")
            print(f"✓ Successfully imported {item_name} from {module_path}")
        else:
            exec(f"import {module_path}")
            print(f"✓ Successfully imported {module_path}")
        return True
    except Exception as e:
        print(f"✗ Failed to import {item_name or ''} from {module_path}")
        print(f"  Error: {e}")
        traceback.print_exc()
        return False

print("Testing imports from test_procurement_service.py:\n")
print("=" * 60)

test_import("pytest")
test_import("datetime", "datetime")
test_import("fastapi", "HTTPException")
test_import("app.services.procurement_service", "ProcurementService")
test_import("app.services.audit_service", "AuditService")
test_import("app.db.repositories.procurement_repository", "ProcurementRepository")
test_import("app.schemas.procurement", "ProcurementCreate")
test_import("app.schemas.procurement", "ProcurementUpdate")
test_import("app.schemas.user", "UserRole")

print("\n" + "=" * 60)
print("Testing if we can import the test file itself:")
test_import("tests.unit.services.test_procurement_service")

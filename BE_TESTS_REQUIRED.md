# BE Tests Required — Gap Analysis & Action Plan

> **Generated:** April 17, 2026  
> **Baseline:** 905 tests passing, **80% total coverage** (~87% excluding ADFS / S3 / Domain-AI)  
> **Goal:** 100% coverage on all business-critical backend code  
> **Excluded from scope:** `adfs_service.py`, `s3_service.py`, `ai/classifier.py`, `ai/component_classifier.py`, `auth_service.domain_login()` (lines 88–170)

---

## How to Use This File

Each section below represents **one implementation task**. An agent should:
1. Read the "Uncovered lines" list + the "What to test" descriptions
2. Create or extend the test file listed under "Target test file"
3. Run `pytest <target_file> -v --tb=short` and confirm all new tests pass
4. Move to the next Priority block

---

## Priority 1 — CRITICAL (0% coverage on complex production logic)

---

### TASK-01 · `BomTemplateService.preview_excel` + `validate_template`

| | |
|---|---|
| **Source file** | `app/services/bom_template_service.py` |
| **Coverage** | 41% — lines 104–125, 136–222 uncovered |
| **Target test file** | `tests/unit/services/test_bom_template_service.py` (extend existing) |

**What these methods do:**
- `preview_excel(file_bytes)` — opens an xlsx with openpyxl, returns first N rows as JSON with cell values + fill colors
- `validate_template(template_data, file_bytes)` — runs DynamicBomStrategy on a sample xlsx to verify the config works; returns `{valid, header_row, mapped_columns, groups_count, sample_group}`

**Tests to write (unit — mock openpyxl or use real in-memory xlsx):**
```
test_preview_excel_returns_rows_and_sheet_name
test_preview_excel_includes_fill_color_when_present
test_preview_excel_invalid_file_raises
test_validate_template_valid_config_returns_valid_true
test_validate_template_keyword_not_found_returns_valid_false
test_validate_template_part_number_column_not_mappable_returns_valid_false
test_validate_template_returns_groups_count_and_sample
test_validate_template_with_data_row_filter
```

**Fixture hint:** use `openpyxl.Workbook()` + `io.BytesIO` to build in-memory xlsx with known headers and data rows.

---

### TASK-02 · `DynamicBomStrategy` — all group detection modes

| | |
|---|---|
| **Source file** | `app/services/bom_strategies/dynamic_strategy.py` |
| **Coverage** | 39% — lines 66–183 uncovered |
| **Target test file** | `tests/unit/services/bom_strategies/test_dynamic_strategy.py` (create new) |

**Five modes to cover, each with at least one positive + one negative test:**

| Mode | Config keys | Method |
|---|---|---|
| `color_fill` | `target_column`, `colors` | `_is_group_by_color_fill` |
| `color_fill_any` | `colors` | `_is_group_by_color_fill_any` |
| `line_number_depth` | `line_column`, `group_pattern` | `_is_group_by_line_depth` |
| `all_rows` | _(none)_ | `_is_group_by_all_rows` |
| `value_change` | `watch_column`, `condition_column`, `condition_value` | `_is_group_by_value_change` |

**Tests to write:**
```
test_find_header_row_found
test_find_header_row_not_found
test_is_group_by_color_fill_matches_specified_color
test_is_group_by_color_fill_no_match
test_is_group_by_color_fill_any_matches_pn_col
test_is_group_by_color_fill_any_matches_any_cell
test_is_group_by_color_fill_any_no_match
test_is_group_by_line_depth_matches_pattern
test_is_group_by_line_depth_no_match
test_is_group_by_all_rows_always_true
test_is_group_by_value_change_detects_change
test_is_group_by_value_change_same_part_returns_false
test_is_group_by_value_change_wrong_condition_value
test_unknown_mode_returns_false_with_warning
test_is_data_row_with_filter
test_is_data_row_no_filter_always_true
test_cell_has_colors_rgb_match
test_cell_has_colors_no_match
```

**Fixture hint:** Create mock row cells using a simple `MockCell` dataclass or `unittest.mock.MagicMock` with `.column`, `.value`, and `.fill.fgColor` attributes.

---

### TASK-03 · Integration — BOM Templates wizard routes (`/preview-excel`, `/validate`)

| | |
|---|---|
| **Source file** | `app/routes/api/bom_templates.py` |
| **Coverage** | 66% — lines 111–118 (`/preview-excel`), 133–147 (`/validate`) uncovered |
| **Target test file** | `tests/integration/routes/test_bom_template_routes.py` (extend existing) |

**Tests to write:**
```
test_preview_excel_valid_file_returns_rows
test_preview_excel_non_xlsx_returns_400
test_preview_excel_unauthenticated_returns_401
test_preview_excel_non_admin_returns_403
test_validate_template_valid_config_and_file_returns_valid_true
test_validate_template_bad_json_config_returns_400
test_validate_template_non_xlsx_returns_400
test_validate_template_keyword_not_found_returns_valid_false_200
```

**Fixture hint:** use `openpyxl.Workbook()` + `io.BytesIO`. Post as multipart `files={"file": ...}`. For the `/validate` route also post `data={"config": json.dumps({...})}`.

---

## Priority 2 — HIGH (major logic uncovered)

---

### TASK-04 · Audit routes — `require_audit_access`, POST logs, GET user activity

| | |
|---|---|
| **Source file** | `app/routes/api/audit.py` |
| **Coverage** | 55% — lines 19–37 (`require_audit_access`), 60 (POST /logs), 85–89 (GET /users/{username}), 105 (pagination) |
| **Target test file** | `tests/integration/routes/test_audit_routes.py` (create new) |

**Tests to write:**
```
test_get_audit_logs_as_admin_returns_200
test_get_audit_logs_as_superadmin_returns_200
test_get_audit_logs_as_inventory_ro_user_returns_200   ← require_audit_access inventory branch
test_get_audit_logs_as_inventory_rw_user_returns_200   ← require_audit_access inventory branch
test_get_audit_logs_as_regular_user_returns_403        ← require_audit_access deny branch
test_get_audit_logs_with_action_filter
test_get_audit_logs_with_actor_filter
test_get_audit_logs_with_date_range_filter
test_get_audit_logs_pagination
test_create_manual_log_as_admin_returns_201
test_create_manual_log_as_regular_user_returns_403
test_get_user_activity_as_admin_returns_200
test_get_user_activity_as_regular_user_returns_403
test_get_user_activity_invalid_username_returns_empty
```

**Fixture hint:** Use `async_client` (admin) and `async_client_user`. For inventory users, create a custom fixture with `permissions=["inventory:ro"]` injected into the JWT token via conftest.

---

### TASK-05 · `BomAnalyticsService` — `record_manual_prices`, `seed_historical_data`, `get_aggregated_trends`, `get_vendor_spending`

| | |
|---|---|
| **Source file** | `app/services/bom_analytics_service.py` |
| **Coverage** | 73% — lines 130–156, 202, 267, 290, 303–316, 345–350, 354, 356, 400, 430, 442 |
| **Target test file** | `tests/unit/services/test_bom_analytics_service.py` (extend existing) |

**Uncovered sections:**
- `record_manual_prices` — stores placeholder docs for manual orders (lines 130–156)
- `seed_historical_data` — iterates all orders and seeds BOM or manual prices (lines ~202)
- `get_aggregated_trends` — cross-order main+secondary part aggregation (lines 267–316)
- `get_vendor_spending` — daily/monthly/yearly resolution grouping (lines 345–356)
- `_extract_price_docs` — edge cases: zero qty, override_price, part_alias fallback (lines 400–442)
- `_resolve_datetime` helper — string date + fallback (lines 22–27)

**Tests to write:**
```
test_resolve_datetime_from_datetime_object
test_resolve_datetime_from_iso_string
test_resolve_datetime_invalid_string_returns_now
test_record_manual_prices_stores_placeholders
test_record_manual_prices_skips_empty_items
test_record_manual_prices_replaces_existing_records
test_seed_historical_data_processes_bom_orders
test_seed_historical_data_processes_manual_orders
test_seed_historical_data_skips_orders_without_data
test_get_aggregated_trends_returns_combined_price_per_unit
test_get_aggregated_trends_skips_orders_without_secondary
test_get_aggregated_trends_empty_result_when_no_main_part
test_get_vendor_spending_monthly_resolution
test_get_vendor_spending_daily_resolution
test_get_vendor_spending_yearly_resolution
test_get_vendor_spending_with_date_range_filter
test_extract_price_docs_skips_zero_qty
test_extract_price_docs_uses_part_alias_for_product_name
test_extract_price_docs_skips_zero_price_items
```

---

### TASK-06 · `BomService` — vendor permission check, unsupported format, error paths

| | |
|---|---|
| **Source file** | `app/services/bom_service.py` |
| **Coverage** | 80% — lines 104, 121, 124, 130–133, 160–166, 174, 178, 191, 206–207, 231–233, 257, 264, 280, 285, 310–313, 348–350, 357–358, 377–378, 397–419, 423–427 |
| **Target test file** | `tests/unit/services/test_bom_service.py` (extend existing) |

**Key uncovered paths:**
- Lines 104, 121, 124: `_parse_headers` — sheet with no part_number column, skipped sheets
- Lines 130–133: group with no part number gets dropped from `valid_groups`
- Lines 160–166: Dell pattern — pull part number up to parent header when child has it but header doesn't
- Lines 206–207: `check_unknown_parts` with empty list input
- Lines 231–233: `enrich_groups` — AI classifier path
- Lines 348–350, 357–358: price extraction with override_price
- Lines 397–419: `parse_excel` edge cases — skip fully empty rows, `is_data_row` filter

**Tests to write:**
```
test_parse_excel_skips_sheet_without_header
test_parse_excel_skips_sheet_without_part_number_column
test_parse_excel_drops_group_with_no_part_number
test_parse_excel_pulls_part_number_from_child_to_parent_header
test_parse_excel_skips_fully_empty_rows
test_parse_excel_applies_is_data_row_filter
test_check_unknown_parts_empty_list_returns_empty
test_parse_headers_case_insensitive_match
test_qty_multiplier_from_product_description
```

---

## Priority 3 — MEDIUM (partial coverage on important services)

---

### TASK-07 · `UserService.create_ad_user` + bulk/edge-case methods

| | |
|---|---|
| **Source file** | `app/services/user_service.py` |
| **Coverage** | 76% — lines 407–431 (create_ad_user), 101, 140–141, 176, 190, 197, 210, 220, 231–235, 238–242, 255–256 |
| **Target test file** | `tests/unit/services/test_user_service.py` (extend existing) |

**Uncovered sections:**
- `create_ad_user(username, permissions, role)` — creates a user of type `"ad"` with audit log (lines 407–431)
- Various error/exception paths in existing methods (lines 101, 140–141, etc.)

**Tests to write:**
```
test_create_ad_user_success
test_create_ad_user_audit_log_called
test_create_ad_user_audit_failure_does_not_raise
test_update_last_login_success
test_get_user_by_id_invalid_id_raises
test_update_user_not_found_raises
test_delete_user_not_found_raises
test_get_user_by_username_not_found_returns_none
```

---

### TASK-08 · `AuthService` — `logout`, audit failure paths in `login`

| | |
|---|---|
| **Source file** | `app/services/auth_service.py` |
| **Coverage** | 52% (excluding domain_login lines 88–170 = effectively ~85%) — lines 80–81, 192–193 uncovered |
| **Target test file** | `tests/unit/services/test_auth_service.py` (create new) |

**Uncovered non-ADFS sections:**
- Lines 80–81: audit log failure during `login` (exception swallowed — should not break login)
- Lines 192–193: `logout()` method — deletes cookie + audit log

**Tests to write:**
```
test_login_success_returns_token
test_login_user_not_found_raises_unauthorized
test_login_inactive_user_raises_unauthorized
test_login_wrong_password_raises_unauthorized
test_login_audit_failure_does_not_break_login
test_logout_deletes_cookie
test_logout_calls_audit_log
test_logout_audit_failure_does_not_raise
```

**Fixture hint:** Inject mock `UserService`, `GroupService`, `ADFSService`, `AuthAuditor` via constructor. Use `unittest.mock.AsyncMock` for async methods. Use `starlette.testclient` `Response` mock or `MagicMock` for the `Response` + `Request` args.

---

### TASK-09 · `BaseRepository` — exception paths for all CRUD methods

| | |
|---|---|
| **Source file** | `app/db/repositories/base.py` |
| **Coverage** | 68% — lines 26–28, 44–46, 54–56, 66–68, 76–78, 85–87, 95–97, 102, 106–108 |
| **Target test file** | `tests/unit/repositories/test_base_repository.py` (create new) |

**All uncovered sections are exception-handling `except` blocks** — each method logs and re-raises. Need to simulate MongoDB driver failures.

**Tests to write:**
```
test_validate_object_id_invalid_raises_InvalidItemIdException
test_get_by_id_db_failure_raises
test_get_all_db_failure_raises
test_count_db_failure_raises
test_create_db_failure_raises
test_update_db_failure_raises
test_update_many_db_failure_raises
test_delete_db_failure_raises
test_delete_many_db_failure_raises
test_get_all_default_query_is_empty_dict
test_count_default_query_is_empty_dict
```

**Fixture hint:** Inject a `MagicMock` collection where each method raises `Exception("DB error")`. Instantiate `BaseRepository(mock_collection)`.

---

### TASK-10 · `ProcurementService` — status transition timestamps + BOM analytics integration

| | |
|---|---|
| **Source file** | `app/services/procurement_service.py` |
| **Coverage** | 82% — lines 58, 84, 86, 90, 95, 110–119, 131–132, 255, 259–268, 280–281, 291–292, 305, 313, 318–319, 324–325, 353, 381–385, 394–395, 417, 438, 447–448 |
| **Target test file** | `tests/unit/services/test_procurement_service.py` (extend existing) |

**Uncovered sections:**
- Lines 110–119: `create_order` with `bom_items` (manual order → `record_manual_prices`)
- Lines 131–132: `create_order` with `bom_file_s3_key` → initial_files list
- Lines 255, 259–268: `update_order` — tracking timestamp transitions (SHIPPED, RECEIVED status)
- Lines 280–281, 291–292: EMF received timestamp + clear timestamp when EMF removed
- Lines 381–385, 394–395: `delete_order` — BOM analytics history deletion

**Tests to write:**
```
test_create_order_with_bom_items_calls_record_manual_prices
test_create_order_with_bom_s3_key_builds_initial_files
test_create_order_bom_analytics_failure_does_not_raise
test_update_order_to_shipped_sets_shipped_at
test_update_order_to_received_sets_received_at
test_update_order_emf_added_sets_emf_received_at
test_update_order_emf_removed_clears_emf_received_at
test_delete_order_calls_analytics_delete_history
```

---

### TASK-11 · Audit Repository — uncovered query methods

| | |
|---|---|
| **Source file** | `app/db/repositories/audit_repository.py` |
| **Coverage** | 88% — lines 65, 69, 83, 93, 105, 112, 117–140, 190, 251, 253 |
| **Target test file** | `tests/unit/repositories/test_audit_repository.py` (create new) |

**Uncovered sections (lines 117–140):** complex filter building — `actor`, `target_user`, `resource_id`, `search` text, `start_date`/`end_date` filters in `get_audit_logs`.

**Tests to write:**
```
test_get_audit_logs_no_filters
test_get_audit_logs_with_action_filter
test_get_audit_logs_with_actor_filter
test_get_audit_logs_with_target_user_filter
test_get_audit_logs_with_resource_id_filter
test_get_audit_logs_with_search_text_filter
test_get_audit_logs_with_date_range_filter
test_get_audit_logs_pagination
test_get_user_activity_returns_actor_and_target_logs
test_create_audit_log_stores_document
```

---

### TASK-12 · Collection Repository — edge cases

| | |
|---|---|
| **Source file** | `app/db/repositories/collection_repository.py` |
| **Coverage** | 81% — lines 75–76, 86–87, 127–128, 138–139, 150–151, 161–162, 175–177, 181–183, 188 |
| **Target test file** | `tests/unit/repositories/test_collection_repository.py` (extend existing) |

**Tests to write:**
```
test_get_collections_for_user_with_group_match
test_add_item_to_collection_already_present_no_duplicate
test_remove_item_not_in_collection_returns_gracefully
test_get_collection_items_empty_collection
test_bulk_add_items_partial_existing
test_bulk_remove_items_partial_missing
```

---

## Priority 4 — LOW (small gaps, 90%+ files)

---

### TASK-13 · `core/security.py` — JWT edge cases

| | |
|---|---|
| **Source file** | `app/core/security.py` |
| **Coverage** | 86% — lines 20, 28–35, 43–49, 61–68, 157 |
| **Target test file** | `tests/unit/core/test_security.py` (create new) |

**Tests to write:**
```
test_create_access_token_default_expiry
test_create_access_token_custom_expiry
test_decode_token_valid
test_decode_token_expired_raises
test_decode_token_invalid_signature_raises
test_get_current_user_from_valid_cookie
test_get_current_user_from_valid_header
test_get_current_user_no_token_raises_401
test_require_admin_with_admin_role
test_require_admin_with_user_role_raises_403
test_require_superadmin_with_superadmin_role
test_require_superadmin_with_admin_role_raises_403
```

---

### TASK-14 · `AuditService` — `create_manual_log` + `get_user_activity`

| | |
|---|---|
| **Source file** | `app/services/audit_service.py` |
| **Coverage** | 88% — lines 120–130 |
| **Target test file** | `tests/unit/services/test_audit_service.py` (create new) |

**Tests to write:**
```
test_create_manual_log_calls_repository
test_create_manual_log_returns_id
test_get_user_activity_calls_repository_with_username
test_get_audit_logs_passes_all_filters_to_repository
```

---

### TASK-15 · Procurement Repository — complex query edge cases

| | |
|---|---|
| **Source file** | `app/db/repositories/procurement_repository.py` |
| **Coverage** | 84% — lines 45–58, 81, 115–116, 136, 167–169, 176–177, 192–193, 208–209, 215, 226, 275 |
| **Target test file** | `tests/unit/repositories/test_procurement_repository.py` (extend existing) |

**Tests to write:**
```
test_get_orders_with_status_in_filter
test_get_orders_with_allowed_vendors_filter
test_get_orders_with_catalog_number_filter
test_get_orders_with_emf_filter
test_create_order_with_initial_files
test_update_order_status
test_delete_order
```

---

## Summary Table

| Task | File | Current % | Target | Priority |
|---|---|---|---|---|
| TASK-01 | `services/bom_template_service.py` | 41% | 95% | 🔴 Critical |
| TASK-02 | `services/bom_strategies/dynamic_strategy.py` | 39% | 95% | 🔴 Critical |
| TASK-03 | `routes/api/bom_templates.py` | 66% | 95% | 🔴 Critical |
| TASK-04 | `routes/api/audit.py` | 55% | 95% | 🟠 High |
| TASK-05 | `services/bom_analytics_service.py` | 73% | 95% | 🟠 High |
| TASK-06 | `services/bom_service.py` | 80% | 95% | 🟠 High |
| TASK-07 | `services/user_service.py` | 76% | 95% | 🟡 Medium |
| TASK-08 | `services/auth_service.py` | ~85%* | 95% | 🟡 Medium |
| TASK-09 | `db/repositories/base.py` | 68% | 95% | 🟡 Medium |
| TASK-10 | `services/procurement_service.py` | 82% | 95% | 🟡 Medium |
| TASK-11 | `db/repositories/audit_repository.py` | 88% | 95% | 🟡 Medium |
| TASK-12 | `db/repositories/collection_repository.py` | 81% | 95% | 🟡 Medium |
| TASK-13 | `core/security.py` | 86% | 95% | 🟢 Low |
| TASK-14 | `services/audit_service.py` | 88% | 95% | 🟢 Low |
| TASK-15 | `db/repositories/procurement_repository.py` | 84% | 95% | 🟢 Low |

*`auth_service.py` reads 52% but lines 88–170 are excluded ADFS code; actual testable coverage ~85%.

---

## Execution Instructions for Implementing Agent

### Environment
```powershell
cd "c:\my project\warehouse\backend"
.\.venv\Scripts\python.exe -m pytest <test_file> -v --tb=short
```

### Full suite validation (run after each task)
```powershell
.\.venv\Scripts\python.exe -m pytest tests/ -q --tb=short
```

### Coverage check (after all tasks complete)
```powershell
.\.venv\Scripts\python.exe -m pytest tests/ --cov=app --cov-report=term-missing -q 2>&1 | Select-Object -Last 80
```

### Key patterns & conventions

**Mock collection pattern (unit tests):**
```python
from unittest.mock import AsyncMock, MagicMock
mock_col = MagicMock()
mock_col.find_one = AsyncMock(return_value={...})
mock_col.insert_one = AsyncMock(return_value=MagicMock(inserted_id=ObjectId()))
repo = SomeRepository.__new__(SomeRepository)
repo.collection = mock_col
```

**In-memory xlsx fixture:**
```python
import io
from openpyxl import Workbook

def make_xlsx(headers: list, rows: list[list]) -> bytes:
    wb = Workbook(); ws = wb.active
    ws.append(headers)
    for row in rows:
        ws.append(row)
    buf = io.BytesIO(); wb.save(buf); return buf.getvalue()
```

**MockCell for strategy tests:**
```python
from unittest.mock import MagicMock

def make_cell(col: int, value=None, rgb: str = None):
    cell = MagicMock()
    cell.column = col
    cell.value = value
    fill = MagicMock()
    fill.fgColor.type = "rgb" if rgb else "none"
    fill.fgColor.rgb = rgb or ""
    cell.fill = fill
    return cell
```

**Async integration test class structure:**
```python
import pytest

@pytest.mark.asyncio
class TestAuditRoutes:
    async def test_xxx(self, async_client):
        res = await async_client.get("/api/audit/logs")
        assert res.status_code == 200
```

---

## Files That Are Already Well Covered (No Action Needed)

| File | Coverage |
|---|---|
| `services/item_service.py` | 100% |
| `services/collection_service.py` | 100% |
| `services/bom_catalog_service.py` | 100% |
| `services/catalog_service.py` | 100% |
| `services/search_service.py` | 100% |
| `schemas/*` | 94–100% |
| `db/repositories/catalog_repository.py` | 100% |
| `db/repositories/group_repository.py` | 100% |
| `db/utils/query_builder.py` | 100% |
| `routes/api/excel.py` | 100% |
| `routes/api/search.py` | 100% |
| `routes/api/catalog.py` | 100% |
| `routes/api/groups.py` | 100% |
| `routes/api/users.py` | 100% |
| `services/bom_strategies/dell_strategy.py` | 100% |
| `services/bom_strategies/generic_strategy.py` | 100% |
| `services/bom_strategies/hpe_strategy.py` | 100% |

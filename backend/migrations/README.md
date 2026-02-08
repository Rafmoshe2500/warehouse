# Database Migrations

This directory contains database migration scripts for the warehouse application.

## Available Migrations

### add_user_type.py

Adds the `user_type` field to existing users in the database.

**Purpose**: Support for Active Directory and Local user types

**What it does**:

- Adds `user_type: "local"` to all existing users without this field
- Provides rollback functionality to remove the field

**Usage**:

```bash
cd backend
python migrations/add_user_type.py
```

**Options**:

1. Run migration - Adds user_type to existing users
2. Rollback - Removes user_type from all users
3. Exit

**Safety**:

- Shows count of affected users before running
- Requires confirmation before making changes
- Provides summary after completion

---

## Creating New Migrations

When creating a new migration script:

1. **Name it descriptively**: `add_<field_name>.py` or `migrate_<description>.py`
2. **Include docstring**: Explain what the migration does
3. **Add confirmation**: Always ask for user confirmation before modifying data
4. **Provide rollback**: Include a rollback function if possible
5. **Show summary**: Display before/after counts
6. **Handle errors**: Use try-except and provide clear error messages
7. **Update this README**: Document the new migration

---

## Best Practices

- ✅ Always backup your database before running migrations
- ✅ Test migrations on a development database first
- ✅ Run migrations during low-traffic periods
- ✅ Keep migration scripts in version control
- ✅ Document what each migration does and why

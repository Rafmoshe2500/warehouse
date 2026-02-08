"""
Migration Script: Add user_type field to existing users

This script adds the 'user_type' field to all existing users in the database
that don't have it, setting the default value to 'local'.

Usage:
    python migrations/add_user_type.py

Author: System
Date: 2026-02-07
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.mongodb import MongoDB
from app.core.constants import UserType


async def migrate_user_type():
    """Add user_type field to existing users"""
    
    print("=" * 60)
    print("Migration: Add user_type field to existing users")
    print("=" * 60)
    
    try:
        # Initialize MongoDB connection
        await MongoDB.connect()
        print("✓ Connected to MongoDB")
        
        # Get users collection
        collection = MongoDB.get_permissions_collection("users")
        
        # Count users without user_type
        users_without_type = await collection.count_documents({
            "user_type": {"$exists": False}
        })
        
        print(f"\nFound {users_without_type} users without user_type field")
        
        if users_without_type == 0:
            print("✓ All users already have user_type field. Nothing to do.")
            return
        
        # Confirm migration
        print(f"\nThis will set user_type='local' for {users_without_type} users.")
        confirm = input("Continue? (yes/no): ").strip().lower()
        
        if confirm not in ['yes', 'y']:
            print("Migration cancelled.")
            return
        
        # Perform migration
        print("\nMigrating users...")
        result = await collection.update_many(
            {"user_type": {"$exists": False}},
            {"$set": {"user_type": UserType.LOCAL.value}}
        )
        
        print(f"✓ Updated {result.modified_count} users")
        
        # Verify migration
        remaining = await collection.count_documents({
            "user_type": {"$exists": False}
        })
        
        if remaining == 0:
            print("\n✅ Migration completed successfully!")
            print(f"   All {result.modified_count} users now have user_type='local'")
        else:
            print(f"\n⚠️  Warning: {remaining} users still don't have user_type")
        
        # Show summary
        print("\n" + "=" * 60)
        print("Summary:")
        print("=" * 60)
        
        local_count = await collection.count_documents({"user_type": "local"})
        ad_count = await collection.count_documents({"user_type": "ad"})
        total_count = await collection.count_documents({})
        
        print(f"Total users:        {total_count}")
        print(f"Local users:        {local_count}")
        print(f"AD users:           {ad_count}")
        print(f"Without user_type:  {remaining}")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    finally:
        print("\n✓ Migration complete")


async def rollback_migration():
    """Rollback: Remove user_type field from all users"""
    
    print("=" * 60)
    print("ROLLBACK: Remove user_type field from all users")
    print("=" * 60)
    print("\n⚠️  WARNING: This will remove the user_type field from ALL users!")
    
    confirm = input("Are you sure? Type 'ROLLBACK' to confirm: ").strip()
    
    if confirm != 'ROLLBACK':
        print("Rollback cancelled.")
        return
    
    try:
        await MongoDB.connect()
        collection = MongoDB.get_permissions_collection("users")
        
        result = await collection.update_many(
            {},
            {"$unset": {"user_type": ""}}
        )
        
        print(f"✓ Removed user_type from {result.modified_count} users")
        print("✅ Rollback completed successfully!")
        
    except Exception as e:
        print(f"❌ Rollback failed: {e}")
        sys.exit(1)
    
    finally:
        print("✓ Rollback complete")


if __name__ == "__main__":
    print("\nUser Type Migration Script")
    print("1. Run migration (add user_type to existing users)")
    print("2. Rollback migration (remove user_type from all users)")
    print("3. Exit")
    
    choice = input("\nSelect option (1-3): ").strip()
    
    if choice == "1":
        asyncio.run(migrate_user_type())
    elif choice == "2":
        asyncio.run(rollback_migration())
    elif choice == "3":
        print("Exiting...")
    else:
        print("Invalid option. Exiting...")

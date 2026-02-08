"""
Migration Script: Ensure all fields are in English

This script checks if there are any Hebrew field names in the database
and translates them to English if found.

Usage:
    python migrations/ensure_english_fields.py

Author: System
Date: 2026-02-07
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.mongodb import MongoDB


# Mapping of Hebrew to English field names
HEBREW_TO_ENGLISH = {
    'מק"ט': 'catalog_number',
    'תאור פריט': 'description',
    'יצרן': 'manufacturer',
    'מיקום': 'location',
    'סריאלי': 'serial',
    'מלאי קיים': 'current_stock',
    'תוקף אחריות': 'warranty_expiry',
    'מלאי משורין': 'reserved_stock',
    'שריון עבור': 'project_allocations',
    'יעוד': 'purpose',
    'אתר יעד': 'target_site',
    'הערות': 'notes',
}


async def ensure_english_fields():
    """Ensure all item field names are in English"""
    
    print("=" * 70)
    print("Migration: Ensure all fields are in English")
    print("=" * 70)
    
    try:
        # Initialize MongoDB connection
        await MongoDB.connect()
        print("✓ Connected to MongoDB")
        
        # Get items collection
        collection = MongoDB.get_collection("inventory")
        
        # Count total items
        total_items = await collection.count_documents({})
        print(f"\nFound {total_items} items in database")
        
        if total_items == 0:
            print("✓ No items to check.")
            return
        
        # Check for Hebrew fields
        print("\nChecking for Hebrew field names...")
        updated_count = 0
        
        cursor = collection.find({})
        async for item in cursor:
            item_id = item["_id"]
            has_hebrew = False
            
            # Check if any Hebrew fields exist
            for heb_key in HEBREW_TO_ENGLISH.keys():
                if heb_key in item:
                    has_hebrew = True
                    break
            
            if has_hebrew:
                # Translate Hebrew fields to English
                set_fields = {}
                unset_fields = {}
                
                for heb_key, eng_key in HEBREW_TO_ENGLISH.items():
                    if heb_key in item:
                        # Set the English field
                        set_fields[eng_key] = item[heb_key]
                        # Mark Hebrew field for removal
                        unset_fields[heb_key] = ""
                
                # Perform update
                if set_fields or unset_fields:
                    update_doc = {}
                    if set_fields:
                        update_doc["$set"] = set_fields
                    if unset_fields:
                        update_doc["$unset"] = unset_fields
                    
                    await collection.update_one(
                        {"_id": item_id},
                        update_doc
                    )
                    updated_count += 1
                    
                    if updated_count % 100 == 0:
                        print(f"  Processed {updated_count} items...")
        
        if updated_count > 0:
            print(f"\n✓ Translated {updated_count} items from Hebrew to English")
        else:
            print("\n✓ All fields are already in English - no changes needed!")
        
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    finally:
        print("\n✓ Migration complete")


if __name__ == "__main__":
    asyncio.run(ensure_english_fields())

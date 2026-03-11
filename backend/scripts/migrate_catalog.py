import asyncio
import sys
import os
from datetime import datetime, timezone

# Add app to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.mongodb import MongoDB
from app.db.repositories.catalog_repository import CatalogRepository

async def migrate_catalog():
    print("Connecting to MongoDB...")
    await MongoDB.connect()
    
    inventory_col = MongoDB.get_collection("inventory")
    catalog_repo = CatalogRepository(MongoDB.get_collection("catalog_items"))
    
    print("Fetching unique catalog items from inventory...")
    pipeline = [
        {"$group": {
            "_id": "$catalog_number",
            "description": {"$first": "$description"},
            "manufacturer": {"$first": "$manufacturer"}
        }}
    ]
    
    cursor = inventory_col.aggregate(pipeline)
    unique_items = await cursor.to_list(length=None)
    
    total = len(unique_items)
    print(f"Found {total} unique items. Populating catalog...")
    
    count = 0
    for item in unique_items:
        makat = item["_id"]
        # Skip empty makats
        if not makat:
            continue
            
        await catalog_repo.upsert(
            catalog_number=makat,
            description=item.get("description"),
            manufacturer=item.get("manufacturer")
        )
        count += 1
        if count % 100 == 0:
            print(f"Processed {count}/{total} items")
            
    print(f"Migration complete. Added/Updated {count} items in catalog.")
    await MongoDB.disconnect()

if __name__ == "__main__":
    asyncio.run(migrate_catalog())

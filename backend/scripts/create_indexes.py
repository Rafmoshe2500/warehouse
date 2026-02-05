from pymongo import MongoClient

# התחברות ל-MongoDB
client = MongoClient('mongodb://root:example@localhost:27017/inventory_db?authSource=admin')
db = client['inventory_db']  # שנה לשם הדאטאבייס שלך

# קבלת רשימת כל הקולקשנים
all_collections = db.list_collection_names()

# סינון וביצוע מחיקה לקולקשנים שמתחילים ב-test_
deleted_collections = []
for collection_name in all_collections:
    if collection_name.startswith('test_'):
        db.drop_collection(collection_name)
        deleted_collections.append(collection_name)
        print(f"נמחק: {collection_name}")

print(f"\nסה\"כ נמחקו {len(deleted_collections)} קולקשנים")
print(f"רשימת הקולקשנים שנמחקו: {deleted_collections}")

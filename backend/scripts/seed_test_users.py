"""
Seed test users for E2E procurement tests.

Creates vendor-specific users with appropriate permissions.
All users get password: "password"

Usage:
    cd backend
    python -m scripts.seed_test_users
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from pymongo import MongoClient
import bcrypt
from datetime import datetime, timezone

# ── Config ────────────────────────────────────────────────
MONGO_URL = os.environ.get("MONGODB_URL", "mongodb://root:example@localhost:27017/inventory_db?authSource=admin")
DB_NAME = os.environ.get("DB_NAME", "inventory_db")
PASSWORD = "password"

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

HASHED = hash_password(PASSWORD)
NOW = datetime.now(timezone.utc)

# ── Users to create ──────────────────────────────────────
TEST_USERS = [
    # ── Global procurement ────────────────────────────────
    {
        "username": "p123ro",
        "role": "user",
        "permissions": ["procurement:ro"],
    },
    {
        "username": "p123rw",
        "role": "user",
        "permissions": ["procurement:rw"],
    },
    # ── NetApp ────────────────────────────────────────────
    {
        "username": "netapp_ro",
        "role": "user",
        "permissions": ["procurement:netapp:ro"],
    },
    {
        "username": "netapp_rw",
        "role": "user",
        "permissions": ["procurement:netapp:rw"],
    },
    # ── Dell ──────────────────────────────────────────────
    {
        "username": "dell_ro",
        "role": "user",
        "permissions": ["procurement:dell:ro"],
    },
    {
        "username": "dell_rw",
        "role": "user",
        "permissions": ["procurement:dell:rw"],
    },
    # ── HPE ───────────────────────────────────────────────
    {
        "username": "hpe_ro",
        "role": "user",
        "permissions": ["procurement:hpe:ro"],
    },
    {
        "username": "hpe_rw",
        "role": "user",
        "permissions": ["procurement:hpe:rw"],
    },
    # ── Cisco ─────────────────────────────────────────────
    {
        "username": "cisco_ro",
        "role": "user",
        "permissions": ["procurement:cisco:ro"],
    },
    {
        "username": "cisco_rw",
        "role": "user",
        "permissions": ["procurement:cisco:rw"],
    },
    # ── Commvault ─────────────────────────────────────────
    {
        "username": "commvault_ro",
        "role": "user",
        "permissions": ["procurement:commvault:ro"],
    },
    {
        "username": "commvault_rw",
        "role": "user",
        "permissions": ["procurement:commvault:rw"],
    },
    # ── Price / analytics permission ──────────────────────
    {
        "username": "price_viewer",
        "role": "user",
        "permissions": ["procurement:ro", "procurement:view_prices"],
    },
    {
        "username": "price_comparer",
        "role": "user",
        "permissions": ["procurement:ro", "procurement:view_prices", "procurement:compare_prices"],
    },
    # ── Multi-vendor user (NetApp + Dell RW) ──────────────
    {
        "username": "multi_vendor_rw",
        "role": "user",
        "permissions": [
            "procurement:netapp:rw",
            "procurement:dell:rw",
            "procurement:view_prices",
        ],
    },
    # ── Inventory-only user (no procurement access) ───────
    {
        "username": "inventory_only",
        "role": "user",
        "permissions": ["inventory:rw"],
    },
]


def main():
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    users_coll = db["users"]

    created = 0
    skipped = 0

    for user_spec in TEST_USERS:
        username = user_spec["username"]
        existing = users_coll.find_one({"username": username})
        if existing:
            # Update permissions and password in case they changed
            users_coll.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "password_hash": HASHED,
                    "permissions": user_spec["permissions"],
                    "role": user_spec["role"],
                    "is_active": True,
                    "user_type": "local",
                    "updated_at": NOW,
                }},
            )
            print(f"  ✏️  Updated: {username} ({', '.join(user_spec['permissions'])})")
            skipped += 1
            continue

        doc = {
            "username": username,
            "password_hash": HASHED,
            "user_type": "local",
            "role": user_spec["role"],
            "permissions": user_spec["permissions"],
            "is_active": True,
            "created_by": "seed_script",
            "created_at": NOW,
            "updated_at": NOW,
            "last_login": None,
        }
        users_coll.insert_one(doc)
        print(f"  ✅ Created: {username} ({', '.join(user_spec['permissions'])})")
        created += 1

    print(f"\nDone: {created} created, {skipped} updated.")
    client.close()


if __name__ == "__main__":
    main()

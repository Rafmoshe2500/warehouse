"""
train_from_mongodb.py
=====================
Standalone script that retrains the BOM component classifier using verified
user-corrected data from MongoDB's bom_part_catalog collection, merged with
the static text_classify.csv training set.

Usage (from backend/ directory):
    python -m scripts.train.train_from_mongodb

Requires: MONGODB_URL and DB_NAME environment variables (or .env file).
"""

import os
import sys
import asyncio

# Ensure app package is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))


async def main():
    from app.db.mongodb import MongoDB
    from app.services.ai_training_service import AITrainingService

    await MongoDB.connect()
    try:
        service = AITrainingService()
        metrics = await service.retrain_model()
        print("\n=== Retrain Complete ===")
        for k, v in metrics.items():
            print(f"  {k}: {v}")
    finally:
        await MongoDB.disconnect()


if __name__ == "__main__":
    asyncio.run(main())

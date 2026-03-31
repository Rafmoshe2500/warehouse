import asyncio
import os
import sys

# Add backend dir to path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.bom_analytics_service import BomAnalyticsService
from app.db.mongodb import MongoDB
from app.core.config import settings

async def main():
    print("Connecting to MongoDB...")
    await MongoDB.connect_to_database(settings.MONGODB_URL, settings.DATABASE_NAME)
    
    svc = BomAnalyticsService()
    print("Running historical data seed...")
    result = await svc.seed_historical_data()
    print("Seed complete!", result)
    
    await MongoDB.close_database_connection()

if __name__ == "__main__":
    asyncio.run(main())


import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

async def test_conn():
    print(f"Connecting to {settings.MONGODB_URL}")
    client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
    try:
        await client.admin.command('ping')
        print("Ping successful!")
    except Exception as e:
        print(f"Ping failed: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(test_conn())

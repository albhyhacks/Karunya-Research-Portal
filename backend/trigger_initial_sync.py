import asyncio
import logging
from app.services.sync import SyncService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_sync():
    print("Testing Karunya University Data Sync (Batch 1)...")
    service = SyncService()
    
    # We'll run a modified sync for testing if needed,
    # but for now, testing the first batch is enough.
    try:
        await service.run_full_sync()
        print("\nSUCCESS: Initial batch of Karunya records has been synced.")
    except Exception as e:
        print(f"\nERROR: Sync failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_sync())

import asyncio
import argparse
import logging
import sys
from app.services.sync import SyncService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)

async def main():
    parser = argparse.ArgumentParser(description="Scopus Data Synchronization Tool")
    parser.add_argument(
        "--mode", 
        choices=["full", "incremental"], 
        required=True,
        help="Sync mode: 'full' for all history, 'incremental' for last 30 days."
    )
    
    args = parser.parse_args()
    
    sync_service = SyncService()
    
    if args.mode == "full":
        print("Starting full sync...")
        await sync_service.run_full_sync()
    else:
        print("Starting incremental sync...")
        await sync_service.run_incremental_sync()
    
    print("Done!")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nSync interrupted by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\nSync failed with error: {e}")
        sys.exit(1)

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from app.services.cache import cache

async def clear_cache():
    await cache.invalidate_analytics()
    print("Analytics cache cleared. The dashboard will now show only Karunya data.")

if __name__ == "__main__":
    asyncio.run(clear_cache())

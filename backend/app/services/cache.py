import time
import logging
from typing import Optional, Any

logger = logging.getLogger(__name__)

class CacheService:
    def __init__(self):
        self._store = {}
        self.ttl = 3600 # 1 hour

    async def get(self, key: str) -> Optional[Any]:
        if key in self._store:
            data, expires_at = self._store[key]
            if time.time() < expires_at:
                return data
            else:
                del self._store[key]
        return None

    async def set(self, key: str, value: Any, ttl: Optional[int] = None):
        expires_at = time.time() + (ttl or self.ttl)
        self._store[key] = (value, expires_at)

    async def invalidate_analytics(self):
        keys_to_delete = [k for k in self._store.keys() if k.startswith("cache:analytics:")]
        for k in keys_to_delete:
            del self._store[k]
        logger.info(f"Invalidated {len(keys_to_delete)} analytics cache keys")

cache = CacheService()

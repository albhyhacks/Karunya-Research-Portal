import asyncio
from sqlalchemy import select
from app.database import SessionLocal
from app.models import User

async def check_users():
    async with SessionLocal() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        print("--- USER LIST ---")
        for u in users:
            print(f"- '{u.full_name}' ('{u.email}') Role: {u.role}")

if __name__ == "__main__":
    asyncio.run(check_users())

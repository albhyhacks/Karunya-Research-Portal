import asyncio
from app.database import SessionLocal
from app.models import Author
from sqlalchemy import update, select, func

async def reset_faculty():
    async with SessionLocal() as db:
        # Check current count
        count_true = await db.scalar(select(func.count(Author.id)).where(Author.is_faculty == True))
        print(f"Authors currently marked as faculty: {count_true}")
        
        # Reset all to False
        await db.execute(update(Author).values(is_faculty=False))
        await db.commit()
        
        count_true_after = await db.scalar(select(func.count(Author.id)).where(Author.is_faculty == True))
        print(f"Authors marked as faculty after reset: {count_true_after}")
        print("Done. Fast Sync will now automatically restore is_faculty=True for true Karunya authors.")

if __name__ == "__main__":
    asyncio.run(reset_faculty())

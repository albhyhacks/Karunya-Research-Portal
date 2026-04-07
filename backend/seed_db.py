import asyncio
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import engine, Base
from app.models.user import User, Role
from app.services.auth import AuthService
from app.database import SessionLocal

async def init_db():
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as db:
        # Check if admin already exists
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.email == "admin@karunya.edu.in"))
        admin = result.scalar_one_or_none()
        
        if not admin:
            print("Creating default admin user...")
            admin = User(
                id=uuid.uuid4(),
                email="admin@karunya.edu.in",
                hashed_password=AuthService.get_password_hash("admin123"),
                full_name="Portal Administrator",
                role=Role.ADMIN
            )
            db.add(admin)
            
            # Create a test faculty user too
            faculty = User(
                id=uuid.uuid4(),
                email="faculty@karunya.edu.in",
                hashed_password=AuthService.get_password_hash("faculty123"),
                full_name="Test Faculty Member",
                role=Role.USER
            )
            db.add(faculty)
            
            await db.commit()
            print("Database seeded successfully with:")
            print("  Admin: admin@karunya.edu.in / admin123")
            print("  Faculty: faculty@karunya.edu.in / faculty123")
        else:
            print("Admin user already exists. Skipping seed.")

if __name__ == "__main__":
    asyncio.run(init_db())

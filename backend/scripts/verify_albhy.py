import asyncio
import httpx

async def test_user_login():
    email = "albhyww@gmail.com"
    # Assuming user knows the password they set. 
    # I'll just check if the user is in the DB again to verify the hash is there.
    # Actually, I'll try to find any "typos" in the email like trailing spaces.
    
    from sqlalchemy import select
    from app.database import SessionLocal
    from app.models import User
    from app.services.auth import AuthService
    
    async with SessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            print(f"User Found: {user.full_name}")
            print(f"Email: '{user.email}'") # Using quotes to see spaces
            print(f"Role: {user.role}")
        else:
            print("User NOT Found with that email.")

if __name__ == "__main__":
    asyncio.run(test_user_login())

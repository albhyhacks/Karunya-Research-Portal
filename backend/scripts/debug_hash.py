from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

try:
    p = "admin123"
    h = pwd_context.hash(p)
    print(f"Hashed: {h}")
    v = pwd_context.verify(p, h)
    print(f"Verified: {v}")
except Exception as e:
    import traceback
    print(f"Error: {e}")
    traceback.print_exc()

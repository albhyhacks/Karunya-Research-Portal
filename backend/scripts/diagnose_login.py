import asyncio
import httpx

async def diagnose_login():
    url = "http://localhost:8000/api/auth/login"
    data = {
        "username": "admin@karunya.edu.in",
        "password": "admin123"
    }
    
    print(f"Testing login at {url}...")
    try:
        async with httpx.AsyncClient() as client:
            # OAuth2 expects form-encoded data
            response = await client.post(url, data=data)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
            
            if response.status_code == 200:
                print("SUCCESS: Login works.")
            elif response.status_code == 422:
                print("ERROR: Unprocessable Entity. Check data format.")
            elif response.status_code == 401:
                print("ERROR: Invalid credentials.")
            else:
                print(f"ERROR: Received unexpected status code {response.status_code}")
                
    except Exception as e:
        print(f"CONNECTION ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(diagnose_login())

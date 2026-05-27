import asyncio
import httpx

api_key = "6171e51c72f6e0548e3a0f2cbec13efd"

async def check_info(id_val):
    url = f"https://api.elsevier.com/content/affiliation/affiliation_id/{id_val}?apiKey={api_key}"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                profile = data.get("affiliation-retrieval-response", {})
                name = profile.get("affiliation-name", "Unknown")
                city = profile.get("city", "Unknown")
                count = profile.get("coredata", {}).get("opensearch:totalResults", "0")
                return f"{name} ({city}) -> {count} papers"
            else:
                return f"Error {response.status_code}"
        except Exception as e:
            return str(e)

async def main():
    ids = ['60007624', '60100082', '60025709', '60023403']
    print("Checking affiliation details for potential Karunya IDs...")
    for i in ids:
        info = await check_info(i)
        print(f"ID {i}: {info}")

if __name__ == "__main__":
    asyncio.run(main())

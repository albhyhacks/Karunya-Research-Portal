import asyncio
import httpx

api_key = "6171e51c72f6e0548e3a0f2cbec13efd"

async def check(id_val):
    url = f"https://api.elsevier.com/content/search/scopus?query=AF-ID({id_val})&apiKey={api_key}&count=0"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                total = data.get("search-results", {}).get("opensearch:totalResults", "0")
                return total
            else:
                return f"Error {response.status_code}"
        except Exception as e:
            return str(e)

async def main():
    ids = ['60007624', '60100082', '60025709', '60023403']
    print("Checking paper counts for potential Karunya IDs...")
    for i in ids:
        count = await check(i)
        print(f"ID {i}: {count} papers")

if __name__ == "__main__":
    asyncio.run(main())

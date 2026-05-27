import asyncio
import httpx
import json

async def check():
    r = await httpx.AsyncClient().get(
        'https://api.elsevier.com/content/abstract/scopus_id/85140483257',
        headers={'X-ELS-APIKey': '72a227e5a90cb997475db20eac9a1f6d'},
        params={'field': 'authors,affiliation,coredata,authkeywords'},
        timeout=30
    )
    d = r.json()
    resp = d.get('abstracts-retrieval-response', {})
    coredata = resp.get('coredata', {})
    print("coredata keys:", list(coredata.keys()))
    print("authkeywords in coredata:", coredata.get('authkeywords'))
    # check if it's at top level of response
    print("authkeywords at top level:", resp.get('authkeywords'))
    # check idxterms
    print("idxterms:", resp.get('idxterms'))
    print("subject areas:", resp.get('subject-areas'))
    
asyncio.run(check())

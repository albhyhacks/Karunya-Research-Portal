import httpx
import json

r = httpx.get('https://api.elsevier.com/content/search/scopus', 
    headers={'X-ELS-APIKey': '72a227e5a90cb997475db20eac9a1f6d'}, 
    params={'query': 'AFFIL(Karunya)', 'field': 'affiliation'}
)
with open('karunya_ids.json', 'w', encoding='utf-8') as f:
    json.dump(r.json(), f, indent=2)

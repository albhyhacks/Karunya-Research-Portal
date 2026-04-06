import sqlite3
import sys

# Ensure UTF-8 output for special characters in titles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('research.db')
cur = conn.cursor()

print('=== PAPERS ===')
cur.execute('SELECT COUNT(*) FROM papers')
print(f'Total: {cur.fetchone()[0]}')

cur.execute("SELECT scopus_id, title FROM papers WHERE scopus_id NOT IN ('85100000001', '85100000002')")
rows = cur.fetchall()
print(f'Real Scopus papers: {len(rows)}')
for r in rows:
    print(f'  {r[0]} | {str(r[1])[:60]}')

print('\n=== AUTHORS ===')
cur.execute('SELECT COUNT(*) FROM authors')
print(f'Total: {cur.fetchone()[0]}')

cur.execute('SELECT scopus_author_id, full_name, is_faculty, h_index FROM authors')
for r in cur.fetchall():
    print(f'  {r[0]} | {r[1]} | faculty: {r[2]} | h_index: {r[3]}')

conn.close()

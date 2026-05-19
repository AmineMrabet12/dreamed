# In Python shell
import sqlite3

conn = sqlite3.connect("bi.db")
cursor = conn.cursor()
cursor.execute("""
CREATE TABLE IF NOT EXISTS chat_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sources TEXT,
    timestamp TEXT NOT NULL
)
""")
conn.commit()
conn.close()

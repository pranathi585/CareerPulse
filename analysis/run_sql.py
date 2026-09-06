import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

DB_FILE = BASE_DIR / "datasets" / "processed" / "careerpulse.db"
SQL_FILE = BASE_DIR / "analysis" / "career_analysis.sql"

connection = sqlite3.connect(DB_FILE)

with open(SQL_FILE, "r", encoding="utf-8") as file:
    sql_script = file.read()

statements = [
    statement.strip()
    for statement in sql_script.split(";")
    if statement.strip()
]

for number, statement in enumerate(statements, start=1):

    if statement.startswith("--"):
        lines = statement.splitlines()
        lines = [
            line for line in lines
            if not line.strip().startswith("--")
        ]
        statement = "\n".join(lines).strip()

    if not statement:
        continue

    cursor = connection.execute(statement)

    if cursor.description:
        print(f"\n========== QUERY {number} ==========")

        columns = [
            column[0]
            for column in cursor.description
        ]

        print(" | ".join(columns))
        print("-" * 70)

        for row in cursor.fetchall():
            print(" | ".join(str(value) for value in row))

connection.close()

print("\nSQL analysis completed successfully.")
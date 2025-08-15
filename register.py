import sqlite3  # This is for saving voter info like a list
import uuid    # This makes unique IDs

# Set up a pretend database (a file to store voter names)
conn = sqlite3.connect('voters.db')  # This creates a file called voters.db in your folder
cursor = conn.cursor()
cursor.execute('''CREATE TABLE IF NOT EXISTS voters
                  (id TEXT PRIMARY KEY, name TEXT)''')  # This makes a table like a spreadsheet
conn.commit()

def enroll_voter(name):
    # Pretend to check for duplicates (we'll add real fingerprints later)
    cursor.execute("SELECT * FROM voters WHERE name = ?", (name,))
    if cursor.fetchone():
        print("Duplicate! This name is already registered - rejected.")
        return
    
    # If no duplicate, save it
    voter_id = str(uuid.uuid4())  # Makes a unique ID
    cursor.execute("INSERT INTO voters (id, name) VALUES (?, ?)", (voter_id, name))
    conn.commit()
    print(f"Success! Voter ID: {voter_id}")

# Test it - like running a small example
enroll_voter("Test Voter 1")  # Try registering
enroll_voter("Test Voter 1")  # Try again - should reject as duplicate

from fastapi import FastAPI
import oracledb

app = FastAPI()

# --- Database Connection ---
# Update username, password, and connection string as per your Oracle setup
username = "system"
password = "ks123"   # 🔹 Replace this
dsn = "localhost/XE"                # XE is default Oracle Express Service Name

connection = oracledb.connect(user=username, password=password, dsn=dsn)
cursor = connection.cursor()

# --- FastAPI Routes ---
@app.get("/")
def home():
    return {"message": "Real Estate DBMS API is running!"}

@app.get("/properties")
def get_properties():
    cursor.execute("SELECT property_id, title, city, price, status FROM properties")
    rows = cursor.fetchall()
    result = []
    for row in rows:
        result.append({
            "property_id": row[0],
            "title": row[1],
            "city": row[2],
            "price": row[3],
            "status": row[4]
        })
    return result

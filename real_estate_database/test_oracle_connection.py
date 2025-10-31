import oracledb

# Use your actual Oracle username, password, and database service name (same as in SQL*Plus)
username = "system"
password = "ks123"  # 🔸 Replace with your actual password
dsn = "localhost/XEPDB1"  # ⚠️ Change XEPDB1 if your Oracle service name is different

try:
    connection = oracledb.connect(user=username, password=password, dsn=dsn)
    print("✅ Connection successful!")
    connection.close()
except Exception as e:
    print("❌ Connection failed:", e)

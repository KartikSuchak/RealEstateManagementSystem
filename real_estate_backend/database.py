import oracledb

def get_connection():
    try:
        dsn = oracledb.makedsn("127.0.0.1", 1521, service_name="XE")
        conn = oracledb.connect(
            user="system",
            password="ks123",  # ✅ correct password only
            dsn=dsn
        )
        return conn
    except oracledb.DatabaseError as e:
        print("❌ Database connection error:", e)
        raise

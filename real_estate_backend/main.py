from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import oracledb
from real_estate_backend.database import get_connection

# ------------------------------------------------------------
# FASTAPI APP CONFIGURATION
# ------------------------------------------------------------
app = FastAPI(title="Real Estate Management System API")

# ✅ Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Handle only OPTIONS preflight (don’t block other methods)
@app.options("/{rest_of_path:path}")
async def preflight_handler(request: Request, rest_of_path: str):
    return {
        "message": f"CORS preflight OK for {request.url.path}"
    }

# ------------------------------------------------------------
# DATA MODELS
# ------------------------------------------------------------
class User(BaseModel):
    username: str
    email: str
    role: str = "buyer"


class Agent(BaseModel):
    username: str
    license_no: str
    region: str


# ------------------------------------------------------------
# ROOT ENDPOINT
# ------------------------------------------------------------
@app.get("/")
def home():
    return {"message": "🏠 Real Estate Management System API is running!"}


# ------------------------------------------------------------
# USERS: CRUD OPERATIONS
# ------------------------------------------------------------
@app.get("/users")
def get_users():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT USER_ID, USERNAME, EMAIL, ROLE FROM USERS ORDER BY USER_ID")
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        users = [
            {"user_id": r[0], "username": r[1], "email": r[2], "role": r[3]}
            for r in rows
        ]
        return {"users": users}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/add_user")
def add_user(user: User):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT NVL(MAX(USER_ID), 0) + 1 FROM USERS")
        new_id = cursor.fetchone()[0]

        cursor.execute("""
            INSERT INTO USERS (USER_ID, USERNAME, PASSWORD_HASH, FULL_NAME, EMAIL, PHONE, ROLE, CREATED_AT)
            VALUES (:1, :2, 'default_hash', :3, :4, '0000000000', :5, SYSDATE)
        """, (new_id, user.username, user.username, user.email, user.role))

        conn.commit()
        cursor.close()
        conn.close()
        return {"message": f"✅ User '{user.username}' added successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/update_user/{user_id}")
def update_user(user_id: int, request: dict):
    username = request.get("username")
    email = request.get("email")
    role = request.get("role")

    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Update user info
        cursor.execute("""
            UPDATE users 
            SET username = :1, email = :2, role = :3 
            WHERE user_id = :4
        """, [username, email, role, user_id])

        # ✅ Sync role with agents table
        if role.lower() == "buyer":
            cursor.execute("DELETE FROM agents WHERE user_id = :1", [user_id])
        elif role.lower() == "agent":
            cursor.execute("SELECT agent_id FROM agents WHERE user_id = :1", [user_id])
            if cursor.fetchone() is None:
                cursor.execute("SELECT NVL(MAX(agent_id),0)+1 FROM agents")
                new_agent_id = cursor.fetchone()[0]
                cursor.execute("""
                    INSERT INTO agents (agent_id, user_id, license_no, region)
                    VALUES (:1, :2, 'UNASSIGNED', 'Not specified')
                """, [new_agent_id, user_id])

        conn.commit()
        cursor.close()
        conn.close()

        return {"message": f"✅ User '{username}' updated successfully!"}
    except Exception as e:
        print("🔥 Update error:", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/delete_user/{user_id}")
def delete_user(user_id: int):
    import traceback
    print(f"🧹 Attempting to delete user_id={user_id}")

    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Check if user exists
        cursor.execute("SELECT username FROM users WHERE user_id = :1", [user_id])
        user_row = cursor.fetchone()
        if not user_row:
            print("⚠️ User not found.")
            return {"message": f"User ID {user_id} not found"}

        username = user_row[0]
        print(f"👤 Found user: {username}")

        # Find linked agent
        cursor.execute("SELECT agent_id FROM agents WHERE user_id = :1", [user_id])
        agent = cursor.fetchone()

        if agent:
            agent_id = agent[0]
            print(f"🔗 Found linked agent_id={agent_id}. Deleting their properties...")
            
            # Delete all properties linked to that agent
            cursor.execute("DELETE FROM properties WHERE agent_id = :1", [agent_id])
            print(f"🏠 Deleted {cursor.rowcount} properties")

            # Delete the agent
            cursor.execute("DELETE FROM agents WHERE agent_id = :1", [agent_id])
            print(f"🧾 Agent deleted.")

        # Delete user
        cursor.execute("DELETE FROM users WHERE user_id = :1", [user_id])
        print(f"🧍‍♂️ Deleted user record (count={cursor.rowcount})")

        conn.commit()
        cursor.close()
        conn.close()

        print("✅ All deletions done successfully.")
        return {"message": f"🗑️ User {user_id} and linked data deleted successfully."}

    except Exception as e:
        print("🔥 Delete error:", e)
        traceback.print_exc()
        if 'conn' in locals():
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# PL/SQL PROCEDURE: Calculate Total Sales for Agent
# ------------------------------------------------------------
@app.get("/calc_total_sales/{agent_id}")
def calc_total_sales(agent_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        total_sales = cursor.var(float)
        cursor.callproc("calc_total_sales", [agent_id, total_sales])
        result = total_sales.getvalue()

        conn.commit()
        cursor.close()
        conn.close()

        return {"agent_id": agent_id, "total_sales": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# PL/SQL FUNCTION: Get Total Unpaid Commission for Agent
# ------------------------------------------------------------
@app.get("/get_total_commission/{agent_id}")
def get_total_commission(agent_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT get_total_commission(:1) FROM dual", [agent_id])
        result = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        return {"agent_id": agent_id, "total_unpaid_commission": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# CURSOR LOGIC: Available Properties by City
# ------------------------------------------------------------
@app.get("/available_properties/{city}")
def available_properties(city: str):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            SELECT property_id, title, price, status
            FROM properties
            WHERE LOWER(city) = LOWER(:city)
            AND status = 'available'
        """
        cursor.execute(query, [city])
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        properties = [
            {"property_id": r[0], "title": r[1], "price": r[2], "status": r[3]}
            for r in rows
        ]
        return {"available_properties": properties}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# EXCEPTION HANDLING DEMO: Check Property Price
# ------------------------------------------------------------
@app.get("/check_property/{property_id}")
def check_property(property_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT price FROM properties WHERE property_id = :1", [property_id])
        result = cursor.fetchone()
        cursor.close()
        conn.close()

        if not result:
            return {"error": f"❌ Property with ID {property_id} not found"}
        else:
            return {"property_id": property_id, "price": result[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# AGENT ENDPOINTS
# ------------------------------------------------------------
@app.get("/agents")
def get_agents():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT a.agent_id, u.username, a.license_no, a.region
            FROM agents a
            JOIN users u ON a.user_id = u.user_id
            ORDER BY a.agent_id
        """)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        agents = [
            {"agent_id": r[0], "username": r[1], "license_no": r[2], "region": r[3]}
            for r in rows
        ]
        return {"agents": agents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/add_agent")
def add_agent(agent: Agent):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # See if user exists
        cursor.execute("SELECT USER_ID, ROLE FROM USERS WHERE USERNAME = :1", [agent.username])
        row = cursor.fetchone()

        if row:
            user_id = row[0]
            current_role = row[1]
            # If role is not agent, update it
            if current_role != 'agent':
                cursor.execute("UPDATE USERS SET ROLE = 'agent' WHERE USER_ID = :1", [user_id])
        else:
            # Create user with role agent
            cursor.execute("SELECT NVL(MAX(USER_ID),0)+1 FROM USERS")
            user_id = cursor.fetchone()[0]
            cursor.execute("""
                INSERT INTO USERS (
                    USER_ID, USERNAME, PASSWORD_HASH, FULL_NAME, EMAIL, PHONE, ROLE, CREATED_AT
                ) VALUES (
                    :1, :2, 'default_hash', :3, :2 || '@example.com', '0000000000', 'agent', SYSDATE
                )
            """, (user_id, agent.username, agent.username))

        # Insert into agents table
        cursor.execute("SELECT NVL(MAX(AGENT_ID),0)+1 FROM AGENTS")
        agent_id = cursor.fetchone()[0]

        cursor.execute("""
            INSERT INTO AGENTS (AGENT_ID, USER_ID, LICENSE_NO, REGION)
            VALUES (:1, :2, :3, :4)
        """, (agent_id, user_id, agent.license_no, agent.region))

        conn.commit()
        cursor.close()
        conn.close()
        return {"message": f"✅ Agent '{agent.username}' added successfully!"}
    except oracledb.IntegrityError:
        raise HTTPException(status_code=400, detail="Agent already exists or duplicate key.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# PROPERTY ENDPOINTS
# ------------------------------------------------------------
@app.get("/properties")
def get_properties():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.property_id, u.username, p.title, p.city, p.locality, p.price, p.status
            FROM properties p
            LEFT JOIN agents a ON p.agent_id = a.agent_id
            LEFT JOIN users u ON a.user_id = u.user_id
            ORDER BY p.property_id
        """)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        properties = [
            {
                "property_id": r[0],
                "agent": r[1],
                "title": r[2],
                "city": r[3],
                "locality": r[4],
                "price": r[5],
                "status": r[6],
            }
            for r in rows
        ]
        return {"properties": properties}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/add_property")
def add_property(property_data: dict):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Find agent_id
        cursor.execute("""
            SELECT a.agent_id FROM agents a
            JOIN users u ON a.user_id = u.user_id
            WHERE u.username = :1
        """, [property_data["agent_username"]])
        agent = cursor.fetchone()

        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found.")

        agent_id = agent[0]

        cursor.execute("""
            INSERT INTO properties (agent_id, title, description, city, locality, price, property_type, status)
            VALUES (:1, :2, :3, :4, :5, :6, :7, :8)
        """, (
            agent_id,
            property_data["title"],
            property_data["description"],
            property_data["city"],
            property_data["locality"],
            property_data["price"],
            property_data["property_type"],
            property_data["status"]
        ))

        conn.commit()
        cursor.close()
        conn.close()
        return {"message": f"✅ Property '{property_data['title']}' added successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/update_property_status/{property_id}")
def update_property_status(property_id: int, new_status: str):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE properties
            SET status = :1
            WHERE property_id = :2
        """, [new_status, property_id])
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"Property ID {property_id} not found")

        cursor.close()
        conn.close()
        return {
            "message": f"✅ Property {property_id} updated to '{new_status}'",
            "trigger": "trg_property_status_log fired automatically"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# UPDATE AGENT
# ------------------------------------------------------------
@app.put("/update_agent/{agent_id}")
def update_agent(agent_id: int, agent: Agent):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE agents
            SET license_no = :1, region = :2
            WHERE agent_id = :3
        """, [agent.license_no, agent.region, agent_id])

        # Optional: also update username in USERS table
        cursor.execute("""
            UPDATE users
            SET username = :1
            WHERE user_id = (SELECT user_id FROM agents WHERE agent_id = :2)
        """, [agent.username, agent_id])

        conn.commit()
        cursor.close()
        conn.close()

        return {"message": f"✅ Agent ID {agent_id} updated successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# DELETE AGENT
# ------------------------------------------------------------
@app.delete("/delete_agent/{agent_id}")
def delete_agent(agent_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Delete properties linked to the agent (foreign key)
        cursor.execute("DELETE FROM properties WHERE agent_id = :1", [agent_id])

        # Delete agent itself
        cursor.execute("DELETE FROM agents WHERE agent_id = :1", [agent_id])

        conn.commit()
        cursor.close()
        conn.close()

        return {"message": f"🗑️ Agent ID {agent_id} deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/update_property/{property_id}")
def update_property(property_id: int, property_data: dict):
    import traceback
    print(f"🛠️ Received update request for property_id={property_id}")
    print("📦 Incoming data:", property_data)

    try:
        conn = get_connection()
        cursor = conn.cursor()

        # ✅ Find agent_id by username
        cursor.execute("""
            SELECT a.agent_id FROM agents a
            JOIN users u ON a.user_id = u.user_id
            WHERE u.username = :1
        """, [property_data.get("agent_username")])
        agent = cursor.fetchone()

        if not agent:
            print("❌ Agent not found for username:", property_data.get("agent_username"))
            raise HTTPException(status_code=404, detail="Agent not found.")

        agent_id = agent[0]
        print("✅ Found agent_id:", agent_id)

        # ✅ Update property details
        cursor.execute("""
            UPDATE properties
            SET agent_id = :1,
                title = :2,
                description = :3,
                city = :4,
                locality = :5,
                price = :6,
                property_type = :7,
                status = :8
            WHERE property_id = :9
        """, (
            agent_id,
            property_data.get("title"),
            property_data.get("description", ""),
            property_data.get("city"),
            property_data.get("locality", ""),
            property_data.get("price"),
            property_data.get("property_type"),
            property_data.get("status"),
            property_id
        ))

        print("💾 Rows affected:", cursor.rowcount)
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"Property ID {property_id} not found.")

        conn.commit()
        cursor.close()
        conn.close()

        print(f"✅ Property {property_id} updated successfully!")
        return {"message": f"✅ Property {property_id} updated successfully!"}

    except Exception as e:
        print("🔥 Update failed:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ------------------------------------------------------------
# DELETE PROPERTY
# ------------------------------------------------------------
@app.delete("/delete_property/{property_id}")
def delete_property(property_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM properties WHERE property_id = :1", [property_id])
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": f"🗑️ Property ID {property_id} deleted successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

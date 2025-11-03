from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import oracledb
from database import get_connection

# ------------------------------------------------------------
# FASTAPI APP CONFIGURATION
# ------------------------------------------------------------
app = FastAPI(title="Real Estate Management System API")

# Enable CORS for frontend (React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Can change to ["http://localhost:3000"] for safety
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------
# DATA MODELS
# ------------------------------------------------------------
class User(BaseModel):
    username: str
    email: str
    role: str = "buyer"

# ---------------------------
# AGENT MODEL
# ---------------------------
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
        users = [{"user_id": r[0], "username": r[1], "email": r[2], "role": r[3]} for r in rows]
        return {"users": users}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/add_user")
def add_user(user: User):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Auto generate id
        cursor.execute("SELECT NVL(MAX(USER_ID),0)+1 FROM USERS")
        new_id = cursor.fetchone()[0]

        cursor.execute("""
            INSERT INTO USERS (
                USER_ID, USERNAME, PASSWORD_HASH, FULL_NAME, EMAIL, PHONE, ROLE, CREATED_AT
            ) VALUES (
                :1, :2, 'default_hash', :3, :4, '0000000000', :5, SYSDATE
            )
        """, (new_id, user.username, user.username, user.email, user.role))

        conn.commit()
        cursor.close()
        conn.close()
        return {"message": f"✅ User '{user.username}' added with role '{user.role}'."}
    except oracledb.IntegrityError:
        raise HTTPException(status_code=400, detail="User already exists.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# PL/SQL PROCEDURE: Calculate Total Sales for Agent
# ------------------------------------------------------------
@app.get("/calc_total_sales/{agent_id}")
def calc_total_sales(agent_id: int):
    """Execute PL/SQL procedure to calculate total sales by agent."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.callproc("calc_total_sales", [agent_id])
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": f"✅ Procedure calc_total_sales executed for agent {agent_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ------------------------------------------------------------
# PL/SQL FUNCTION: Get Total Unpaid Commission for Agent
# ------------------------------------------------------------
@app.get("/get_total_commission/{agent_id}")
def get_total_commission(agent_id: int):
    """Execute PL/SQL function to return unpaid commission amount."""
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
    """Return all available properties for a given city."""
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
    """Fetch price of a property; show error if not found."""
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

# ---------------------------
# AGENT ENDPOINTS
# ---------------------------
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
        agents = [{"agent_id": r[0], "username": r[1], "license_no": r[2], "region": r[3]} for r in rows]
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
            # If role is not agent, update it to agent
            if current_role != 'agent':
                cursor.execute("UPDATE USERS SET ROLE = 'agent' WHERE USER_ID = :1", [user_id])
        else:
            # create user with role agent
            cursor.execute("SELECT NVL(MAX(USER_ID),0)+1 FROM USERS")
            user_id = cursor.fetchone()[0]
            cursor.execute("""
                INSERT INTO USERS (
                    USER_ID, USERNAME, PASSWORD_HASH, FULL_NAME, EMAIL, PHONE, ROLE, CREATED_AT
                ) VALUES (
                    :1, :2, 'default_hash', :3, :2 || '@example.com', '0000000000', 'agent', SYSDATE
                )
            """, (user_id, agent.username, agent.username))

        # Insert into agents table (create new AGENT_ID)
        cursor.execute("SELECT NVL(MAX(AGENT_ID),0)+1 FROM AGENTS")
        agent_id = cursor.fetchone()[0]

        cursor.execute("""
            INSERT INTO AGENTS (AGENT_ID, USER_ID, LICENSE_NO, REGION)
            VALUES (:1, :2, :3, :4)
        """, (agent_id, user_id, agent.license_no, agent.region))

        conn.commit()
        cursor.close()
        conn.close()
        return {"message": f"✅ Agent '{agent.username}' added (user_id={user_id})."}
    except oracledb.IntegrityError as ie:
        # If agent already exists in AGENTS, return helpful error
        raise HTTPException(status_code=400, detail="Agent already exists or duplicate key.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------
# PROPERTY ENDPOINTS
# ---------------------------
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

        # Find agent_id from username
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

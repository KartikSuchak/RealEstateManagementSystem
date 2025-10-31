-- =====================================================
-- REAL ESTATE DBMS - ADVANCED PL/SQL COMPONENTS
-- =====================================================

-- 1️⃣ TRIGGER: Auto-insert commission record after a sale
CREATE OR REPLACE TRIGGER trg_after_sale
AFTER INSERT ON sales
FOR EACH ROW
BEGIN
    INSERT INTO commissions (
        sale_id, agent_id, commission_percent, commission_amount, paid_status, created_at
    ) VALUES (
        :NEW.sale_id,
        :NEW.agent_id,
        2,  -- 2% commission
        (:NEW.sale_price * 0.02),
        'unpaid',
        SYSDATE
    );
END;
/

-- =====================================================
-- 2️⃣ CURSOR: Display available properties by city
DECLARE
    CURSOR cur_available_properties (p_city VARCHAR2) IS
        SELECT property_id, title, price, status
        FROM properties
        WHERE LOWER(city) = LOWER(p_city)
          AND status = 'available';
    
    v_property_id properties.property_id%TYPE;
    v_title       properties.title%TYPE;
    v_price       properties.price%TYPE;
    v_status      properties.status%TYPE;
BEGIN
    DBMS_OUTPUT.PUT_LINE('Available Properties in Nagpur:');
    OPEN cur_available_properties('Nagpur');
    LOOP
        FETCH cur_available_properties INTO v_property_id, v_title, v_price, v_status;
        EXIT WHEN cur_available_properties%NOTFOUND;
        DBMS_OUTPUT.PUT_LINE('Property ID: ' || v_property_id || ' | ' || v_title || ' | ₹' || v_price || ' | ' || v_status);
    END LOOP;
    CLOSE cur_available_properties;
END;
/

-- =====================================================
-- 3️⃣ STORED PROCEDURE: Calculate total sales by agent
CREATE OR REPLACE PROCEDURE calc_total_sales (
    p_agent_id IN NUMBER
) AS
    v_total_sales NUMBER := 0;
BEGIN
    SELECT NVL(SUM(sale_price), 0)
    INTO v_total_sales
    FROM sales
    WHERE agent_id = p_agent_id;

    DBMS_OUTPUT.PUT_LINE('Total Sales by Agent ' || p_agent_id || ' = ₹' || v_total_sales);
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        DBMS_OUTPUT.PUT_LINE('No sales found for Agent ID: ' || p_agent_id);
END;
/

-- Example Run:
-- EXEC calc_total_sales(1);

-- =====================================================
-- 4️⃣ FUNCTION: Get total commission earned by agent
CREATE OR REPLACE FUNCTION get_total_commission (
    p_agent_id IN NUMBER
) RETURN NUMBER AS
    v_total_commission NUMBER := 0;
BEGIN
    SELECT NVL(SUM(commission_amount), 0)
    INTO v_total_commission
    FROM commissions
    WHERE agent_id = p_agent_id
      AND paid_status = 'unpaid';

    RETURN v_total_commission;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 0;
END;
/

-- Example Run:
-- SELECT get_total_commission(1) FROM dual;

-- =====================================================
-- 5️⃣ EXCEPTION HANDLING: Test block for invalid property ID
DECLARE
    v_price properties.price%TYPE;
BEGIN
    SELECT price INTO v_price FROM properties WHERE property_id = 9999;
    DBMS_OUTPUT.PUT_LINE('Property Price: ₹' || v_price);
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        DBMS_OUTPUT.PUT_LINE('❌ Property not found.');
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('⚠️ Some other error occurred: ' || SQLERRM);
END;
/

-- =====================================================
-- 6 Cursor: list sales for an agent and compute totals / average
-- Cursor: show sales for a given agent, running total and average
SET SERVEROUTPUT ON SIZE 1000000
DECLARE
  CURSOR c_sales_by_agent (p_agent_id NUMBER) IS
    SELECT s.sale_id, s.property_id, s.sale_price, s.sale_date, u.full_name buyer_name
    FROM sales s
    JOIN users u ON s.buyer_id = u.user_id
    WHERE s.agent_id = p_agent_id
    ORDER BY s.sale_date;

  v_sale_id    sales.sale_id%TYPE;
  v_property   sales.property_id%TYPE;
  v_price      sales.sale_price%TYPE;
  v_date       sales.sale_date%TYPE;
  v_buyer      users.full_name%TYPE;

  v_count      NUMBER := 0;
  v_total      NUMBER := 0;
  v_avg        NUMBER := 0;
  p_agent_id   NUMBER := 1; -- change agent id as needed
BEGIN
  DBMS_OUTPUT.PUT_LINE('Sales report for Agent ID = ' || p_agent_id || CHR(10));

  OPEN c_sales_by_agent(p_agent_id);
  LOOP
    FETCH c_sales_by_agent INTO v_sale_id, v_property, v_price, v_date, v_buyer;
    EXIT WHEN c_sales_by_agent%NOTFOUND;

    v_count := v_count + 1;
    v_total := v_total + NVL(v_price,0);
    v_avg   := v_total / v_count;

    DBMS_OUTPUT.PUT_LINE('Sale #' || v_count
      || ' | sale_id=' || v_sale_id
      || ' | property_id=' || v_property
      || ' | buyer=' || NVL(v_buyer,'-')
      || ' | price=₹' || v_price
      || ' | date=' || TO_CHAR(v_date,'DD-MON-YYYY')
    );
  END LOOP;
  CLOSE c_sales_by_agent;

  DBMS_OUTPUT.PUT_LINE(CHR(10) || 'Total sales count: ' || v_count);
  DBMS_OUTPUT.PUT_LINE('Total sales amount: ₹' || v_total);
  IF v_count > 0 THEN
    DBMS_OUTPUT.PUT_LINE('Average sale price: ₹' || ROUND(v_avg,2));
  ELSE
    DBMS_OUTPUT.PUT_LINE('Average sale price: N/A (no sales)');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    DBMS_OUTPUT.PUT_LINE('Error: ' || SQLERRM);
END;
/

-- =====================================================

-- Trigger: Log property status changes
CREATE OR REPLACE TRIGGER trg_property_status_log
BEFORE UPDATE OF status ON properties
FOR EACH ROW
WHEN (OLD.status != NEW.status)
BEGIN
    INSERT INTO property_logs (property_id, old_status, new_status, changed_by)
    VALUES (:OLD.property_id, :OLD.status, :NEW.status, USER);
END;
/

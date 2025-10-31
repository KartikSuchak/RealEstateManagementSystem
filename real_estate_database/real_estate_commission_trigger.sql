
-- Trigger: Auto Commission Insertion after Sale
-- This trigger automatically inserts a commission record
-- into the COMMISSIONS table whenever a new sale is recorded.

CREATE OR REPLACE TRIGGER trg_after_sale_commission
AFTER INSERT ON sales
FOR EACH ROW
DECLARE
    v_commission_percent NUMBER := 2;  -- Default commission rate
    v_commission_amount  NUMBER;
BEGIN
    v_commission_amount := (:NEW.sale_price * v_commission_percent) / 100;

    INSERT INTO commissions (
        sale_id, agent_id, commission_percent, commission_amount, paid_status, created_at
    ) VALUES (
        :NEW.sale_id, :NEW.agent_id, v_commission_percent, v_commission_amount, 'unpaid', SYSDATE
    );

    DBMS_OUTPUT.PUT_LINE('Commission record inserted automatically.');
END;
/

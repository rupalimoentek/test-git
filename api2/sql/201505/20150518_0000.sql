-- change default for timezone
ALTER TABLE ct_user_detail ALTER COLUMN timezone SET DEFAULT 'EST';
UPDATE ct_user_detail SET timezone='EST' WHERE timezone='-0700';

-- org unit billing node identification
ALTER TABLE org_unit ADD COLUMN billing_node BOOLEAN NOT NULL DEFAULT false;

-- add additional count metric for a component
ALTER TABLE org_component_count ADD COLUMN secondary_total INT NOT NULL DEFAULT 0;
ALTER TABLE org_component_count ADD COLUMN count_start TIMESTAMP with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- add billing data
ALTER TABLE org_billing ADD COLUMN prev_invoice_date date;
ALTER TABLE org_billing ADD COLUMN prev_invoice_amount numeric(10,2);

-- correct sample data OU for billing
UPDATE org_unit SET billing_node=true WHERE org_unit_parent_id IS NULL AND (top_ou_id IS NULL OR top_ou_id=org_unit_id);
UPDATE subscription_component SET component_threshold_max=99999999 WHERE subscription_id=10 AND component_id=10;
UPDATE subscription_component SET component_threshold_max=99999999 WHERE subscription_id=9 AND component_id=10;
UPDATE subscription_component SET component_threshold_max=99999999 WHERE subscription_id=10 AND component_id=2;
UPDATE subscription_component SET component_threshold_max=99999999 WHERE subscription_id=9 AND component_id=2;
UPDATE subscription_component SET component_threshold_max=99999999 WHERE subscription_id=8 AND component_id=2;
UPDATE subscription_component SET component_threshold_max=99999999 WHERE subscription_id=10 AND component_id=8;
UPDATE subscription_component SET component_threshold_max=99999999 WHERE subscription_id=9 AND component_id=8;
UPDATE subscription_component SET component_threshold_max=99999999 WHERE subscription_id=8 AND component_id=8;
UPDATE subscription_component SET component_threshold_max=99999999 WHERE subscription_id=10 AND component_id=3;
UPDATE subscription_component SET component_threshold_max=99999999 WHERE subscription_id=9 AND component_id=3;
UPDATE subscription_component SET component_threshold_max=99999999 WHERE subscription_id=8 AND component_id=3;


DELETE FROM component_access WHERE component_id=8 AND scope_id=3;
DELETE FROM component_access WHERE component_id=9 AND scope_id=3;

-- remove all subscriptions
DELETE FROM org_account;
-- ===== SUBSCRIPTIONS ================
-- create subscriptions for top level OUs
INSERT INTO org_account (org_unit_id, subscription_id) (SELECT org_unit_id, '9' AS subscription_id FROM org_unit WHERE org_unit_parent_id IS NULL);
-- create subscriptions for second level OUs
INSERT INTO org_account (org_unit_id, subscription_id)
    (SELECT org_unit_id, '9' AS subscription_id FROM org_unit WHERE org_unit_parent_id IN
        (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IS NULL)
    );
-- create subscriptions for third level OUs
INSERT INTO org_account (org_unit_id, subscription_id)
    (SELECT org_unit_id, '9' AS subscription_id FROM org_unit WHERE org_unit_parent_id IN
         (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IN
              (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IS NULL)
         )
    );

-- remove all OU count records
DELETE FROM org_component_count;
-- ===== USER COUNT ================
-- create user count record for top level OUs
INSERT INTO org_component_count (org_unit_id, component_id) (SELECT org_unit_id, '3' AS component_id FROM org_unit WHERE org_unit_parent_id IS NULL);
-- create user count for second level OUs
INSERT INTO org_component_count (org_unit_id, component_id)
    (SELECT org_unit_id, '3' AS component_id FROM org_unit WHERE org_unit_parent_id IN
         (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IS NULL)
    );
-- create user count for third level OUs
INSERT INTO org_component_count (org_unit_id, component_id)
    (SELECT org_unit_id, '3' AS component_id FROM org_unit WHERE org_unit_parent_id IN
         (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IN
              (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IS NULL)
         )
    );

-- ===== CAMPAIGN COUNT ================
-- create campaign count record for top level OUs
INSERT INTO org_component_count (org_unit_id, component_id) (SELECT org_unit_id, '2' AS component_id FROM org_unit WHERE org_unit_parent_id IS NULL);
-- create campaign count for second level OUs
INSERT INTO org_component_count (org_unit_id, component_id)
    (SELECT org_unit_id, '2' AS component_id FROM org_unit WHERE org_unit_parent_id IN
         (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IS NULL)
    );
-- create campaign count for third level OUs
INSERT INTO org_component_count (org_unit_id, component_id)
    (SELECT org_unit_id, '2' AS component_id FROM org_unit WHERE org_unit_parent_id IN
         (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IN
              (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IS NULL)
         )
    );

-- ===== CALL ACTION COUNT ================
-- create call action count record for top level OUs
INSERT INTO org_component_count (org_unit_id, component_id) (SELECT org_unit_id, '10' AS component_id FROM org_unit WHERE org_unit_parent_id IS NULL);
-- create call action count for second level OUs
INSERT INTO org_component_count (org_unit_id, component_id)
    (SELECT org_unit_id, '10' AS component_id FROM org_unit WHERE org_unit_parent_id IN
         (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IS NULL)
    );
-- create call action count for third level OUs
INSERT INTO org_component_count (org_unit_id, component_id)
    (SELECT org_unit_id, '10' AS component_id FROM org_unit WHERE org_unit_parent_id IN
         (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IN
              (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IS NULL)
         )
    );

-- ===== PHONE NUMBERS COUNT ================
-- create phone number count record for top level OUs
INSERT INTO org_component_count (org_unit_id, component_id) (SELECT org_unit_id, '18' AS component_id FROM org_unit WHERE org_unit_parent_id IS NULL);
-- create phone number count for second level OUs
INSERT INTO org_component_count (org_unit_id, component_id)
    (SELECT org_unit_id, '18' AS component_id FROM org_unit WHERE org_unit_parent_id IN
         (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IS NULL)
    );
-- create phone number count for third level OUs
INSERT INTO org_component_count (org_unit_id, component_id)
    (SELECT org_unit_id, '18' AS component_id FROM org_unit WHERE org_unit_parent_id IN
         (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IN
              (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IS NULL)
         )
    );

-- ===== CALL FLOW COUNT ================
-- create call flow count record for top level OUs
INSERT INTO org_component_count (org_unit_id, component_id) (SELECT org_unit_id, '8' AS component_id FROM org_unit WHERE org_unit_parent_id IS NULL);
-- create call flow count for second level OUs
INSERT INTO org_component_count (org_unit_id, component_id)
    (SELECT org_unit_id, '8' AS component_id FROM org_unit WHERE org_unit_parent_id IN
         (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IS NULL)
    );
-- create call flow count for third level OUs
INSERT INTO org_component_count (org_unit_id, component_id)
    (SELECT org_unit_id, '8' AS component_id FROM org_unit WHERE org_unit_parent_id IN
         (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IN
              (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IS NULL)
         )
    );

ALTER TYPE callaction ADD VALUE 'analytic' BEFORE 'none';

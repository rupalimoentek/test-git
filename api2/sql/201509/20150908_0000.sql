-- force phone numbers to be unique
ALTER TABLE phone_number ADD UNIQUE (number);
ALTER TABLE phone_number ADD CONSTRAINT number_chk CHECK (number >= 1000000000 AND number <= 9999999999);

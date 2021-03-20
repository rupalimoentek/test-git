ALTER TABLE channel ADD COLUMN specific BOOLEAN NOT NULL DEFAULT false;

INSERT INTO channel (category, sub_category, cat_combo, specific) VALUES
    ('Google', 'Paid', 'Google:Paid', true),
    ('Google', 'Paid-Ad Ext.', 'Google:Paid-Ad Ext.', true),
    ('Google', 'Display', 'Google:Display', true),
    ('Google', 'Organic', 'Google:Organic', true),
    ('Bing', 'Paid', 'Bing:Paid', true),
    ('Bing', 'Paid-Ad Ext.', 'Bing:Paid-Ad Ext.', true),
    ('Bing', 'Display', 'Bing:Display', true),
    ('Bing', 'Organic', 'Bing:Organic', true),
    ('Yahoo', 'Paid', 'Yahoo:Paid', true),
    ('Yahoo', 'Display', 'Yahoo:Display', true),
    ('Yahoo', 'Organic', 'Yahoo:Organic', true),
    ('Facebook', 'Social', 'Facebook:Social', true),
    ('Facebook', 'Paid', 'Facebook:Paid', true),
    ('Facebook', 'Display', 'Facebook:Display', true),
    ('Google+', 'Social', 'Google+:Social', true),
    ('Linkedin', 'Social', 'Linkedin:Social', true),
    ('Linkedin', 'Paid', 'Linkedin:Paid', true),
    ('Twitter', 'Social', 'Twitter:Social', true),
    ('Online', 'Email', 'Online:Email', true);
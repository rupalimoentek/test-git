ALTER TABLE public.default_dni_setting 
DROP COLUMN share_with_subgroup


ALTER TABLE default_org_setting ADD COLUMN share_with_subgroup boolean 
ALTER TABLE public.default_org_setting ALTER COLUMN share_with_subgroup SET DEFAULT false;

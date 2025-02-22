-- Function to list all tables
CREATE OR REPLACE FUNCTION list_all_tables()
RETURNS TABLE (
  table_name text,
  table_schema text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.table_name::text,
    i.table_schema::text
  FROM information_schema.tables i
  WHERE i.table_schema IN ('public', 'auth')
  AND i.table_type = 'BASE TABLE'
  ORDER BY i.table_schema, i.table_name;
END;
$$;

-- Call the function to list tables
SELECT * FROM list_all_tables();
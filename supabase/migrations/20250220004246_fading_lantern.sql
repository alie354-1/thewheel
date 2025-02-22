-- Create a view to show all company stages and steps in a readable format
CREATE OR REPLACE VIEW company_stages_view AS
WITH RECURSIVE stage_hierarchy AS (
  -- Get all stages
  SELECT 
    s.id as stage_id,
    s.name as stage_name,
    s.description as stage_description,
    s.order_index as stage_order,
    s.required as stage_required,
    s.estimated_duration as stage_duration,
    st.id as step_id,
    st.name as step_name,
    st.description as step_description,
    st.order_index as step_order,
    st.required as step_required,
    st.estimated_duration as step_duration,
    st.tools,
    st.resources,
    st.checklist,
    st.tips
  FROM company_stages s
  LEFT JOIN company_stage_steps st ON s.id = st.stage_id
  ORDER BY s.order_index, st.order_index
)
SELECT * FROM stage_hierarchy;

-- Create function to get company progress with details
CREATE OR REPLACE FUNCTION get_company_progress(company_id uuid)
RETURNS TABLE (
  stage_name text,
  stage_order integer,
  step_name text,
  step_order integer,
  status text,
  completed_at timestamptz,
  notes text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    s.name as stage_name,
    s.order_index as stage_order,
    st.name as step_name,
    st.order_index as step_order,
    p.status,
    p.completed_at,
    p.notes
  FROM company_stages s
  LEFT JOIN company_stage_steps st ON s.id = st.stage_id
  LEFT JOIN company_progress p ON p.stage_id = s.id AND p.step_id = st.id AND p.company_id = $1
  ORDER BY s.order_index, st.order_index;
$$;

-- Create function to get stage completion stats
CREATE OR REPLACE FUNCTION get_stage_completion_stats(company_id uuid)
RETURNS TABLE (
  stage_name text,
  total_steps integer,
  completed_steps integer,
  completion_percentage numeric,
  estimated_remaining_days integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH stage_stats AS (
    SELECT 
      s.name as stage_name,
      COUNT(st.id) as total_steps,
      COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed_steps,
      ROUND(
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END)::numeric / 
        NULLIF(COUNT(st.id), 0) * 100,
        2
      ) as completion_percentage,
      -- Estimate remaining days based on estimated_duration
      -- Assuming format like '2-4 weeks' or '3-5 days'
      CASE 
        WHEN s.estimated_duration ~ 'weeks?' THEN
          REGEXP_REPLACE(s.estimated_duration, '[^0-9-]', '', 'g')::integer * 7
        ELSE
          REGEXP_REPLACE(s.estimated_duration, '[^0-9-]', '', 'g')::integer
      END as estimated_days
    FROM company_stages s
    LEFT JOIN company_stage_steps st ON s.id = st.stage_id
    LEFT JOIN company_progress p ON 
      p.stage_id = s.id AND 
      p.step_id = st.id AND 
      p.company_id = $1
    GROUP BY s.name, s.estimated_duration
  )
  SELECT 
    stage_name,
    total_steps,
    completed_steps,
    completion_percentage,
    CASE 
      WHEN completion_percentage < 100 THEN
        ROUND(estimated_days * (1 - (completion_percentage / 100)))::integer
      ELSE 0
    END as estimated_remaining_days
  FROM stage_stats
  ORDER BY completion_percentage DESC;
END;
$$;

-- Create function to get next recommended steps
CREATE OR REPLACE FUNCTION get_next_recommended_steps(company_id uuid)
RETURNS TABLE (
  stage_name text,
  step_name text,
  description text,
  required boolean,
  estimated_duration text,
  tools jsonb,
  resources jsonb
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH current_progress AS (
    SELECT 
      s.id as stage_id,
      s.order_index as stage_order,
      st.id as step_id,
      st.order_index as step_order,
      p.status
    FROM company_stages s
    LEFT JOIN company_stage_steps st ON s.id = st.stage_id
    LEFT JOIN company_progress p ON 
      p.stage_id = s.id AND 
      p.step_id = st.id AND 
      p.company_id = $1
    WHERE p.status IS NULL OR p.status IN ('not_started', 'in_progress')
    ORDER BY s.order_index, st.order_index
    LIMIT 5
  )
  SELECT 
    s.name as stage_name,
    st.name as step_name,
    st.description,
    st.required,
    st.estimated_duration,
    st.tools,
    st.resources
  FROM current_progress cp
  JOIN company_stages s ON s.id = cp.stage_id
  JOIN company_stage_steps st ON st.id = cp.step_id
  ORDER BY s.order_index, st.order_index;
$$;

-- Create function to get stage dependencies
CREATE OR REPLACE FUNCTION get_stage_dependencies(stage_id uuid)
RETURNS TABLE (
  required_stage_name text,
  required_step_name text,
  dependency_type text,
  status text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH RECURSIVE stage_deps AS (
    -- Get direct dependencies
    SELECT 
      s.id as stage_id,
      s.name as stage_name,
      st.id as step_id,
      st.name as step_name,
      'required' as dependency_type,
      1 as level
    FROM company_stages s
    JOIN company_stage_steps st ON s.id = st.stage_id
    WHERE s.id = $1 AND st.required = true
    
    UNION
    
    -- Get indirect dependencies
    SELECT 
      s2.id,
      s2.name,
      st2.id,
      st2.name,
      'recommended' as dependency_type,
      d.level + 1
    FROM stage_deps d
    JOIN company_stages s2 ON s2.order_index < (
      SELECT order_index FROM company_stages WHERE id = d.stage_id
    )
    JOIN company_stage_steps st2 ON st2.stage_id = s2.id
    WHERE d.level < 3  -- Limit recursion depth
  )
  SELECT 
    d.stage_name as required_stage_name,
    d.step_name as required_step_name,
    d.dependency_type,
    COALESCE(p.status, 'not_started') as status
  FROM stage_deps d
  LEFT JOIN company_progress p ON p.stage_id = d.stage_id AND p.step_id = d.step_id
  ORDER BY d.level, d.stage_name, d.step_name;
$$;

-- Grant access to the view and functions
GRANT SELECT ON company_stages_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_company_progress TO authenticated;
GRANT EXECUTE ON FUNCTION get_stage_completion_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_recommended_steps TO authenticated;
GRANT EXECUTE ON FUNCTION get_stage_dependencies TO authenticated;
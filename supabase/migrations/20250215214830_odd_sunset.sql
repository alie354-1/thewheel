-- Drop and recreate standup_tasks table with all required columns
DROP TABLE IF EXISTS standup_tasks CASCADE;

CREATE TABLE standup_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  standup_entry_id uuid REFERENCES standup_entries(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  category text NOT NULL DEFAULT 'personal',
  task_type text NOT NULL DEFAULT 'Other' CHECK (task_type IN (
    'Feature Development',
    'Bug Fix',
    'Documentation',
    'Research',
    'Design',
    'Planning',
    'Marketing',
    'Sales',
    'Customer Support',
    'Infrastructure',
    'Testing',
    'Analytics',
    'Process Improvement',
    'Team Coordination',
    'Other'
  )),
  estimated_hours numeric DEFAULT 1,
  due_date date NOT NULL,
  assigned_to uuid REFERENCES auth.users(id),
  completed_at timestamptz,
  ai_suggestions jsonb DEFAULT '{
    "implementation_tips": [],
    "potential_challenges": [],
    "success_metrics": [],
    "resources": [
      {
        "title": "",
        "url": "",
        "type": "",
        "description": ""
      }
    ],
    "learning_resources": [
      {
        "title": "",
        "url": "",
        "type": "",
        "platform": "",
        "description": ""
      }
    ],
    "tools": [
      {
        "name": "",
        "url": "",
        "category": "",
        "description": ""
      }
    ]
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE standup_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own standup tasks"
  ON standup_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM standup_entries
      WHERE id = standup_tasks.standup_entry_id
      AND user_id = auth.uid()
    ) OR
    assigned_to = auth.uid() OR
    category = 'company'
  );

CREATE POLICY "Users can create their own standup tasks"
  ON standup_tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM standup_entries
      WHERE id = standup_tasks.standup_entry_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own standup tasks"
  ON standup_tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM standup_entries
      WHERE id = standup_tasks.standup_entry_id
      AND user_id = auth.uid()
    ) OR
    assigned_to = auth.uid()
  );

-- Create indexes
CREATE INDEX idx_standup_tasks_entry_id ON standup_tasks(standup_entry_id);
CREATE INDEX idx_standup_tasks_category ON standup_tasks(category);
CREATE INDEX idx_standup_tasks_status ON standup_tasks(status);
CREATE INDEX idx_standup_tasks_priority ON standup_tasks(priority);
CREATE INDEX idx_standup_tasks_task_type ON standup_tasks(task_type);
CREATE INDEX idx_standup_tasks_assigned_to ON standup_tasks(assigned_to);
CREATE INDEX idx_standup_tasks_due_date ON standup_tasks(due_date);
CREATE INDEX idx_standup_tasks_ai_suggestions ON standup_tasks USING gin(ai_suggestions);

-- Create trigger to update completed_at
CREATE OR REPLACE FUNCTION update_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
  ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating completed_at
DROP TRIGGER IF EXISTS update_task_completed_at ON standup_tasks;
CREATE TRIGGER update_task_completed_at
  BEFORE UPDATE ON standup_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_completed_at();
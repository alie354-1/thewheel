-- Drop and recreate ai_suggestions column with flat structure
ALTER TABLE standup_tasks
DROP COLUMN IF EXISTS ai_suggestions;

ALTER TABLE standup_tasks
ADD COLUMN implementation_tips text[] DEFAULT '{}',
ADD COLUMN potential_challenges text[] DEFAULT '{}',
ADD COLUMN success_metrics text[] DEFAULT '{}',
ADD COLUMN resources jsonb DEFAULT '[]',
ADD COLUMN learning_resources jsonb DEFAULT '[]',
ADD COLUMN tools jsonb DEFAULT '[]';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_standup_tasks_implementation_tips ON standup_tasks USING gin(implementation_tips);
CREATE INDEX IF NOT EXISTS idx_standup_tasks_potential_challenges ON standup_tasks USING gin(potential_challenges);
CREATE INDEX IF NOT EXISTS idx_standup_tasks_success_metrics ON standup_tasks USING gin(success_metrics);
CREATE INDEX IF NOT EXISTS idx_standup_tasks_resources ON standup_tasks USING gin(resources);
CREATE INDEX IF NOT EXISTS idx_standup_tasks_learning_resources ON standup_tasks USING gin(learning_resources);
CREATE INDEX IF NOT EXISTS idx_standup_tasks_tools ON standup_tasks USING gin(tools);
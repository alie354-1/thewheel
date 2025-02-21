-- Drop existing columns if they exist
DO $$ BEGIN
    -- Drop existing columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'standup_tasks' AND column_name = 'ai_suggestions') THEN
        ALTER TABLE standup_tasks DROP COLUMN ai_suggestions;
    END IF;
END $$;

-- Add individual columns for AI suggestions data
ALTER TABLE standup_tasks
ADD COLUMN IF NOT EXISTS implementation_tips text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS potential_challenges text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS success_metrics text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS resources jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS learning_resources jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS tools jsonb DEFAULT '[]';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_standup_tasks_implementation_tips ON standup_tasks USING gin(implementation_tips);
CREATE INDEX IF NOT EXISTS idx_standup_tasks_potential_challenges ON standup_tasks USING gin(potential_challenges);
CREATE INDEX IF NOT EXISTS idx_standup_tasks_success_metrics ON standup_tasks USING gin(success_metrics);
CREATE INDEX IF NOT EXISTS idx_standup_tasks_resources ON standup_tasks USING gin(resources);
CREATE INDEX IF NOT EXISTS idx_standup_tasks_learning_resources ON standup_tasks USING gin(learning_resources);
CREATE INDEX IF NOT EXISTS idx_standup_tasks_tools ON standup_tasks USING gin(tools);
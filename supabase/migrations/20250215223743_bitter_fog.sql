-- First check if columns exist and drop them if they do
DO $$ 
BEGIN
    -- Drop existing columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'standup_tasks' AND column_name = 'ai_suggestions') THEN
        ALTER TABLE standup_tasks DROP COLUMN ai_suggestions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'standup_tasks' AND column_name = 'implementation_tips') THEN
        ALTER TABLE standup_tasks DROP COLUMN implementation_tips;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'standup_tasks' AND column_name = 'potential_challenges') THEN
        ALTER TABLE standup_tasks DROP COLUMN potential_challenges;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'standup_tasks' AND column_name = 'success_metrics') THEN
        ALTER TABLE standup_tasks DROP COLUMN success_metrics;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'standup_tasks' AND column_name = 'resources') THEN
        ALTER TABLE standup_tasks DROP COLUMN resources;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'standup_tasks' AND column_name = 'learning_resources') THEN
        ALTER TABLE standup_tasks DROP COLUMN learning_resources;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'standup_tasks' AND column_name = 'tools') THEN
        ALTER TABLE standup_tasks DROP COLUMN tools;
    END IF;
END $$;

-- Add columns with proper defaults
ALTER TABLE standup_tasks
ADD COLUMN implementation_tips text[] DEFAULT '{}',
ADD COLUMN potential_challenges text[] DEFAULT '{}',
ADD COLUMN success_metrics text[] DEFAULT '{}',
ADD COLUMN resources jsonb DEFAULT '[]',
ADD COLUMN learning_resources jsonb DEFAULT '[]',
ADD COLUMN tools jsonb DEFAULT '[]';

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_standup_tasks_implementation_tips;
DROP INDEX IF EXISTS idx_standup_tasks_potential_challenges;
DROP INDEX IF EXISTS idx_standup_tasks_success_metrics;
DROP INDEX IF EXISTS idx_standup_tasks_resources;
DROP INDEX IF EXISTS idx_standup_tasks_learning_resources;
DROP INDEX IF EXISTS idx_standup_tasks_tools;

-- Create indexes for better query performance
CREATE INDEX idx_standup_tasks_implementation_tips ON standup_tasks USING gin(implementation_tips);
CREATE INDEX idx_standup_tasks_potential_challenges ON standup_tasks USING gin(potential_challenges);
CREATE INDEX idx_standup_tasks_success_metrics ON standup_tasks USING gin(success_metrics);
CREATE INDEX idx_standup_tasks_resources ON standup_tasks USING gin(resources);
CREATE INDEX idx_standup_tasks_learning_resources ON standup_tasks USING gin(learning_resources);
CREATE INDEX idx_standup_tasks_tools ON standup_tasks USING gin(tools);
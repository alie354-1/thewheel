-- Drop existing columns if they exist
DO $$ BEGIN
    -- Drop existing columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'standup_tasks' AND column_name = 'ai_suggestions') THEN
        -- Extract data from jsonb column before dropping it
        UPDATE standup_tasks
        SET 
            implementation_tips = COALESCE((ai_suggestions->>'implementation_tips')::text[], '{}'),
            potential_challenges = COALESCE((ai_suggestions->>'potential_challenges')::text[], '{}'),
            success_metrics = COALESCE((ai_suggestions->>'success_metrics')::text[], '{}'),
            resources = COALESCE((ai_suggestions->>'resources')::jsonb, '[]'),
            learning_resources = COALESCE((ai_suggestions->>'learning_resources')::jsonb, '[]'),
            tools = COALESCE((ai_suggestions->>'tools')::jsonb, '[]')
        WHERE ai_suggestions IS NOT NULL;
        
        -- Drop the column after data migration
        ALTER TABLE standup_tasks DROP COLUMN ai_suggestions;
    END IF;
END $$;

-- Ensure all required columns exist with proper defaults
DO $$ 
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'standup_tasks' AND column_name = 'implementation_tips') THEN
        ALTER TABLE standup_tasks ADD COLUMN implementation_tips text[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'standup_tasks' AND column_name = 'potential_challenges') THEN
        ALTER TABLE standup_tasks ADD COLUMN potential_challenges text[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'standup_tasks' AND column_name = 'success_metrics') THEN
        ALTER TABLE standup_tasks ADD COLUMN success_metrics text[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'standup_tasks' AND column_name = 'resources') THEN
        ALTER TABLE standup_tasks ADD COLUMN resources jsonb DEFAULT '[]';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'standup_tasks' AND column_name = 'learning_resources') THEN
        ALTER TABLE standup_tasks ADD COLUMN learning_resources jsonb DEFAULT '[]';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'standup_tasks' AND column_name = 'tools') THEN
        ALTER TABLE standup_tasks ADD COLUMN tools jsonb DEFAULT '[]';
    END IF;
END $$;

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
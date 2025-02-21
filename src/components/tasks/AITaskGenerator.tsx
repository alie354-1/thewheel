import React, { useState } from 'react';
import { Brain, RotateCw } from 'lucide-react';
import { generateTasks } from '../../lib/openai';
import { useAuthStore } from '../../lib/store';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  category: string;
  task_type: string;
  estimated_hours: number;
  due_date: string;
  ai_suggestions?: {
    implementation_tips: string[];
    potential_challenges: string[];
    success_metrics: string[];
    resources?: any[];
    learning_resources?: any[];
    tools?: any[];
  };
}

interface AITaskGeneratorProps {
  standupEntry: {
    accomplished: string;
    working_on: string;
    blockers: string;
    goals: string;
  };
  onTasksGenerated: (tasks: Task[]) => void;
}

const AITaskGenerator: React.FC<AITaskGeneratorProps> = ({ standupEntry, onTasksGenerated }) => {
  const { user } = useAuthStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateTasks = async () => {
    if (!user) return;
    setIsGenerating(true);
    setError('');

    try {
      const { tasks } = await generateTasks(standupEntry, user.id);
      onTasksGenerated(tasks);
    } catch (error: any) {
      console.error('Error generating tasks:', error);
      setError(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mb-6">
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <button
        onClick={handleGenerateTasks}
        disabled={isGenerating}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <RotateCw className="h-4 w-4 mr-2 animate-spin" />
            Generating Tasks...
          </>
        ) : (
          <>
            <Brain className="h-4 w-4 mr-2" />
            Generate AI Tasks
          </>
        )}
      </button>
    </div>
  );
};

export default AITaskGenerator;
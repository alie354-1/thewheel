import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import TaskForm from './TaskForm';

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

interface ManualTaskCreationProps {
  onTaskCreated: (task: Partial<Task>) => void;
  category?: string;
}

const ManualTaskCreation: React.FC<ManualTaskCreationProps> = ({ onTaskCreated, category = 'personal' }) => {
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = (task: Partial<Task>) => {
    onTaskCreated({ ...task, category });
    setIsCreating(false);
  };

  if (isCreating) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Create New Task</h3>
          <button
            onClick={() => setIsCreating(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <TaskForm
          onSubmit={handleSubmit}
          onCancel={() => setIsCreating(false)}
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsCreating(true)}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
    >
      <Plus className="h-4 w-4 mr-2" />
      Create New Task
    </button>
  );
};

export default ManualTaskCreation;
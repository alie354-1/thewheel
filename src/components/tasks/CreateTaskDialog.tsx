import React, { useState } from 'react';
import { X } from 'lucide-react';
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

interface CreateTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: (task: Partial<Task>) => void;
  category?: string;
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  isOpen,
  onClose,
  onTaskCreated,
  category = 'personal'
}) => {
  if (!isOpen) return null;

  const handleSubmit = (task: Partial<Task>) => {
    onTaskCreated({ ...task, category });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />

        {/* Dialog */}
        <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Create New Task</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <TaskForm
              onSubmit={handleSubmit}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskDialog;
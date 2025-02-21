import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, ChevronRight } from 'lucide-react';

interface TaskPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isCompanyView?: boolean;
  standupEntry: {
    accomplished: string;
    working_on: string;
    blockers: string;
    goals: string;
  };
}

export default function TaskPromptDialog({ isOpen, onClose, isCompanyView = false, standupEntry }: TaskPromptDialogProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleGenerateTasks = () => {
    navigate(isCompanyView ? '/tasks/new/company' : '/tasks/new', {
      state: { standupEntry }
    });
    onClose();
  };

  const handleSkip = () => {
    navigate('/dashboard');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />

        {/* Dialog */}
        <div className="relative w-full max-w-md rounded-lg bg-white shadow-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Generate Tasks
              </h3>
              <button
                onClick={onClose}
                className="rounded-full p-1 text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Would you like to generate tasks based on your update? Our AI can help create task suggestions aligned with your goals and current work.
            </p>

            <div className="space-y-4">
              <button
                onClick={handleGenerateTasks}
                className="w-full inline-flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <Plus className="h-4 w-4 text-gray-400 mr-3" />
                  Generate Tasks
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>

              <button
                onClick={handleSkip}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
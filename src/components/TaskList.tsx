import React, { useState } from 'react';
import TaskItem from './TaskItem';

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
  implementation_tips: string[];
  potential_challenges: string[];
  success_metrics: string[];
  resources: {
    title: string;
    url: string;
    type: string;
    description: string;
  }[];
  learning_resources: {
    title: string;
    url: string;
    type: string;
    platform: string;
    description: string;
  }[];
  tools: {
    name: string;
    url: string;
    category: string;
    description: string;
  }[];
}

interface TaskListProps {
  tasks: Task[];
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  onAddTask?: (task: Task) => void;
  onRemoveTask?: (task: Task) => void;
  suggestedTasks?: boolean;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks = [], // Provide default empty array
  onUpdateTask,
  onAddTask,
  onRemoveTask,
  suggestedTasks = false
}) => {
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, Record<string, boolean>>>({});

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const toggleSection = (taskId: string, section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [taskId]: {
        ...(prev[taskId] || {}),
        [section]: !(prev[taskId]?.[section])
      }
    }));
  };

  // Return early if no tasks
  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-sm text-gray-500">No tasks available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onUpdateTask={onUpdateTask}
          onRemoveTask={onRemoveTask}
          onAddTask={onAddTask}
          isExpanded={expandedTasks[task.id] || false}
          onToggleExpand={() => toggleTask(task.id)}
          expandedSections={expandedSections[task.id] || {}}
          onToggleSection={(section) => toggleSection(task.id, section)}
          suggestedTask={suggestedTasks}
        />
      ))}
    </div>
  );
};

export default TaskList;
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Clock, CheckCircle, AlertCircle, Filter, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import TaskList from './TaskList';
import CreateTaskDialog from './tasks/CreateTaskDialog';

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

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  highPriority: number;
  estimatedHours: number;
  completedHours: number;
}

interface TaskManagerProps {
  category?: string;
  showCompleted?: boolean;
}

const TaskManager: React.FC<TaskManagerProps> = ({
  category = 'personal',
  showCompleted = false
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    overdue: 0,
    highPriority: 0,
    estimatedHours: 0,
    completedHours: 0
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortField, setSortField] = useState<keyof Task>('due_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: [] as string[],
    priority: [] as string[],
    type: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [category]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [tasks, filters, sortField, sortDirection, showCompleted]);

  const loadTasks = async () => {
    try {
      let query = supabase
        .from('standup_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (taskList: Task[]) => {
    const now = new Date();
    const stats: TaskStats = {
      total: taskList.length,
      completed: taskList.filter(t => t.status === 'completed').length,
      inProgress: taskList.filter(t => t.status === 'in_progress').length,
      pending: taskList.filter(t => t.status === 'pending').length,
      overdue: taskList.filter(t => 
        t.status !== 'completed' && 
        new Date(t.due_date) < now
      ).length,
      highPriority: taskList.filter(t => t.priority === 'high').length,
      estimatedHours: taskList.reduce((sum, t) => sum + (t.estimated_hours || 0), 0),
      completedHours: taskList
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.estimated_hours || 0), 0)
    };
    setStats(stats);
  };

  const applyFiltersAndSort = () => {
    let filtered = [...tasks];

    // Apply status filter
    if (!showCompleted) {
      filtered = filtered.filter(task => task.status !== 'completed');
    }

    // Apply custom filters
    if (filters.status.length > 0) {
      filtered = filtered.filter(task => filters.status.includes(task.status));
    }
    if (filters.priority.length > 0) {
      filtered = filtered.filter(task => filters.priority.includes(task.priority));
    }
    if (filters.type.length > 0) {
      filtered = filtered.filter(task => filters.type.includes(task.task_type));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'due_date') {
        comparison = new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime();
      } else {
        comparison = String(a[sortField]).localeCompare(String(b[sortField]));
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredTasks(filtered);
    calculateStats(filtered);
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('standup_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, ...updates } : task
        )
      );
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleCreateTask = async (task: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('standup_tasks')
        .insert([{
          ...task,
          category
        }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setTasks(prev => [data, ...prev]);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const toggleSort = (field: keyof Task) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleFilter = (type: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }));
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Loading tasks...</p>
      </div>
    );
  }

  // Don't render anything if there are no tasks and the component is not expanded
  if (!isLoading && tasks.length === 0 && !isExpanded) {
    return null;
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center text-lg font-medium text-gray-900"
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 mr-2" />
            ) : (
              <ChevronRight className="h-5 w-5 mr-2" />
            )}
            Tasks
          </button>
          
          {/* Collapsed View Stats */}
          {!isExpanded && tasks.length > 0 && (
            <div className="ml-6 flex items-center space-x-6">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-yellow-500 mr-1.5" />
                <span className="text-sm text-gray-600">{stats.inProgress}</span>
              </div>
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-1.5" />
                <span className="text-sm text-gray-600">{stats.overdue}</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />
                <span className="text-sm text-gray-600">{stats.completed}</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </button>
        </div>

        {/* Expanded View Content */}
        {isExpanded && (
          <>
            {/* Stats */}
            <div className="mt-4 grid grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-blue-800">Total Tasks</div>
                <div className="mt-1 text-2xl font-semibold text-blue-900">{stats.total}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-green-800">Completed</div>
                <div className="mt-1 text-2xl font-semibold text-green-900">{stats.completed}</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-yellow-800">In Progress</div>
                <div className="mt-1 text-2xl font-semibold text-yellow-900">{stats.inProgress}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-red-800">Overdue</div>
                <div className="mt-1 text-2xl font-semibold text-red-900">{stats.overdue}</div>
              </div>
            </div>

            {/* Filters Toggle */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Status</h4>
                    <div className="flex flex-wrap gap-2">
                      {['pending', 'in_progress', 'completed'].map(status => (
                        <button
                          key={status}
                          onClick={() => toggleFilter('status', status)}
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                            filters.status.includes(status)
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {status === 'completed' && <CheckCircle className="h-4 w-4 mr-1" />}
                          {status === 'in_progress' && <Clock className="h-4 w-4 mr-1" />}
                          {status === 'pending' && <AlertCircle className="h-4 w-4 mr-1" />}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Priority</h4>
                    <div className="flex flex-wrap gap-2">
                      {['low', 'medium', 'high'].map(priority => (
                        <button
                          key={priority}
                          onClick={() => toggleFilter('priority', priority)}
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                            filters.priority.includes(priority)
                              ? priority === 'high'
                                ? 'bg-red-100 text-red-800'
                                : priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Task List */}
      {isExpanded ? (
        <div className="p-6">
          {/* Sort Controls */}
          <div className="mb-4 flex items-center space-x-4">
            <button
              onClick={() => toggleSort('due_date')}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Due Date
              {sortField === 'due_date' && (
                sortDirection === 'asc' ? (
                  <ArrowUp className="h-4 w-4 ml-1" />
                ) : (
                  <ArrowDown className="h-4 w-4 ml-1" />
                )
              )}
            </button>
            <button
              onClick={() => toggleSort('priority')}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Priority
              {sortField === 'priority' && (
                sortDirection === 'asc' ? (
                  <ArrowUp className="h-4 w-4 ml-1" />
                ) : (
                  <ArrowDown className="h-4 w-4 ml-1" />
                )
              )}
            </button>
            <button
              onClick={() => toggleSort('status')}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Status
              {sortField === 'status' && (
                sortDirection === 'asc' ? (
                  <ArrowUp className="h-4 w-4 ml-1" />
                ) : (
                  <ArrowDown className="h-4 w-4 ml-1" />
                )
              )}
            </button>
          </div>

          {tasks.length > 0 ? (
            <TaskList
              tasks={filteredTasks}
              onUpdateTask={handleUpdateTask}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">No tasks yet. Create your first task to get started!</p>
            </div>
          )}
        </div>
      ) : (
        filteredTasks.length > 0 && (
          <div className="p-4">
            <TaskList
              tasks={filteredTasks.slice(0, 3)}
              onUpdateTask={handleUpdateTask}
            />
          </div>
        )
      )}

      {/* Create Task Dialog */}
      <CreateTaskDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onTaskCreated={handleCreateTask}
        category={category}
      />
    </div>
  );
};

export default TaskManager;
import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Edit, 
  Save, 
  X, 
  Book, 
  PenTool as Tool, 
  ExternalLink, 
  Video, 
  FileText, 
  Lightbulb,
  Brain,
  Plus,
  RotateCw,
  Trash2
} from 'lucide-react';
import { generateTasks } from '../../lib/openai';

interface Resource {
  title: string;
  url: string;
  type: string;
  description: string;
}

interface LearningResource {
  title: string;
  url: string;
  type: string;
  platform: string;
  description: string;
}

interface Tool {
  name: string;
  url: string;
  category: string;
  description: string;
}

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
  resources: Resource[];
  learning_resources: LearningResource[];
  tools: Tool[];
}

interface TaskItemProps {
  task: Task;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  onRemoveTask?: (task: Task) => void;
  onAddTask?: (task: Task) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  expandedSections: Record<string, boolean>;
  onToggleSection: (section: string) => void;
  suggestedTask?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onUpdateTask,
  onRemoveTask,
  onAddTask,
  isExpanded,
  onToggleExpand,
  expandedSections,
  onToggleSection,
  suggestedTask = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [editedTask, setEditedTask] = useState(task);

  const handleGenerateAISuggestions = async () => {
    setIsGeneratingAI(true);

    try {
      const { tasks } = await generateTasks({
        accomplished: '',
        working_on: editedTask.description,
        blockers: '',
        goals: editedTask.title
      }, '');

      if (tasks && tasks.length > 0) {
        const suggestions = tasks[0];
        setEditedTask(prev => ({
          ...prev,
          implementation_tips: suggestions.implementation_tips || [],
          potential_challenges: suggestions.potential_challenges || [],
          success_metrics: suggestions.success_metrics || [],
          resources: suggestions.resources || [],
          learning_resources: suggestions.learning_resources || [],
          tools: suggestions.tools || []
        }));
      }
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSave = () => {
    if (suggestedTask && onAddTask) {
      onAddTask(editedTask);
    } else if (onUpdateTask) {
      onUpdateTask(task.id, editedTask);
    }
    setIsEditing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileText className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'tool':
        return <Tool className="h-4 w-4" />;
      case 'template':
        return <FileText className="h-4 w-4" />;
      case 'guide':
        return <Book className="h-4 w-4" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white shadow rounded-lg p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={editedTask.title}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={editedTask.description}
              onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                value={editedTask.priority}
                onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as Task['priority'] })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                value={editedTask.due_date}
                onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {/* AI Suggestions Section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">AI Suggestions</h3>
              <button
                onClick={handleGenerateAISuggestions}
                disabled={isGeneratingAI}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {isGeneratingAI ? (
                  <>
                    <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Generate Suggestions
                  </>
                )}
              </button>
            </div>

            {/* Display AI suggestions sections */}
            {editedTask.implementation_tips?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Implementation Tips</h4>
                <ul className="space-y-1">
                  {editedTask.implementation_tips.map((tip, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="mr-2">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {editedTask.potential_challenges?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Potential Challenges</h4>
                <ul className="space-y-1">
                  {editedTask.potential_challenges.map((challenge, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="mr-2">•</span>
                      {challenge}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {editedTask.success_metrics?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Success Metrics</h4>
                <ul className="space-y-1">
                  {editedTask.success_metrics.map((metric, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="mr-2">•</span>
                      {metric}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {editedTask.resources?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Resources</h4>
                <div className="space-y-2">
                  {editedTask.resources.map((resource, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                      <div className="flex-1">
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          {getResourceIcon(resource.type)}
                          <span className="ml-2">{resource.title}</span>
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                        <p className="text-xs text-gray-500 ml-6">
                          {resource.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {editedTask.learning_resources?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Learning Resources</h4>
                <div className="space-y-2">
                  {editedTask.learning_resources.map((resource, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                      <div className="flex-1">
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          <Book className="h-4 w-4 mr-2" />
                          {resource.title}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                        <p className="text-xs text-gray-500 ml-6">
                          {resource.platform} • {resource.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {editedTask.tools?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recommended Tools</h4>
                <div className="space-y-2">
                  {editedTask.tools.map((tool, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                      <div className="flex-1">
                        <a
                          href={tool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          <Tool className="h-4 w-4 mr-2" />
                          {tool.name}
                          <span className="ml-2 text-xs text-gray-500">({tool.category})</span>
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                        <p className="text-xs text-gray-500 ml-6">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setEditedTask(task);
                setIsEditing(false);
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {suggestedTask ? (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4">
        <div>
          <div className="flex items-center justify-between">
            <button
              onClick={onToggleExpand}
              className="flex items-center text-left flex-1"
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-900">{task.title}</p>
                {!isExpanded && (
                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                    <span>Type: {task.task_type}</span>
                    <span>•</span>
                    <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </button>

            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
              {suggestedTask && onAddTask && (
                <button
                  onClick={() => onAddTask(task)}
                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </button>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-400 hover:text-gray-500"
              >
                <Edit className="h-4 w-4" />
              </button>
              {!suggestedTask && onRemoveTask && (
                <button
                  onClick={() => onRemoveTask(task)}
                  className="p-1 text-gray-400 hover:text-gray-500"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {!suggestedTask && getStatusIcon(task.status)}
            </div>
          </div>

          {isExpanded && (
            <div className="mt-4 ml-7 space-y-4">
              <div>
                <p className="text-sm text-gray-900">{task.description}</p>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span>Type: {task.task_type}</span>
                  <span>•</span>
                  <span>Category: {task.category}</span>
                  <span>•</span>
                  <span>Estimated: {task.estimated_hours}h</span>
                  <span>•</span>
                  <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Implementation Tips */}
              {task.implementation_tips?.length > 0 && (
                <div>
                  <button
                    onClick={() => onToggleSection('tips')}
                    className="flex items-center text-sm font-medium text-gray-900"
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Implementation Tips
                    {expandedSections['tips'] ? (
                      <ChevronDown className="h-4 w-4 ml-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 ml-2" />
                    )}
                  </button>
                  {expandedSections['tips'] && (
                    <ul className="mt-2 space-y-1 ml-6">
                      {task.implementation_tips.map((tip, index) => (
                        <li key={index} className="text-sm text-gray-600">• {tip}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Resources */}
              {task.resources?.length > 0 && (
                <div>
                  <button
                    onClick={() => onToggleSection('resources')}
                    className="flex items-center text-sm font-medium text-gray-900"
                  >
                    <Book className="h-4 w-4 mr-2" />
                    Helpful Resources
                    {expandedSections['resources'] ? (
                      <ChevronDown className="h-4 w-4 ml-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 ml-2" />
                    )}
                  </button>
                  {expandedSections['resources'] && (
                    <div className="mt-2 space-y-2 ml-6">
                      {task.resources.map((resource, index) => (
                        <div key={index} className="space-y-1">
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                          >
                            {getResourceIcon(resource.type)}
                            <span className="ml-2">{resource.title}</span>
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                          <p className="text-xs text-gray-500 ml-6">
                            {resource.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Learning Resources */}
              {task.learning_resources?.length > 0 && (
                <div>
                  <button
                    onClick={() => onToggleSection('learning')}
                    className="flex items-center text-sm font-medium text-gray-900"
                  >
                    <Book className="h-4 w-4 mr-2" />
                    Learning Resources
                    {expandedSections['learning'] ? (
                      <ChevronDown className="h-4 w-4 ml-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 ml-2" />
                    )}
                  </button>
                  {expandedSections['learning'] && (
                    <div className="mt-2 space-y-3 ml-6">
                      {task.learning_resources.map((resource, index) => (
                        <div key={index} className="space-y-1">
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                          >
                            {getResourceIcon(resource.type)}
                            <span className="ml-2">{resource.title}</span>
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                          <p className="text-xs text-gray-500 ml-6">
                            {resource.platform} • {resource.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tools */}
              {task.tools?.length > 0 && (
                <div>
                  <button
                    onClick={() => onToggleSection('tools')}
                    className="flex items-center text-sm font-medium text-gray-900"
                  >
                    <Tool className="h-4 w-4 mr-2" />
                    Recommended Tools
                    {expandedSections['tools'] ? (
                      <ChevronDown className="h-4 w-4 ml-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 ml-2" />
                    )}
                  </button>
                  {expandedSections['tools'] && (
                    <div className="mt-2 space-y-3 ml-6">
                      {task.tools.map((tool, index) => (
                        <div key={index} className="space-y-1">
                          <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                          >
                            <Tool className="h-4 w-4 mr-2" />
                            {tool.name}
                            <span className="ml-2 text-xs text-gray-500">({tool.category})</span>
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                          <p className="text-xs text-gray-500 ml-6">
                            {tool.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Status Control */}
              {!suggestedTask && onUpdateTask && (
                <div className="border-t border-gray-200 pt-4">
                  <select
                    value={task.status}
                    onChange={(e) => onUpdateTask(task.id, { status: e.target.value as Task['status'] })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
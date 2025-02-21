import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Plus,
  FileText,
  Link as LinkIcon,
  ExternalLink,
  ThumbsUp,
  MessageSquare,
  X,
  Rocket,
  Target,
  Users,
  DollarSign,
  Settings,
  Globe,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';

interface Stage {
  id: string;
  name: string;
  description: string;
  order_index: number;
  required: boolean;
  estimated_duration: string;
  resources: {
    title: string;
    url: string;
    type: string;
  }[];
}

interface Step {
  id: string;
  stage_id: string;
  name: string;
  description: string;
  order_index: number;
  required: boolean;
  estimated_duration: string;
  tools: {
    name: string;
    url: string;
    type: string;
  }[];
  resources: {
    title: string;
    url: string;
    type: string;
  }[];
  checklist: string[];
  tips: string[];
}

interface Progress {
  id: string;
  stage_id: string;
  step_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  notes: string;
  attachments: {
    name: string;
    url: string;
    type: string;
  }[];
  completed_at: string | null;
}

interface Suggestion {
  id: string;
  step_id: string;
  user_id: string;
  title: string;
  description: string;
  is_public: boolean;
  upvotes: number;
}

interface CompanyStagesProps {
  company: {
    id: string;
    name: string;
    stage: string;
  } | null;
}

export default function CompanyStages({ company }: CompanyStagesProps) {
  const { user } = useAuthStore();
  const [stages, setStages] = useState<Stage[]>([]);
  const [steps, setSteps] = useState<Record<string, Step[]>>({});
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [suggestions, setSuggestions] = useState<Record<string, Suggestion[]>>({});
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (company) {
      loadStages();
    }
  }, [company]);

  const loadStages = async () => {
    try {
      // Load stages
      const { data: stages, error: stagesError } = await supabase
        .from('company_stages')
        .select('*')
        .order('order_index');

      if (stagesError) throw stagesError;

      if (stages) {
        setStages(stages);
        
        // Load steps for each stage
        const stepsPromises = stages.map(stage => 
          supabase
            .from('company_stage_steps')
            .select('*')
            .eq('stage_id', stage.id)
            .order('order_index')
        );

        const stepsResults = await Promise.all(stepsPromises);
        const stepsMap: Record<string, Step[]> = {};
        
        stepsResults.forEach((result, index) => {
          if (result.error) throw result.error;
          if (result.data) {
            stepsMap[stages[index].id] = result.data;
          }
        });

        setSteps(stepsMap);

        // Load progress
        if (company) {
          const { data: progress, error: progressError } = await supabase
            .from('company_progress')
            .select('*')
            .eq('company_id', company.id);

          if (progressError) throw progressError;

          if (progress) {
            const progressMap: Record<string, Progress> = {};
            progress.forEach(p => {
              progressMap[`${p.stage_id}_${p.step_id}`] = p;
            });
            setProgress(progressMap);
          }
        }

        // Load suggestions
        const { data: suggestions, error: suggestionsError } = await supabase
          .from('company_step_suggestions')
          .select('*')
          .eq('is_public', true);

        if (suggestionsError) throw suggestionsError;

        if (suggestions) {
          const suggestionsMap: Record<string, Suggestion[]> = {};
          suggestions.forEach(s => {
            if (!suggestionsMap[s.step_id]) {
              suggestionsMap[s.step_id] = [];
            }
            suggestionsMap[s.step_id].push(s);
          });
          setSuggestions(suggestionsMap);
        }

        // Expand first stage by default
        if (stages.length > 0) {
          setExpandedStages({ [stages[0].id]: true });
        }
      }
    } catch (error: any) {
      console.error('Error loading stages:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStage = (stageId: string) => {
    setExpandedStages(prev => ({
      ...prev,
      [stageId]: !prev[stageId]
    }));
  };

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const updateProgress = async (stageId: string, stepId: string, status: Progress['status'], notes?: string) => {
    if (!company) return;

    try {
      const key = `${stageId}_${stepId}`;
      const existing = progress[key];

      if (existing) {
        const { error } = await supabase
          .from('company_progress')
          .update({
            status,
            notes,
            completed_at: status === 'completed' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('company_progress')
          .insert({
            company_id: company.id,
            stage_id: stageId,
            step_id: stepId,
            status,
            notes,
            completed_at: status === 'completed' ? new Date().toISOString() : null
          });

        if (error) throw error;
      }

      await loadStages();
    } catch (error: any) {
      console.error('Error updating progress:', error);
      setError(error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Loading company stages...</p>
      </div>
    );
  }

  if (!stages.length) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No stages found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please contact an administrator to set up company stages.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {stages.map(stage => (
        <div key={stage.id} className="bg-white shadow rounded-lg overflow-hidden">
          {/* Stage Header */}
          <button
            onClick={() => toggleStage(stage.id)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center">
              {expandedStages[stage.id] ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">{stage.name}</h3>
                <p className="text-sm text-gray-500">{stage.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {stage.estimated_duration}
              </span>
              {stage.required && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Required
                </span>
              )}
            </div>
          </button>

          {/* Stage Content */}
          {expandedStages[stage.id] && (
            <div className="border-t border-gray-200">
              {steps[stage.id]?.map(step => (
                <div key={step.id} className="border-b border-gray-200 last:border-b-0">
                  <div className="px-6 py-4">
                    <button
                      onClick={() => toggleStep(step.id)}
                      className="w-full flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        {expandedSteps[step.id] ? (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-gray-900">{step.name}</h4>
                          <p className="text-sm text-gray-500">{step.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {progress[`${stage.id}_${step.id}`]?.status === 'completed' && (
                          <span className="inline-flex items-center text-green-600">
                            <CheckCircle className="h-5 w-5" />
                          </span>
                        )}
                        {progress[`${stage.id}_${step.id}`]?.status === 'in_progress' && (
                          <span className="inline-flex items-center text-yellow-600">
                            <Clock className="h-5 w-5" />
                          </span>
                        )}
                        {step.required && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Required
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Step Details */}
                    {expandedSteps[step.id] && (
                      <div className="mt-4 ml-8 space-y-4">
                        {/* Checklist */}
                        {step.checklist.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Checklist</h5>
                            <div className="space-y-2">
                              {step.checklist.map((item, index) => (
                                <div key={index} className="flex items-start">
                                  <input
                                    type="checkbox"
                                    checked={progress[`${stage.id}_${step.id}`]?.status === 'completed'}
                                    onChange={(e) => updateProgress(
                                      stage.id,
                                      step.id,
                                      e.target.checked ? 'completed' : 'in_progress'
                                    )}
                                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  />
                                  <span className="ml-3 text-sm text-gray-700">{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tools */}
                        {step.tools.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Tools</h5>
                            <div className="space-y-2">
                              {step.tools.map((tool, index) => (
                                <a
                                  key={index}
                                  href={tool.url}
                                  target={tool.type === 'internal' ? '_self' : '_blank'}
                                  rel="noopener noreferrer"
                                  className="flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                                >
                                  <LinkIcon className="h-4 w-4 mr-1" />
                                  {tool.name}
                                  {tool.type !== 'internal' && (
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                  )}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Resources */}
                        {step.resources.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Resources</h5>
                            <div className="space-y-2">
                              {step.resources.map((resource, index) => (
                                <a
                                  key={index}
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  {resource.title}
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tips */}
                        {step.tips.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Tips</h5>
                            <ul className="list-disc list-inside space-y-1">
                              {step.tips.map((tip, index) => (
                                <li key={index} className="text-sm text-gray-700">{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Progress Notes */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Notes</h5>
                          <textarea
                            value={progress[`${stage.id}_${step.id}`]?.notes || ''}
                            onChange={(e) => updateProgress(stage.id, step.id, 'in_progress', e.target.value)}
                            rows={3}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Add your notes about this step..."
                          />
                        </div>

                        {/* Step Actions */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => updateProgress(stage.id, step.id, 'skipped')}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Skip Step
                          </button>
                          <button
                            onClick={() => updateProgress(
                              stage.id,
                              step.id,
                              progress[`${stage.id}_${step.id}`]?.status === 'completed' ? 'in_progress' : 'completed'
                            )}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                          >
                            {progress[`${stage.id}_${step.id}`]?.status === 'completed' ? (
                              <>
                                <Clock className="h-4 w-4 mr-1" />
                                Mark In Progress
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Mark Complete
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
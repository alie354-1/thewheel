import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Lightbulb,
  Target,
  Users,
  DollarSign,
  BarChart3,
  Rocket,
  ChevronRight,
  Plus,
  Save,
  Brain,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { generateTasks } from '../../lib/openai';

interface Idea {
  id: string;
  title: string;
  stage: 'brainstorm' | 'concept' | 'validation' | 'planning' | 'execution';
  raw_idea: string;
  inspiration_source: string;
  initial_thoughts: string;
  market_opportunities: string;
  potential_challenges: string;
  problem_statement: string;
  target_audience: string;
  solution: string;
  unique_value: string;
  market_size: string;
  competition: string;
  business_model: string;
  go_to_market: string;
  resources_needed: string;
  next_steps: string;
  ai_feedback: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    suggestions: string[];
  };
  created_at: string;
  updated_at: string;
}

const stages = [
  {
    id: 'brainstorm',
    name: 'Brainstorm',
    description: 'Explore and refine raw ideas',
    icon: Brain,
    fields: ['raw_idea', 'inspiration_source', 'initial_thoughts', 'market_opportunities', 'potential_challenges']
  },
  {
    id: 'concept',
    name: 'Concept',
    description: 'Define the problem and initial solution',
    icon: Lightbulb,
    fields: ['problem_statement', 'solution', 'unique_value']
  },
  {
    id: 'validation',
    name: 'Validation',
    description: 'Validate market need and feasibility',
    icon: Target,
    fields: ['target_audience', 'market_size', 'competition']
  },
  {
    id: 'planning',
    name: 'Planning',
    description: 'Plan business model and go-to-market',
    icon: BarChart3,
    fields: ['business_model', 'go_to_market', 'resources_needed']
  },
  {
    id: 'execution',
    name: 'Execution',
    description: 'Define actionable next steps',
    icon: Rocket,
    fields: ['next_steps']
  }
];

export default function IdeaFlow() {
  const { user } = useAuthStore();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [currentIdea, setCurrentIdea] = useState<Idea | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      loadIdeas();
    }
  }, [user]);

  const loadIdeas = async () => {
    try {
      const { data: ideas, error } = await supabase
        .from('ideas')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setIdeas(ideas || []);
    } catch (error: any) {
      console.error('Error loading ideas:', error);
      setError(error.message);
    }
  };

  const createNewIdea = () => {
    const newIdea: Omit<Idea, 'id' | 'created_at' | 'updated_at'> = {
      title: 'New Idea',
      stage: 'brainstorm',
      raw_idea: '',
      inspiration_source: '',
      initial_thoughts: '',
      market_opportunities: '',
      potential_challenges: '',
      problem_statement: '',
      target_audience: '',
      solution: '',
      unique_value: '',
      market_size: '',
      competition: '',
      business_model: '',
      go_to_market: '',
      resources_needed: '',
      next_steps: '',
      ai_feedback: {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: [],
        suggestions: []
      }
    };
    setCurrentIdea(newIdea as Idea);
    setIsEditing(true);
  };

  const generateAIFeedback = async () => {
    if (!currentIdea) return;

    setIsGeneratingFeedback(true);
    setError('');

    try {
      const { feedback } = await generateTasks({
        accomplished: '',
        working_on: `
          Problem: ${currentIdea.problem_statement}
          Solution: ${currentIdea.solution}
          Target Audience: ${currentIdea.target_audience}
          Market Size: ${currentIdea.market_size}
          Competition: ${currentIdea.competition}
          Business Model: ${currentIdea.business_model}
          Go-to-Market: ${currentIdea.go_to_market}
          Resources Needed: ${currentIdea.resources_needed}
          Next Steps: ${currentIdea.next_steps}
        `,
        blockers: '',
        goals: currentIdea.unique_value
      }, user?.id || '');

      setCurrentIdea(prev => ({
        ...prev!,
        ai_feedback: {
          strengths: feedback.strengths || [],
          weaknesses: feedback.weaknesses || [],
          opportunities: feedback.opportunities || [],
          threats: feedback.threats || [],
          suggestions: feedback.suggestions || []
        }
      }));
    } catch (error: any) {
      console.error('Error generating feedback:', error);
      setError(error.message);
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const handleSave = async () => {
    if (!currentIdea || !user) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      if (currentIdea.id) {
        const { error } = await supabase
          .from('ideas')
          .update({
            ...currentIdea,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentIdea.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('ideas')
          .insert([{
            ...currentIdea,
            user_id: user.id
          }])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setCurrentIdea(data);
        }
      }

      setSuccess('Idea saved successfully!');
      loadIdeas();
    } catch (error: any) {
      console.error('Error saving idea:', error);
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const moveToNextStage = async () => {
    if (!currentIdea) return;

    const currentIndex = stages.findIndex(s => s.id === currentIdea.stage);
    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1].id as Idea['stage'];
      setCurrentIdea(prev => ({
        ...prev!,
        stage: nextStage
      }));
      await handleSave();
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link to="/idea-hub" className="mr-4 text-gray-400 hover:text-gray-500">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                <Lightbulb className="h-6 w-6 mr-2" />
                Idea Flow
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Refine your ideas into buildable concepts
              </p>
            </div>
          </div>
          <button
            onClick={createNewIdea}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Idea
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Ideas List */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Your Ideas</h2>
            <div className="space-y-4">
              {ideas.map((idea) => (
                <button
                  key={idea.id}
                  onClick={() => {
                    setCurrentIdea(idea);
                    setIsEditing(false);
                  }}
                  className={`w-full text-left p-4 rounded-lg border ${
                    currentIdea?.id === idea.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <h3 className="font-medium text-gray-900">{idea.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Stage: {idea.stage.charAt(0).toUpperCase() + idea.stage.slice(1)}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Updated {new Date(idea.updated_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Idea Editor */}
          <div className="lg:col-span-3">
            {currentIdea ? (
              <div className="bg-white shadow rounded-lg">
                {/* Stage Progress */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <nav aria-label="Progress">
                    <ol className="flex items-center">
                      {stages.map((stage, index) => (
                        <li
                          key={stage.id}
                          className={`${
                            index !== stages.length - 1 ? 'flex-1' : ''
                          } relative`}
                        >
                          <div className="flex items-center">
                            <div
                              className={`${
                                stage.id === currentIdea.stage
                                  ? 'border-2 border-indigo-600'
                                  : stages.findIndex(s => s.id === currentIdea.stage) > index
                                  ? 'bg-indigo-600'
                                  : 'bg-gray-200'
                              } rounded-full h-8 w-8 flex items-center justify-center`}
                            >
                              <stage.icon
                                className={`h-5 w-5 ${
                                  stage.id === currentIdea.stage
                                    ? 'text-indigo-600'
                                    : stages.findIndex(s => s.id === currentIdea.stage) > index
                                    ? 'text-white'
                                    : 'text-gray-400'
                                }`}
                              />
                            </div>
                            {index !== stages.length - 1 && (
                              <div
                                className={`flex-1 h-0.5 mx-2 ${
                                  stages.findIndex(s => s.id === currentIdea.stage) > index
                                    ? 'bg-indigo-600'
                                    : 'bg-gray-200'
                                }`}
                              />
                            )}
                          </div>
                          <div className="mt-2">
                            <span className="text-xs font-medium">
                              {stage.name}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </nav>
                </div>

                {/* Content */}
                <div className="p-6">
                  {error && (
                    <div className="mb-4 p-4 bg-red-50 rounded-md">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="mb-4 p-4 bg-green-50 rounded-md">
                      <p className="text-sm text-green-700">{success}</p>
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <input
                        type="text"
                        value={currentIdea.title}
                        onChange={(e) => setCurrentIdea(prev => ({
                          ...prev!,
                          title: e.target.value
                        }))}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>

                    {/* Stage-specific fields */}
                    {stages
                      .find(s => s.id === currentIdea.stage)
                      ?.fields.map(field => (
                        <div key={field}>
                          <label className="block text-sm font-medium text-gray-700">
                            {field.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </label>
                          <textarea
                            value={currentIdea[field as keyof Idea] as string}
                            onChange={(e) => setCurrentIdea(prev => ({
                              ...prev!,
                              [field]: e.target.value
                            }))}
                            disabled={!isEditing}
                            rows={4}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </div>
                      ))}

                    {/* AI Feedback */}
                    {currentIdea.ai_feedback && (
                      <div className="mt-6 bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                          <Brain className="h-4 w-4 mr-2" />
                          AI Analysis
                        </h3>
                        <div className="space-y-4">
                          {currentIdea.ai_feedback.strengths.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Strengths</h4>
                              <ul className="mt-2 list-disc list-inside text-sm text-gray-600">
                                {currentIdea.ai_feedback.strengths.map((strength, index) => (
                                  <li key={index}>{strength}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {currentIdea.ai_feedback.weaknesses.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Areas for Improvement</h4>
                              <ul className="mt-2 list-disc list-inside text-sm text-gray-600">
                                {currentIdea.ai_feedback.weaknesses.map((weakness, index) => (
                                  <li key={index}>{weakness}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {currentIdea.ai_feedback.opportunities.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Opportunities</h4>
                              <ul className="mt-2 list-disc list-inside text-sm text-gray-600">
                                {currentIdea.ai_feedback.opportunities.map((opportunity, index) => (
                                  <li key={index}>{opportunity}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {currentIdea.ai_feedback.threats.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Risks</h4>
                              <ul className="mt-2 list-disc list-inside text-sm text-gray-600">
                                {currentIdea.ai_feedback.threats.map((threat, index) => (
                                  <li key={index}>{threat}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {currentIdea.ai_feedback.suggestions.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Suggestions</h4>
                              <ul className="mt-2 list-disc list-inside text-sm text-gray-600">
                                {currentIdea.ai_feedback.suggestions.map((suggestion, index) => (
                                  <li key={index}>{suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between pt-4 border-t border-gray-200">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setIsEditing(!isEditing)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          {isEditing ? 'Cancel' : 'Edit'}
                        </button>
                        <button
                          onClick={generateAIFeedback}
                          disabled={isGeneratingFeedback}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <Brain className="h-4 w-4 mr-2" />
                          {isGeneratingFeedback ? 'Generating...' : 'Get AI Feedback'}
                        </button>
                        <Link
                          to="/idea-hub/cofounder-bot"
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Discuss with AI
                        </Link>
                      </div>
                      <div className="flex space-x-3">
                        {isEditing && (
                          <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                        )}
                        {!isEditing && (
                          <button
                            onClick={moveToNextStage}
                            disabled={currentIdea.stage === 'execution'}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                          >
                            Next Stage
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <Lightbulb className="h-12 w-12 text-gray-400 mx-auto" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No idea selected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select an existing idea or create a new one to get started
                </p>
                <div className="mt-6">
                  <button
                    onClick={createNewIdea}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Idea
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
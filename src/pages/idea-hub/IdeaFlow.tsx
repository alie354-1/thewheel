import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lightbulb,
  Brain,
  Target,
  Users,
  DollarSign,
  BarChart3,
  Rocket,
  ChevronRight,
  Plus,
  Save,
  MessageSquare,
  ArrowRight,
  X,
  Edit,
  Archive,
  Trash2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { generateTasks } from '../../lib/openai';

interface Idea {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'exploring' | 'validated' | 'archived';
  problem_statement: string;
  solution_concept: string;
  target_audience: string;
  unique_value: string;
  market_size: string;
  competitors: any[];
  market_trends: string[];
  revenue_streams: any[];
  cost_structure: any[];
  key_metrics: string[];
  channels: string[];
  assumptions: string[];
  validation_steps: any[];
  feedback_collected: any[];
  pivot_notes: string[];
  ai_feedback: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    suggestions: string[];
    market_insights: string[];
    validation_tips: string[];
  };
}

export default function IdeaFlow() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [currentIdea, setCurrentIdea] = useState<Idea | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('concept');

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
    const newIdea: Omit<Idea, 'id'> = {
      title: 'New Idea',
      description: '',
      status: 'draft',
      problem_statement: '',
      solution_concept: '',
      target_audience: '',
      unique_value: '',
      market_size: '',
      competitors: [],
      market_trends: [],
      revenue_streams: [],
      cost_structure: [],
      key_metrics: [],
      channels: [],
      assumptions: [],
      validation_steps: [],
      feedback_collected: [],
      pivot_notes: [],
      ai_feedback: {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: [],
        suggestions: [],
        market_insights: [],
        validation_tips: []
      }
    };
    setCurrentIdea(newIdea as Idea);
    setIsEditing(true);
    setActiveTab('concept');
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
          Solution: ${currentIdea.solution_concept}
          Target Audience: ${currentIdea.target_audience}
          Unique Value: ${currentIdea.unique_value}
          Market Size: ${currentIdea.market_size}
          Market Trends: ${currentIdea.market_trends.join(', ')}
          Revenue Model: ${JSON.stringify(currentIdea.revenue_streams)}
        `,
        blockers: '',
        goals: 'Validate and refine this business idea'
      }, user?.id || '');

      // Parse AI feedback into sections
      const aiInsights = {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: [],
        suggestions: [],
        market_insights: [],
        validation_tips: []
      };

      // Extract insights from feedback
      const sections = feedback.split('\n\n');
      sections.forEach(section => {
        if (section.includes('Strengths:')) {
          aiInsights.strengths = section.split('\n').slice(1).map(s => s.replace('• ', ''));
        } else if (section.includes('Weaknesses:')) {
          aiInsights.weaknesses = section.split('\n').slice(1).map(s => s.replace('• ', ''));
        } else if (section.includes('Opportunities:')) {
          aiInsights.opportunities = section.split('\n').slice(1).map(s => s.replace('• ', ''));
        } else if (section.includes('Threats:')) {
          aiInsights.threats = section.split('\n').slice(1).map(s => s.replace('• ', ''));
        } else if (section.includes('Suggestions:')) {
          aiInsights.suggestions = section.split('\n').slice(1).map(s => s.replace('• ', ''));
        } else if (section.includes('Market Insights:')) {
          aiInsights.market_insights = section.split('\n').slice(1).map(s => s.replace('• ', ''));
        } else if (section.includes('Validation Tips:')) {
          aiInsights.validation_tips = section.split('\n').slice(1).map(s => s.replace('• ', ''));
        }
      });

      setCurrentIdea(prev => ({
        ...prev!,
        ai_feedback: aiInsights
      }));

      setSuccess('AI feedback generated successfully!');
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

  const handleDelete = async (idea: Idea) => {
    if (!window.confirm('Are you sure you want to delete this idea?')) return;

    try {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', idea.id);

      if (error) throw error;
      
      if (currentIdea?.id === idea.id) {
        setCurrentIdea(null);
      }
      
      loadIdeas();
      setSuccess('Idea deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting idea:', error);
      setError(error.message);
    }
  };

  const handleArchive = async (idea: Idea) => {
    try {
      const { error } = await supabase
        .from('ideas')
        .update({ status: 'archived' })
        .eq('id', idea.id);

      if (error) throw error;
      loadIdeas();
      setSuccess('Idea archived successfully!');
    } catch (error: any) {
      console.error('Error archiving idea:', error);
      setError(error.message);
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <Lightbulb className="h-6 w-6 mr-2" />
              Idea Flow
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Explore and refine your business ideas
            </p>
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
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{idea.title}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      idea.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      idea.status === 'exploring' ? 'bg-blue-100 text-blue-800' :
                      idea.status === 'validated' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {idea.status.charAt(0).toUpperCase() + idea.status.slice(1)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {idea.description || idea.problem_statement}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
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
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {isEditing ? (
                        <input
                          type="text"
                          value={currentIdea.title}
                          onChange={(e) => setCurrentIdea({ ...currentIdea, title: e.target.value })}
                          className="block w-full text-lg font-medium text-gray-900 border-0 focus:ring-0"
                          placeholder="Enter idea title..."
                        />
                      ) : (
                        <h2 className="text-lg font-medium text-gray-900">{currentIdea.title}</h2>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        {isEditing ? (
                          <>
                            <X className="h-4 w-4 mr-1.5" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <Edit className="h-4 w-4 mr-1.5" />
                            Edit
                          </>
                        )}
                      </button>
                      {isEditing && (
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <Save className="h-4 w-4 mr-1.5" />
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                      )}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleArchive(currentIdea)}
                          className="p-1.5 text-gray-500 hover:text-gray-700"
                          title="Archive idea"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(currentIdea)}
                          className="p-1.5 text-gray-500 hover:text-red-600"
                          title="Delete idea"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Tabs */}
                  <div className="mt-4 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        onClick={() => setActiveTab('concept')}
                        className={`${
                          activeTab === 'concept'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                      >
                        <Lightbulb className="h-5 w-5 mr-2" />
                        Core Concept
                      </button>
                      <button
                        onClick={() => setActiveTab('market')}
                        className={`${
                          activeTab === 'market'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                      >
                        <Target className="h-5 w-5 mr-2" />
                        Market
                      </button>
                      <button
                        onClick={() => setActiveTab('business')}
                        className={`${
                          activeTab === 'business'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                      >
                        <DollarSign className="h-5 w-5 mr-2" />
                        Business Model
                      </button>
                      <button
                        onClick={() => setActiveTab('validation')}
                        className={`${
                          activeTab === 'validation'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                      >
                        <BarChart3 className="h-5 w-5 mr-2" />
                        Validation
                      </button>
                      <button
                        onClick={() => setActiveTab('ai')}
                        className={`${
                          activeTab === 'ai'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                      >
                        <Brain className="h-5 w-5 mr-2" />
                        AI Insights
                      </button>
                    </nav>
                  </div>
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
                    {activeTab === 'concept' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Problem Statement
                          </label>
                          <textarea
                            value={currentIdea.problem_statement}
                            onChange={(e) => setCurrentIdea({ ...currentIdea, problem_statement: e.target.value })}
                            rows={3}
                            disabled={!isEditing}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                            placeholder="What problem are you solving?"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Solution Concept
                          </label>
                          <textarea
                            value={currentIdea.solution_concept}
                            onChange={(e) => setCurrentIdea({ ...currentIdea, solution_concept: e.target.value })}
                            rows={3}
                            disabled={!isEditing}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                            placeholder="How does your solution address the problem?"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Target Audience
                          </label>
                          <textarea
                            value={currentIdea.target_audience}
                            onChange={(e) => setCurrentIdea({ ...currentIdea, target_audience: e.target.value })}
                            rows={3}
                            disabled={!isEditing}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                            placeholder="Who are your target customers?"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Unique Value Proposition
                          </label>
                          <textarea
                            value={currentIdea.unique_value}
                            onChange={(e) => setCurrentIdea({ ...currentIdea, unique_value: e.target.value })}
                            rows={3}
                            disabled={!isEditing}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                            placeholder="What makes your solution unique and valuable?"
                          />
                        </div>
                      </>
                    )}

                    {activeTab === 'market' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Market Size
                          </label>
                          <textarea
                            value={currentIdea.market_size}
                            onChange={(e) => setCurrentIdea({ ...currentIdea, market_size: e.target.value })}
                            rows={3}
                            disabled={!isEditing}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                            placeholder="What is the total addressable market size?"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Market Trends
                          </label>
                          <div className="mt-2 space-y-2">
                            {currentIdea.market_trends.map((trend, index) => (
                              <div key={index} className="flex items-center">
                                <input
                                  type="text"
                                  value={trend}
                                  onChange={(e) => {
                                    const newTrends = [...currentIdea.market_trends];
                                    newTrends[index] = e.target.value;
                                    setCurrentIdea({ ...currentIdea, market_trends: newTrends });
                                  }}
                                  disabled={!isEditing}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                />
                                {isEditing && (
                                  <button
                                    onClick={() => {
                                      const newTrends = currentIdea.market_trends.filter((_, i) => i !== index);
                                      setCurrentIdea({ ...currentIdea, market_trends: newTrends });
                                    }}
                                    className="ml-2 text-gray-400 hover:text-gray-500"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                            {isEditing && (
                              <button
                                onClick={() => setCurrentIdea({
                                  ...currentIdea,
                                  market_trends: [...currentIdea.market_trends, '']
                                })}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <Plus className="h-4 w-4 mr-1.5" />
                                Add Trend
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Competitors
                          </label>
                          <div className="mt-2 space-y-4">
                            {currentIdea.competitors.map((competitor, index) => (
                              <div key={index} className="border rounded-lg p-4">
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={competitor.name}
                                    onChange={(e) => {
                                      const newCompetitors = [...currentIdea.competitors];
                                      newCompetitors[index] = { ...competitor, name: e.target.value };
                                      setCurrentIdea({ ...currentIdea, competitors: newCompetitors });
                                    }}
                                    disabled={!isEditing}
                                    placeholder="Competitor name"
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                  />
                                  <textarea
                                    value={competitor.strengths}
                                    onChange={(e) => {
                                      const newCompetitors = [...currentIdea.competitors];
                                      newCompetitors[index] = { ...competitor, strengths: e.target.value };
                                      setCurrentIdea({ ...currentIdea, competitors: newCompetitors });
                                    }}
                                    disabled={!isEditing}
                                    placeholder="Competitor strengths"
                                    rows={2}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                  />
                                  <textarea
                                    value={competitor.weaknesses}
                                    onChange={(e) => {
                                      const newCompetitors = [...currentIdea.competitors];
                                      newCompetitors[index] = { ...competitor, weaknesses: e.target.value };
                                      setCurrentIdea({ ...currentIdea, competitors: newCompetitors });
                                    }}
                                    disabled={!isEditing}
                                    placeholder="Competitor weaknesses"
                                    rows={2}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                  />
                                </div>
                                {isEditing && (
                                  <div className="mt-2 flex justify-end">
                                    <button
                                      onClick={() => {
                                        const newCompetitors = currentIdea.competitors.filter((_, i) => i !== index);
                                        setCurrentIdea({ ...currentIdea, competitors: newCompetitors });
                                      }}
                                      className="text-red-600 hover:text-red-700 text-sm"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                            {isEditing && (
                              <button
                                onClick={() => setCurrentIdea({
                                  ...currentIdea,
                                  competitors: [...currentIdea.competitors, { name: '', strengths: '', weaknesses: '' }]
                                })}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <Plus className="h-4 w-4 mr-1.5" />
                                Add Competitor
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {activeTab === 'business' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Revenue Streams
                          </label>
                          <div className="mt-2 space-y-4">
                            {currentIdea.revenue_streams.map((stream, index) => (
                              <div key={index} className="border rounded-lg p-4">
                                <div className="space-y-2">
                                   Continuing with the IdeaFlow.tsx file content from where we left off:

                                  <input
                                    type="text"
                                    value={stream.name}
                                    onChange={(e) => {
                                      const newStreams = [...currentIdea.revenue_streams];
                                      newStreams[index] = { ...stream, name: e.target.value };
                                      setCurrentIdea({ ...currentIdea, revenue_streams: newStreams });
                                    }}
                                    disabled={!isEditing}
                                    placeholder="Revenue stream name"
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                  />
                                  <textarea
                                    value={stream.description}
                                    onChange={(e) => {
                                      const newStreams = [...currentIdea.revenue_streams];
                                      newStreams[index] = { ...stream, description: e.target.value };
                                      setCurrentIdea({ ...currentIdea, revenue_streams: newStreams });
                                    }}
                                    disabled={!isEditing}
                                    placeholder="Revenue stream description"
                                    rows={2}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                  />
                                </div>
                                {isEditing && (
                                  <div className="mt-2 flex justify-end">
                                    <button
                                      onClick={() => {
                                        const newStreams = currentIdea.revenue_streams.filter((_, i) => i !== index);
                                        setCurrentIdea({ ...currentIdea, revenue_streams: newStreams });
                                      }}
                                      className="text-red-600 hover:text-red-700 text-sm"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                            {isEditing && (
                              <button
                                onClick={() => setCurrentIdea({
                                  ...currentIdea,
                                  revenue_streams: [...currentIdea.revenue_streams, { name: '', description: '' }]
                                })}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <Plus className="h-4 w-4 mr-1.5" />
                                Add Revenue Stream
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Key Metrics
                          </label>
                          <div className="mt-2 space-y-2">
                            {currentIdea.key_metrics.map((metric, index) => (
                              <div key={index} className="flex items-center">
                                <input
                                  type="text"
                                  value={metric}
                                  onChange={(e) => {
                                    const newMetrics = [...currentIdea.key_metrics];
                                    newMetrics[index] = e.target.value;
                                    setCurrentIdea({ ...currentIdea, key_metrics: newMetrics });
                                  }}
                                  disabled={!isEditing}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                />
                                {isEditing && (
                                  <button
                                    onClick={() => {
                                      const newMetrics = currentIdea.key_metrics.filter((_, i) => i !== index);
                                      setCurrentIdea({ ...currentIdea, key_metrics: newMetrics });
                                    }}
                                    className="ml-2 text-gray-400 hover:text-gray-500"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                            {isEditing && (
                              <button
                                onClick={() => setCurrentIdea({
                                  ...currentIdea,
                                  key_metrics: [...currentIdea.key_metrics, '']
                                })}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <Plus className="h-4 w-4 mr-1.5" />
                                Add Metric
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Distribution Channels
                          </label>
                          <div className="mt-2 space-y-2">
                            {currentIdea.channels.map((channel, index) => (
                              <div key={index} className="flex items-center">
                                <input
                                  type="text"
                                  value={channel}
                                  onChange={(e) => {
                                    const newChannels = [...currentIdea.channels];
                                    newChannels[index] = e.target.value;
                                    setCurrentIdea({ ...currentIdea, channels: newChannels });
                                  }}
                                  disabled={!isEditing}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                />
                                {isEditing && (
                                  <button
                                    onClick={() => {
                                      const newChannels = currentIdea.channels.filter((_, i) => i !== index);
                                      setCurrentIdea({ ...currentIdea, channels: newChannels });
                                    }}
                                    className="ml-2 text-gray-400 hover:text-gray-500"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                            {isEditing && (
                              <button
                                onClick={() => setCurrentIdea({
                                  ...currentIdea,
                                  channels: [...currentIdea.channels, '']
                                })}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <Plus className="h-4 w-4 mr-1.5" />
                                Add Channel
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {activeTab === 'validation' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Key Assumptions
                          </label>
                          <div className="mt-2 space-y-2">
                            {currentIdea.assumptions.map((assumption, index) => (
                              <div key={index} className="flex items-center">
                                <input
                                  type="text"
                                  value={assumption}
                                  onChange={(e) => {
                                    const newAssumptions = [...currentIdea.assumptions];
                                    newAssumptions[index] = e.target.value;
                                    setCurrentIdea({ ...currentIdea, assumptions: newAssumptions });
                                  }}
                                  disabled={!isEditing}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                />
                                {isEditing && (
                                  <button
                                    onClick={() => {
                                      const newAssumptions = currentIdea.assumptions.filter((_, i) => i !== index);
                                      setCurrentIdea({ ...currentIdea, assumptions: newAssumptions });
                                    }}
                                    className="ml-2 text-gray-400 hover:text-gray-500"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                            {isEditing && (
                              <button
                                onClick={() => setCurrentIdea({
                                  ...currentIdea,
                                  assumptions: [...currentIdea.assumptions, '']
                                })}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <Plus className="h-4 w-4 mr-1.5" />
                                Add Assumption
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Validation Steps
                          </label>
                          <div className="mt-2 space-y-4">
                            {currentIdea.validation_steps.map((step, index) => (
                              <div key={index} className="border rounded-lg p-4">
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={step.description}
                                    onChange={(e) => {
                                      const newSteps = [...currentIdea.validation_steps];
                                      newSteps[index] = { ...step, description: e.target.value };
                                      setCurrentIdea({ ...currentIdea, validation_steps: newSteps });
                                    }}
                                    disabled={!isEditing}
                                    placeholder="What do you need to validate?"
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                  />
                                  <textarea
                                    value={step.method}
                                    onChange={(e) => {
                                      const newSteps = [...currentIdea.validation_steps];
                                      newSteps[index] = { ...step, method: e.target.value };
                                      setCurrentIdea({ ...currentIdea, validation_steps: newSteps });
                                    }}
                                    disabled={!isEditing}
                                    placeholder="How will you validate this?"
                                    rows={2}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                  />
                                  <select
                                    value={step.status}
                                    onChange={(e) => {
                                      const newSteps = [...currentIdea.validation_steps];
                                      newSteps[index] = { ...step, status: e.target.value };
                                      setCurrentIdea({ ...currentIdea, validation_steps: newSteps });
                                    }}
                                    disabled={!isEditing}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                  >
                                    <option value="pending">Not Started</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="invalidated">Invalidated</option>
                                  </select>
                                </div>
                                {isEditing && (
                                  <div className="mt-2 flex justify-end">
                                    <button
                                      onClick={() => {
                                        const newSteps = currentIdea.validation_steps.filter((_, i) => i !== index);
                                        setCurrentIdea({ ...currentIdea, validation_steps: newSteps });
                                      }}
                                      className="text-red-600 hover:text-red-700 text-sm"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                            {isEditing && (
                              <button
                                onClick={() => setCurrentIdea({
                                  ...currentIdea,
                                  validation_steps: [...currentIdea.validation_steps, {
                                    description: '',
                                    method: '',
                                    status: 'pending'
                                  }]
                                })}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <Plus className="h-4 w-4 mr-1.5" />
                                Add Validation Step
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Collected Feedback
                          </label>
                          <div className="mt-2 space-y-4">
                            {currentIdea.feedback_collected.map((feedback, index) => (
                              <div key={index} className="border rounded-lg p-4">
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={feedback.source}
                                    onChange={(e) => {
                                      const newFeedback = [...currentIdea.feedback_collected];
                                      newFeedback[index] = { ...feedback, source: e.target.value };
                                      setCurrentIdea({ ...currentIdea, feedback_collected: newFeedback });
                                    }}
                                    disabled={!isEditing}
                                    placeholder="Feedback source"
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                  />
                                  <textarea
                                    value={feedback.content}
                                    onChange={(e) => {
                                      const newFeedback = [...currentIdea.feedback_collected];
                                      newFeedback[index] = { ...feedback, content: e.target.value };
                                      setCurrentIdea({ ...currentIdea, feedback_collected: newFeedback });
                                    }}
                                    disabled={!isEditing}
                                    placeholder="What was the feedback?"
                                    rows={2}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                  />
                                </div>
                                {isEditing && (
                                  <div className="mt-2 flex justify-end">
                                    <button
                                      onClick={() => {
                                        const newFeedback = currentIdea.feedback_collected.filter((_, i) => i !== index);
                                        setCurrentIdea({ ...currentIdea, feedback_collected: newFeedback });
                                      }}
                                      className="text-red-600 hover:text-red-700 text-sm"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                            {isEditing && (
                              <button
                                onClick={() => setCurrentIdea({
                                  ...currentIdea,
                                  feedback_collected: [...currentIdea.feedback_collected, { source: '', content: '' }]
                                })}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <Plus className="h-4 w-4 mr-1.5" />
                                Add Feedback
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {activeTab === 'ai' && (
                      <>
                        <div className="mb-6 flex justify-between items-center">
                          <h3 className="text-lg font-medium text-gray-900">AI Analysis</h3>
                          <button
                            onClick={generateAIFeedback}
                            disabled={isGeneratingFeedback}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            {isGeneratingFeedback ? 'Analyzing...' : 'Generate Analysis'}
                          </button>
                        </div>

                        <div className="space-y-6">
                          {currentIdea.ai_feedback.strengths.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Strengths</h4>
                              <ul className="mt-2 list-disc list-inside space-y-1">
                                {currentIdea.ai_feedback.strengths.map((strength, index) => (
                                  <li key={index} className="text-sm text-gray-600">{strength}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {currentIdea.ai_feedback.weaknesses.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Areas for Improvement</h4>
                              <ul className="mt-2 list-disc list-inside space-y-1">
                                {currentIdea.ai_feedback.weaknesses.map((weakness, index) => (
                                  <li key={index} className="text-sm text-gray-600">{weakness}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {currentIdea.ai_feedback.opportunities.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Opportunities</h4>
                              <ul className="mt-2 list-disc list-inside space-y-1">
                                {currentIdea.ai_feedback.opportunities.map((opportunity, index) => (
                                  <li key={index} className="text-sm text-gray-600">{opportunity}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {currentIdea.ai_feedback.threats.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Potential Risks</h4>
                              <ul className="mt-2 list-disc list-inside space-y-1">
                                {currentIdea.ai_feedback.threats.map((threat, index) => (
                                  <li key={index} className="text-sm text-gray-600">{threat}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {currentIdea.ai_feedback.market_insights.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Market Insights</h4>
                              <ul className="mt-2 list-disc list-inside space-y-1">
                                {currentIdea.ai_feedback.market_insights.map((insight, index) => (
                                  <li key={index} className="text-sm text-gray-600">{insight}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {currentIdea.ai_feedback.validation_tips.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Validation Tips</h4>
                              <ul className="mt-2 list-disc list-inside space-y-1">
                                {currentIdea.ai_feedback.validation_tips.map((tip, index) => (
                                  <li key={index} className="text-sm text-gray-600">{tip}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {currentIdea.ai_feedback.suggestions.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Next Steps</h4>
                              <ul className="mt-2 list-disc list-inside space-y-1">
                                {currentIdea.ai_feedback.suggestions.map((suggestion, index) => (
                                  <li key={index} className="text-sm text-gray-600">{suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {Object.values(currentIdea.ai_feedback).every(arr => arr.length === 0) && (
                            <div className="text-center py-12">
                              <Brain className="mx-auto h-12 w-12 text-gray-400" />
                              <h3 className="mt-2 text-sm font-medium text-gray-900">No AI analysis yet</h3>
                              <p className="mt-1 text-sm text-gray-500">
                                Click the Generate Analysis button to get AI insights about your idea.
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <Lightbulb className="mx-auto h-12 w-12 text-gray-400" />
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
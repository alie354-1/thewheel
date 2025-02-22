import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lightbulb,
  Brain,
  ArrowRight,
  AlertCircle,
  Save
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { generateTasks } from '../lib/openai';

interface IdeaData {
  title: string;
  description: string;
  problem_statement: string;
  solution_concept: string;
  target_audience: string;
  unique_value: string;
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

export default function IdeaRefinement() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ideaData, setIdeaData] = useState<IdeaData>({
    title: '',
    description: '',
    problem_statement: '',
    solution_concept: '',
    target_audience: '',
    unique_value: '',
    ai_feedback: {
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: [],
      suggestions: [],
      market_insights: [],
      validation_tips: []
    }
  });

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('ideas')
        .insert({
          user_id: user.id,
          title: ideaData.title,
          description: ideaData.description,
          problem_statement: ideaData.problem_statement,
          solution_concept: ideaData.solution_concept,
          target_audience: ideaData.target_audience,
          unique_value: ideaData.unique_value,
          ai_feedback: ideaData.ai_feedback,
          status: 'draft'
        });

      if (error) throw error;

      setSuccess('Idea saved successfully!');
    } catch (error: any) {
      console.error('Error saving idea:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIFeedback = async () => {
    if (!ideaData.title || !ideaData.description) {
      setError('Please provide at least a title and description');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const { feedback } = await generateTasks({
        accomplished: '',
        working_on: `
          Title: ${ideaData.title}
          Description: ${ideaData.description}
          Problem: ${ideaData.problem_statement}
          Solution: ${ideaData.solution_concept}
          Target Audience: ${ideaData.target_audience}
          Unique Value: ${ideaData.unique_value}
        `,
        blockers: '',
        goals: ''
      }, user?.id || '');

      // Parse feedback into sections
      const feedbackObj = JSON.parse(feedback);
      setIdeaData(prev => ({
        ...prev,
        ai_feedback: {
          strengths: feedbackObj.strengths || [],
          weaknesses: feedbackObj.weaknesses || [],
          opportunities: feedbackObj.opportunities || [],
          threats: feedbackObj.threats || [],
          suggestions: feedbackObj.suggestions || [],
          market_insights: feedbackObj.market_insights || [],
          validation_tips: feedbackObj.validation_tips || []
        }
      }));
    } catch (error: any) {
      console.error('Error generating AI feedback:', error);
      setError(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Lightbulb className="h-6 w-6 text-indigo-600" />
            <h2 className="ml-2 text-lg font-medium text-gray-900">
              Idea Refinement
            </h2>
          </div>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Progress'}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Core Idea Fields */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Describe your idea in one sentence
            </label>
            <input
              type="text"
              id="title"
              value={ideaData.title}
              onChange={(e) => setIdeaData(prev => ({ ...prev, title: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., 'An AI-powered customer service tool' or 'Tutus for ponies!'"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              What inspired this idea?
            </label>
            <textarea
              id="description"
              rows={3}
              value={ideaData.description}
              onChange={(e) => setIdeaData(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., 'I love ponies and think they'd look great in tutus' or 'I hate waiting for customer service calls'"
            />
          </div>

          <div>
            <label htmlFor="solution_concept" className="block text-sm font-medium text-gray-700">
              Do you see this as a product, technology, or service?
            </label>
            <textarea
              id="solution_concept"
              rows={3}
              value={ideaData.solution_concept}
              onChange={(e) => setIdeaData(prev => ({ ...prev, solution_concept: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., 'A physical product line of custom-made tutus' or 'A software tool that uses AI'"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={generateAIFeedback}
              disabled={isGenerating}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              <Brain className="h-4 w-4 mr-2" />
              {isGenerating ? 'Analyzing...' : 'Get AI Feedback'}
            </button>
          </div>
        </div>

        {/* AI Feedback Section */}
        {ideaData.ai_feedback.strengths.length > 0 && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">AI Analysis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Strengths</h4>
                <ul className="space-y-2">
                  {ideaData.ai_feedback.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Areas for Improvement</h4>
                <ul className="space-y-2">
                  {ideaData.ai_feedback.weaknesses.map((weakness, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Opportunities */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Opportunities</h4>
                <ul className="space-y-2">
                  {ideaData.ai_feedback.opportunities.map((opportunity, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {opportunity}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Threats */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Potential Risks</h4>
                <ul className="space-y-2">
                  {ideaData.ai_feedback.threats.map((threat, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-yellow-500 mr-2">•</span>
                      {threat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Next Steps */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Suggested Next Steps</h4>
              <ul className="space-y-2">
                {ideaData.ai_feedback.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <ArrowRight className="h-4 w-4 text-indigo-500 mr-2 mt-0.5" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
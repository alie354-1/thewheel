import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3,
  ArrowRight,
  Brain,
  AlertCircle,
  Save,
  RotateCw,
  Plus,
  Check,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { generateMarketSuggestions } from '../lib/openai';

interface MarketSuggestions {
  target_audience: string[];
  sales_channels: string[];
  pricing_model: string[];
  customer_type: string[];
  integration_needs: string[];
}

interface MarketValidationQuestionsProps {
  ideaId: string;
  ideaData: {
    title: string;
    description: string;
    target_market: string;
    solution_concept: string;
  };
}

export default function MarketValidationQuestions({ ideaId, ideaData }: MarketValidationQuestionsProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [suggestions, setSuggestions] = useState<MarketSuggestions | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Record<string, string[]>>({
    target_audience: [],
    sales_channels: [],
    pricing_model: [],
    customer_type: [],
    integration_needs: []
  });
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({
    target_audience: '',
    sales_channels: '',
    pricing_model: '',
    customer_type: '',
    integration_needs: ''
  });

  useEffect(() => {
    // Auto-generate suggestions when component mounts
    handleGenerateSuggestions();
  }, [ideaData]);

  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);
    setError('');

    try {
      const suggestions = await generateMarketSuggestions(ideaData);
      setSuggestions(suggestions);
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      setError(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSuggestion = (category: string, item: string) => {
    setSelectedSuggestions(prev => {
      const current = prev[category] || [];
      const updated = current.includes(item)
        ? current.filter(i => i !== item)
        : [...current, item];
      
      return {
        ...prev,
        [category]: updated
      };
    });
  };

  const handleCustomInput = (category: string, value: string) => {
    setCustomInputs(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const addCustomInput = (category: string) => {
    if (!customInputs[category].trim()) return;

    setSelectedSuggestions(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), customInputs[category].trim()]
    }));

    setCustomInputs(prev => ({
      ...prev,
      [category]: ''
    }));
  };

  const removeCustomInput = (category: string, item: string) => {
    setSelectedSuggestions(prev => ({
      ...prev,
      [category]: prev[category].filter(i => i !== item)
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase
        .from('ideas')
        .update({
          market_insights: selectedSuggestions,
          status: 'exploring'
        })
        .eq('id', ideaId);

      if (updateError) throw updateError;

      setSuccess('Market validation saved successfully!');
      setTimeout(() => {
        navigate('/idea-hub/market-research', {
          state: { ideaId }
        });
      }, 1500);
    } catch (error: any) {
      console.error('Error saving market validation:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategory = (
    category: string,
    title: string,
    suggestions: string[] = [],
    colorClass: string
  ) => (
    <div>
      <h4 className="text-sm font-medium text-gray-900 mb-4">{title}</h4>

      {/* Custom Input */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={customInputs[category]}
          onChange={(e) => handleCustomInput(category, e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustomInput(category);
            }
          }}
          placeholder="Add custom input..."
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        <button
          onClick={() => addCustomInput(category)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      
      {/* AI Suggestions */}
      <div className="flex flex-wrap gap-2 mb-4">
        {suggestions.map((item, index) => (
          <button
            key={index}
            onClick={() => toggleSuggestion(category, item)}
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
              selectedSuggestions[category]?.includes(item)
                ? `${colorClass}`
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            {selectedSuggestions[category]?.includes(item) ? (
              <Check className="h-4 w-4 mr-1" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            {item}
          </button>
        ))}
      </div>

      {/* Selected Custom Inputs */}
      <div className="flex flex-wrap gap-2">
        {selectedSuggestions[category]
          ?.filter(item => !suggestions.includes(item))
          .map((item, index) => (
            <div
              key={index}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${colorClass}`}
            >
              {item}
              <button
                onClick={() => removeCustomInput(category, item)}
                className="ml-2 p-0.5 rounded-full hover:bg-white/20"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Market Validation
        </h3>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="px-6 py-4 bg-green-50">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      <div className="p-6">
        {/* Generate Button */}
        <div className="mb-6">
          <button
            onClick={() => handleGenerateSuggestions()}
            disabled={isGenerating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Generate Market Suggestions
              </>
            )}
          </button>
        </div>

        {/* Categories */}
        <div className="space-y-8">
          {suggestions && (
            <>
              {renderCategory(
                'target_audience',
                'Target Audience Segments',
                suggestions.target_audience,
                'bg-indigo-100 text-indigo-800'
              )}

              {renderCategory(
                'sales_channels',
                'Sales Channels',
                suggestions.sales_channels,
                'bg-green-100 text-green-800'
              )}

              {renderCategory(
                'pricing_model',
                'Pricing Models',
                suggestions.pricing_model,
                'bg-blue-100 text-blue-800'
              )}

              {renderCategory(
                'customer_type',
                'Customer Types',
                suggestions.customer_type,
                'bg-purple-100 text-purple-800'
              )}

              {renderCategory(
                'integration_needs',
                'Integration Requirements',
                suggestions.integration_needs,
                'bg-yellow-100 text-yellow-800'
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Progress
            </button>
            <button
              onClick={() => navigate('/idea-hub/market-research', {
                state: { ideaId }
              })}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Continue to Market Analysis
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
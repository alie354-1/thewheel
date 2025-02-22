import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Coins,
  Brain,
  ArrowRight,
  AlertCircle,
  Save,
  RotateCw,
  Check,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { generateMarketSuggestions } from '../lib/openai';

interface BusinessSuggestions {
  target_audience: string[];
  sales_channels: string[];
  pricing_model: string[];
  customer_type: string[];
  integration_needs: string[];
}

export default function BusinessGenerator() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [suggestions, setSuggestions] = useState<BusinessSuggestions | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Record<string, string[]>>({
    target_audience: [],
    sales_channels: [],
    pricing_model: [],
    customer_type: [],
    integration_needs: []
  });

  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);
    setError('');

    try {
      const suggestions = await generateMarketSuggestions({
        title: "Business Model Generation",
        description: "Generate business model suggestions"
      });

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

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: saveError } = await supabase
        .from('ideas')
        .insert({
          user_id: user.id,
          status: 'exploring',
          market_insights: selectedSuggestions
        });

      if (saveError) throw saveError;

      setSuccess('Business model saved successfully!');
      setTimeout(() => {
        navigate('/idea-hub/business-model');
      }, 1500);
    } catch (error: any) {
      console.error('Error saving business model:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Coins className="h-5 w-5 mr-2" />
          Business Model Generator
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
        <div className="mb-6">
          <button
            onClick={handleGenerateSuggestions}
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
                Generate Suggestions
              </>
            )}
          </button>
        </div>

        {suggestions && (
          <div className="space-y-8">
            {/* Target Audience */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Target Audience Segments</h4>
              <div className="space-y-2">
                {suggestions.target_audience.map((segment, index) => (
                  <button
                    key={index}
                    onClick={() => toggleSuggestion('target_audience', segment)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium mr-2 ${
                      selectedSuggestions.target_audience.includes(segment)
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {selectedSuggestions.target_audience.includes(segment) ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : (
                      <Plus className="h-4 w-4 mr-1" />
                    )}
                    {segment}
                  </button>
                ))}
              </div>
            </div>

            {/* Sales Channels */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Sales Channels</h4>
              <div className="space-y-2">
                {suggestions.sales_channels.map((channel, index) => (
                  <button
                    key={index}
                    onClick={() => toggleSuggestion('sales_channels', channel)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium mr-2 ${
                      selectedSuggestions.sales_channels.includes(channel)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {selectedSuggestions.sales_channels.includes(channel) ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : (
                      <Plus className="h-4 w-4 mr-1" />
                    )}
                    {channel}
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing Models */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Pricing Models</h4>
              <div className="space-y-2">
                {suggestions.pricing_model.map((model, index) => (
                  <button
                    key={index}
                    onClick={() => toggleSuggestion('pricing_model', model)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium mr-2 ${
                      selectedSuggestions.pricing_model.includes(model)
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {selectedSuggestions.pricing_model.includes(model) ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : (
                      <Plus className="h-4 w-4 mr-1" />
                    )}
                    {model}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Types */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Customer Types</h4>
              <div className="space-y-2">
                {suggestions.customer_type.map((type, index) => (
                  <button
                    key={index}
                    onClick={() => toggleSuggestion('customer_type', type)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium mr-2 ${
                      selectedSuggestions.customer_type.includes(type)
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {selectedSuggestions.customer_type.includes(type) ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : (
                      <Plus className="h-4 w-4 mr-1" />
                    )}
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Integration Needs */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Integration Requirements</h4>
              <div className="space-y-2">
                {suggestions.integration_needs.map((need, index) => (
                  <button
                    key={index}
                    onClick={() => toggleSuggestion('integration_needs', need)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium mr-2 ${
                      selectedSuggestions.integration_needs.includes(need)
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {selectedSuggestions.integration_needs.includes(need) ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : (
                      <Plus className="h-4 w-4 mr-1" />
                    )}
                    {need}
                  </button>
                ))}
              </div>
            </div>

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
                onClick={() => navigate('/idea-hub/business-model')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Continue to Business Model
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
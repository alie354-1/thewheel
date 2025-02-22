import React from 'react';
import { Brain, ArrowRight, RotateCw } from 'lucide-react';

interface MarketSuggestionsProps {
  suggestions: {
    target_audience: string[];
    sales_channels: string[];
    pricing_model: string[];
    customer_type: string[];
    integration_needs: string[];
  };
  onSuggestionClick: (category: string, suggestion: string) => void;
  onContinue: () => void;
  currentValues: {
    target_audience: string;
    sales_channels: string;
    pricing_model: string;
    customer_type: string;
    integration_needs: string;
  };
  isLoading?: boolean;
  onRequestMoreSuggestions?: (category: string) => Promise<void>;
  onAddCustomSuggestion?: (category: string, suggestion: string) => void;
}

export default function MarketSuggestions({ 
  suggestions, 
  onSuggestionClick, 
  onContinue, 
  currentValues,
  isLoading 
}: MarketSuggestionsProps) {
  // Helper function to check if a suggestion is included in current value
  const isSuggestionSelected = (category: string, suggestion: string) => {
    const currentValue = currentValues[category as keyof typeof currentValues] || '';
    return currentValue.toLowerCase().includes(suggestion.toLowerCase());
  };

  if (!suggestions) {
    return (
      <div className="bg-white shadow rounded-lg p-8">
        <div className="flex flex-col items-center justify-center">
          <RotateCw className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="mt-4 text-sm text-gray-500">Generating market suggestions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Brain className="h-6 w-6 text-indigo-600" />
            <h3 className="ml-2 text-lg font-medium text-gray-900">Market Validation</h3>
          </div>
        </div>

        <div className="space-y-8">
          {/* Target Audience */}
          <div>
            <div className="mb-4">
              <label htmlFor="target_audience" className="block text-sm font-medium text-gray-700">
                Target Audience
              </label>
              <textarea
                id="target_audience"
                value={currentValues.target_audience}
                readOnly
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Click suggestions below to add target audience segments..."
              />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Suggestions</h4>
            <div className="flex flex-wrap gap-2">
              {suggestions.target_audience.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick('target_audience', suggestion)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${isSuggestionSelected('target_audience', suggestion)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Sales Channels */}
          <div>
            <div className="mb-4">
              <label htmlFor="sales_channels" className="block text-sm font-medium text-gray-700">
                Sales Channels
              </label>
              <textarea
                id="sales_channels"
                value={currentValues.sales_channels}
                readOnly
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Click suggestions below to add sales channels..."
              />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Suggestions</h4>
            <div className="flex flex-wrap gap-2">
              {suggestions.sales_channels.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick('sales_channels', suggestion)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${isSuggestionSelected('sales_channels', suggestion)
                      ? 'bg-green-600 text-white'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Models */}
          <div>
            <div className="mb-4">
              <label htmlFor="pricing_model" className="block text-sm font-medium text-gray-700">
                Pricing Model
              </label>
              <textarea
                id="pricing_model"
                value={currentValues.pricing_model}
                readOnly
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Click suggestions below to add pricing models..."
              />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Suggestions</h4>
            <div className="flex flex-wrap gap-2">
              {suggestions.pricing_model.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick('pricing_model', suggestion)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${isSuggestionSelected('pricing_model', suggestion)
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Types */}
          <div>
            <div className="mb-4">
              <label htmlFor="customer_type" className="block text-sm font-medium text-gray-700">
                Customer Type
              </label>
              <textarea
                id="customer_type"
                value={currentValues.customer_type}
                readOnly
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Click suggestions below to add customer types..."
              />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Suggestions</h4>
            <div className="flex flex-wrap gap-2">
              {suggestions.customer_type.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick('customer_type', suggestion)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${isSuggestionSelected('customer_type', suggestion)
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                    }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Integration Needs */}
          <div>
            <div className="mb-4">
              <label htmlFor="integration_needs" className="block text-sm font-medium text-gray-700">
                Integration Needs
              </label>
              <textarea
                id="integration_needs"
                value={currentValues.integration_needs}
                readOnly
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Click suggestions below to add integration needs..."
              />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Suggestions</h4>
            <div className="flex flex-wrap gap-2">
              {suggestions.integration_needs.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick('integration_needs', suggestion)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${isSuggestionSelected('integration_needs', suggestion)
                      ? 'bg-yellow-600 text-white'
                      : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                    }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Continue Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={onContinue}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating Analysis...
                </>
              ) : (
                <>
                  Generate Market Analysis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
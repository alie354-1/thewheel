import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Users,
  ArrowLeft,
  Brain,
  AlertCircle,
  Save,
  ArrowRight,
  Building2,
  DollarSign,
  Target,
  ShoppingBag,
  Store,
  BarChart3,
  Plus,
  X,
  Tag,
  RotateCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { generateMarketSuggestions } from '../../lib/openai';

interface MarketData {
  target_audience: string;
  sales_channels: string;
  pricing_model: string;
  customer_type: string;
  integration_needs: string;
  market_insights: {
    customer_profiles: string[];
    early_adopters: string[];
    sales_channels: string[];
    pricing_insights: string[];
    integration_recommendations: string[];
    market_size_estimates: string[];
    competition_analysis: string[];
  };
}

interface MarketSuggestions {
  target_audience: string[];
  sales_channels: string[];
  pricing_model: string[];
  customer_type: string[];
  integration_needs: string[];
}

const defaultMarketInsights = {
  customer_profiles: [],
  early_adopters: [],
  sales_channels: [],
  pricing_insights: [],
  integration_recommendations: [],
  market_size_estimates: [],
  competition_analysis: []
};

const defaultSuggestions = {
  target_audience: [],
  sales_channels: [],
  pricing_model: [],
  customer_type: [],
  integration_needs: []
};

export default function MarketValidation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [idea, setIdea] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<MarketSuggestions>(defaultSuggestions);
  const [marketData, setMarketData] = useState<MarketData>({
    target_audience: '',
    sales_channels: '',
    pricing_model: '',
    customer_type: '',
    integration_needs: '',
    market_insights: defaultMarketInsights
  });

  useEffect(() => {
    loadIdea();
  }, []);

  const loadIdea = async () => {
    const ideaId = location.state?.ideaId;
    if (!ideaId) {
      navigate('/idea-hub/refinement');
      return;
    }

    try {
      const { data: idea, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', ideaId)
        .single();

      if (error) throw error;
      if (!idea) throw new Error('Idea not found');

      setIdea(idea);

      // Generate initial suggestions
      generateSuggestions(idea);

      if (idea.target_audience) {
        setMarketData(prev => ({
          ...prev,
          target_audience: idea.target_audience
        }));
      }
    } catch (error: any) {
      console.error('Error loading idea:', error);
      setError(error.message);
    }
  };

  const generateSuggestions = async (ideaData: any) => {
    setIsGeneratingSuggestions(true);
    setError('');

    try {
      const newSuggestions = await generateMarketSuggestions({
        title: ideaData.title,
        description: ideaData.description,
        solution_concept: ideaData.solution_concept,
        target_audience: marketData.target_audience,
        sales_channels: marketData.sales_channels,
        pricing_model: marketData.pricing_model,
        customer_type: marketData.customer_type,
        integration_needs: marketData.integration_needs
      });

      setSuggestions(newSuggestions);
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      setError(error.message);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const handleSave = async (continueToNext: boolean = false) => {
    if (!user || !idea) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('ideas')
        .update({
          target_audience: marketData.target_audience,
          market_insights: marketData.market_insights,
          updated_at: new Date().toISOString()
        })
        .eq('id', idea.id);

      if (error) throw error;

      setSuccess('Progress saved successfully!');

      if (continueToNext) {
        navigate('/idea-hub/business-model', { 
          state: { ideaId: idea.id }
        });
      }
    } catch (error: any) {
      console.error('Error saving progress:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSuggestionTags = (field: keyof MarketSuggestions) => {
    return suggestions[field] && suggestions[field].length > 0 ? (
      <div className="mt-2 flex flex-wrap gap-2">
        {suggestions[field].map((suggestion, index) => (
          <button
            key={index}
            onClick={() => addSuggestion(field, suggestion)}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-indigo-100 hover:text-indigo-800 transition-colors"
          >
            <Tag className="h-3 w-3 mr-1" />
            {suggestion}
          </button>
        ))}
        <button
          onClick={() => generateSuggestions(idea)}
          disabled={isGeneratingSuggestions}
          className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-indigo-100 hover:text-indigo-800 transition-colors disabled:opacity-50"
        >
          <RotateCw className={`h-3 w-3 mr-1 ${isGeneratingSuggestions ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
    ) : null;
  };

  const addSuggestion = (field: keyof MarketSuggestions, suggestion: string) => {
    setMarketData(prev => ({
      ...prev,
      [field]: prev[field] ? `${prev[field]}\n${suggestion}` : suggestion
    }));
  };

  const generateMarketInsights = async () => {
    if (!idea) return;

    setIsGenerating(true);
    setError('');

    try {
      const { data: adminSettings, error: settingsError } = await supabase
        .from('profiles')
        .select('settings')
        .eq('role', 'superadmin')
        .single();

      if (settingsError || !adminSettings?.settings?.openai?.api_key) {
        throw new Error('OpenAI API key not configured. Please contact an administrator.');
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminSettings.settings.openai.api_key}`
        },
        body: JSON.stringify({
          model: adminSettings.settings.openai.model || 'gpt-4',
          messages: [
            {
              role: "system",
              content: `You are an experienced market research analyst helping founders validate their startup ideas. 
            Analyze the provided information and generate detailed market insights.
            
            Format your response as a JSON object with these exact keys:
            {
              "customer_profiles": string[],
              "early_adopters": string[],
              "sales_channels": string[],
              "pricing_insights": string[],
              "integration_recommendations": string[],
              "market_size_estimates": string[],
              "competition_analysis": string[]
            }
            
            Each array should contain 3-5 detailed insights.
            Ensure all text is properly escaped for JSON.`
            },
            {
              role: "user", 
              content: `Please analyze this startup idea:
              Title: ${idea.title}
              Description: ${idea.description}
              Solution Type: ${idea.solution_concept}
              Target Audience: ${marketData.target_audience}
              Sales Channels: ${marketData.sales_channels}
              Pricing Model: ${marketData.pricing_model}
              Customer Type: ${marketData.customer_type}
              Integration Needs: ${marketData.integration_needs}`
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate market insights');
      }

      const result = await response.json();
      const content = result.choices[0].message.content;

      // Safely parse the JSON response
      let insights;
      try {
        insights = JSON.parse(content.trim());
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
        throw new Error('Failed to parse market insights. Please try again.');
      }

      // Validate the response structure
      const requiredKeys = [
        'customer_profiles',
        'early_adopters',
        'sales_channels',
        'pricing_insights',
        'market_size_estimates',
        'competition_analysis'
      ];

      const missingKeys = requiredKeys.filter(key => !insights[key]);
      if (missingKeys.length > 0) {
        throw new Error(`Invalid response format. Missing: ${missingKeys.join(', ')}`);
      }

      setMarketData(prev => ({
        ...prev,
        market_insights: {
          customer_profiles: insights.customer_profiles || [],
          early_adopters: insights.early_adopters || [],
          sales_channels: insights.sales_channels || [],
          pricing_insights: insights.pricing_insights || [],
          integration_recommendations: insights.integration_recommendations || [],
          market_size_estimates: insights.market_size_estimates || [],
          competition_analysis: insights.competition_analysis || []
        }
      }));
    } catch (error: any) {
      console.error('Error generating market insights:', error);
      setError(error.message || 'Failed to generate insights');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/idea-hub/refinement')}
              className="mr-4 text-gray-400 hover:text-gray-500"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                <Target className="h-6 w-6 mr-2" />
                Step 2: Market Viability
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Let's identify who might care about this idea and why
              </p>
            </div>
          </div>
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

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Market Questions */}
            <div className="space-y-8">
              {/* Target Audience */}
              <div>
                <label htmlFor="target_audience" className="block text-sm font-medium text-gray-900">
                  Who is your ideal customer?
                </label>
                <textarea
                  id="target_audience"
                  rows={3}
                  value={marketData.target_audience}
                  onChange={(e) => setMarketData(prev => ({ ...prev, target_audience: e.target.value }))}
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Describe your target customers in detail - their demographics, needs, and pain points"
                />
                {renderSuggestionTags('target_audience')}
              </div>

              {/* Sales Channels */}
              <div>
                <label htmlFor="sales_channels" className="block text-sm font-medium text-gray-900">
                  Where do you picture this being sold?
                </label>
                <textarea
                  id="sales_channels"
                  rows={2}
                  value={marketData.sales_channels}
                  onChange={(e) => setMarketData(prev => ({ ...prev, sales_channels: e.target.value }))}
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., Online marketplace, retail stores, direct sales, events"
                />
                {renderSuggestionTags('sales_channels')}
              </div>

              {/* Pricing Model */}
              <div>
                <label htmlFor="pricing_model" className="block text-sm font-medium text-gray-900">
                  How would you price this?
                </label>
                <textarea
                  id="pricing_model"
                  rows={2}
                  value={marketData.pricing_model}
                  onChange={(e) => setMarketData(prev => ({ ...prev, pricing_model: e.target.value }))}
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., Subscription, one-time purchase, freemium, usage-based"
                />
                {renderSuggestionTags('pricing_model')}
              </div>

              {/* Customer Type */}
              <div>
                <label htmlFor="customer_type" className="block text-sm font-medium text-gray-900">
                  Who would use this—consumers, businesses, or both?
                </label>
                <textarea
                  id="customer_type"
                  rows={2}
                  value={marketData.customer_type}
                  onChange={(e) => setMarketData(prev => ({ ...prev, customer_type: e.target.value }))}
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Describe whether this is B2C, B2B, or B2B2C and why"
                />
                {renderSuggestionTags('customer_type')}
              </div>

              {/* Integration Needs */}
              <div>
                <label htmlFor="integration_needs" className="block text-sm font-medium text-gray-900">
                  Would this integrate into existing systems, or be standalone?
                </label>
                <textarea
                  id="integration_needs"
                  rows={2}
                  value={marketData.integration_needs}
                  onChange={(e) => setMarketData(prev => ({ ...prev, integration_needs: e.target.value }))}
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Describe any integration requirements or dependencies"
                />
                {renderSuggestionTags('integration_needs')}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={generateMarketInsights}
                  disabled={isGenerating}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Analyzing Market...' : 'Get Market Insights'}
                </button>
              </div>
            </div>

            {/* Market Insights */}
            {marketData.market_insights.customer_profiles.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Market Analysis</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Profiles */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Customer Profiles
                    </h4>
                    <ul className="space-y-2">
                      {marketData.market_insights.customer_profiles.map((profile, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="text-indigo-500 mr-2">•</span>
                          {profile}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Early Adopters */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <Target className="h-4 w-4 mr-2" />
                      Early Adopters
                    </h4>
                    <ul className="space-y-2">
                      {marketData.market_insights.early_adopters.map((adopter, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          {adopter}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sales Channels */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <Store className="h-4 w-4 mr-2" />
                      Sales Channels
                    </h4>
                    <ul className="space-y-2">
                      {marketData.market_insights.sales_channels.map((channel, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {channel}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pricing Insights */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Pricing Insights
                    </h4>
                    <ul className="space-y-2">
                      {marketData.market_insights.pricing_insights.map((insight, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="text-yellow-500 mr-2">•</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Integration Recommendations */}
                  {marketData.market_insights.integration_recommendations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                        <Building2 className="h-4 w-4 mr-2" />
                        Integration Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {marketData.market_insights.integration_recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <span className="text-purple-500 mr-2">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Market Size */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Market Size Estimates
                    </h4>
                    <ul className="space-y-2">
                      {marketData.market_insights.market_size_estimates.map((estimate, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="text-orange-500 mr-2">•</span>
                          {estimate}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Competition Analysis */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Competition Analysis
                  </h4>
                  <ul className="space-y-2">
                    {marketData.market_insights.competition_analysis.map((analysis, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        {analysis}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    onClick={() => handleSave(false)}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Progress
                  </button>
                  <button
                    onClick={() => handleSave(true)}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Continue to Business Model
                    <ArrowRight className="h-4 w-4 ml-2" />
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
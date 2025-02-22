import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  BarChart3,
  ArrowLeft,
  Save,
  ArrowRight,
  Brain,
  AlertCircle,
  RotateCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { generateMarketSuggestions, generateMarketAnalysis } from '../../lib/openai';
import MarketSuggestions from '../../components/MarketSuggestions';
import MarketAnalysis from '../../components/MarketAnalysis';

interface MarketQuestionnaire {
  target_audience: string;
  sales_channels: string;
  pricing_model: string;
  customer_type: string;
  integration_needs: string;
}

export default function MarketValidation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [isRegeneratingSection, setIsRegeneratingSection] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState<'initial' | 'suggestions' | 'analysis'>('initial');
  const [ideaId, setIdeaId] = useState<string | null>(null);
  const [ideaData, setIdeaData] = useState<any>(null);
  const [questionnaire, setQuestionnaire] = useState<MarketQuestionnaire>({
    target_audience: '',
    sales_channels: '',
    pricing_model: '',
    customer_type: '',
    integration_needs: ''
  });
  const [suggestions, setSuggestions] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    if (location.state?.ideaId) {
      setIdeaId(location.state.ideaId);
      loadIdea(location.state.ideaId);
    }
  }, [location]);

  const loadIdea = async (id: string) => {
    try {
      const { data: idea, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (idea) {
        setIdeaData(idea);
        // Pre-fill questionnaire with any existing data
        setQuestionnaire({
          target_audience: idea.target_audience || '',
          sales_channels: idea.channels?.join(', ') || '',
          pricing_model: idea.revenue_streams?.[0]?.model || '',
          customer_type: idea.target_audience || '',
          integration_needs: ''
        });
        // Generate suggestions immediately
        generateSuggestions(idea);
      }
    } catch (error: any) {
      console.error('Error loading idea:', error);
      setError(error.message);
    }
  };

  const generateSuggestions = async (idea: any) => {
    setIsLoading(true);
    setError('');

    try {
      const suggestions = await generateMarketSuggestions(idea);
      setSuggestions(suggestions);
      setStep('suggestions');
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (category: string, suggestion: string) => {
    const currentValue = questionnaire[category as keyof typeof questionnaire] || '';
    const suggestions = currentValue.split(',').map(s => s.trim()).filter(Boolean);
    
    // If suggestion already exists, remove it
    if (suggestions.includes(suggestion)) {
      const newSuggestions = suggestions.filter(s => s !== suggestion);
      setQuestionnaire(prev => ({
        ...prev,
        [category]: newSuggestions.join(', ')
      }));
    } else {
      // Add new suggestion
      suggestions.push(suggestion);
      setQuestionnaire(prev => ({
        ...prev,
        [category]: suggestions.join(', ')
      }));
    }
  };

  const generateAnalysis = async () => {
    setIsGeneratingAnalysis(true);
    setError('');

    try {
      const analysis = await generateMarketAnalysis(questionnaire);
      setAnalysis(analysis);
      setStep('analysis');

      // Save analysis to idea
      if (ideaId) {
        const { error } = await supabase
          .from('ideas')
          .update({
            target_audience: questionnaire.target_audience,
            channels: questionnaire.sales_channels.split(',').map(s => s.trim()).filter(Boolean),
            revenue_streams: [{
              model: questionnaire.pricing_model,
              details: questionnaire.pricing_model
            }],
            market_insights: analysis.market_insights,
            updated_at: new Date().toISOString()
          })
          .eq('id', ideaId);

        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Error generating analysis:', error);
      setError(error.message);
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  const handleRegenerateSection = async (section: string) => {
    setIsRegeneratingSection(section);
    try {
      const analysis = await generateMarketAnalysis({
        ...questionnaire,
        focus_section: section
      });
      setAnalysis(prev => ({
        ...prev,
        market_insights: {
          ...prev.market_insights,
          [section]: analysis.market_insights[section]
        }
      }));
    } catch (error: any) {
      console.error('Error regenerating section:', error);
      setError(error.message);
    } finally {
      setIsRegeneratingSection(null);
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 text-gray-400 hover:text-gray-500"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                <BarChart3 className="h-6 w-6 mr-2" />
                Market Validation
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Validate your market assumptions and identify opportunities
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

        {/* Market Suggestions */}
        {step === 'suggestions' && suggestions && (
          <MarketSuggestions
            suggestions={suggestions}
            onSuggestionClick={handleSuggestionClick}
            onContinue={generateAnalysis}
            currentValues={questionnaire}
            isLoading={isGeneratingAnalysis}
          />
        )}

        {/* Market Analysis */}
        {step === 'analysis' && analysis && (
          <MarketAnalysis
            analysis={analysis}
            onRegenerateSection={handleRegenerateSection}
            onContinue={() => navigate('/idea-hub/business-model', { 
              state: { ideaId, marketInsights: analysis.market_insights }
            })}
            isLoading={isGeneratingAnalysis}
            isRegenerating={isRegeneratingSection}
          />
        )}
      </div>
    </div>
  );
}
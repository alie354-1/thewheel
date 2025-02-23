import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lightbulb,
  ArrowLeft,
  Brain,
  AlertCircle,
  Save,
  ArrowRight,
  Check,
  RotateCw,
  Edit,
  Plus,
  X,
  Wand2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { generateIdeaVariations, generateCombinedIdeas } from '../../lib/openai';

interface Variation {
  id: string;
  title: string;
  description: string;
  differentiator: string;
  targetMarket: string;
  revenueModel: string;
  isSelected: boolean;
  isEditing: boolean;
  editedTitle?: string;
  editedDescription?: string;
  likedAspects?: string;
}

interface RefinedIdea {
  id: string;
  title: string;
  description: string;
  sourceElements: string[];
  targetMarket: string;
  revenueModel: string;
  valueProposition: string;
  isSelected: boolean;
  isEditing: boolean;
  editedTitle?: string;
  editedDescription?: string;
}

export default function IdeaRefinement() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegeneratingSingle, setIsRegeneratingSingle] = useState<string | null>(null);
  const [isRegeneratingCombined, setIsRegeneratingCombined] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState<'initial' | 'variations' | 'combined'>('initial');
  const [ideaData, setIdeaData] = useState({
    title: '',
    inspiration: '',
    type: ''
  });
  const [variations, setVariations] = useState<Variation[]>([]);
  const [refinedIdeas, setRefinedIdeas] = useState<RefinedIdea[]>([]);

  const handleSave = async (continueToNext: boolean = false) => {
    if (!user) return;

    const selectedVariations = variations.filter(v => v.isSelected);
    if (selectedVariations.length === 0) {
      setError('Please select at least one variation to continue');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      // Prepare the idea data based on selection
      const selectedIdea = selectedVariations.length === 1 
        ? {
            title: selectedVariations[0].title,
            description: selectedVariations[0].description,
            target_market: selectedVariations[0].targetMarket,
            solution_concept: selectedVariations[0].differentiator,
            status: 'draft',
            ai_feedback: {
              source_elements: [selectedVariations[0].differentiator],
              revenue_model: selectedVariations[0].revenueModel,
              original_variations: selectedVariations.map(v => ({
                title: v.title,
                description: v.description,
                differentiator: v.differentiator,
                target_market: v.targetMarket,
                revenue_model: v.revenueModel,
                liked_aspects: v.likedAspects
              }))
            }
          }
        : {
            title: refinedIdeas.find(idea => idea.isSelected)?.title || '',
            description: refinedIdeas.find(idea => idea.isSelected)?.description || '',
            target_market: refinedIdeas.find(idea => idea.isSelected)?.targetMarket || '',
            solution_concept: refinedIdeas.find(idea => idea.isSelected)?.valueProposition || '',
            status: 'draft',
            ai_feedback: {
              source_elements: refinedIdeas.find(idea => idea.isSelected)?.sourceElements || [],
              revenue_model: refinedIdeas.find(idea => idea.isSelected)?.revenueModel || '',
              original_variations: variations
                .filter(v => v.isSelected)
                .map(v => ({
                  title: v.title,
                  description: v.description,
                  differentiator: v.differentiator,
                  target_market: v.targetMarket,
                  revenue_model: v.revenueModel,
                  liked_aspects: v.likedAspects
                }))
            }
          };

      const { data: idea, error: saveError } = await supabase
        .from('ideas')
        .insert(selectedIdea)
        .select()
        .single();

      if (saveError) throw saveError;

      setSuccess('Progress saved successfully!');

      if (continueToNext && idea) {
        // Navigate to market validation step with the idea ID and data
        navigate('/idea-hub/market-validation', { 
          state: { 
            ideaId: idea.id,
            ideaData: {
              title: selectedIdea.title,
              description: selectedIdea.description,
              target_market: selectedIdea.target_market,
              solution_concept: selectedIdea.solution_concept
            }
          }
        });
      }
    } catch (error: any) {
      console.error('Error saving progress:', error);
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const generateVariations = async () => {
    if (!ideaData.title.trim()) {
      setError('Please describe your idea first');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      console.log('Generating variations for:', ideaData);
      const variations = await generateIdeaVariations(ideaData);
      console.log('Received variations:', variations);
      
      if (!Array.isArray(variations)) {
        throw new Error('Invalid response format: variations should be an array');
      }

      setVariations(variations);
      setStep('variations');
    } catch (error: any) {
      console.error('Error generating variations:', error);
      setError(error.message || 'Failed to generate variations. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateVariation = async (variationId: string) => {
    setIsRegeneratingSingle(variationId);
    setError('');

    try {
      const variation = variations.find(v => v.id === variationId);
      if (!variation) return;

      const newVariations = await generateIdeaVariations({
        title: ideaData.title,
        inspiration: `Original variation: ${variation.title} - ${variation.description}`,
        type: ideaData.type
      });

      if (newVariations && newVariations.length > 0) {
        setVariations(prev => prev.map(v => 
          v.id === variationId ? {
            ...v,
            title: newVariations[0].title,
            description: newVariations[0].description,
            differentiator: newVariations[0].differentiator,
            targetMarket: newVariations[0].targetMarket,
            revenueModel: newVariations[0].revenueModel,
            isEditing: false
          } : v
        ));
      }
    } catch (error: any) {
      console.error('Error regenerating variation:', error);
      setError(error.message || 'Failed to regenerate variation');
    } finally {
      setIsRegeneratingSingle(null);
    }
  };

  const generateCombined = async () => {
    const selectedVariations = variations.filter(v => v.isSelected);
    if (selectedVariations.length < 2) {
      setError('Please select at least two variations to combine');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      console.log('Generating combined ideas from:', selectedVariations);
      const combinedIdeas = await generateCombinedIdeas(
        ideaData.title,
        selectedVariations
      );
      console.log('Received combined ideas:', combinedIdeas);

      if (!Array.isArray(combinedIdeas)) {
        throw new Error('Invalid response format: combined ideas should be an array');
      }

      setRefinedIdeas(combinedIdeas);
      setStep('combined');
    } catch (error: any) {
      console.error('Error generating combined ideas:', error);
      setError(error.message || 'Failed to generate combined ideas');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleVariationSelection = (id: string) => {
    setVariations(prev => prev.map(v => ({
      ...v,
      isSelected: v.id === id ? !v.isSelected : v.isSelected
    })));
  };

  const toggleVariationEdit = (id: string) => {
    setVariations(prev => prev.map(v => {
      if (v.id === id) {
        return {
          ...v,
          isEditing: !v.isEditing,
          editedTitle: v.title,
          editedDescription: v.description
        };
      }
      return v;
    }));
  };

  const saveVariationEdit = (id: string) => {
    setVariations(prev => prev.map(v => {
      if (v.id === id) {
        return {
          ...v,
          title: v.editedTitle || v.title,
          description: v.editedDescription || v.description,
          isEditing: false,
          editedTitle: undefined,
          editedDescription: undefined
        };
      }
      return v;
    }));
  };

  const updateVariationContent = (id: string, field: string, value: string) => {
    setVariations(prev => prev.map(v => {
      if (v.id === id) {
        return {
          ...v,
          [`edited${field.charAt(0).toUpperCase() + field.slice(1)}`]: value
        };
      }
      return v;
    }));
  };

  const updateLikedAspects = (id: string, value: string) => {
    setVariations(prev => prev.map(v => {
      if (v.id === id) {
        return {
          ...v,
          likedAspects: value
        };
      }
      return v;
    }));
  };

  const selectRefinedIdea = (id: string) => {
    setRefinedIdeas(prev => prev.map(idea => ({
      ...idea,
      isSelected: idea.id === id
    })));
  };

  const toggleRefinedIdeaEdit = (id: string) => {
    setRefinedIdeas(prev => prev.map(idea => {
      if (idea.id === id) {
        return {
          ...idea,
          isEditing: !idea.isEditing,
          editedTitle: idea.title,
          editedDescription: idea.description
        };
      }
      return idea;
    }));
  };

  const updateRefinedIdeaContent = (id: string, field: string, value: string) => {
    setRefinedIdeas(prev => prev.map(idea => {
      if (idea.id === id) {
        return {
          ...idea,
          [`edited${field.charAt(0).toUpperCase() + field.slice(1)}`]: value
        };
      }
      return idea;
    }));
  };

  const regenerateCombinedIdea = async (id: string) => {
    setIsRegeneratingCombined(id);
    try {
      await generateCombined();
    } finally {
      setIsRegeneratingCombined(null);
    }
  };

  const handleBack = () => {
    if (step === 'combined') {
      setStep('variations');
    } else if (step === 'variations') {
      setStep('initial');
    } else {
      navigate('/idea-hub');
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="mr-4 text-gray-400 hover:text-gray-500"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                <Lightbulb className="h-6 w-6 mr-2" />
                {step === 'initial' && 'Step 1: Initial Idea'}
                {step === 'variations' && 'Step 2: Explore Variations'}
                {step === 'combined' && 'Step 3: Refine Combined Ideas'}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {step === 'initial' && "Let's start by exploring your core idea"}
                {step === 'variations' && 'Select the variations you want to explore further'}
                {step === 'combined' && 'Choose the best combination of your selected variations'}
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
            {/* Initial Step */}
            {step === 'initial' && (
              <div className="space-y-6">
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
                  <label htmlFor="inspiration" className="block text-sm font-medium text-gray-700">
                    What inspired this idea?
                  </label>
                  <textarea
                    id="inspiration"
                    rows={3}
                    value={ideaData.inspiration}
                    onChange={(e) => setIdeaData(prev => ({ ...prev, inspiration: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g., 'I hate waiting for customer service calls and think AI could help' or 'I love ponies and think they'd look great in tutus'"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Do you see this as a product, technology, or service?
                  </label>
                  <textarea
                    id="type"
                    rows={2}
                    value={ideaData.type}
                    onChange={(e) => setIdeaData(prev => ({ ...prev, type: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g., 'A physical product line of custom-made tutus' or 'A software tool that uses AI'"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={generateVariations}
                    disabled={isGenerating}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    {isGenerating ? 'Generating Ideas...' : 'Generate Variations'}
                  </button>
                </div>
              </div>
            )}

            {/* Variations Step */}
            {step === 'variations' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Select Variations to Explore</h3>
                <div className="space-y-4">
                  {variations.map((variation) => (
                    <div 
                      key={variation.id}
                      className={`bg-white border rounded-lg p-4 ${
                        variation.isSelected ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {variation.isEditing ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={variation.editedTitle}
                                onChange={(e) => updateVariationContent(variation.id, 'title', e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                              <textarea
                                value={variation.editedDescription}
                                onChange={(e) => updateVariationContent(variation.id, 'description', e.target.value)}
                                rows={3}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                          ) : (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{variation.title}</h4>
                              <p className="mt-1 text-sm text-gray-600">{variation.description}</p>
                              <div className="mt-2 space-y-2">
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Key Differentiator:</span> {variation.differentiator}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Target Market:</span> {variation.targetMarket}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Revenue Model:</span> {variation.revenueModel}
                                </p>
                              </div>
                            </div>
                          )}

                          {variation.isSelected && (
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700">
                                What aspects of this variation do you like?
                              </label>
                              <textarea
                                value={variation.likedAspects}
                                onChange={(e) => updateLikedAspects(variation.id, e.target.value)}
                                rows={2}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="e.g., 'The target market focus' or 'The revenue model'"
                              />
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex items-center space-x-2">
                          <button
                            onClick={() => toggleVariationSelection(variation.id)}
                            className={`p-1 rounded-full ${
                              variation.isSelected 
                                ? 'text-indigo-600 hover:text-indigo-700' 
                                : 'text-gray-400 hover:text-gray-500'
                            }`}
                          >
                            <Check className="h-5 w-5" />
                          </button>
                          {variation.isEditing ? (
                            <button
                              onClick={() => saveVariationEdit(variation.id)}
                              className="p-1 text-green-600 hover:text-green-700"
                            >
                              <Save className="h-5 w-5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleVariationEdit(variation.id)}
                              className="p-1 text-gray-400 hover:text-gray-500"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => regenerateVariation(variation.id)}
                            disabled={isRegeneratingSingle === variation.id}
                            className="p-1 text-gray-400 hover:text-gray-500 disabled:opacity-50"
                          >
                            <RotateCw className={isRegeneratingSingle === variation.id ? 'h-5 w-5 animate-spin' : 'h-5 w-5'} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Updated Combine/Continue Button */}
                <div className="mt-6 flex justify-end">
                  {variations.filter(v => v.isSelected).length > 0 && (
                    <button
                      onClick={variations.filter(v => v.isSelected).length === 1 
                        ? () => handleSave(true)  // Go straight to market validation
                        : generateCombined}       // Generate combined options
                      disabled={isGenerating}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {variations.filter(v => v.isSelected).length === 1 ? (
                        <>
                          Continue to Market Validation
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          {isGenerating ? 'Generating Options...' : 'Generate Combined Options'}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Combined Ideas Step */}
            {step === 'combined' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Choose One Combined Concept</h3>
                
                {refinedIdeas.map((idea) => (
                  <div 
                    key={idea.id}
                    className={`bg-white border rounded-lg p-6 mb-4 ${
                      idea.isSelected ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        {idea.isEditing ? (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Title</label>
                              <input
                                type="text"
                                value={idea.editedTitle}
                                onChange={(e) => updateRefinedIdeaContent(idea.id, 'title', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Description</label>
                              <textarea
                                value={idea.editedDescription}
                                onChange={(e) => updateRefinedIdeaContent(idea.id, 'description', e.target.value)}
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <h4 className="text-lg font-medium text-gray-900">{idea.title}</h4>
                            <p className="mt-2 text-sm text-gray-600">{idea.description}</p>
                            
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-gray-700">Key Elements</h5>
                              <ul className="mt-2 space-y-1">
                                {idea.sourceElements.map((element: string, index: number) => (
                                  <li key={index} className="text-sm text-gray-600 flex items-start">
                                    <span className="text-indigo-500 mr-2">•</span>
                                    {element}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h5 className="text-sm font-medium text-gray-700">Target Market</h5>
                                <p className="mt-1 text-sm text-gray-600">{idea.targetMarket}</p>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium text-gray-700">Revenue Model</h5>
                                <p className="mt-1 text-sm text-gray-600">{idea.revenueModel}</p>
                              </div>
                            </div>

                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-gray-700">Value Proposition</h5>
                              <p className="mt-1 text-sm text-gray-600">{idea.valueProposition}</p>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="ml-4 flex items-center space-x-2">
                        <button
                          onClick={() => selectRefinedIdea(idea.id)}
                          className={`p-1 rounded-full ${
                            idea.isSelected 
                              ? 'text-indigo-600 hover:text-indigo-700' 
                              : 'text-gray-400 hover:text-gray-500'
                          }`}
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => toggleRefinedIdeaEdit(idea.id)}
                          className="p-1 text-gray-400 hover:text-gray-500"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => regenerateCombinedIdea(idea.id)}
                          disabled={isRegeneratingCombined === idea.id}
                          className="p-1 text-gray-400 hover:text-gray-500 disabled:opacity-50"
                        >
                          <RefreshCw className={isRegeneratingCombined === idea.id ? 'h-5 w-5 animate-spin' : 'h-5 w-5'} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Action Buttons */}
                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    onClick={() => handleSave(false)}
                    disabled={isSaving}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Progress
                  </button>
                  <button
                    onClick={() => handleSave(true)}
                    disabled={isSaving || !refinedIdeas.find(idea => idea.isSelected)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Continue to Market Validation
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
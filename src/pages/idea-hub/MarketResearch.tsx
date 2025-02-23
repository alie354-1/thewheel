import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ArrowLeft,
  Brain,
  Users,
  Target,
  Building,
  DollarSign,
  TrendingUp,
  Save,
  RotateCw,
  ArrowRight,
  Edit2,
  X,
  Check,
  Trash2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { generateMarketAnalysis } from '../../lib/openai';

interface Source {
  name: string;
  url: string;
  type: string;
  year: number;
}

interface CustomerProfile {
  segment: string;
  description: string;
  needs: string[];
  pain_points: string[];
  buying_behavior: string;
  sources: Source[];
}

interface MarketAnalysis {
  customer_profiles: CustomerProfile[];
  early_adopters: {
    type: string;
    characteristics: string[];
    acquisition_strategy: string;
    sources: Source[];
  }[];
  sales_channels: {
    channel: string;
    effectiveness: number;
    cost: string;
    timeline: string;
    sources: Source[];
  }[];
  pricing_insights: {
    model: string;
    price_point: string;
    justification: string;
    sources: Source[];
  }[];
  market_size: {
    tam: string;
    sam: string;
    som: string;
    growth_rate: string;
    sources: Source[];
  };
}

interface EditableProfile extends CustomerProfile {
  isEditing: boolean;
}

const renderSources = (sources: Source[]) => (
  <div className="mt-4 border-t border-gray-100 pt-4">
    <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Sources</h5>
    <div className="space-y-2">
      {sources.map((source, index) => (
        <div key={index} className="flex items-start">
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:text-indigo-900"
          >
            {source.name}
            <span className="text-gray-500 ml-2">
              ({source.year} • {source.type.replace(/_/g, ' ')})
            </span>
          </a>
        </div>
      ))}
    </div>
  </div>
);

export default function MarketResearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [idea, setIdea] = useState<any>(null);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState('customer_profiles');
  const [editableProfiles, setEditableProfiles] = useState<EditableProfile[]>([]);

  useEffect(() => {
    loadIdea();
  }, [location.state]);

  useEffect(() => {
    if (analysis) {
      setEditableProfiles(
        analysis.customer_profiles.map(profile => ({
          ...profile,
          isEditing: false
        }))
      );
    }
  }, [analysis]);

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
      setIdea(idea);
    } catch (error) {
      console.error('Error loading idea:', error);
      setError('Failed to load idea data');
    }
  };

  const handleGenerateAnalysis = async () => {
    if (!idea) return;

    setIsGenerating(true);
    setError('');

    try {
      const analysis = await generateMarketAnalysis(idea);
      setAnalysis(analysis);
      setEditableProfiles(
        analysis.customer_profiles.map(profile => ({
          ...profile,
          isEditing: false
        }))
      );
    } catch (error: any) {
      console.error('Error generating market analysis:', error);
      setError(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleEditProfile = (index: number) => {
    setEditableProfiles(prev =>
      prev.map((profile, i) => ({
        ...profile,
        isEditing: i === index ? !profile.isEditing : profile.isEditing
      }))
    );
  };

  const updateProfile = (index: number, field: keyof CustomerProfile, value: any) => {
    setEditableProfiles(prev =>
      prev.map((profile, i) =>
        i === index
          ? {
              ...profile,
              [field]: value
            }
          : profile
      )
    );
  };

  const handleDeleteProfile = (index: number) => {
    if (!window.confirm('Are you sure you want to delete this customer profile?')) {
      return;
    }

    setEditableProfiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user || !idea || !analysis) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Update analysis with edited profiles
      const updatedAnalysis = {
        ...analysis,
        customer_profiles: editableProfiles.map(({ isEditing, ...profile }) => profile)
      };

      const { error: updateError } = await supabase
        .from('ideas')
        .update({
          market_insights: updatedAnalysis,
          status: 'validated'
        })
        .eq('id', idea.id);

      if (updateError) throw updateError;

      setSuccess('Market analysis saved successfully!');
      setAnalysis(updatedAnalysis);
      
      // Reset editing state
      setEditableProfiles(prev =>
        prev.map(profile => ({
          ...profile,
          isEditing: false
        }))
      );

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error: any) {
      console.error('Error saving market analysis:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
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
                <BarChart3 className="h-6 w-6 mr-2" />
                Market Analysis
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Analyze your market opportunity and competition
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerateAnalysis}
            disabled={isGenerating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                Generating Analysis...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Generate Analysis
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Analysis Content */}
        <div className="bg-white shadow rounded-lg">
          {/* Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('customer_profiles')}
                className={`${
                  activeTab === 'customer_profiles'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center justify-center`}
              >
                <Users className="h-5 w-5 mr-2" />
                Customer Profiles
              </button>
              <button
                onClick={() => setActiveTab('early_adopters')}
                className={`${
                  activeTab === 'early_adopters'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center justify-center`}
              >
                <Target className="h-5 w-5 mr-2" />
                Early Adopters
              </button>
              <button
                onClick={() => setActiveTab('sales_channels')}
                className={`${
                  activeTab === 'sales_channels'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center justify-center`}
              >
                <Building className="h-5 w-5 mr-2" />
                Sales Channels
              </button>
              <button
                onClick={() => setActiveTab('pricing_insights')}
                className={`${
                  activeTab === 'pricing_insights'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center justify-center`}
              >
                <DollarSign className="h-5 w-5 mr-2" />
                Pricing Insights
              </button>
              <button
                onClick={() => setActiveTab('market_size')}
                className={`${
                  activeTab === 'market_size'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center justify-center`}
              >
                <TrendingUp className="h-5 w-5 mr-2" />
                Market Size
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {!analysis ? (
              <div className="text-center py-12">
                <Brain className="h-12 w-12 text-gray-400 mx-auto" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No analysis yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Click the "Generate Analysis" button to analyze your market opportunity
                </p>
              </div>
            ) : (
              <>
                {/* Customer Profiles */}
                {activeTab === 'customer_profiles' && (
                  <div className="space-y-6">
                    {editableProfiles.map((profile, index) => (
                      <div key={index} className="bg-white border rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            {profile.isEditing ? (
                              <input
                                type="text"
                                value={profile.segment}
                                onChange={(e) => updateProfile(index, 'segment', e.target.value)}
                                className="text-lg font-medium text-gray-900 border-b border-gray-300 focus:border-indigo-500 focus:ring-0 w-full"
                              />
                            ) : (
                              <h4 className="text-lg font-medium text-gray-900">{profile.segment}</h4>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleEditProfile(index)}
                              className="p-1 rounded-full hover:bg-gray-100"
                            >
                              {profile.isEditing ? (
                                <Check className="h-5 w-5 text-green-500" />
                              ) : (
                                <Edit2 className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteProfile(index)}
                              className="p-1 rounded-full hover:bg-gray-100 text-red-400 hover:text-red-500"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>

                        {profile.isEditing ? (
                          <textarea
                            value={profile.description}
                            onChange={(e) => updateProfile(index, 'description', e.target.value)}
                            className="text-gray-600 mb-4 w-full border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500"
                            rows={3}
                          />
                        ) : (
                          <p className="text-gray-600 mb-4">{profile.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Needs</h5>
                            {profile.isEditing ? (
                              <div className="space-y-2">
                                {profile.needs.map((need, i) => (
                                  <div key={i} className="flex items-center">
                                    <input
                                      type="text"
                                      value={need}
                                      onChange={(e) => {
                                        const newNeeds = [...profile.needs];
                                        newNeeds[i] = e.target.value;
                                        updateProfile(index, 'needs', newNeeds);
                                      }}
                                      className="flex-1 text-sm border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    <button
                                      onClick={() => {
                                        const newNeeds = profile.needs.filter((_, idx) => idx !== i);
                                        updateProfile(index, 'needs', newNeeds);
                                      }}
                                      className="ml-2 text-gray-400 hover:text-gray-500"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    updateProfile(index, 'needs', [...profile.needs, '']);
                                  }}
                                  className="text-sm text-indigo-600 hover:text-indigo-900"
                                >
                                  + Add Need
                                </button>
                              </div>
                            ) : (
                              <ul className="space-y-2">
                                {profile.needs.map((need, i) => (
                                  <li key={i} className="text-sm text-gray-600 flex items-start">
                                    <span className="text-indigo-500 mr-2">•</span>
                                    {need}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Pain Points</h5>
                            {profile.isEditing ? (
                              <div className="space-y-2">
                                {profile.pain_points.map((point, i) => (
                                  <div key={i} className="flex items-center">
                                    <input
                                      type="text"
                                      value={point}
                                      onChange={(e) => {
                                        const newPoints = [...profile.pain_points];
                                        newPoints[i] = e.target.value;
                                        updateProfile(index, 'pain_points', newPoints);
                                      }}
                                      className="flex-1 text-sm border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    <button
                                      onClick={() => {
                                        const newPoints = profile.pain_points.filter((_, idx) => idx !== i);
                                        updateProfile(index, 'pain_points', newPoints);
                                      }}
                                      className="ml-2 text-gray-400 hover:text-gray-500"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    updateProfile(index, 'pain_points', [...profile.pain_points, '']);
                                  }}
                                  className="text-sm text-indigo-600 hover:text-indigo-900"
                                >
                                  + Add Pain Point
                                </button>
                              </div>
                            ) : (
                              <ul className="space-y-2">
                                {profile.pain_points.map((point, i) => (
                                  <li key={i} className="text-sm text-gray-600 flex items-start">
                                    <span className="text-red-500 mr-2">•</span>
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>

                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Buying Behavior</h5>
                          {profile.isEditing ? (
                            <textarea
                              value={profile.buying_behavior}
                              onChange={(e) => updateProfile(index, 'buying_behavior', e.target.value)}
                              className="text-sm text-gray-600 w-full border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500"
                              rows={2}
                            />
                          ) : (
                            <p className="text-sm text-gray-600">{profile.buying_behavior}</p>
                          )}
                        </div>

                        {renderSources(profile.sources)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Early Adopters */}
                {activeTab === 'early_adopters' && (
                  <div className="space-y-6">
                    {analysis.early_adopters.map((adopter, index) => (
                      <div key={index} className="bg-white border rounded-lg p-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">{adopter.type}</h4>
                        
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Characteristics</h5>
                          <ul className="space-y-2">
                            {adopter.characteristics.map((char, i) => (
                              <li key={i} className="text-sm text-gray-600 flex items-start">
                                <span className="text-indigo-500 mr-2">•</span>
                                {char}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Acquisition Strategy</h5>
                          <p className="text-sm text-gray-600">{adopter.acquisition_strategy}</p>
                        </div>

                        {renderSources(adopter.sources)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Sales Channels */}
                {activeTab === 'sales_channels' && (
                  <div className="space-y-6">
                    {analysis.sales_channels.map((channel, index) => (
                      <div key={index} className="bg-white border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-medium text-gray-900">{channel.channel}</h4>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-2">Effectiveness:</span>
                            <div className="w-24 h-2 bg-gray-200 rounded-full">
                              <div
                                className="h-2 bg-indigo-600 rounded-full"
                                style={{ width: `${channel.effectiveness * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Cost</h5>
                            <p className="text-sm text-gray-600">{channel.cost}</p>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Timeline</h5>
                            <p className="text-sm text-gray-600">{channel.timeline}</p>
                          </div>
                        </div>

                        {renderSources(channel.sources)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Pricing Insights */}
                {activeTab === 'pricing_insights' && (
                  <div className="space-y-6">
                    {analysis.pricing_insights.map((insight, index) => (
                      <div key={index} className="bg-white border rounded-lg p-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">{insight.model}</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Price Point</h5>
                            <p className="text-sm text-gray-600">{insight.price_point}</p>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Justification</h5>
                            <p className="text-sm text-gray-600">{insight.justification}</p>
                          </div>
                        </div>

                        {renderSources(insight.sources)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Market Size */}
                {activeTab === 'market_size' && (
                  <div className="space-y-6">
                    <div className="bg-white border rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Total Addressable Market (TAM)</h4>
                          <p className="text-lg font-semibold text-gray-900">{analysis.market_size.tam}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Serviceable Addressable Market (SAM)</h4>
                          <p className="text-lg font-semibold text-gray-900">{analysis.market_size.sam}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Serviceable Obtainable Market (SOM)</h4>
                          <p className="text-lg font-semibold text-gray-900">{analysis.market_size.som}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Growth Rate</h4>
                          <p className="text-lg font-semibold text-gray-900">{analysis.market_size.growth_rate}</p>
                        </div>
                      </div>

                      {renderSources(analysis.market_size.sources)}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Action Buttons */}
            {analysis && (
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Progress
                </button>
                <Link
                  to="/idea-hub/business-model"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Continue to Business Model
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
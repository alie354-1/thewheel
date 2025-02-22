import React, { useState } from 'react';
import { 
  Brain, 
  ArrowRight, 
  RefreshCw, 
  ExternalLink, 
  Edit, 
  Save, 
  X, 
  RotateCw,
  Plus,
  Trash2,
  Link as LinkIcon,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Target,
  DollarSign,
  Users,
  BarChart3
} from 'lucide-react';

interface MarketAnalysisProps {
  analysis: {
    market_insights: {
      customer_profiles: Array<{
        profile: string;
        data_points: Array<{
          point: string;
          sources: string[];
          commentary?: string;
        }>;
        sources: string[];
        commentary?: string;
      }>;
      early_adopters: Array<{
        segment: string;
        characteristics: Array<{
          trait: string;
          sources: string[];
          commentary?: string;
        }>;
        validation_method: string;
        sources: string[];
        commentary?: string;
      }>;
      sales_channels: Array<{
        channel: string;
        effectiveness: string;
        cost_metrics: string;
        examples: Array<{
          example: string;
          sources: string[];
          commentary?: string;
        }>;
        sources: string[];
        commentary?: string;
      }>;
      pricing_insights: Array<{
        model: string;
        market_data: string;
        competitor_analysis: string;
        sources: string[];
        commentary?: string;
      }>;
      integration_recommendations: Array<{
        integration: string;
        market_share: string;
        implementation_cost: string;
        sources: string[];
        commentary?: string;
      }>;
      market_size_estimates: Array<{
        segment: string;
        size: string;
        growth_rate: string;
        methodology: string;
        sources: string[];
        commentary?: string;
      }>;
      competition_analysis: Array<{
        competitor_type: string;
        market_share: string;
        strengths: Array<{
          point: string;
          sources: string[];
          commentary?: string;
        }>;
        weaknesses: Array<{
          point: string;
          sources: string[];
          commentary?: string;
        }>;
        sources: string[];
        commentary?: string;
      }>;
    };
  };
  onRegenerateSection?: (section: string) => Promise<void>;
  onContinue: () => void;
  isLoading?: boolean;
  isRegenerating?: string | null;
  onUpdateAnalysis?: (analysis: any) => void;
  onRequestMoreInsights?: (section: string, item: any) => Promise<void>;
}

interface EditableFieldProps {
  value: string;
  onChange: (value: string) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: () => void;
  label?: string;
  multiline?: boolean;
}

const EditableField: React.FC<EditableFieldProps> = ({
  value,
  onChange,
  isEditing,
  onStartEdit,
  onSave,
  label,
  multiline = false
}) => {
  if (isEditing) {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-xs font-medium text-gray-700">
            {label}
          </label>
        )}
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        )}
        <button
          onClick={onSave}
          className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Save className="h-3 w-3 mr-1" />
          Save
        </button>
      </div>
    );
  }

  return (
    <div className="group relative">
      {multiline ? (
        <p className="text-sm text-gray-600 whitespace-pre-wrap">{value}</p>
      ) : (
        <span className="text-sm text-gray-600">{value}</span>
      )}
      <button
        onClick={onStartEdit}
        className="absolute -right-6 top-0 p-1 text-gray-400 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Edit className="h-4 w-4" />
      </button>
    </div>
  );
};

export default function MarketAnalysis({ 
  analysis, 
  onRegenerateSection,
  onContinue,
  isLoading,
  isRegenerating,
  onUpdateAnalysis,
  onRequestMoreInsights
}: MarketAnalysisProps) {
  const [activeTab, setActiveTab] = useState('customer_profiles');
  const [editingSource, setEditingSource] = useState<{section: string; index: number; dataPointIndex?: number} | null>(null);
  const [newSource, setNewSource] = useState('');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const tabs = [
    { id: 'customer_profiles', name: 'Customer Profiles', icon: Users },
    { id: 'early_adopters', name: 'Early Adopters', icon: Target },
    { id: 'sales_channels', name: 'Sales Channels', icon: DollarSign },
    { id: 'pricing_insights', name: 'Pricing', icon: DollarSign },
    { id: 'integration_recommendations', name: 'Integration', icon: Lightbulb },
    { id: 'market_size_estimates', name: 'Market Size', icon: BarChart3 },
    { id: 'competition_analysis', name: 'Competition', icon: Target }
  ];

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAddSource = (section: string, index: number, dataPointIndex?: number) => {
    if (!newSource.trim()) return;

    const updatedAnalysis = { ...analysis };
    const insights = updatedAnalysis.market_insights[section as keyof typeof updatedAnalysis.market_insights];
    
    if (Array.isArray(insights) && insights[index]) {
      if (dataPointIndex !== undefined) {
        // Add source to specific data point
        const item = insights[index];
        if (section === 'customer_profiles' && item.data_points?.[dataPointIndex]) {
          item.data_points[dataPointIndex].sources.push(newSource);
        } else if (section === 'early_adopters' && item.characteristics?.[dataPointIndex]) {
          item.characteristics[dataPointIndex].sources.push(newSource);
        } else if (section === 'sales_channels' && item.examples?.[dataPointIndex]) {
          item.examples[dataPointIndex].sources.push(newSource);
        } else if (section === 'competition_analysis') {
          if (dataPointIndex < (item.strengths?.length || 0)) {
            item.strengths[dataPointIndex].sources.push(newSource);
          } else {
            const weaknessIndex = dataPointIndex - (item.strengths?.length || 0);
            if (item.weaknesses?.[weaknessIndex]) {
              item.weaknesses[weaknessIndex].sources.push(newSource);
            }
          }
        }
      } else {
        // Add source to main item
        insights[index].sources.push(newSource);
      }

      onUpdateAnalysis?.(updatedAnalysis);
    }

    setNewSource('');
    setEditingSource(null);
  };

  const handleRemoveSource = (section: string, index: number, sourceIndex: number, dataPointIndex?: number) => {
    const updatedAnalysis = { ...analysis };
    const insights = updatedAnalysis.market_insights[section as keyof typeof updatedAnalysis.market_insights];
    
    if (Array.isArray(insights) && insights[index]) {
      if (dataPointIndex !== undefined) {
        // Remove source from specific data point
        const item = insights[index];
        if (section === 'customer_profiles' && item.data_points?.[dataPointIndex]) {
          item.data_points[dataPointIndex].sources.splice(sourceIndex, 1);
        } else if (section === 'early_adopters' && item.characteristics?.[dataPointIndex]) {
          item.characteristics[dataPointIndex].sources.splice(sourceIndex, 1);
        } else if (section === 'sales_channels' && item.examples?.[dataPointIndex]) {
          item.examples[dataPointIndex].sources.splice(sourceIndex, 1);
        } else if (section === 'competition_analysis') {
          if (dataPointIndex < (item.strengths?.length || 0)) {
            item.strengths[dataPointIndex].sources.splice(sourceIndex, 1);
          } else {
            const weaknessIndex = dataPointIndex - (item.strengths?.length || 0);
            if (item.weaknesses?.[weaknessIndex]) {
              item.weaknesses[weaknessIndex].sources.splice(sourceIndex, 1);
            }
          }
        }
      } else {
        // Remove source from main item
        insights[index].sources.splice(sourceIndex, 1);
      }

      onUpdateAnalysis?.(updatedAnalysis);
    }
  };

  const renderSources = (sources: string[], section: string, index: number, dataPointIndex?: number) => (
    <div className="mt-2">
      <h5 className="text-xs font-medium text-gray-500 mb-1">Sources:</h5>
      <div className="space-y-1">
        {sources.map((source, sourceIndex) => (
          <div key={sourceIndex} className="flex items-center justify-between group">
            <a
              href={source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:text-indigo-900 flex items-center"
            >
              <LinkIcon className="h-3 w-3 mr-1" />
              {source}
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
            <button
              onClick={() => handleRemoveSource(section, index, sourceIndex, dataPointIndex)}
              className="p-1 text-gray-400 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          onClick={() => setEditingSource({ section, index, dataPointIndex })}
          className="text-xs text-indigo-600 hover:text-indigo-900 flex items-center"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Source
        </button>
      </div>
    </div>
  );

  const renderContent = (section: string, items: any[]) => {
    return items.map((item, index) => (
      <div key={index} className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <button
              onClick={() => toggleExpanded(`${section}_${index}`)}
              className="flex items-center text-sm font-medium text-gray-900 hover:text-indigo-600"
            >
              {expandedItems[`${section}_${index}`] ? (
                <ChevronDown className="h-4 w-4 mr-2" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-2" />
              )}
              {section === 'customer_profiles' && item.profile}
              {section === 'early_adopters' && item.segment}
              {section === 'sales_channels' && item.channel}
              {section === 'pricing_insights' && item.model}
              {section === 'integration_recommendations' && item.integration}
              {section === 'market_size_estimates' && item.segment}
              {section === 'competition_analysis' && item.competitor_type}
            </button>

            {expandedItems[`${section}_${index}`] && (
              <div className="mt-4 space-y-4">
                {section === 'customer_profiles' && (
                  <>
                    <div className="space-y-2">
                      {item.data_points.map((point: any, pointIndex: number) => (
                        <div key={pointIndex} className="ml-4">
                          <p className="text-sm text-gray-600">{point.point}</p>
                          {point.commentary && (
                            <p className="mt-1 text-sm text-gray-500 italic">{point.commentary}</p>
                          )}
                          {renderSources(point.sources, section, index, pointIndex)}
                        </div>
                      ))}
                    </div>
                    {item.commentary && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-700">{item.commentary}</p>
                      </div>
                    )}
                  </>
                )}

                {section === 'early_adopters' && (
                  <>
                    <div className="space-y-2">
                      {item.characteristics.map((char: any, charIndex: number) => (
                        <div key={charIndex} className="ml-4">
                          <p className="text-sm text-gray-600">{char.trait}</p>
                          {char.commentary && (
                            <p className="mt-1 text-sm text-gray-500 italic">{char.commentary}</p>
                          )}
                          {renderSources(char.sources, section, index, charIndex)}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-900 font-medium">Validation Method</p>
                      <p className="mt-1 text-sm text-gray-600">{item.validation_method}</p>
                    </div>
                    {item.commentary && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-700">{item.commentary}</p>
                      </div>
                    )}
                  </>
                )}

                {section === 'sales_channels' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-900 font-medium">Effectiveness</p>
                      <p className="mt-1 text-sm text-gray-600">{item.effectiveness}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-medium">Cost Metrics</p>
                      <p className="mt-1 text-sm text-gray-600">{item.cost_metrics}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-900 font-medium">Examples</p>
                      {item.examples.map((example: any, exampleIndex: number) => (
                        <div key={exampleIndex} className="ml-4">
                          <p className="text-sm text-gray-600">{example.example}</p>
                          {example.commentary && (
                            <p className="mt-1 text-sm text-gray-500 italic">{example.commentary}</p>
                          )}
                          {renderSources(example.sources, section, index, exampleIndex)}
                        </div>
                      ))}
                    </div>
                    {item.commentary && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-700">{item.commentary}</p>
                      </div>
                    )}
                  </>
                )}

                {section === 'pricing_insights' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-900 font-medium">Market Data</p>
                      <p className="mt-1 text-sm text-gray-600">{item.market_data}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-medium">Competitor Analysis</p>
                      <p className="mt-1 text-sm text-gray-600">{item.competitor_analysis}</p>
                    </div>
                    {item.commentary && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-700">{item.commentary}</p>
                      </div>
                    )}
                  </>
                )}

                {section === 'integration_recommendations' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-900 font-medium">Market Share</p>
                      <p className="mt-1 text-sm text-gray-600">{item.market_share}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-medium">Implementation Cost</p>
                      <p className="mt-1 text-sm text-gray-600">{item.implementation_cost}</p>
                    </div>
                    {item.commentary && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-700">{item.commentary}</p>
                      </div>
                    )}
                  </>
                )}

                {section === 'market_size_estimates' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-900 font-medium">Size</p>
                      <p className="mt-1 text-sm text-gray-600">{item.size}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-medium">Growth Rate</p>
                      <p className="mt-1 text-sm text-gray-600">{item.growth_rate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-medium">Methodology</p>
                      <p className="mt-1 text-sm text-gray-600">{item.methodology}</p>
                    </div>
                    {item.commentary && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-700">{item.commentary}</p>
                      </div>
                    )}
                  </>
                )}

                {section === 'competition_analysis' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-900 font-medium">Market Share</p>
                      <p className="mt-1 text-sm text-gray-600">{item.market_share}</p>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-900 font-medium mb-2">Strengths</p>
                      <div className="space-y-2">
                        {item.strengths.map((strength: any, strengthIndex: number) => (
                          <div key={strengthIndex} className="ml-4">
                            <p className="text-sm text-gray-600">{strength.point}</p>
                            {strength.commentary && (
                              <p className="mt-1 text-sm text-gray-500 italic">{strength.commentary}</p>
                            )}
                            {renderSources(strength.sources, section, index, strengthIndex)}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-900 font-medium mb-2">Weaknesses</p>
                      <div className="space-y-2">
                        {item.weaknesses.map((weakness: any, weaknessIndex: number) => (
                          <div key={weaknessIndex} className="ml-4">
                            <p className="text-sm text-gray-600">{weakness.point}</p>
                            {weakness.commentary && (
                              <p className="mt-1 text-sm text-gray-500 italic">{weakness.commentary}</p>
                            )}
                            {renderSources(weakness.sources, section, index, item.strengths.length + weaknessIndex)}
                          </div>
                        ))}
                      </div>
                    </div>
                    {item.commentary && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-700">{item.commentary}</p>
                      </div>
                    )}
                  </>
                )}

                {renderSources(item.sources, section, index)}

                {onRequestMoreInsights && (
                  <button
                    onClick={() => onRequestMoreInsights(section, item)}
                    className="mt-4 inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Get More Insights
                  </button>
                )}
              </div>
            )}
          </div>
          {onRegenerateSection && (
            <button
              onClick={() => onRegenerateSection(section)}
              disabled={isRegenerating === section}
              className="ml-4 p-1 text-gray-400 hover:text-gray-500 disabled:opacity-50"
            >
              <RefreshCw className={isRegenerating === section ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            </button>
          )}
        </div>
      </div>
    ));
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-8">
        <div className="flex flex-col items-center justify-center">
          <RotateCw className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="mt-4 text-sm text-gray-500">Generating market analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                ${activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">{tabs.find(t => t.id === activeTab)?.name}</h3>
          {onRegenerateSection && (
            <button
              onClick={() => onRegenerateSection(activeTab)}
              disabled={isRegenerating === activeTab}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {isRegenerating === activeTab ? (
                <>
                  <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </>
              )}
            </button>
          )}
        </div>

        {/* Dynamic content based on active tab */}
        <div className="space-y-6">
          {renderContent(
            activeTab,
            analysis.market_insights[activeTab as keyof typeof analysis.market_insights] || []
          )}
        </div>

        {/* Continue Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={onContinue}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Continue to Business Model
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Source Modal */}
      {editingSource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Add Source</h4>
              <button
                onClick={() => {
                  setEditingSource(null);
                  setNewSource('');
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="source_url" className="block text-sm font-medium text-gray-700">
                  Source URL
                </label>
                <input
                  type="url"
                  id="source_url"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setEditingSource(null);
                    setNewSource('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (editingSource) {
                      handleAddSource(
                        editingSource.section,
                        editingSource.index,
                        editingSource.dataPointIndex
                      );
                    }
                  }}
                  disabled={!newSource}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  Add Source
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
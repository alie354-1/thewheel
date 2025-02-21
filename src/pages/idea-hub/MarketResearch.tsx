import React, { useState, useEffect } from 'react';
import { BarChart3, ArrowLeft, Search, Download, ExternalLink, Save, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';

interface MarketInsight {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

interface Competitor {
  name: string;
  website: string;
  marketShare: string;
  strengths: string[];
  weaknesses: string[];
}

export default function MarketResearch() {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('Market Analysis');
  const [researchId, setResearchId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [insights, setInsights] = useState<MarketInsight[]>([
    {
      title: 'Market Size',
      value: '$4.2B',
      change: '+12.3%',
      trend: 'up'
    },
    {
      title: 'Growth Rate',
      value: '15.7%',
      change: '+2.1%',
      trend: 'up'
    },
    {
      title: 'Customer Acquisition Cost',
      value: '$125',
      change: '-5.2%',
      trend: 'down'
    },
    {
      title: 'Customer Lifetime Value',
      value: '$2,450',
      change: '+8.7%',
      trend: 'up'
    }
  ]);

  const [competitors, setCompetitors] = useState<Competitor[]>([
    {
      name: 'CompetitorX',
      website: 'https://example.com',
      marketShare: '35%',
      strengths: ['Brand recognition', 'Large user base', 'Strong partnerships'],
      weaknesses: ['Outdated technology', 'High prices', 'Poor customer support']
    },
    {
      name: 'CompetitorY',
      website: 'https://example.com',
      marketShare: '25%',
      strengths: ['Modern platform', 'Competitive pricing', 'Innovation'],
      weaknesses: ['Limited market reach', 'New player', 'Feature gaps']
    }
  ]);

  useEffect(() => {
    const loadResearch = async () => {
      const { data: research } = await supabase
        .from('market_research')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (research) {
        setResearchId(research.id);
        setTitle(research.title);
        setInsights(research.insights);
        setCompetitors(research.competitors);
      }
    };

    if (user) {
      loadResearch();
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      if (researchId) {
        await supabase
          .from('market_research')
          .update({
            title,
            insights,
            competitors,
            updated_at: new Date().toISOString()
          })
          .eq('id', researchId);
      } else {
        const { data } = await supabase
          .from('market_research')
          .insert({
            user_id: user.id,
            title,
            insights,
            competitors
          })
          .select()
          .single();

        if (data) {
          setResearchId(data.id);
        }
      }
    } catch (error) {
      console.error('Error saving research:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNew = () => {
    setResearchId(null);
    setTitle('Market Analysis');
    setInsights([
      {
        title: 'Market Size',
        value: '$0',
        change: '0%',
        trend: 'neutral'
      },
      {
        title: 'Growth Rate',
        value: '0%',
        change: '0%',
        trend: 'neutral'
      },
      {
        title: 'Customer Acquisition Cost',
        value: '$0',
        change: '0%',
        trend: 'neutral'
      },
      {
        title: 'Customer Lifetime Value',
        value: '$0',
        change: '0%',
        trend: 'neutral'
      }
    ]);
    setCompetitors([{
      name: 'New Competitor',
      website: '',
      marketShare: '0%',
      strengths: [],
      weaknesses: []
    }]);
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
            <div className="flex-1">
              <div className="flex items-center">
                <BarChart3 className="h-6 w-6 mr-2 text-gray-400" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-2xl font-semibold text-gray-900 bg-transparent border-none focus:ring-0 focus:outline-none"
                  placeholder="Enter research title..."
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Analyze your market and competition
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="max-w-xs">
              <label htmlFor="search" className="sr-only">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="search"
                  name="search"
                  id="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search market data..."
                />
              </div>
            </div>
            <button
              onClick={handleNew}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Research
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Research'}
            </button>
          </div>
        </div>

        {/* Market Insights */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {insights.map((insight, index) => (
            <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {insight.title}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {insight.value}
                        </div>
                        <div
                          className={`ml-2 flex items-baseline text-sm font-semibold ${
                            insight.trend === 'up'
                              ? 'text-green-600'
                              : insight.trend === 'down'
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {insight.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Competitor Analysis */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Competitor Analysis
            </h3>
          </div>
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 gap-6">
              {competitors.map((competitor, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-6 hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">
                        {competitor.name}
                      </h4>
                      <a
                        href={competitor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        {competitor.website}
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </a>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold text-gray-900">
                        {competitor.marketShare}
                      </div>
                      <div className="text-sm text-gray-500">Market Share</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">
                        Strengths
                      </h5>
                      <ul className="list-disc list-inside text-sm text-gray-500">
                        {competitor.strengths.map((strength, i) => (
                          <li key={i}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">
                        Weaknesses
                      </h5>
                      <ul className="list-disc list-inside text-sm text-gray-500">
                        {competitor.weaknesses.map((weakness, i) => (
                          <li key={i}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
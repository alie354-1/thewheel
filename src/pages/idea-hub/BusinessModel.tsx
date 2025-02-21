import React, { useState, useEffect } from 'react';
import { Coins, ArrowLeft, Save, Plus, DollarSign, MinusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';

interface RevenueStream {
  name: string;
  type: string;
  amount: number;
  frequency: string;
  description: string;
}

interface CostItem {
  name: string;
  type: 'fixed' | 'variable';
  amount: number;
  frequency: string;
}

interface KeyMetric {
  name: string;
  target: string;
  current: string;
  unit: string;
}

export default function BusinessModel() {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('Business Model');
  const [modelId, setModelId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [revenueStreams, setRevenueStreams] = useState<RevenueStream[]>([
    {
      name: 'Subscription Revenue',
      type: 'recurring',
      amount: 29.99,
      frequency: 'monthly',
      description: 'Monthly subscription fee for premium features'
    }
  ]);

  const [costStructure, setCostStructure] = useState<CostItem[]>([
    {
      name: 'Server Costs',
      type: 'variable',
      amount: 500,
      frequency: 'monthly'
    }
  ]);

  const [keyMetrics, setKeyMetrics] = useState<KeyMetric[]>([
    {
      name: 'Monthly Active Users',
      target: '10000',
      current: '2500',
      unit: 'users'
    }
  ]);

  useEffect(() => {
    const loadModel = async () => {
      const { data: model } = await supabase
        .from('business_models')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (model) {
        setModelId(model.id);
        setTitle(model.title);
        setRevenueStreams(model.revenue_streams);
        setCostStructure(model.cost_structure);
        setKeyMetrics(model.key_metrics);
      }
    };

    if (user) {
      loadModel();
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      if (modelId) {
        await supabase
          .from('business_models')
          .update({
            title,
            revenue_streams: revenueStreams,
            cost_structure: costStructure,
            key_metrics: keyMetrics,
            updated_at: new Date().toISOString()
          })
          .eq('id', modelId);
      } else {
        const { data } = await supabase
          .from('business_models')
          .insert({
            user_id: user.id,
            title,
            revenue_streams: revenueStreams,
            cost_structure: costStructure,
            key_metrics: keyMetrics
          })
          .select()
          .single();

        if (data) {
          setModelId(data.id);
        }
      }
    } catch (error) {
      console.error('Error saving business model:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNew = () => {
    setModelId(null);
    setTitle('Business Model');
    setRevenueStreams([{
      name: '',
      type: 'recurring',
      amount: 0,
      frequency: 'monthly',
      description: ''
    }]);
    setCostStructure([{
      name: '',
      type: 'fixed',
      amount: 0,
      frequency: 'monthly'
    }]);
    setKeyMetrics([{
      name: '',
      target: '',
      current: '',
      unit: ''
    }]);
  };

  const addRevenueStream = () => {
    setRevenueStreams([
      ...revenueStreams,
      {
        name: '',
        type: 'recurring',
        amount: 0,
        frequency: 'monthly',
        description: ''
      }
    ]);
  };

  const addCostItem = () => {
    setCostStructure([
      ...costStructure,
      {
        name: '',
        type: 'fixed',
        amount: 0,
        frequency: 'monthly'
      }
    ]);
  };

  const addKeyMetric = () => {
    setKeyMetrics([
      ...keyMetrics,
      {
        name: '',
        target: '',
        current: '',
        unit: ''
      }
    ]);
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
                <Coins className="h-6 w-6 mr-2 text-gray-400" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-2xl font-semibold text-gray-900 bg-transparent border-none focus:ring-0 focus:outline-none"
                  placeholder="Enter model title..."
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Define your revenue streams and cost structures
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleNew}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Model
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Model'}
            </button>
          </div>
        </div>

        {/* Revenue Streams */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Revenue Streams</h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {revenueStreams.map((stream, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={stream.name}
                      onChange={(e) => {
                        const newStreams = [...revenueStreams];
                        newStreams[index].name = e.target.value;
                        setRevenueStreams(newStreams);
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={stream.type}
                      onChange={(e) => {
                        const newStreams = [...revenueStreams];
                        newStreams[index].type = e.target.value;
                        setRevenueStreams(newStreams);
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="recurring">Recurring</option>
                      <option value="one-time">One-time</option>
                      <option value="usage-based">Usage-based</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        value={stream.amount}
                        onChange={(e) => {
                          const newStreams = [...revenueStreams];
                          newStreams[index].amount = parseFloat(e.target.value);
                          setRevenueStreams(newStreams);
                        }}
                        className="block w-full pl-10 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Frequency</label>
                    <select
                      value={stream.frequency}
                      onChange={(e) => {
                        const newStreams = [...revenueStreams];
                        newStreams[index].frequency = e.target.value;
                        setRevenueStreams(newStreams);
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addRevenueStream}
              className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Revenue Stream
            </button>
          </div>
        </div>

        {/* Cost Structure */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Cost Structure</h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {costStructure.map((cost, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={cost.name}
                      onChange={(e) => {
                        const newCosts = [...costStructure];
                        newCosts[index].name = e.target.value;
                        setCostStructure(newCosts);
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={cost.type}
                      onChange={(e) => {
                        const newCosts = [...costStructure];
                        newCosts[index].type = e.target.value as 'fixed' | 'variable';
                        setCostStructure(newCosts);
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="variable">Variable</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        value={cost.amount}
                        onChange={(e) => {
                          const newCosts = [...costStructure];
                          newCosts[index].amount = parseFloat(e.target.value);
                          setCostStructure(newCosts);
                        }}
                        className="block w-full pl-10 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Frequency</label>
                    <select
                      value={cost.frequency}
                      onChange={(e) => {
                        const newCosts = [...costStructure];
                        newCosts[index].frequency = e.target.value;
                        setCostStructure(newCosts);
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addCostItem}
              className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Cost Item
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Key Metrics</h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {keyMetrics.map((metric, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Metric Name</label>
                    <input
                      type="text"
                      value={metric.name}
                      onChange={(e) => {
                        const newMetrics = [...keyMetrics];
                        newMetrics[index].name = e.target.value;
                        setKeyMetrics(newMetrics);
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Target</label>
                    <input
                      type="text"
                      value={metric.target}
                      onChange={(e) => {
                        const newMetrics = [...keyMetrics];
                        newMetrics[index].target = e.target.value;
                        setKeyMetrics(newMetrics);
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current</label>
                    <input
                      type="text"
                      value={metric.current}
                      onChange={(e) => {
                        const newMetrics = [...keyMetrics];
                        newMetrics[index].current = e.target.value;
                        setKeyMetrics(newMetrics);
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unit</label>
                    <input
                      type="text"
                      value={metric.unit}
                      onChange={(e) => {
                        const newMetrics = [...keyMetrics];
                        newMetrics[index].unit = e.target.value;
                        setKeyMetrics(newMetrics);
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addKeyMetric}
              className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Key Metric
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
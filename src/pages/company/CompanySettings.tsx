import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Settings, 
  FolderOpen, 
  Cloud, 
  Plus, 
  X, 
  Save, 
  Trash2,
  RefreshCw,
  Minus
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import TeamManagement from '../../components/TeamManagement';
import CloudStorageSettings from '../../components/CloudStorageSettings';

interface Company {
  id: string;
  name: string;
  description?: string;
  mission?: string;
  vision_statement?: string;
  core_values?: string[];
  company_culture?: string;
  industries: string[];
  website?: string;
  size?: string;
  stage?: string;
  business_model?: string;
  target_market?: string;
  is_public: boolean;
  logo_url?: string;
  social_links: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    facebook?: string;
  };
  product_roadmap: {
    current_stage: string | null;
    key_features: string[];
    upcoming_releases: string[];
    long_term_vision: string | null;
  };
  tech_stack: {
    frontend: string[];
    backend: string[];
    infrastructure: string[];
    tools: string[];
  };
  team_structure: {
    departments: string[];
    key_roles: string[];
  };
  team_composition: {
    full_time: number;
    part_time: number;
    contractors: number;
  };
}

interface CompanyMember {
  id: string;
  role: string;
  title: string;
  department: string;
  user_id: string;
  user_email: string;
}

export default function CompanySettings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [company, setCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [activeSubtab, setActiveSubtab] = useState('basic');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadCompany();
    }
  }, [user]);

  useEffect(() => {
    if (company) {
      loadMembers();
    }
  }, [company]);

  const loadCompany = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Get the latest company where user is owner
      const { data: companies, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (companyError) throw companyError;

      const company = companies?.[0];
      if (company) {
        setCompany({
          ...company,
          product_roadmap: company.product_roadmap || {
            current_stage: null,
            key_features: [],
            upcoming_releases: [],
            long_term_vision: null
          },
          tech_stack: company.tech_stack || {
            frontend: [],
            backend: [],
            infrastructure: [],
            tools: []
          },
          team_structure: company.team_structure || {
            departments: [],
            key_roles: []
          },
          team_composition: company.team_composition || {
            full_time: 0,
            part_time: 0,
            contractors: 0
          }
        });
      }
    } catch (error: any) {
      console.error('Error loading company:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMembers = async () => {
    if (!company) return;

    try {
      const { data: members, error } = await supabase
        .from('company_members')
        .select('id, role, title, department, user_id, user_email')
        .eq('company_id', company.id);

      if (error) throw error;
      setMembers(members || []);
    } catch (error: any) {
      console.error('Error loading members:', error);
      setError(error.message);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name.startsWith('social_links.')) {
      const network = name.split('.')[1];
      setCompany(prev => ({
        ...prev!,
        social_links: {
          ...prev!.social_links,
          [network]: value
        }
      }));
    } else {
      setCompany(prev => ({
        ...prev!,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const handleArrayInputChange = (section: keyof Company, field: string, value: string, index: number) => {
    setCompany(prev => {
      if (!prev) return prev;
      const newArray = [...(prev[section] as any)[field]];
      newArray[index] = value;
      return {
        ...prev,
        [section]: {
          ...(prev[section] as any),
          [field]: newArray
        }
      };
    });
  };

  const handleAddArrayItem = (section: keyof Company, field: string) => {
    setCompany(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [section]: {
          ...(prev[section] as any),
          [field]: [...(prev[section] as any)[field], '']
        }
      };
    });
  };

  const handleRemoveArrayItem = (section: keyof Company, field: string, index: number) => {
    setCompany(prev => {
      if (!prev) return prev;
      const newArray = [...(prev[section] as any)[field]];
      newArray.splice(index, 1);
      return {
        ...prev,
        [section]: {
          ...(prev[section] as any),
          [field]: newArray
        }
      };
    });
  };

  const handleJsonInputChange = (section: keyof Company, field: string, value: any) => {
    setCompany(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [section]: {
          ...(prev[section] as any),
          [field]: value
        }
      };
    });
  };

  const handleSave = async () => {
    if (!company) return;
    
    setIsSaving(true);
    setError('');

    try {
      const { error } = await supabase
        .from('companies')
        .update({
          ...company,
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id);

      if (error) throw error;
      
      // Reload company data
      await loadCompany();
    } catch (error: any) {
      console.error('Error updating company:', error);
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!company || !window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', company.id);

      if (error) throw error;

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error deleting company:', error);
      setError(error.message);
    }
  };

  const handleRelaunchSetup = () => {
    // Store current company data in session storage
    if (company) {
      sessionStorage.setItem('companySetupData', JSON.stringify({
        name: company.name,
        industries: company.industries,
        website: company.website,
        size: company.size,
        stage: company.stage,
        business_model: company.business_model,
        target_market: company.target_market,
        description: company.description,
        mission: company.mission,
        is_public: company.is_public,
        logo_url: company.logo_url,
        social_links: company.social_links
      }));
      navigate('/company/setup');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Company Found</h2>
        <p className="text-gray-500 mb-4">You need to set up a company first.</p>
        <button
          onClick={() => navigate('/company/setup')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Set Up Company
        </button>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                <Building2 className="h-6 w-6 mr-2" />
                Company Settings
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your company preferences and settings
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRelaunchSetup}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Relaunch Setup
            </button>
            {activeTab === 'general' && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-md flex items-start">
            <X className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Settings Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('general')}
              className={`${
                activeTab === 'general'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Settings className="h-5 w-5 mr-2" />
              General
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`${
                activeTab === 'team'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Users className="h-5 w-5 mr-2" />
              Team
            </button>
            <button
              onClick={() => setActiveTab('storage')}
              className={`${
                activeTab === 'storage'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Cloud className="h-5 w-5 mr-2" />
              Cloud Storage
            </button>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="mt-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Subtabs for General Settings */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <nav className="flex space-x-4">
                    <button
                      onClick={() => setActiveSubtab('basic')}
                      className={`${
                        activeSubtab === 'basic'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-500 hover:text-gray-700'
                      } px-3 py-2 rounded-md text-sm font-medium`}
                    >
                      Basic Info
                    </button>
                    <button
                      onClick={() => setActiveSubtab('market')}
                      className={`${
                        activeSubtab === 'market'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-500 hover:text-gray-700'
                      } px-3 py-2 rounded-md text-sm font-medium`}
                    >
                      Market
                    </button>
                    <button
                      onClick={() => setActiveSubtab('product')}
                      className={`${
                        activeSubtab === 'product'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-500 hover:text-gray-700'
                      } px-3 py-2 rounded-md text-sm font-medium`}
                    >
                      Product
                    </button>
                    <button
                      onClick={() => setActiveSubtab('team')}
                      className={`${
                        activeSubtab === 'team'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-500 hover:text-gray-700'
                      } px-3 py-2 rounded-md text-sm font-medium`}
                    >
                      Team
                    </button>
                    <button
                      onClick={() => setActiveSubtab('profile')}
                      className={`${
                        activeSubtab === 'profile'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-500 hover:text-gray-700'
                      } px-3 py-2 rounded-md text-sm font-medium`}
                    >
                      Profile
                    </button>
                  </nav>
                </div>

                <div className="p-6">
                  {activeSubtab === 'basic' && (
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Company Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={company.name}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                          Website
                        </label>
                        <input
                          type="url"
                          id="website"
                          name="website"
                          value={company.website || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="size" className="block text-sm font-medium text-gray-700">
                          Company Size
                        </label>
                        <select
                          id="size"
                          name="size"
                          value={company.size || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="">Select size</option>
                          <option value="1-10">1-10 employees</option>
                          <option value="11-50">11-50 employees</option>
                          <option value="51-200">51-200 employees</option>
                          <option value="201-500">201-500 employees</option>
                          <option value="501+">501+ employees</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="stage" className="block text-sm font-medium text-gray-700">
                          Company Stage
                        </label>
                        <select
                          id="stage"
                          name="stage"
                          value={company.stage || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="">Select stage</option>
                          <option value="idea">Idea Stage</option>
                          <option value="mvp">MVP</option>
                          <option value="early">Early Stage</option>
                          <option value="growth">Growth Stage</option>
                          <option value="scale">Scale Up</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {activeSubtab === 'market' && (
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="target_market" className="block text-sm font-medium text-gray-700">
                          Target Market
                        </label>
                        <textarea
                          id="target_market"
                          name="target_market"
                          value={company.target_market || ''}
                          onChange={handleInputChange}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="business_model" className="block text-sm font-medium text-gray-700">
                          Business Model
                        </label>
                        <select
                          id="business_model"
                          name="business_model"
                          value={company.business_model || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="">Select business model</option>
                          <option value="b2b">B2B</option>
                          <option value="b2c">B2C</option>
                          <option value="b2b2c">B2B2C</option>
                          <option value="c2c">C2C</option>
                          <option value="saas">SaaS</option>
                          <option value="marketplace">Marketplace</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {activeSubtab === 'product' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Key Features
                        </label>
                        {company.product_roadmap.key_features.map((feature, index) => (
                          <div key={index} className="flex items-center mt-2">
                            <input
                              type="text"
                              value={feature}
                              onChange={(e) => handleArrayInputChange('product_roadmap', 'key_features', e.target.value, index)}
                              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveArrayItem('product_roadmap', 'key_features', index)}
                              className="ml-2 text-gray-400 hover:text-gray-500"
                            >
                              <Minus className="h-5 w-5" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddArrayItem('product_roadmap', 'key_features')}
                          className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Feature
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Tech Stack
                        </label>
                        <div className="space-y-4 mt-2">
                          <div>
                            <label className="block text-sm text-gray-500">Frontend</label>
                            {company.tech_stack.frontend.map((tech, index) => (
                              <div key={index} className="flex items-center mt-2">
                                <input
                                  type="text"
                                  value={tech}
                                  onChange={(e) => handleArrayInputChange('tech_stack', 'frontend', e.target.value, index)}
                                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveArrayItem('tech_stack', 'frontend', index)}
                                  className="ml-2 text-gray-400 hover:text-gray-500"
                                >
                                  <Minus className="h-5 w-5" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleAddArrayItem('tech_stack', 'frontend')}
                              className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Frontend Tech
                            </button>
                          </div>

                          <div>
                            <label className="block text-sm text-gray-500">Backend</label>
                            {company.tech_stack.backend.map((tech, index) => (
                              <div key={index} className="flex items-center mt-2">
                                <input
                                  type="text"
                                  value={tech}
                                  onChange={(e) => handleArrayInputChange('tech_stack', 'backend', e.target.value, index)}
                                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveArrayItem('tech_stack', 'backend', index)}
                                  className="ml-2 text-gray-400 hover:text-gray-500"
                                >
                                  <Minus className="h-5 w-5" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleAddArrayItem('tech_stack', 'backend')}
                              className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Backend Tech
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSubtab === 'team' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Team Structure
                        </label>
                        <div className="space-y-4 mt-2">
                          <div>
                            <label className="block text-sm text-gray-500">Departments</label>
                            {company.team_structure.departments.map((dept, index) => (
                              <div key={index} className="flex items-center mt-2">
                                <input
                                  type="text"
                                  value={dept}
                                  onChange={(e) => handleArrayInputChange('team_structure', 'departments', e.target.value, index)}
                                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveArrayItem('team_structure', 'departments', index)}
                                  className="ml-2 text-gray-400 hover:text-gray-500"
                                >
                                  <Minus className="h-5 w-5" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleAddArrayItem('team_structure', 'departments')}
                              className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Department
                            </button>
                          </div>

                          <div>
                            <label className="block text-sm text-gray-500">Key Roles</label>
                            {company.team_structure.key_roles.map((role, index) => (
                              <div key={index} className="flex items-center mt-2">
                                <input
                                  type="text"
                                  value={role}
                                  onChange={(e) => handleArrayInputChange('team_structure', 'key_roles', e.target.value, index)}
                                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveArrayItem('team_structure', 'key_roles', index)}
                                  className="ml-2 text-gray-400 hover:text-gray-500"
                                >
                                  <Minus className="h-5 w-5" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleAddArrayItem('team_structure', 'key_roles')}
                              className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Key Role
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Team Composition
                        </label>
                        <div className="grid grid-cols-3 gap-4 mt-2">
                          <div>
                            <label className="block text-sm text-gray-500">Full-time</label>
                            <input
                              type="number"
                              value={company.team_composition.full_time}
                              onChange={(e) => handleJsonInputChange('team_composition', 'full_time', parseInt(e.target.value))}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-500">Part-time</label>
                            <input
                              type="number"
                              value={company.team_composition.part_time}
                              onChange={(e) => handleJsonInputChange('team_composition', 'part_time', parseInt(e.target.value))}
                              className="mt- 1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-500">Contractors</label>
                            <input
                              type="number"
                              value={company.team_composition.contractors}
                              onChange={(e) => handleJsonInputChange('team_composition', 'contractors', parseInt(e.target.value))}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSubtab === 'profile' && (
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                          Company Description
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          rows={4}
                          value={company.description || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="mission" className="block text-sm font-medium text-gray-700">
                          Company Mission
                        </label>
                        <textarea
                          id="mission"
                          name="mission"
                          rows={3}
                          value={company.mission || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700">
                          Logo URL
                        </label>
                        <input
                          type="url"
                          id="logo_url"
                          name="logo_url"
                          value={company.logo_url || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="is_public"
                            name="is_public"
                            checked={company.is_public}
                            onChange={handleInputChange}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
                            Make company profile public
                          </label>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Public profiles are visible to all users and can be found in the directory
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Social Links</label>
                        <div className="mt-1 space-y-2">
                          <input
                            type="url"
                            name="social_links.linkedin"
                            value={company.social_links.linkedin || ''}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="LinkedIn URL"
                          />
                          <input
                            type="url"
                            name="social_links.twitter"
                            value={company.social_links.twitter || ''}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Twitter URL"
                          />
                          <input
                            type="url"
                            name="social_links.github"
                            value={company.social_links.github || ''}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="GitHub URL"
                          />
                          <input
                            type="url"
                            name="social_links.facebook"
                            value={company.social_links.facebook || ''}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Facebook URL"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Danger Zone</h3>
                </div>
                <div className="px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Delete Company</h4>
                      <p className="mt-1 text-sm text-gray-500">
                        Once you delete a company, there is no going back. Please be certain.
                      </p>
                    </div>
                    <button
                      onClick={handleDeleteCompany}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Company
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <TeamManagement
              companyId={company.id}
              members={members}
              onMemberAdded={loadMembers}
              onMemberRemoved={loadMembers}
            />
          )}

          {activeTab === 'storage' && (
            <CloudStorageSettings 
              companyId={company.id}
              onComplete={() => {
                loadCompany();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
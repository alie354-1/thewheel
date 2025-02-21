import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Briefcase, Users, Globe, DollarSign, Target, Brain, Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';

const SETUP_STEPS = [
  { id: 'basic', name: 'Basic Info', description: 'Company name and industry', icon: Building2 },
  { id: 'market', name: 'Market', description: 'Target market and positioning', icon: Target },
  { id: 'business', name: 'Business Model', description: 'Revenue and operations', icon: DollarSign },
  { id: 'product', name: 'Product', description: 'Product/service details', icon: Brain },
  { id: 'team', name: 'Team', description: 'Team structure and culture', icon: Users },
  { id: 'profile', name: 'Profile', description: 'Public profile and links', icon: Globe }
];

const SUGGESTED_INDUSTRIES = [
  'SaaS',
  'E-commerce',
  'FinTech',
  'HealthTech',
  'EdTech',
  'AI/ML',
  'Mobile Apps',
  'Enterprise Software',
  'Consumer Internet',
  'Marketplace',
  'Hardware',
  'IoT',
  'Cybersecurity',
  'Cloud Computing',
  'Digital Marketing',
  'Remote Work',
  'Social Impact',
  'Clean Tech',
  'BioTech',
  'AgTech',
  'PropTech',
  'InsurTech',
  'RetailTech',
  'Gaming',
  'Web3',
  'AR/VR',
  'SpaceTech',
  'RoboTech'
];

export default function CompanySetup() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState('basic');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [formData, setFormData] = useState(() => {
    // Try to load saved data from session storage
    const savedData = sessionStorage.getItem('companySetupData');
    const defaultData = {
      // Basic Info
      name: '',
      industries: [] as string[],
      website: '',
      
      // Market Info
      target_market: '',
      market_size: '',
      competition: '',
      
      // Business Model
      business_model: '',
      revenue_model: '',
      pricing_strategy: '',
      
      // Product Info
      product_description: '',
      features: '',
      tech_stack: '',
      
      // Team Info
      team_size: '',
      culture: '',
      remote_policy: '',
      
      // Profile
      description: '',
      mission: '',
      is_public: true,
      social_links: {
        linkedin: '',
        twitter: '',
        github: ''
      }
    };

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        return {
          ...defaultData,
          ...parsed,
          social_links: {
            ...defaultData.social_links,
            ...(parsed.social_links || {})
          }
        };
      } catch (e) {
        return defaultData;
      }
    }

    return defaultData;
  });

  const [industrySearch, setIndustrySearch] = useState('');
  const [customIndustry, setCustomIndustry] = useState('');
  const [showCustomIndustry, setShowCustomIndustry] = useState(false);

  // Filter suggested industries based on search
  const filteredIndustries = SUGGESTED_INDUSTRIES.filter(industry =>
    industry.toLowerCase().includes(industrySearch.toLowerCase())
  );

  const handleAddIndustry = (industry: string) => {
    if (!formData.industries.includes(industry)) {
      setFormData(prev => ({
        ...prev,
        industries: [...prev.industries, industry]
      }));
    }
    setIndustrySearch('');
  };

  const handleRemoveIndustry = (industry: string) => {
    setFormData(prev => ({
      ...prev,
      industries: prev.industries.filter(i => i !== industry)
    }));
  };

  const handleAddCustomIndustry = () => {
    if (customIndustry.trim() && !formData.industries.includes(customIndustry.trim())) {
      handleAddIndustry(customIndustry.trim());
      setCustomIndustry('');
      setShowCustomIndustry(false);
    }
  };

  // Save form data to session storage when it changes
  useEffect(() => {
    sessionStorage.setItem('companySetupData', JSON.stringify(formData));
  }, [formData]);

  // Check if user already has a company
  useEffect(() => {
    const checkExistingCompany = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError('');

        // Check if user owns any companies
        const { data: ownedCompanies, error: ownedError } = await supabase
          .from('companies')
          .select('id')
          .eq('owner_id', user.id);

        if (ownedError) throw ownedError;

        // Check if user is a member of any companies
        const { data: memberships, error: memberError } = await supabase
          .from('company_members')
          .select('company_id')
          .eq('user_id', user.id);

        if (memberError) throw memberError;

        // If user has any companies or memberships, redirect to dashboard
        if ((ownedCompanies && ownedCompanies.length > 0) || 
            (memberships && memberships.length > 0)) {
          navigate('/company/dashboard');
        }
      } catch (error: any) {
        console.error('Error checking company access:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingCompany();
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (name.startsWith('social_links.')) {
      const network = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        social_links: {
          ...prev.social_links,
          [network]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const handleSave = async (goToDashboard = false) => {
    if (!user || !formData.name || formData.industries.length === 0) return;

    setIsLoading(true);
    setError('');
    
    try {
      if (companyId) {
        // Update existing company
        const { error: updateError } = await supabase
          .from('companies')
          .update({
            name: formData.name,
            industries: formData.industries,
            website: formData.website,
            target_market: formData.target_market,
            business_model: formData.business_model,
            description: formData.description,
            mission: formData.mission,
            is_public: formData.is_public,
            social_links: formData.social_links,
            updated_at: new Date().toISOString()
          })
          .eq('id', companyId);

        if (updateError) throw updateError;
      } else {
        // Create new company
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .insert([{
            name: formData.name,
            industries: formData.industries,
            website: formData.website,
            target_market: formData.target_market,
            business_model: formData.business_model,
            description: formData.description,
            mission: formData.mission,
            is_public: formData.is_public,
            social_links: formData.social_links,
            owner_id: user.id
          }])
          .select()
          .single();

        if (companyError) throw companyError;

        if (!company) {
          throw new Error('Failed to create company');
        }

        // Store company ID for future updates
        setCompanyId(company.id);

        // Create company member record for owner
        const { error: memberError } = await supabase
          .from('company_members')
          .insert({
            company_id: company.id,
            user_id: user.id,
            role: 'owner',
            title: 'Founder',
            joined_at: new Date().toISOString()
          });

        if (memberError) {
          // If member creation fails, delete the company to maintain consistency
          await supabase
            .from('companies')
            .delete()
            .eq('id', company.id);
          throw memberError;
        }
      }

      // Navigate to dashboard if requested
      if (goToDashboard) {
        // Clear session storage
        sessionStorage.removeItem('companySetupData');
        navigate('/company/dashboard');
      }
    } catch (error: any) {
      console.error('Error saving company:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    const currentIndex = SETUP_STEPS.findIndex(step => step.id === currentStep);
    if (currentIndex < SETUP_STEPS.length - 1) {
      setCurrentStep(SETUP_STEPS[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = SETUP_STEPS.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(SETUP_STEPS[currentIndex - 1].id);
    }
  };

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit? Your progress will be saved.')) {
      navigate('/dashboard');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter your company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Industries <span className="text-red-500">*</span>
              </label>
              
              {/* Selected Industries */}
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.industries.map((industry) => (
                  <span
                    key={industry}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                  >
                    {industry}
                    <button
                      type="button"
                      onClick={() => handleRemoveIndustry(industry)}
                      className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Industry Search */}
              <div className="relative mt-2">
                <input
                  type="text"
                  value={industrySearch}
                  onChange={(e) => setIndustrySearch(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Search industries..."
                />
                
                {industrySearch && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                    {filteredIndustries.length > 0 ? (
                      <ul className="py-1">
                        {filteredIndustries.map((industry) => (
                          <li key={industry}>
                            <button
                              type="button"
                              onClick={() => handleAddIndustry(industry)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {industry}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4">
                        <p className="text-sm text-gray-500">No matching industries</p>
                        {!showCustomIndustry && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowCustomIndustry(true);
                              setCustomIndustry(industrySearch);
                            }}
                            className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add custom industry
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Custom Industry Input */}
              {showCustomIndustry && (
                <div className="mt-4">
                  <label htmlFor="custom_industry" className="block text-sm font-medium text-gray-700">
                    Add Custom Industry
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      id="custom_industry"
                      value={customIndustry}
                      onChange={(e) => setCustomIndustry(e.target.value)}
                      className="flex-1 min-w-0 block w-full rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Enter custom industry"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomIndustry}
                      className="inline-flex items-center px-3 py-2 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm hover:bg-gray-100"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                Website
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="https://example.com"
              />
            </div>
          </div>
        );

      case 'market':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="target_market" className="block text-sm font-medium text-gray-700">
                Target Market
              </label>
              <textarea
                id="target_market"
                name="target_market"
                value={formData.target_market}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Describe your target market..."
              />
            </div>

            <div>
              <label htmlFor="market_size" className="block text-sm font-medium text-gray-700">
                Market Size
              </label>
              <textarea
                id="market_size"
                name="market_size"
                value={formData.market_size}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Describe your market size and opportunity..."
              />
            </div>

            <div>
              <label htmlFor="competition" className="block text-sm font-medium text-gray-700">
                Competition
              </label>
              <textarea
                id="competition"
                name="competition"
                value={formData.competition}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Describe your competitors..."
              />
            </div>
          </div>
        );

      case 'business':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="business_model" className="block text-sm font-medium text-gray-700">
                Business Model
              </label>
              <select
                id="business_model"
                name="business_model"
                value={formData.business_model}
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

            <div>
              <label htmlFor="revenue_model" className="block text-sm font-medium text-gray-700">
                Revenue Model
              </label>
              <select
                id="revenue_model"
                name="revenue_model"
                value={formData.revenue_model}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select revenue model</option>
                <option value="subscription">Subscription</option>
                <option value="transactional">Transactional</option>
                <option value="advertising">Advertising</option>
                <option value="freemium">Freemium</option>
                <option value="commission">Commission</option>
                <option value="licensing">Licensing</option>
              </select>
            </div>

            <div>
              <label htmlFor="pricing_strategy" className="block text-sm font-medium text-gray-700">
                Pricing Strategy
              </label>
              <textarea
                id="pricing_strategy"
                name="pricing_strategy"
                value={formData.pricing_strategy}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Describe your pricing strategy..."
              />
            </div>
          </div>
        );

      case 'product':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="product_description" className="block text-sm font-medium text-gray-700">
                Product Description
              </label>
              <textarea
                id="product_description"
                name="product_description"
                value={formData.product_description}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Describe your product or service..."
              />
            </div>

            <div>
              <label htmlFor="features" className="block text-sm font-medium text-gray-700">
                Key Features
              </label>
              <textarea
                id="features"
                name="features"
                value={formData.features}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="List your key features..."
              />
            </div>

            <div>
              <label htmlFor="tech_stack" className="block text-sm font-medium text-gray-700">
                Technology Stack
              </label>
              <textarea
                id="tech_stack"
                name="tech_stack"
                value={formData.tech_stack}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Describe your technology stack..."
              />
            </div>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="team_size" className="block text-sm font-medium text-gray-700">
                Team Size
              </label>
              <select
                id="team_size"
                name="team_size"
                value={formData.team_size}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select team size</option>
                <option value="1">Solo founder</option>
                <option value="2-5">2-5 people</option>
                <option value="6-10">6-10 people</option>
                <option value="11-20">11-20 people</option>
                <option value="21-50">21-50 people</option>
                <option value="50+">50+ people</option>
              </select>
            </div>

            <div>
              <label htmlFor="culture" className="block text-sm font-medium text-gray-700">
                Company Culture
              </label>
              <textarea
                id="culture"
                name="culture"
                value={formData.culture}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Describe your company culture..."
              />
            </div>

            <div>
              <label htmlFor="remote_policy" className="block text-sm font-medium text-gray-700">
                Remote Work Policy
              </label>
              <select
                id="remote_policy"
                name="remote_policy"
                value={formData.remote_policy}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select policy</option>
                <option value="remote">Remote-first</option>
                <option value="hybrid">Hybrid</option>
                <option value="office">Office-based</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Company Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Describe your company..."
              />
            </div>

            <div>
              <label htmlFor="mission" className="block text-sm font-medium text-gray-700">
                Mission Statement
              </label>
              <textarea
                id="mission"
                name="mission"
                value={formData.mission}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="What is your company's mission?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Social Links</label>
              <div className="mt-1 space-y-2">
                <input
                  type="url"
                  name="social_links.linkedin"
                  value={formData.social_links.linkedin}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="LinkedIn URL"
                />
                <input
                  type="url"
                  name="social_links.twitter"
                  value={formData.social_links.twitter}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Twitter URL"
                />
                <input
                  type="url"
                  name="social_links.github"
                  value={formData.social_links.github}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="GitHub URL"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_public"
                name="is_public"
                checked={formData.is_public}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
                Make company profile public
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Building2 className="mx-auto h-12 w-12 text-indigo-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Set Up Your Company
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Let's get your company set up and ready for success
          </p>
        </div>

        {/* Progress Steps */}
        <nav aria-label="Progress" className="mb-12">
          <ol className="flex items-center">
            {SETUP_STEPS.map((step, stepIdx) => (
              <li
                key={step.id}
                className={`${stepIdx !== SETUP_STEPS.length - 1 ? 'flex-1' : ''} relative`}
              >
                {/* Step Indicator */}
                <div className="group flex flex-col items-center">
                  <span className="flex items-center justify-center">
                    <span
                      className={`${
                        stepIdx < SETUP_STEPS.findIndex(s => s.id === currentStep)
                          ? 'bg-indigo-600'
                          : currentStep === step.id
                          ? 'border-2 border-indigo-600 bg-white'
                          : 'border-2 border-gray-300 bg-white'
                      } h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-150 ease-in-out`}
                    >
                      <step.icon
                        className={`h-6 w-6 ${
                          stepIdx < SETUP_STEPS.findIndex(s => s.id === currentStep)
                            ? 'text-white'
                            : currentStep === step.id
                            ? 'text-indigo-600'
                            : 'text-gray-500'
                        }`}
                      />
                    </span>
                  </span>
                  {stepIdx !== SETUP_STEPS.length - 1 && (
                    <div
                      className={`hidden md:block absolute top-6 left-1/2 w-full h-0.5 transition-colors duration-150 ease-in-out ${
                        stepIdx < SETUP_STEPS.findIndex(s => s.id === currentStep)
                          ? 'bg-indigo-600'
                          : 'bg-gray-300'
                      }`}
                    />
                  )}
                  
                  {/* Step Content */}
                  <div className="mt-4 text-center">
                    <h3 className="text-sm font-medium text-gray-900">
                      {step.name}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {step.description}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </nav>

        {/* Form */}
        <div className="bg-white shadow rounded-lg p-6">
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {renderStepContent()}

          {/* Navigation */}
          <div className="mt-8 flex justify-between pt-6 border-t border-gray-200">
            <div>
              <button
                type="button"
                onClick={handleExit}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Save & Exit
              </button>
            </div>
            <div className="flex space-x-3">
              {currentStep !== SETUP_STEPS[0].id && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back
                </button>
              )}
              <button
                onClick={() => handleSave(false)}
                disabled={isLoading || !formData.name || formData.industries.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Save & Continue
              </button>
              {currentStep === SETUP_STEPS[SETUP_STEPS.length - 1].id && (
                <button
                  onClick={() => handleSave(true)}
                  disabled={isLoading || !formData.name || formData.industries.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  Complete Setup
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Plus, 
  X,
  Settings,
  Check,
  ArrowRight,
  ArrowLeft,
  XCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';

const SETUP_STEPS = [
  { 
    id: 'basic', 
    name: 'Basic Info', 
    description: 'Your name and contact details',
    icon: User
  },
  { 
    id: 'professional', 
    name: 'Professional', 
    description: 'Your work experience',
    icon: User
  },
  { 
    id: 'expertise', 
    name: 'Expertise', 
    description: 'Skills and interests',
    icon: User
  },
  { 
    id: 'preferences', 
    name: 'Preferences', 
    description: 'Privacy and notifications',
    icon: Settings
  }
];

const SUGGESTED_INTERESTS = [
  'Artificial Intelligence',
  'Blockchain',
  'E-commerce',
  'FinTech',
  'Healthcare',
  'SaaS',
  'Sustainability',
  'EdTech',
  'Mobile Apps',
  'IoT',
  'Cybersecurity',
  'Cloud Computing',
  'Digital Marketing',
  'Remote Work',
  'Social Impact'
];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user, profile, fetchProfile, updateSetupProgress } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('basic');
  const [formData, setFormData] = useState({
    full_name: '',
    professional_background: '',
    interests: [] as string[],
    is_public: true,
    allows_messages: true,
    social_links: {
      linkedin: '',
      twitter: '',
      github: '',
      website: ''
    }
  });
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // If profile is already set up, redirect to dashboard
    if (profile?.full_name) {
      navigate('/dashboard');
    }

    // Load saved progress if available
    if (profile?.setup_progress) {
      setCurrentStep(profile.setup_progress.current_step);
      if (profile.setup_progress.form_data) {
        setFormData(prev => ({
          ...prev,
          ...profile.setup_progress.form_data
        }));
      }
    }
  }, [user, profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name.startsWith('social_links.')) {
      const platform = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        social_links: {
          ...prev.social_links,
          [platform]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.full_name) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          setup_progress: null, // Clear setup progress when complete
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      await fetchProfile(user.id);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    const currentIndex = SETUP_STEPS.findIndex(step => step.id === currentStep);
    if (currentIndex < SETUP_STEPS.length - 1) {
      const nextStep = SETUP_STEPS[currentIndex + 1].id;
      setCurrentStep(nextStep);
      saveProgress(nextStep);
    }
  };

  const handleBack = () => {
    const currentIndex = SETUP_STEPS.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      const prevStep = SETUP_STEPS[currentIndex - 1].id;
      setCurrentStep(prevStep);
      saveProgress(prevStep);
    }
  };

  const handleExit = () => {
    setShowExitConfirm(true);
  };

  const saveProgress = async (step: string) => {
    if (!user) return;
    
    setIsSavingProgress(true);
    try {
      await updateSetupProgress({
        current_step: step,
        completed_steps: SETUP_STEPS
          .slice(0, SETUP_STEPS.findIndex(s => s.id === step))
          .map(s => s.id),
        form_data: formData
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setIsSavingProgress(false);
    }
  };

  const confirmExit = async () => {
    if (!user) {
      navigate('/dashboard');
      return;
    }

    setIsSavingProgress(true);
    try {
      await updateSetupProgress({
        current_step: currentStep,
        completed_steps: SETUP_STEPS
          .slice(0, SETUP_STEPS.findIndex(s => s.id === currentStep))
          .map(s => s.id),
        form_data: formData
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setIsSavingProgress(false);
      setShowExitConfirm(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter your full name"
              />
            </div>
          </div>
        );

      case 'professional':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="professional_background" className="block text-sm font-medium text-gray-700">
                Professional Background
              </label>
              <textarea
                id="professional_background"
                name="professional_background"
                rows={4}
                value={formData.professional_background}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Tell us about your professional experience..."
              />
            </div>
          </div>
        );

      case 'expertise':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Interests
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          interests: prev.interests.filter((_, i) => i !== index)
                        }));
                      }}
                      className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Suggested Interests:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_INTERESTS.filter(interest => !formData.interests.includes(interest)).map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          interests: [...prev.interests, interest]
                        }));
                      }}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_public"
                name="is_public"
                checked={formData.is_public}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
                Make my profile public
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allows_messages"
                name="allows_messages"
                checked={formData.allows_messages}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="allows_messages" className="ml-2 block text-sm text-gray-900">
                Allow other users to message me
              </label>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">Social Links</h4>
              <div className="space-y-4">
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
                <input
                  type="url"
                  name="social_links.website"
                  value={formData.social_links.website}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Personal Website URL"
                />
              </div>
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
        {/* Close Button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={handleExit}
            className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-white/50"
            title="Exit Setup"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="text-center mb-8">
          <User className="mx-auto h-12 w-12 text-indigo-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Tell us about yourself to get started
          </p>
        </div>

        {/* Progress Steps */}
        <nav aria-label="Progress" className="mb-8">
          <ol className="flex items-center">
            {SETUP_STEPS.map((step, stepIdx) => (
              <li
                key={step.id}
                className={`${stepIdx !== SETUP_STEPS.length - 1 ? 'flex-1' : ''} relative`}
              >
                <div className="group flex flex-col items-center">
                  <span className="flex items-center justify-center">
                    <span
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        stepIdx < SETUP_STEPS.findIndex(s => s.id === currentStep)
                          ? 'bg-indigo-600'
                          : currentStep === step.id
                          ? 'border-2 border-indigo-600 bg-white'
                          : 'border-2 border-gray-300 bg-white'
                      }`}
                    >
                      <step.icon
                        className={`h-5 w-5 ${
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
                      className={`hidden md:block absolute top-4 left-1/2 w-full h-0.5 transition-colors duration-150 ease-in-out ${
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
          <form onSubmit={handleSubmit}>
            {renderStepContent()}

            {/* Navigation */}
            <div className="mt-8 flex justify-between pt-6 border-t border-gray-200">
              <div>
                {currentStep !== SETUP_STEPS[0].id && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </button>
                )}
              </div>
              <div>
                {currentStep !== SETUP_STEPS[SETUP_STEPS.length - 1].id ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading || !formData.full_name}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isLoading ? (
                      'Completing Setup...'
                    ) : (
                      <>
                        Complete Setup
                        <Check className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Exit Confirmation Dialog */}
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowExitConfirm(false)} />
              <div className="relative w-full max-w-md rounded-lg bg-white shadow-lg p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Exit Setup?</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Your progress will be saved, but your profile will remain incomplete. You can return to complete it later.
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowExitConfirm(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Continue Setup
                  </button>
                  <button
                    onClick={confirmExit}
                    disabled={isSavingProgress}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    {isSavingProgress ? 'Saving...' : 'Exit'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
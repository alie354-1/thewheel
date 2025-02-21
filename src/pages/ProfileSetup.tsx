import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Plus, Trash2, CloudCog } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import CloudStorageSetup from '../components/CloudStorageSetup';

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
  const { user, profile, fetchProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    interests: [] as string[],
    is_public: true
  });
  const [customInterest, setCustomInterest] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // If profile is already set up, redirect to dashboard
    if (profile?.full_name) {
      navigate('/dashboard');
    }
  }, [user, profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addInterest = (interest: string) => {
    if (!interest.trim() || formData.interests.includes(interest)) return;
    setFormData(prev => ({
      ...prev,
      interests: [...prev.interests, interest.trim()]
    }));
    setCustomInterest('');
  };

  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.full_name || formData.interests.length === 0) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      await fetchProfile(user.id);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <User className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Tell us about your interests and we'll help you connect with like-minded founders
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your full name"
              />
            </div>

            {/* Interests Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Select Your Interests
              </label>
              
              {/* Selected Interests */}
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.interests.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => removeInterest(interest)}
                      className="ml-2 inline-flex items-center p-0.5 rounded-full text-blue-800 hover:bg-blue-200"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Suggested Interests */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_INTERESTS.filter(interest => !formData.interests.includes(interest)).map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => addInterest(interest)}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Interest Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  placeholder="Add a custom interest..."
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addInterest(customInterest);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => addInterest(customInterest)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Privacy Setting */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_public"
                name="is_public"
                checked={formData.is_public}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
                Make my profile public
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !formData.full_name || formData.interests.length === 0}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Complete Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
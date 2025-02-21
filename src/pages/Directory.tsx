import React, { useState, useEffect } from 'react';
import { Users, Search, MapPin, Globe, Briefcase, Filter, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  full_name: string;
  headline: string;
  bio: string;
  skills: string[];
  interests: string[];
  location: string;
  avatar_url: string;
  website: string;
  social_links: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
  available_for: {
    mentoring: boolean;
    investing: boolean;
    advising: boolean;
    cofounding: boolean;
  };
}

export default function Directory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const availabilityOptions = [
    { value: 'mentoring', label: 'Mentoring' },
    { value: 'investing', label: 'Investing' },
    { value: 'advising', label: 'Advising' },
    { value: 'cofounding', label: 'Co-founding' }
  ];

  useEffect(() => {
    searchProfiles();
  }, [searchQuery, selectedSkills, selectedInterests, selectedAvailability]);

  const searchProfiles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('search_profiles', {
        search_query: searchQuery ? searchQuery.replace(/\s+/g, ' & ') : null,
        filter_skills: selectedSkills.length > 0 ? selectedSkills : null,
        filter_interests: selectedInterests.length > 0 ? selectedInterests : null,
        filter_available_for: selectedAvailability.length > 0 ? selectedAvailability : null
      });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error searching profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <Users className="h-6 w-6 mr-2" />
              Directory
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Connect with founders, mentors, and advisors
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, skills, or interests..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {showFilters && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Skills Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills
                  </label>
                  <input
                    type="text"
                    placeholder="Add skills..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        const skill = input.value.trim();
                        if (skill && !selectedSkills.includes(skill)) {
                          setSelectedSkills([...selectedSkills, skill]);
                          input.value = '';
                        }
                      }
                    }}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => setSelectedSkills(selectedSkills.filter(s => s !== skill))}
                          className="ml-1 inline-flex items-center p-0.5 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Interests Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interests
                  </label>
                  <input
                    type="text"
                    placeholder="Add interests..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        const interest = input.value.trim();
                        if (interest && !selectedInterests.includes(interest)) {
                          setSelectedInterests([...selectedInterests, interest]);
                          input.value = '';
                        }
                      }
                    }}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedInterests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        {interest}
                        <button
                          type="button"
                          onClick={() => setSelectedInterests(selectedInterests.filter(i => i !== interest))}
                          className="ml-1 inline-flex items-center p-0.5 rounded-full text-green-400 hover:bg-green-200 hover:text-green-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Available For Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available For
                  </label>
                  <div className="space-y-2">
                    {availabilityOptions.map((option) => (
                      <label key={option.value} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedAvailability.includes(option.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAvailability([...selectedAvailability, option.value]);
                            } else {
                              setSelectedAvailability(selectedAvailability.filter(a => a !== option.value));
                            }
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm text-indigo-600">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
              <div key={profile.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-center">
                    <img
                      className="h-16 w-16 rounded-full"
                      src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&size=64`}
                      alt={profile.full_name}
                    />
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{profile.full_name}</h3>
                      {profile.headline && (
                        <p className="text-sm text-gray-500">{profile.headline}</p>
                      )}
                    </div>
                  </div>

                  {profile.bio && (
                    <p className="mt-4 text-sm text-gray-500 line-clamp-3">{profile.bio}</p>
                  )}

                  {profile.location && (
                    <p className="mt-4 text-sm text-gray-500 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {profile.location}
                    </p>
                  )}

                  {profile.website && (
                    <p className="mt-2 text-sm text-gray-500 flex items-center">
                      <Globe className="h-4 w-4 mr-1" />
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {new URL(profile.website).hostname}
                      </a>
                    </p>
                  )}

                  {profile.skills && profile.skills.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Skills</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {profile.skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.available_for && Object.entries(profile.available_for).some(([_, value]) => value) && (
                    <div className="mt-4">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Available for</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(profile.available_for).map(([key, value]) => (
                          value && (
                            <span
                              key={key}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                            >
                              <Briefcase className="h-3 w-3 mr-1" />
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                            </span>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.social_links && Object.values(profile.social_links).some(value => value) && (
                    <div className="mt-4 flex space-x-4">
                      {profile.social_links.linkedin && (
                        <a
                          href={profile.social_links.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <span className="sr-only">LinkedIn</span>
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </a>
                      )}
                      {profile.social_links.twitter && (
                        <a
                          href={profile.social_links.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <span className="sr-only">Twitter</span>
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                          </svg>
                        </a>
                      )}
                      {profile.social_links.github && (
                        <a
                          href={profile.social_links.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <span className="sr-only">GitHub</span>
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path
                              fillRule="evenodd"
                              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
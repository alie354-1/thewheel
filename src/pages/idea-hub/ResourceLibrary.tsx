import React, { useState, useEffect } from 'react';
import { Library, ArrowLeft, Search, Download, ExternalLink, Tag, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  content_url: string;
  thumbnail_url: string;
  tags: string[];
  is_premium: boolean;
}

export default function ResourceLibrary() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const categories = [
    'Business Planning',
    'Market Research',
    'Financial Models',
    'Legal Templates',
    'Pitch Decks',
    'Growth Strategies'
  ];

  const types = [
    'Template',
    'Guide',
    'Tool',
    'Article',
    'Video',
    'Worksheet'
  ];

  useEffect(() => {
    loadResources();
  }, [selectedCategory, selectedType, searchQuery]);

  const loadResources = async () => {
    let query = supabase
      .from('resource_library')
      .select('*');

    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory);
    }

    if (selectedType !== 'all') {
      query = query.eq('type', selectedType);
    }

    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    }

    const { data } = await query;

    if (data) {
      setResources(data);
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
                <Library className="h-6 w-6 mr-2" />
                Resource Library
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Access templates, guides, and educational content
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search resources..."
                />
              </div>
            </div>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Types</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
            >
              {resource.thumbnail_url && (
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={resource.thumbnail_url}
                    alt={resource.title}
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {resource.type}
                  </span>
                  {resource.is_premium && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Premium
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {resource.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {resource.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {resource.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <a
                    href={resource.content_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-900"
                  >
                    View Resource
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                  <button className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900">
                    <Download className="mr-1 h-4 w-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
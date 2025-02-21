import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Calendar, 
  TrendingUp,
  Clock,
  Tag,
  ThumbsUp,
  MessageCircle,
  Plus,
  Users,
  Search,
  Filter,
  Building2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import CreateCommunityModal from '../components/CreateCommunityModal';

interface Community {
  id: string;
  name: string;
  description: string;
  slug: string;
  member_count: number;
  is_private: boolean;
  created_at: string;
  owner_id: string;
}

export default function Community() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('discussions');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommunities(data || []);
    } catch (error) {
      console.error('Error loading communities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCommunities = communities.filter(community => {
    const matchesSearch = community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         community.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || true; // Add category filtering when implemented
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <MessageSquare className="h-6 w-6 mr-2" />
              Communities
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Join communities to connect with other founders and entrepreneurs
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Community
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search communities..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">All Categories</option>
              <option value="tech">Technology</option>
              <option value="business">Business</option>
              <option value="startup">Startups</option>
              <option value="product">Product</option>
            </select>
          </div>
        </div>

        {/* Communities Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCommunities.map((community) => (
            <div
              key={community.id}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    <Link
                      to={`/community/${community.slug}`}
                      className="hover:text-indigo-600"
                    >
                      {community.name}
                    </Link>
                  </h3>
                  {community.is_private && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Private
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {community.description}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {community.member_count} members
                  </div>
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 mr-1" />
                    {community.owner_id === user?.id ? 'You' : 'Member'}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4">
                <Link
                  to={`/community/${community.slug}`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                >
                  View Community
                  <span aria-hidden="true"> &rarr;</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Create Community Modal */}
        <CreateCommunityModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadCommunities}
        />
      </div>
    </div>
  );
}
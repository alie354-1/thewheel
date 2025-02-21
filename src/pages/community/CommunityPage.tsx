import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  MessageSquare,
  FolderOpen,
  Plus,
  Settings,
  ChevronRight,
  Clock,
  FileText,
  Tag,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';

interface Community {
  id: string;
  name: string;
  description: string;
  slug: string;
  avatar_url: string;
  banner_url: string;
  member_count: number;
  is_private: boolean;
  owner: {
    full_name: string;
  };
}

interface Member {
  id: string;
  role: string;
  user: {
    full_name: string;
    avatar_url: string;
  };
}

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author: {
    full_name: string;
  };
  upvotes: number;
  downvotes: number;
}

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  organizer: {
    full_name: string;
  };
}

interface Document {
  id: string;
  title: string;
  description: string;
  file_type: string;
  created_at: string;
  author: {
    full_name: string;
  };
}

export default function CommunityPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState('discussions');
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (slug) {
      loadCommunity();
    }
  }, [slug]);

  const loadCommunity = async () => {
    if (!slug) return;
    setError('');
    
    try {
      // Load community details
      const { data: community, error: communityError } = await supabase
        .from('communities')
        .select(`
          *,
          owner:profiles!communities_owner_id_fkey(full_name)
        `)
        .eq('slug', slug)
        .single();

      if (communityError) throw communityError;
      if (!community) {
        setError('Community not found');
        return;
      }

      setCommunity(community);
      
      // Load members
      const { data: members, error: membersError } = await supabase
        .from('community_members')
        .select(`
          *,
          user:profiles(full_name, avatar_url)
        `)
        .eq('community_id', community.id);

      if (membersError) throw membersError;

      if (members) {
        setMembers(members);
        
        // Check if current user is a member
        const userMember = members.find(m => m.user_id === user?.id);
        setIsMember(!!userMember);
        setIsAdmin(userMember?.role === 'admin' || userMember?.role === 'owner');
      }

      // Load posts
      const { data: posts, error: postsError } = await supabase
        .from('community_posts')
        .select(`
          *,
          author:profiles(full_name)
        `)
        .eq('community_id', community.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (postsError) throw postsError;
      if (posts) setPosts(posts);

      // Load events
      const { data: events, error: eventsError } = await supabase
        .from('community_events')
        .select(`
          *,
          organizer:profiles(full_name)
        `)
        .eq('community_id', community.id)
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(5);

      if (eventsError) throw eventsError;
      if (events) setEvents(events);

      // Load documents
      const { data: documents, error: documentsError } = await supabase
        .from('community_documents')
        .select(`
          *,
          author:profiles(full_name)
        `)
        .eq('community_id', community.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (documentsError) throw documentsError;
      if (documents) setDocuments(documents);
    } catch (error: any) {
      console.error('Error loading community:', error);
      setError(error.message || 'Failed to load community data');
    } finally {
      setIsLoading(false);
    }
  };

  const joinCommunity = async () => {
    if (!user || !community) return;

    try {
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: community.id,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;
      await loadCommunity();
    } catch (error: any) {
      console.error('Error joining community:', error);
      setError(error.message || 'Failed to join community');
    }
  };

  const handleNewPost = () => {
    if (!community) return;
    navigate(`/community/${slug}/new-post`);
  };

  const handleNewEvent = () => {
    if (!community) return;
    navigate(`/community/${slug}/new-event`);
  };

  const handleUploadDocument = () => {
    if (!community) return;
    navigate(`/community/${slug}/upload-document`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-500">{error}</p>
        <button
          onClick={() => navigate('/community')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Back to Communities
        </button>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Community Not Found</h2>
        <p className="text-gray-500">The community you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/community')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Back to Communities
        </button>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-lg" />
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{community.name}</h1>
                <p className="mt-1 text-sm text-gray-500">{community.description}</p>
              </div>
              <div className="flex items-center space-x-4">
                {!isMember && (
                  <button
                    onClick={joinCommunity}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Join Community
                  </button>
                )}
                {isAdmin && (
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage
                  </button>
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {community.member_count} members
              </div>
              <div>Created by {community.owner.full_name}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('discussions')}
                className={`${
                  activeTab === 'discussions'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center justify-center`}
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Discussions
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`${
                  activeTab === 'events'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center justify-center`}
              >
                <Calendar className="h-5 w-5 mr-2" />
                Events
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`${
                  activeTab === 'members'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center justify-center`}
              >
                <Users className="h-5 w-5 mr-2" />
                Members
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`${
                  activeTab === 'documents'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center justify-center`}
              >
                <FolderOpen className="h-5 w-5 mr-2" />
                Documents
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'discussions' && (
            <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900">Recent Discussions</h2>
                  {isMember && (
                    <button
                      onClick={handleNewPost}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Discussion
                    </button>
                  )}
                </div>
                {posts.length > 0 ? (
                  <div className="space-y-6">
                    {posts.map((post) => (
                      <div key={post.id} className="flex space-x-4">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">
                            <Link to={`/community/${slug}/post/${post.id}`} className="hover:text-indigo-600">
                              {post.title}
                            </Link>
                          </h3>
                          <div className="mt-1 text-sm text-gray-500 line-clamp-2">{post.content}</div>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span>{post.author.full_name}</span>
                            <span>•</span>
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No discussions yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get the conversation started by creating the first discussion.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900">Upcoming Events</h2>
                  {isMember && (
                    <button
                      onClick={handleNewEvent}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Event
                    </button>
                  )}
                </div>
                {events.length > 0 ? (
                  <div className="space-y-6">
                    {events.map((event) => (
                      <div key={event.id} className="flex space-x-4">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{event.title}</h3>
                          <div className="mt-1 text-sm text-gray-500">{event.description}</div>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {new Date(event.start_time).toLocaleString()}
                            </div>
                            <div>{event.location}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming events</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Create an event to bring the community together.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="bg-white shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900">Members</h2>
                  {isAdmin && (
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Invite Members
                    </button>
                  )}
                </div>
                {members.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3">
                        <img
                          src={member.user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user.full_name)}`}
                          alt=""
                          className="h-10 w-10 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.user.full_name}</p>
                          <p className="text-sm text-gray-500 capitalize">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No members yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Invite others to join this community.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="bg-white shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900">Documents</h2>
                  {isMember && (
                    <button
                      onClick={handleUploadDocument}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Upload Document
                    </button>
                  )}
                </div>
                {documents.length > 0 ? (
                  <div className="space-y-6">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-8 w-8 text-gray-400" />
                          <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-900">{doc.title}</h3>
                            <div className="mt-1 text-sm text-gray-500">{doc.description}</div>
                            <div className="mt-1 text-xs text-gray-500">
                              Uploaded by {doc.author.full_name} • {new Date(doc.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No documents yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Upload documents to share with the community.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users,
  Code,
  BookOpen,
  GraduationCap,
  Building2,
  FileText,
  Bell,
  Clock,
  ChevronRight,
  Bot,
  Brain,
  Target,
  Lightbulb,
  Calendar,
  Plus
} from 'lucide-react';
import TaskManager from '../components/tasks/TaskManager';
import StandupHistory from '../components/StandupHistory';
import JoinCompanyDialog from '../components/JoinCompanyDialog';

export default function Dashboard() {
  const { profile } = useAuthStore();
  const [hasCompany, setHasCompany] = useState(false);
  const [standupEntries, setStandupEntries] = useState<any[]>([]);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      checkCompanyAccess();
      loadStandupEntries();
    }
  }, [profile]);

  const checkCompanyAccess = async () => {
    if (!profile) return;

    try {
      setIsLoading(true);
      setError('');

      // Check if user owns any companies
      const { data: ownedCompanies, error: ownedError } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', profile.id);

      if (ownedError) throw ownedError;

      if (ownedCompanies && ownedCompanies.length > 0) {
        setHasCompany(true);
        return;
      }

      // Check if user is a member of any companies
      const { data: memberships, error: memberError } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', profile.id);

      if (memberError) throw memberError;

      setHasCompany(memberships && memberships.length > 0);
    } catch (error: any) {
      console.error('Error checking company access:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStandupEntries = async () => {
    if (!profile) return;

    try {
      const { data } = await supabase
        .from('standup_entries')
        .select(`
          *,
          tasks:standup_tasks(*)
        `)
        .eq('user_id', profile.id)
        .order('date', { ascending: false })
        .limit(5);
      
      if (data) {
        setStandupEntries(data);
      }
    } catch (error) {
      console.error('Error loading standup entries:', error);
    }
  };

  const resources = [
    {
      title: 'Technical Docs',
      description: 'API guides & documentation',
      icon: Code,
      action: 'View Docs',
      link: '#'
    },
    {
      title: 'Startup Guides',
      description: 'Best practices & tutorials',
      icon: BookOpen,
      action: 'Explore Guides',
      link: '#'
    },
    {
      title: 'Templates',
      description: 'Ready-to-use documents',
      icon: FileText,
      action: 'Browse Templates',
      link: '#'
    },
    {
      title: 'Learning Paths',
      description: 'Structured courses',
      icon: GraduationCap,
      action: 'Start Learning',
      link: '#'
    }
  ];

  const recentActivities = [
    {
      type: 'message',
      title: 'New message from Advisor',
      description: 'John Davis shared feedback on your pitch deck',
      time: '2 hours ago',
      icon: MessageSquare
    },
    {
      type: 'document',
      title: 'Document update',
      description: 'Business plan template has been updated',
      time: '4 hours ago',
      icon: FileText
    },
    {
      type: 'connection',
      title: 'New connection request',
      description: 'Sarah Miller wants to connect',
      time: '6 hours ago',
      icon: Users
    }
  ];

  const updates = [
    {
      category: 'Community & Network',
      items: [
        {
          title: 'Founder Meetup',
          description: 'Tomorrow at 2:00 PM',
          icon: Users
        },
        {
          title: 'Active Discussions',
          description: '12 new topics',
          icon: MessageSquare
        }
      ]
    },
    {
      category: 'Marketplace Updates',
      items: [
        {
          title: 'Legal Consultation',
          description: 'New service provider added',
          icon: Building2
        },
        {
          title: 'Analytics Dashboard',
          description: 'Recommended tool',
          icon: LayoutDashboard
        }
      ]
    }
  ];

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's what's happening in your founder journey
          </p>
        </div>

        {/* AI Co-founder Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-8 sm:p-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bot className="h-8 w-8 text-white" />
                  <div className="ml-4">
                    <h2 className="text-xl font-semibold text-white">AI Co-founder</h2>
                    <p className="text-indigo-100">Your personal startup advisor</p>
                  </div>
                </div>
                <Link
                  to="/idea-hub/cofounder-bot"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-600 bg-white hover:bg-indigo-50"
                >
                  Start Daily Standup
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Company Setup Card */}
        {!hasCompany && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Set Up Your Company</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Create your company profile or join an existing one.
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowJoinDialog(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Join Company
                </button>
                <Link
                  to="/company/setup"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Set Up Company
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Task Manager */}
        <div className="mb-8">
          <TaskManager showCompleted={false} />
        </div>

        {/* Standup History */}
        <div className="mb-8">
          <StandupHistory entries={standupEntries} />
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {resources.map((resource, index) => (
            <div
              key={index}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <resource.icon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{resource.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{resource.description}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <a
                    href={resource.link}
                    className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900"
                  >
                    {resource.action}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activities */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Activities</h2>
            <a href="#" className="text-sm text-indigo-600 hover:text-indigo-900">
              View all
            </a>
          </div>
          <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
            {recentActivities.map((activity, index) => (
              <div key={index} className="p-4 hover:bg-gray-50">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <activity.icon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="mt-1 text-sm text-gray-500">{activity.description}</p>
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Updates Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {updates.map((section, index) => (
            <div key={index} className="bg-white shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{section.category}</h3>
                <div className="space-y-4">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-start">
                      <div className="flex-shrink-0">
                        <item.icon className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Join Company Dialog */}
        <JoinCompanyDialog
          isOpen={showJoinDialog}
          onClose={() => setShowJoinDialog(false)}
          onSuccess={() => {
            setShowJoinDialog(false);
            window.location.href = '/company/dashboard';
          }}
        />
      </div>
    </div>
  );
}
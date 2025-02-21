import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  Settings,
  FolderOpen,
  CheckSquare,
  Cloud,
  BarChart,
  Plus,
  ChevronRight,
  Clock,
  AlertCircle,
  Rocket,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import TaskManager from '../../components/tasks/TaskManager';
import DocumentStore from '../../components/company/DocumentStore';
import CompanyStages from '../../components/company/CompanyStages';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  category: string;
  task_type: string;
  estimated_hours: number;
  due_date: string;
}

interface CompanyMember {
  id: string;
  role: string;
  title: string;
  department: string;
  user_id: string;
  user_email: string;
}

interface Company {
  id: string;
  name: string;
  industry: string;
  website: string;
  size: string;
  stage: string;
  workspace_setup: {
    google: boolean;
    microsoft: boolean;
  };
}

export default function CompanyDashboard() {
  const { profile } = useAuthStore();
  const [company, setCompany] = useState<Company | null>(null);
  const [documents, setDocuments] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      loadCompanyData();
    }
  }, [profile]);

  const loadCompanyData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Fetch company data
      const { data: companies, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (companyError) throw companyError;

      const company = companies?.[0];
      if (company) {
        setCompany(company);

        // Fetch related data
        const [
          { data: documentsData },
          { data: environmentsData },
          { data: membersData }
        ] = await Promise.all([
          supabase
            .from('company_documents')
            .select('*')
            .eq('company_id', company.id)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('development_environments')
            .select('*')
            .eq('company_id', company.id),
          supabase
            .from('company_members')
            .select('id, role, title, department, user_id, user_email')
            .eq('company_id', company.id)
        ]);

        setDocuments(documentsData || []);
        setEnvironments(environmentsData || []);
        setMembers(membersData || []);
      }
    } catch (error: any) {
      console.error('Error fetching company data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
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
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              {company?.name || 'Company Dashboard'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">{company?.industry}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/company/members"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Users className="h-4 w-4 mr-2" />
              Team ({members.length})
            </Link>
            <Link
              to="/company/settings"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Team Members</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{members.length}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/company/members" className="font-medium text-indigo-700 hover:text-indigo-900">
                  View all
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FolderOpen className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Documents</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{documents.length}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <button 
                  onClick={() => setActiveTab('documents')} 
                  className="font-medium text-indigo-700 hover:text-indigo-900"
                >
                  View all
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Cloud className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Dev Environments</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {environments.filter(e => e.status === 'active').length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/company/environments" className="font-medium text-indigo-700 hover:text-indigo-900">
                  View all
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Analytics</dt>
                    <dd className="flex items-baseline">
                      <div className="text-sm text-gray-500">Coming soon</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-gray-500">Available soon</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stage Tracker */}
        <div className="mt-8">
          <CompanyStages company={company} />
        </div>

        {/* Navigation Tabs */}
        <div className="mt-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`${
                activeTab === 'documents'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Documents
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`${
                activeTab === 'tasks'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Tasks
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Task Manager */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Tasks</h2>
                <TaskManager category="company" showCompleted={false} />
              </div>

              {/* Team Members */}
              <div className="bg-white shadow rounded-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Team Members</h2>
                    <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                      <Plus className="h-4 w-4 mr-1" />
                      Invite Member
                    </button>
                  </div>
                  <div className="flow-root">
                    <ul className="-my-5 divide-y divide-gray-200">
                      {members.map((member) => (
                        <li key={member.id} className="py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <img
                                className="h-8 w-8 rounded-full"
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.user_email || 'User')}`}
                                alt=""
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {member.user_email}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {member.title} • {member.role}
                              </p>
                            </div>
                            <div>
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <DocumentStore />
          )}

          {activeTab === 'tasks' && (
            <TaskManager category="company" showCompleted={true} />
          )}
        </div>
      </div>
    </div>
  );
}
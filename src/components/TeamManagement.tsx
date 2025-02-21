import React, { useState } from 'react';
import { Users, UserPlus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  title: string;
  department: string;
  user_email?: string;
}

interface TeamManagementProps {
  companyId: string;
  members: TeamMember[];
  onMemberAdded: () => void;
  onMemberRemoved: () => void;
}

export default function TeamManagement({ companyId, members, onMemberAdded, onMemberRemoved }: TeamManagementProps) {
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');
  const [newMemberTitle, setNewMemberTitle] = useState('');
  const [newMemberDepartment, setNewMemberDepartment] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAdding(true);

    try {
      // Get user by email using RPC function
      const { data: userData, error: userError } = await supabase
        .rpc('get_user_by_email', {
          email: newMemberEmail
        });

      if (userError || !userData) {
        setError('User not found. Please check the email address.');
        return;
      }

      // Add the user to the company
      const { error: memberError } = await supabase
        .from('company_members')
        .insert({
          company_id: companyId,
          user_id: userData.id,
          role: newMemberRole,
          title: newMemberTitle,
          department: newMemberDepartment
        });

      if (memberError) {
        if (memberError.code === '23505') { // Unique violation
          setError('This user is already a member of the company.');
        } else {
          setError('Failed to add team member. Please try again.');
        }
        return;
      }

      // Clear form
      setNewMemberEmail('');
      setNewMemberRole('member');
      setNewMemberTitle('');
      setNewMemberDepartment('');
      onMemberAdded();
    } catch (error) {
      console.error('Error adding team member:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('company_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      onMemberRemoved();
    } catch (error) {
      console.error('Error removing team member:', error);
      setError('Failed to remove team member. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Member Form */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            Add Team Member
          </h3>
        </div>
        <form onSubmit={handleAddMember} className="px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                required
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                required
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="guest">Guest</option>
              </select>
            </div>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={newMemberTitle}
                onChange={(e) => setNewMemberTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <input
                type="text"
                id="department"
                value={newMemberDepartment}
                onChange={(e) => setNewMemberDepartment(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isAdding}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isAdding ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>

      {/* Team Members List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Team Members
          </h3>
        </div>
        <div className="px-6 py-5">
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
                      {member.department && (
                        <p className="text-sm text-gray-500 truncate">
                          {member.department}
                        </p>
                      )}
                    </div>
                    <div>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="inline-flex items-center p-1 border border-transparent rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
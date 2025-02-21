import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin' | 'superadmin';
  is_public: boolean;
  avatar_url: string | null;
  allows_messages: boolean;
  status: 'online' | 'offline' | 'away' | null;
  last_seen: string | null;
  professional_background: string | null;
  social_links: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
  } | null;
  cloud_storage?: {
    google?: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    };
    microsoft?: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    };
  };
}

interface AuthStore {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  fetchProfile: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  isAdmin: false,
  isSuperAdmin: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({
    profile,
    isAdmin: profile?.role === 'admin' || profile?.role === 'superadmin',
    isSuperAdmin: profile?.role === 'superadmin'
  }),
  fetchProfile: async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (profile) {
        set({
          profile,
          isAdmin: profile.role === 'admin' || profile.role === 'superadmin',
          isSuperAdmin: profile.role === 'superadmin'
        });
      } else {
        // If no profile exists, create one with messaging enabled by default
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: userId,
              email: (await supabase.auth.getUser()).data.user?.email,
              role: 'user',
              allows_messages: true, // Enable messaging by default
              is_public: true // Make profile public by default
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          return;
        }

        if (newProfile) {
          set({
            profile: newProfile,
            isAdmin: false,
            isSuperAdmin: false
          });
        }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, isAdmin: false, isSuperAdmin: false });
  },
}));
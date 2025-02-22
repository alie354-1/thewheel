// Add to existing imports
import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Add new interface for feature flags
interface FeatureFlags {
  // Idea Hub Features
  ideaRefinement: boolean;
  marketValidation: boolean;
  businessModel: boolean;
  pitchDeck: boolean;
  aiDiscussion: boolean;
  ideaCanvas: boolean;
  marketResearch: boolean;
  
  // Community Features
  communityDiscussions: boolean;
  communityEvents: boolean;
  communityResources: boolean;
  communityMentoring: boolean;
  
  // Company Features
  companySetup: boolean;
  companyDashboard: boolean;
  companyDocuments: boolean;
  companyTeam: boolean;
  companyProgress: boolean;
  
  // AI Features
  aiCofounder: boolean;
  aiTaskGeneration: boolean;
  aiStrategicAnalysis: boolean;
  
  // Tool Features
  toolRecommendations: boolean;
  toolIntegrations: boolean;
  toolMarketplace: boolean;
  
  // Directory Features
  userDirectory: boolean;
  companyDirectory: boolean;
  mentorDirectory: boolean;
  
  // Messaging Features
  directMessages: boolean;
  groupChats: boolean;
  notifications: boolean;
}

// Update AuthStore interface
interface AuthStore {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  featureFlags: FeatureFlags;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setFeatureFlags: (flags: FeatureFlags) => void;
  fetchProfile: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Default feature flags
const defaultFeatureFlags: FeatureFlags = {
  // Idea Hub Features
  ideaRefinement: false,
  marketValidation: false,
  businessModel: false,
  pitchDeck: false,
  aiDiscussion: false,
  ideaCanvas: false,
  marketResearch: false,
  
  // Community Features
  communityDiscussions: false,
  communityEvents: false,
  communityResources: false,
  communityMentoring: false,
  
  // Company Features
  companySetup: true, // Keep core company features enabled by default
  companyDashboard: true,
  companyDocuments: true,
  companyTeam: true,
  companyProgress: true,
  
  // AI Features
  aiCofounder: false,
  aiTaskGeneration: false,
  aiStrategicAnalysis: false,
  
  // Tool Features
  toolRecommendations: false,
  toolIntegrations: false,
  toolMarketplace: false,
  
  // Directory Features
  userDirectory: true,
  companyDirectory: true,
  mentorDirectory: false,
  
  // Messaging Features
  directMessages: true,
  groupChats: false,
  notifications: true
};

// Update store implementation
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  isAdmin: false,
  isSuperAdmin: false,
  featureFlags: defaultFeatureFlags,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({
    profile,
    isAdmin: profile?.role === 'admin' || profile?.role === 'superadmin',
    isSuperAdmin: profile?.role === 'superadmin'
  }),
  setFeatureFlags: (flags) => set({ featureFlags: flags }),
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
          isSuperAdmin: profile.role === 'superadmin',
          featureFlags: profile.settings?.feature_flags || defaultFeatureFlags
        });
      } else {
        // Create new profile with default settings
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            email: (await supabase.auth.getUser()).data.user?.email,
            role: 'user',
            allows_messages: true,
            is_public: true,
            settings: {
              feature_flags: defaultFeatureFlags
            }
          }])
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
            isSuperAdmin: false,
            featureFlags: defaultFeatureFlags
          });
        }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ 
      user: null, 
      profile: null, 
      isAdmin: false, 
      isSuperAdmin: false,
      featureFlags: defaultFeatureFlags
    });
  },
}));
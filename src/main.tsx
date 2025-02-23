import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAuthStore } from './lib/store';
import App from './App.tsx';
import './index.css';

// Initialize auth state
const initAuth = async () => {
  const { setUser, fetchProfile } = useAuthStore.getState();

  try {
    // Get initial session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw sessionError;
    }

    if (session?.user) {
      setUser(session.user);
      await fetchProfile(session.user.id);
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  } catch (error) {
    console.error('Error initializing auth:', error);
  }
};

// Initialize auth before rendering
initAuth().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Router>
        <App />
      </Router>
    </StrictMode>
  );
});
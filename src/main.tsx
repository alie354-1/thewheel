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

  // Get initial session
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    setUser(session.user);
    await fetchProfile(session.user.id);
  }

  // Listen for auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      setUser(session.user);
      await fetchProfile(session.user.id);
    } else {
      setUser(null);
    }
  });
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
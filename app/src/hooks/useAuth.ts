import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isLoading: boolean;
  error: string | null;
  isDemoMode: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    isLoading: true,
    error: null,
    isDemoMode: false,
  });

  const fetchUserRole = useCallback(async (userId: string): Promise<AppRole | null> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return data?.role ?? null;
    } catch (err) {
      console.error('Error in fetchUserRole:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null;
        
        if (user) {
          // Use setTimeout to avoid deadlock with Supabase auth
          setTimeout(async () => {
            const role = await fetchUserRole(user.id);
            setAuthState(prev => ({
              user,
              session,
              role,
              isLoading: false,
              error: null,
              isDemoMode: false, // Exit demo mode on real auth
            }));
          }, 0);
        } else {
          setAuthState(prev => ({
            user: null,
            session: null,
            role: null,
            isLoading: false,
            error: null,
            isDemoMode: prev.isDemoMode, // Preserve demo mode
          }));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      
      if (user) {
        const role = await fetchUserRole(user.id);
        setAuthState({
          user,
          session,
          role,
          isLoading: false,
          error: null,
          isDemoMode: false,
        });
      } else {
        setAuthState(prev => ({
          user: null,
          session: null,
          role: null,
          isLoading: false,
          error: null,
          isDemoMode: prev.isDemoMode,
        }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  const signUp = async (email: string, password: string, fullName?: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setAuthState(prev => ({ ...prev, isLoading: false, error: error.message }));
      return { data: null, error };
    }

    return { data, error: null };
  };

  const signIn = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthState(prev => ({ ...prev, isLoading: false, error: error.message }));
      return { data: null, error };
    }

    return { data, error: null };
  };

  const signOut = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      setAuthState(prev => ({ ...prev, isLoading: false, error: error.message }));
    }
    
    return { error };
  };

  const enterDemoMode = () => {
    setAuthState(prev => ({ ...prev, isDemoMode: true, isLoading: false }));
  };

  const exitDemoMode = () => {
    setAuthState(prev => ({ ...prev, isDemoMode: false }));
  };

  return {
    ...authState,
    isAuthenticated: !!authState.user,
    isAlumno: authState.role === 'alumno',
    isProfesor: authState.role === 'profesor',
    isAdmin: authState.role === 'admin',
    signUp,
    signIn,
    signOut,
    enterDemoMode,
    exitDemoMode,
  };
}

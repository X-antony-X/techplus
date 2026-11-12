
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabase';

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAccess = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          if (mounted) {
            setLoggedIn(false);
            setLoading(false);
          }
          return;
        }

        if (mounted) setLoggedIn(true);

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        const hasAccess = ['teacher', 'lecturer', 'admin'].includes(
          profile?.role
        );

        if (mounted) {
          setAuthorized(hasAccess);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking user role:', error);

        if (mounted) {
          setAuthorized(false);
          setLoading(false);
        }
      }
    };

    checkAccess();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-600" />
      </div>
    );
  }

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!authorized) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;

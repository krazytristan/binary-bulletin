import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ProtectedRoute() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // 1. Get the initial session state
    const checkSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setLoading(false);
    };

    checkSession();

    // 2. Listen for auth changes (Login/Logout/Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // While checking auth, show a clean background to avoid the "White Screen" flash
  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If no user is logged in, send them to the login page
  // 'replace' prevents them from clicking 'back' into the admin panel
  // 'state' remembers where they were trying to go
  if (!session) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  // If authenticated, render the sub-routes (Dashboard, Articles, etc.)
  return <Outlet />;
}
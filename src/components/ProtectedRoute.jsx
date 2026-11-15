import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ProtectedRoute() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFBF9] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-amber-400 rounded-full animate-spin"></div>
        <p className="font-serif italic text-sm text-gray-600">Verifying editorial credentials...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

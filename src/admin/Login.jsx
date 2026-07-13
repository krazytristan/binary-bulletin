import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  Loader2, 
  ShieldAlert,
  ArrowLeft,
  Quote
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 🔄 AUTH LISTENER
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/admin-panel/dashboard", { replace: true });
      }
    });

    return () => subscription?.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) throw error;
      
    } catch (err) {
      setErrorMsg("Authentication failed. Please check your credentials and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FCFBF9] font-sans selection:bg-[#1E3A8A] selection:text-white">
      
      {/* LEFT PANE: BRANDING & IMAGE */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black flex-col justify-between overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="/ama-bg.jpg" 
            alt="Campus" 
            className="w-full h-full object-cover opacity-50 grayscale transition-transform duration-1000 hover:scale-105"
            onError={(e) => {
              // Fallback gradient if image not found
              e.target.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 p-12 h-full flex flex-col justify-between">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors font-sans text-xs uppercase tracking-widest font-bold">
              <ArrowLeft size={16} /> Return to Publication
            </Link>
          </div>

          <div className="max-w-lg">
            <div className="flex items-center gap-3 mb-6 text-[#F59E0B]">
              <Quote size={32} fill="currentColor" />
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-black text-white leading-tight mb-6">
              The Press Room
            </h2>
            <p className="text-lg text-white/80 font-serif leading-relaxed italic">
              "Access to the editorial dashboard is restricted to authorized journalists and staff members of The Binary Bulletin."
            </p>
            
            <div className="mt-12 flex items-center gap-4 border-t border-white/20 pt-6">
              <span className="text-[10px] font-sans font-bold text-white/50 uppercase tracking-widest">System Status</span>
              <span className="flex items-center gap-2 text-[10px] font-sans font-bold text-emerald-400 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANE: LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative">
        <div className="w-full max-w-md">
          
          <div className="mb-12 text-center lg:text-left">
            <h1 className="text-3xl font-serif font-black text-gray-900 tracking-tight mb-3">Editor Login</h1>
            <p className="text-gray-500 font-sans text-sm">Sign in to access the publication dashboard.</p>
          </div>

          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-red-50 border border-red-200 text-red-700 p-4 mb-8 rounded-lg text-sm flex items-start gap-3"
              >
                <ShieldAlert size={20} className="shrink-0 mt-0.5 text-red-500" />
                <span className="font-serif leading-relaxed">{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-sans font-bold text-gray-700 uppercase tracking-widest block">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1E3A8A] transition-colors" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="editor@binarybulletin.com"
                  className="w-full bg-white border border-gray-300 p-4 pl-12 rounded-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none transition-all font-sans text-gray-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-sans font-bold text-gray-700 uppercase tracking-widest">Password</label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1E3A8A] transition-colors" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white border border-gray-300 p-4 pl-12 pr-12 rounded-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none transition-all font-sans text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className={`w-full p-4 mt-8 font-sans font-bold uppercase tracking-widest text-white transition-colors flex items-center justify-center gap-3 ${
                loading ? "bg-gray-400" : "bg-black hover:bg-[#1E3A8A]"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Access Dashboard</span>
              )}
            </button>
          </form>

          <div className="mt-16 text-center lg:text-left">
            <Link to="/" className="text-xs font-sans font-bold uppercase tracking-widest text-gray-400 hover:text-[#1E3A8A] transition-colors">
              &larr; Back to Front Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
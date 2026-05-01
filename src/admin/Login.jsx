import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  Loader2, 
  ShieldCheck, 
  CircuitBoard, 
  ShieldAlert,
  Fingerprint 
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 🔄 AUTH LISTENER
  // Redirects the user if they are already logged in or just successfully signed in.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // We navigate to /admin-panel/dashboard to match our App.js protected routes
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
      
      // Navigation is handled by onAuthStateChange above
    } catch (err) {
      // Generic error for security
      setErrorMsg("Verification Failed: Access restricted to authorized terminals.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-[#05070a]">
      
      {/* 🌌 BACKGROUND ANIMATION */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute -top-[10%] -left-[10%] w-[80%] h-[60%] rounded-full bg-blue-900/20 blur-[120px]" 
        />
        <motion.div 
          initial={{ top: "-10%" }}
          animate={{ top: "110%" }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 w-full h-[1px] bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.3)] z-10"
        />
      </div>

      {/* 🔷 LOGIN CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-2 bg-[#0d1117]/95 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        
        {/* LEFT: IDENTITY */}
        <div className="flex flex-col justify-between p-10 md:p-14 bg-gradient-to-br from-blue-600/10 to-transparent border-b md:border-b-0 md:border-r border-white/5">
          <div className="relative">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-10 shadow-xl shadow-blue-500/20">
              <CircuitBoard size={36} className="text-white" />
            </div>
            
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase leading-[0.85] mb-4">
              THE BINARY <br /> <span className="text-blue-500">BULLETIN</span>
            </h1>
            <p className="text-gray-400 font-medium text-sm opacity-70 max-w-[280px]">
              Secure Administrative Gateway. Terminal verification active.
            </p>
          </div>
          
          <div className="hidden md:flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
            <Fingerprint className="text-blue-400" size={24} />
            <div>
                <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Protocol</p>
                <p className="text-[11px] font-mono text-emerald-400 uppercase">AUTH_ENCRYPTED</p>
            </div>
          </div>
        </div>

        {/* RIGHT: FORM */}
        <div className="bg-white p-10 md:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Admin Login</h2>
            <p className="text-gray-500 text-sm font-medium">Please enter credentials.</p>
          </div>

          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-xl text-xs font-bold flex items-center gap-3"
              >
                <ShieldAlert size={18} className="shrink-0" />
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Terminal ID</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nexgen.sys"
                  className="w-full bg-gray-50 border border-gray-200 p-4 pl-12 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 outline-none transition-all font-medium text-gray-900"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Passkey</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-gray-50 border border-gray-200 p-4 pl-12 pr-12 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 outline-none transition-all font-medium text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={loading}
              type="submit"
              className={`w-full p-4 rounded-2xl text-white font-bold text-lg shadow-xl flex items-center justify-center gap-3 transition-all ${
                loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={22} />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={22} />
                  <span>Secure Access</span>
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between opacity-40">
            <span className="text-[10px] font-black uppercase tracking-widest">Node_01_Online</span>
            <span className="text-[10px] font-bold uppercase tracking-tight">
              © {new Date().getFullYear()} NEXGEN IT Solutions
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
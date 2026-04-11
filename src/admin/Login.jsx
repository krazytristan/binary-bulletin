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

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) navigate("/admin/dashboard");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // 🛡️ ROLE CHECK
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError || profile?.role !== "admin") {
        setErrorMsg("Access Denied: Administrative privileges required.");
        await supabase.auth.signOut();
        return;
      }

      navigate("/admin/dashboard");
    } catch (err) {
      setErrorMsg(err.message === "Invalid login credentials" 
        ? "Verification Failed: Invalid email or password." 
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-[#05070a]">
      
      {/* 🌌 DYNAMIC BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Animated Glows */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-[10%] -left-[10%] w-[80%] md:w-[60%] h-[60%] rounded-full bg-blue-900/30 blur-[80px] md:blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -bottom-[10%] -right-[10%] w-[70%] md:w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[80px] md:blur-[100px]" 
        />
        
        {/* Security Scanner Line */}
        <motion.div 
          initial={{ top: "-10%" }}
          animate={{ top: "110%" }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 w-full h-[1px] bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.4)] z-10"
        />
      </div>

      {/* 🔷 MAIN LOGIN CARD */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-2 bg-[#0d1117]/80 backdrop-blur-3xl border border-white/5 rounded-[2rem] shadow-2xl overflow-hidden"
      >
        
        {/* --- LEFT SIDE: IDENTITY & BRAND --- */}
        <div className="flex flex-col justify-between p-8 md:p-12 bg-gradient-to-br from-blue-700/20 to-indigo-900/40 text-white border-b md:border-b-0 md:border-r border-white/5">
          <div className="relative z-10">
            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-500/20">
              <CircuitBoard size={32} />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-4 leading-tight uppercase">
              The Binary <br /> <span className="text-blue-500">Bulletin</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-lg font-medium opacity-80 leading-relaxed max-w-sm">
              Secure Administrative Gateway. Identity verification required for terminal access.
            </p>
          </div>
          
          <div className="hidden md:flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 mt-8">
            <Fingerprint className="text-blue-400" size={24} />
            <div>
                <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Auth Protocol</p>
                <p className="text-xs font-mono text-emerald-400">ENCRYPTED // ACTIVE</p>
            </div>
          </div>
        </div>

        {/* --- RIGHT SIDE: INPUT FORM --- */}
        <div className="bg-white p-8 md:p-14 flex flex-col justify-center">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">Admin Login</h2>
            <p className="text-gray-500 font-medium text-sm md:text-base">Authentication terminal ready.</p>
          </div>

          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-xl text-xs md:text-sm font-bold flex items-center gap-3 shadow-sm"
              >
                <ShieldAlert size={18} className="shrink-0" />
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* EMAIL INPUT */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Terminal ID</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@binary.sys"
                  className="w-full bg-gray-50 border border-gray-200 p-4 pl-12 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium"
                />
              </div>
            </div>

            {/* PASSWORD INPUT */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Passkey</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-gray-50 border border-gray-200 p-4 pl-12 pr-12 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* ACTION BUTTON */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className={`w-full p-4 rounded-2xl text-white font-bold text-lg shadow-xl flex items-center justify-center gap-3 transition-all ${
                loading 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-200/50"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Verifying Terminal...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={20} />
                  <span>Secure Access</span>
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                Node 01 // Active
              </span>
            </div>
            <span className="text-[10px] font-bold text-gray-300">
              © {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
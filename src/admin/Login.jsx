import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

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

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role !== "admin") {
        setErrorMsg("Access denied. Not an admin.");
        await supabase.auth.signOut();
        return;
      }

      navigate("/admin/dashboard");
    } catch (err) {
      setErrorMsg(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-900 to-blue-600">

      {/* 🔥 ANIMATED BACKGROUND */}
      <motion.div
        className="absolute w-[500px] h-[500px] bg-blue-400 opacity-20 rounded-full blur-3xl"
        animate={{ x: [0, 50, -50, 0], y: [0, 50, -50, 0] }}
        transition={{ repeat: Infinity, duration: 12 }}
      />

      <motion.div
        className="absolute w-[400px] h-[400px] bg-blue-300 opacity-20 rounded-full blur-3xl right-0 bottom-0"
        animate={{ x: [0, -40, 40, 0], y: [0, -40, 40, 0] }}
        transition={{ repeat: Infinity, duration: 10 }}
      />

      {/* CARD */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-5xl grid md:grid-cols-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
      >

        {/* LEFT */}
        <div className="hidden md:flex flex-col justify-center items-center text-white p-10 space-y-4">
          <h1 className="text-3xl font-bold text-center">
            The Binary Bulletin
          </h1>
          <p className="text-sm opacity-80 text-center">
            Manage content, media, and news effortlessly.
          </p>
        </div>

        {/* RIGHT */}
        <div className="bg-white p-8 md:p-10">

          <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
            Admin Login
          </h2>

          {/* ERROR */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-100 text-red-600 p-2 mb-4 rounded text-sm text-center"
            >
              {errorMsg}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">

            {/* EMAIL */}
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="peer w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />

              <label
                className={`absolute left-3 bg-white px-1 text-gray-500 text-sm transition-all
                ${
                  email
                    ? "top-[-8px] text-xs text-blue-600"
                    : "top-3 peer-focus:top-[-8px] peer-focus:text-xs peer-focus:text-blue-600"
                }`}
              >
                Email
              </label>
            </div>

            {/* PASSWORD */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="peer w-full border p-3 rounded-lg pr-10 focus:ring-2 focus:ring-blue-500 outline-none"
              />

              <label
                className={`absolute left-3 bg-white px-1 text-gray-500 text-sm transition-all
                ${
                  password
                    ? "top-[-8px] text-xs text-blue-600"
                    : "top-3 peer-focus:top-[-8px] peer-focus:text-xs peer-focus:text-blue-600"
                }`}
              >
                Password
              </label>

              <span
                className="absolute right-3 top-3 cursor-pointer text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁"}
              </span>
            </div>

            {/* BUTTON */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
              type="submit"
              disabled={loading}
              className={`w-full p-3 rounded-lg text-white font-semibold flex items-center justify-center gap-2 ${
                loading
                  ? "bg-gray-400"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
              {loading ? "Logging in..." : "Login"}
            </motion.button>

          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            © {new Date().getFullYear()} The Binary Bulletin
          </p>

        </div>
      </motion.div>
    </div>
  );
}
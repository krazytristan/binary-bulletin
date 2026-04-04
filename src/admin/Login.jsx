import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 🔐 Auto redirect if already logged in
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      navigate("/admin/dashboard");
    }
  };

  // 🔑 LOGIN FUNCTION
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

      // ✅ OPTIONAL: CHECK ROLE (ADMIN ONLY)
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

      // ✅ SUCCESS
      navigate("/admin/dashboard");

    } catch (err) {
      console.error("LOGIN ERROR:", err.message);
      setErrorMsg(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-600 p-4">
      
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl">
        
        {/* 🔥 HEADER */}
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Admin Login
        </h2>
        <p className="text-center text-gray-500 text-sm mb-6">
          The Binary Bulletin
        </p>

        {/* ❌ ERROR */}
        {errorMsg && (
          <div className="bg-red-100 text-red-600 p-2 mb-4 rounded text-sm text-center">
            {errorMsg}
          </div>
        )}

        {/* 🔐 FORM */}
        <form onSubmit={handleLogin}>
          
          {/* EMAIL */}
          <div className="mb-4">
            <label className="text-sm text-gray-600">Email</label>
            <input
              type="email"
              required
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* PASSWORD */}
          <div className="mb-4 relative">
            <label className="text-sm text-gray-600">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              className="w-full p-3 border rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* 👁 SHOW PASSWORD */}
            <span
              className="absolute right-3 top-9 cursor-pointer text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁"}
            </span>
          </div>

          {/* 🔘 BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full p-3 rounded-lg text-white font-semibold transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* FOOTER */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} The Binary Bulletin
        </p>
      </div>
    </div>
  );
}
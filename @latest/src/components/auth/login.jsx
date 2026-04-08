import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "./auth_layout";
import ClerkPopup from "./ClerkPopup";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/react";
import { Toast } from "../common/toast";
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const validate = () => {
    let e = {};
    if (!email.includes("@"))
      e.email = "Invalid email";
    if (password.length < 6)
      e.password = "Password must be 6+ characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.msg || "Login failed");
        return;
      }
      // ✅ STORE USER + TOKEN
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      console.log("Login success:", data);
      navigate("/dashboard");
      Toast.success("User SuccesFully Log In")
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };
  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Login to continue"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <motion.input
          whileFocus={{ scale: 1.02 }}
          type="email"
          placeholder="Email"
          className="w-full px-4 py-3 rounded-lg bg-white/70"
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <p className="text-red-300 text-sm">{errors.email}</p>}
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg bg-white/70"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-3 text-sm"
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>
        {errors.password && <p className="text-red-300 text-sm">{errors.password}</p>}
        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-black py-3 rounded-lg">
          Sign In
        </button>
      </form>
      <div className="mt-6 text-center">
        <ClerkPopup />
        <p className="text-black black-sm mt-4">
          Don't have account?
          <Link to="/Signup" className="ml-1 underline">Signup</Link>
        </p>
        <Link to="/forgot-password" className="text-sm text-black underline">
          Forgot Password
        </Link>
      </div>
    </AuthLayout>
  );
}
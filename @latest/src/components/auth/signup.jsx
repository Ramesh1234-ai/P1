import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import AuthLayout from "./auth_layout";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [category, setCategory] = useState("User");
  const [file, setFile] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          username: email.split("@")[0],
          avatarUrl: "",
          role: category,
        }),
      });

      const data = await res.json();
      console.log(data);

      if (!res.ok) {
        alert(data.msg || "Signup failed");
        return;
      }

      alert("Account created successfully ✅");
      navigate("/login");

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Start your journey">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full px-4 py-3 rounded-lg border border-gray-300"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full px-4 py-3 rounded-lg border border-gray-300"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full px-4 py-3 rounded-lg border border-gray-300"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        {/* Category */}
        <div className="relative">
          <select
            className="w-full px-4 py-3 rounded-lg border border-gray-300 appearance-none"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Admin</option>
            <option>Streamer</option>
            <option>User</option>
          </select>
          <ChevronDown
            size={20}
            color="#aaa"
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
        </div>
        {/* File */}
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full"
        />
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition"
        >
          Create Account
        </button>
      </form>
      <p className="text-black text-center mt-6">
        Already have an account?
        <Link to="/login" className="ml-1 underline text-indigo-600">
          Login
        </Link>
      </p>
    </AuthLayout>
  );
}
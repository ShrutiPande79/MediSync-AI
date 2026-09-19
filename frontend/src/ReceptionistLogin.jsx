import { useState } from "react";

function ReceptionistLogin({ onLogin, onCreateAccount }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/receptionists/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password");
      }

      console.log("Receptionist login successful:", data.receptionist);
      onLogin(data.receptionist);
    } catch (err) {
      console.error("Receptionist login error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-50 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-indigo-100">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏥</div>
          <h1 className="text-3xl font-bold text-gray-900">
            Receptionist Login
          </h1>
          <p className="text-gray-500 mt-2">
            Access hospital clinic desk & patient records
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="receptionist@hospital.com"
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition shadow-md"
          >
            {loading ? "Logging in..." : "Login to Desk"}
          </button>
        </form>

        <button
          type="button"
          onClick={onCreateAccount}
          className="w-full mt-4 border border-indigo-600 text-indigo-600 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition"
        >
          Create Receptionist Account
        </button>
      </div>
    </div>
  );
}

export default ReceptionistLogin;

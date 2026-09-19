import { useState } from "react";

function DoctorLogin({ onLogin, onCreateAccount }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/doctors/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password");
      }

      console.log("Doctor login successful:", data.doctor);

      onLogin(data.doctor);
    } catch (error) {
      console.error("Doctor login error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8">

        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👨‍⚕️</div>

          <h1 className="text-3xl font-bold text-gray-900">
            Doctor Login
          </h1>

          <p className="text-gray-500 mt-2">
            Login to access your doctor account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block font-medium mb-2">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter doctor email"
              required
              className="w-full border rounded-xl px-4 py-3 outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label className="block font-medium mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="w-full border rounded-xl px-4 py-3 outline-none focus:border-green-500"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Doctor Login"}
          </button>

        </form>

        <button
          type="button"
          onClick={onCreateAccount}
          className="w-full mt-4 border border-green-600 text-green-600 py-3 rounded-xl font-semibold hover:bg-green-50"
        >
          Create Doctor Account
        </button>

      </div>
    </div>
  );
}

export default DoctorLogin;
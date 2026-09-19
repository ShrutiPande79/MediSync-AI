import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

function Register({ onRegisterSuccess, onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [patientId, setPatientId] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // 1. Create Firebase account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // 2. Create patient in MongoDB
      const response = await fetch("http://localhost:5000/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create patient record"
        );
      }

      // 3. Save Patient ID
      setPatientId(data.patient.patientId);

      console.log("Patient created:", data.patient);

      // 4. Continue to patient portal
      onRegisterSuccess(userCredential.user);

    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Create Patient Account</h2>

        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="tel"
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Create password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength="6"
            required
          />

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          <button type="submit">
            Register
          </button>
        </form>

        {patientId && (
          <div className="mt-5 p-4 bg-green-50 border border-green-300 rounded-xl text-center">
            <p className="text-green-700 font-semibold">
              Registration Successful!
            </p>

            <p className="mt-2 text-gray-700">
              Your Patient ID is:
            </p>

            <p className="text-2xl font-bold text-green-600 mt-1">
              {patientId}
            </p>
          </div>
        )}

        <p>
          Already have an account?{" "}
          <button
            type="button"
            className="link-button"
            onClick={onLogin}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;
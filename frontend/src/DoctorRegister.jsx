import { useState } from "react";

function DoctorRegister({ onRegisterSuccess, onLogin }) {
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState("");
  const [phone, setPhone] = useState("");
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
        "http://localhost:5000/api/doctors",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
            specialization,
            experience: Number(experience),
            phone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create doctor account"
        );
      }

      console.log("Doctor created successfully:", data.doctor);

      alert("Doctor account created successfully!");

      // Login the newly created doctor
      onRegisterSuccess({
        id: data.doctor._id,
        name: data.doctor.name,
        email: data.doctor.email,
        specialization: data.doctor.specialization,
        experience: data.doctor.experience,
        phone: data.doctor.phone,
        image: data.doctor.image,
        available: data.doctor.available,
      });

    } catch (error) {
      console.error("Doctor registration error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-6 py-10">

      <div className="w-full max-w-lg bg-white rounded-3xl shadow-lg p-8">

        <div className="text-center mb-8">

          <div className="text-6xl mb-4">
            👨‍⚕️
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Create Doctor Account
          </h1>

          <p className="text-gray-500 mt-2">
            Register your doctor account
          </p>

        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* NAME */}
          <div>
            <label className="block font-medium mb-2">
              Doctor Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter doctor name"
              required
              className="w-full border rounded-xl px-4 py-3 outline-none focus:border-green-500"
            />
          </div>

          {/* SPECIALIZATION */}
          <div>
            <label className="block font-medium mb-2">
              Specialization
            </label>

            <input
              type="text"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="e.g. Cardiologist"
              required
              className="w-full border rounded-xl px-4 py-3 outline-none focus:border-green-500"
            />
          </div>

          {/* EXPERIENCE */}
          <div>
            <label className="block font-medium mb-2">
              Experience
            </label>

            <input
              type="number"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="Years of experience"
              min="0"
              required
              className="w-full border rounded-xl px-4 py-3 outline-none focus:border-green-500"
            />
          </div>

          {/* PHONE */}
          <div>
            <label className="block font-medium mb-2">
              Phone Number
            </label>

            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              required
              className="w-full border rounded-xl px-4 py-3 outline-none focus:border-green-500"
            />
          </div>

          {/* EMAIL */}
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

          {/* PASSWORD */}
          <div>
            <label className="block font-medium mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create password"
              minLength="6"
              required
              className="w-full border rounded-xl px-4 py-3 outline-none focus:border-green-500"
            />
          </div>

          {/* ERROR */}
          {error && (
            <p className="text-red-500 text-sm">
              {error}
            </p>
          )}

          {/* REGISTER */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {loading
              ? "Creating Account..."
              : "Create Doctor Account"}
          </button>

        </form>

        {/* LOGIN */}
        <button
          type="button"
          onClick={onLogin}
          className="w-full mt-4 border border-green-600 text-green-600 py-3 rounded-xl font-semibold hover:bg-green-50"
        >
          Already have an account? Doctor Login
        </button>

      </div>

    </div>
  );
}

export default DoctorRegister;
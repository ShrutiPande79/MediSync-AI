function RoleSelection({ onPatient, onDoctor, onReceptionist }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-6xl">
        {/* Logo / Heading */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">
            ✨ MediSync AI Platform
          </div>
          <h1 className="text-5xl font-extrabold text-indigo-600 tracking-tight">
            MediSync AI
          </h1>
          <p className="text-gray-600 text-lg mt-3 max-w-2xl mx-auto">
            AI-Powered Clinical Documentation, Appointment Scheduling & Patient History Management System
          </p>

          <h2 className="text-2xl font-bold text-gray-800 mt-8">
            Select Your Portal to Continue
          </h2>
        </div>

        {/* Role Cards - 3 Column Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {/* PATIENT */}
          <button
            type="button"
            onClick={onPatient}
            className="bg-white rounded-3xl p-8 shadow-md hover:shadow-2xl transition text-center border-2 border-transparent hover:border-blue-500 flex flex-col justify-between group"
          >
            <div>
              <div className="text-6xl mb-5 group-hover:scale-110 transition duration-300">
                👤
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Patient
              </h3>
              <p className="text-gray-500 text-sm mt-3 leading-relaxed">
                Book doctor appointments, access your permanent Patient ID, view diagnosis history, and download medical reports.
              </p>
            </div>

            <div className="mt-8 bg-blue-600 text-white font-semibold py-3 rounded-xl shadow-md group-hover:bg-blue-700 transition">
              Patient Portal →
            </div>
          </button>

          {/* DOCTOR */}
          <button
            type="button"
            onClick={onDoctor}
            className="bg-white rounded-3xl p-8 shadow-md hover:shadow-2xl transition text-center border-2 border-transparent hover:border-green-500 flex flex-col justify-between group"
          >
            <div>
              <div className="text-6xl mb-5 group-hover:scale-110 transition duration-300">
                👨‍⚕️
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Doctor
              </h3>
              <p className="text-gray-500 text-sm mt-3 leading-relaxed">
                Manage appointment queues, use AI Voice-to-Text for clinical notes, prescribe treatments, and upload reports.
              </p>
            </div>

            <div className="mt-8 bg-green-600 text-white font-semibold py-3 rounded-xl shadow-md group-hover:bg-green-700 transition">
              Doctor Portal →
            </div>
          </button>

          {/* RECEPTIONIST */}
          <button
            type="button"
            onClick={onReceptionist}
            className="bg-white rounded-3xl p-8 shadow-md hover:shadow-2xl transition text-center border-2 border-transparent hover:border-indigo-500 flex flex-col justify-between group"
          >
            <div>
              <div className="text-6xl mb-5 group-hover:scale-110 transition duration-300">
                🏥
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Receptionist
              </h3>
              <p className="text-gray-500 text-sm mt-3 leading-relaxed">
                Register walk-in patients, manage clinic appointment schedules, upload diagnostic scans, and inspect patient timelines.
              </p>
            </div>

            <div className="mt-8 bg-indigo-600 text-white font-semibold py-3 rounded-xl shadow-md group-hover:bg-indigo-700 transition">
              Receptionist Desk →
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoleSelection;
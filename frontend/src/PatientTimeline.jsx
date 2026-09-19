import { useState } from "react";

function PatientTimeline({ patient, appointments = [], medicalRecords = [], onDownload }) {
  const [filter, setFilter] = useState("all"); // 'all', 'appointment', 'record', 'report'

  // Combine appointments and medical records into a unified chronological stream
  const timelineEvents = [];

  // 1. Appointments
  appointments.forEach((apt) => {
    timelineEvents.push({
      id: `apt-${apt._id || apt.id}`,
      type: "appointment",
      date: new Date(apt.createdAt || apt.date),
      displayDate: apt.date || new Date(apt.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      time: apt.time,
      doctor: apt.doctorName,
      title: `Clinic Consultation / Visit`,
      symptoms: apt.symptoms,
      status: apt.status || "Pending",
      phone: apt.phone,
    });
  });

  // 2. Medical Records and Reports
  medicalRecords.forEach((rec) => {
    timelineEvents.push({
      id: `rec-${rec._id}`,
      type: "record",
      date: new Date(rec.createdAt),
      displayDate: new Date(rec.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      doctor: rec.doctorName,
      title: `Clinical Diagnosis & Rx`,
      diagnosis: rec.diagnosis,
      notes: rec.notes,
      prescription: rec.prescription,
      reportName: rec.reportName,
      reportUrl: rec.reportUrl,
      reportType: rec.reportType,
    });

    if (rec.reportUrl) {
      timelineEvents.push({
        id: `rep-${rec._id}`,
        type: "report",
        date: new Date(rec.createdAt),
        displayDate: new Date(rec.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        doctor: rec.doctorName,
        title: `Medical Report / Scan`,
        reportName: rec.reportName || "Diagnostic Test Report",
        reportUrl: rec.reportUrl,
        reportType: rec.reportType || "PDF/Image",
        diagnosis: rec.diagnosis,
      });
    }
  });

  // Sort descending (newest first)
  timelineEvents.sort((a, b) => b.date - a.date);

  const filteredEvents = timelineEvents.filter((item) => {
    if (filter === "all") return true;
    return item.type === filter;
  });

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm">
      {/* Patient Header */}
      {patient && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              PATIENT HEALTH JOURNEY & TIMELINE
            </span>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {patient.name || patient.patientName}
            </h3>
            <p className="text-blue-700 font-extrabold text-lg mt-0.5">
              Patient ID: {patient.patientId}
            </p>
            {patient.phone && (
              <p className="text-gray-500 text-sm mt-1">
                📞 {patient.phone} {patient.email ? `• ✉️ ${patient.email}` : ""}
              </p>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 font-semibold">Visits</p>
              <p className="text-xl font-bold text-blue-600">{appointments.length}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 font-semibold">Diagnoses</p>
              <p className="text-xl font-bold text-green-600">{medicalRecords.length}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 font-semibold">Reports</p>
              <p className="text-xl font-bold text-purple-600">
                {medicalRecords.filter((r) => r.reportUrl).length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4 mb-8">
        <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>⏱️</span> Chronological Timeline ({filteredEvents.length} events)
        </h4>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === "all"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Events
          </button>
          <button
            type="button"
            onClick={() => setFilter("appointment")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === "appointment"
                ? "bg-blue-600 text-white"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            📅 Visits
          </button>
          <button
            type="button"
            onClick={() => setFilter("record")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === "record"
                ? "bg-green-600 text-white"
                : "bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            🩺 Diagnoses
          </button>
          <button
            type="button"
            onClick={() => setFilter("report")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === "report"
                ? "bg-purple-600 text-white"
                : "bg-purple-50 text-purple-700 hover:bg-purple-100"
            }`}
          >
            📑 Reports
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <div className="text-4xl mb-2">📜</div>
          <p className="text-gray-500 font-medium">No timeline events recorded yet.</p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-indigo-200 space-y-8 ml-2 sm:ml-4">
          {filteredEvents.map((event) => (
            <div key={event.id} className="relative group">
              {/* Timeline Node Icon */}
              <div
                className={`absolute -left-[35px] sm:-left-[43px] top-1 w-9 h-9 rounded-full flex items-center justify-center text-sm shadow-md border-2 border-white ${
                  event.type === "appointment"
                    ? "bg-blue-600 text-white"
                    : event.type === "record"
                    ? "bg-green-600 text-white"
                    : "bg-purple-600 text-white"
                }`}
              >
                {event.type === "appointment" ? "📅" : event.type === "record" ? "🩺" : "📄"}
              </div>

              {/* Event Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 hover:shadow-md transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3 mb-3">
                  <div>
                    <span
                      className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full mr-2 ${
                        event.type === "appointment"
                          ? "bg-blue-100 text-blue-700"
                          : event.type === "record"
                          ? "bg-green-100 text-green-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {event.type === "appointment"
                        ? "Clinic Visit"
                        : event.type === "record"
                        ? "Clinical Record"
                        : "Medical Report"}
                    </span>
                    <strong className="text-gray-900 text-base">{event.title}</strong>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs font-semibold text-gray-500 block">
                      📅 {event.displayDate} {event.time ? `• ${event.time}` : ""}
                    </span>
                    <span className="text-xs text-indigo-600 font-medium">
                      Doctor: {event.doctor}
                    </span>
                  </div>
                </div>

                {/* Event Specific Content */}
                {event.type === "appointment" && (
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong className="text-gray-700">Symptoms / Reason:</strong>{" "}
                      <span className="text-gray-600">{event.symptoms || "Regular Checkup"}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-semibold text-gray-500">Status:</span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          event.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : event.status === "Cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>
                  </div>
                )}

                {event.type === "record" && (
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong className="text-gray-800">Diagnosis:</strong>{" "}
                      <span className="text-gray-700 font-medium">{event.diagnosis || "Not specified"}</span>
                    </p>
                    {event.notes && (
                      <p>
                        <strong className="text-gray-800">Doctor's Notes:</strong>{" "}
                        <span className="text-gray-600 whitespace-pre-line">{event.notes}</span>
                      </p>
                    )}
                    {event.prescription && (
                      <p>
                        <strong className="text-gray-800">Prescription:</strong>{" "}
                        <span className="text-gray-600 font-medium whitespace-pre-line">{event.prescription}</span>
                      </p>
                    )}
                  </div>
                )}

                {event.type === "report" && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 mt-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📑</span>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{event.reportName}</p>
                        <p className="text-xs text-gray-500">
                          Format: {event.reportType || "Document"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={event.reportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-purple-700 transition"
                      >
                        View Report
                      </a>
                      {onDownload && (
                        <button
                          type="button"
                          onClick={() => onDownload(event.reportUrl, event.reportName)}
                          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-gray-200 transition border border-gray-300"
                        >
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PatientTimeline;

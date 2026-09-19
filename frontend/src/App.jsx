import { useState, useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { auth, storage } from "./firebase";
import Login from "./Login";
import Register from "./Register";
import RoleSelection from "./RoleSelection";
import DoctorLogin from "./DoctorLogin";
import DoctorRegister from "./DoctorRegister";
import ReceptionistLogin from "./ReceptionistLogin";
import ReceptionistRegister from "./ReceptionistRegister";
import PatientTimeline from "./PatientTimeline";

// ==========================================
// TIME SLOTS
// ==========================================

const timeSlots = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
];


// ==========================================
// APP
// ==========================================

function App() {

  // ========================================
  // PORTAL SELECTION
  // ========================================

  const [portal, setPortal] = useState(null); // 'patient' | 'doctor' | 'receptionist'


  // ========================================
  // PATIENT STATES & AUTH
  // ========================================

  const [user, setUser] = useState(auth.currentUser);
  const [patientProfile, setPatientProfile] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [showRegister, setShowRegister] = useState(false);


  // ========================================
  // DOCTOR STATES & AUTH
  // ========================================

  const [doctorLoggedIn, setDoctorLoggedIn] = useState(false);
  const [loggedInDoctor, setLoggedInDoctor] = useState(null);
  const [showDoctorLogin, setShowDoctorLogin] = useState(false);
  const [showDoctorRegister, setShowDoctorRegister] = useState(false);


  // ========================================
  // RECEPTIONIST STATES & AUTH
  // ========================================

  const [receptionistLoggedIn, setReceptionistLoggedIn] = useState(false);
  const [loggedInReceptionist, setLoggedInReceptionist] = useState(null);
  const [showReceptionistLogin, setShowReceptionistLogin] = useState(false);
  const [showReceptionistRegister, setShowReceptionistRegister] = useState(false);
  const [receptionistTab, setReceptionistTab] = useState("patients"); // 'patients' | 'register' | 'appointments' | 'upload' | 'timeline'

  // Receptionist data states
  const [allPatients, setAllPatients] = useState([]);
  const [allClinicAppointments, setAllClinicAppointments] = useState([]);
  const [selectedTimelinePatient, setSelectedTimelinePatient] = useState(null);
  const [timelinePatientAppointments, setTimelinePatientAppointments] = useState([]);
  const [timelinePatientRecords, setTimelinePatientRecords] = useState([]);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");

  // Receptionist Walk-in Patient Form
  const [walkinForm, setWalkinForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [walkinSuccessId, setWalkinSuccessId] = useState("");

  // Receptionist Appointment Booking Form
  const [receptionistAptForm, setReceptionistAptForm] = useState({
    patientId: "",
    patientName: "",
    phone: "",
    doctorId: "",
    doctorName: "",
    date: "",
    time: "",
    symptoms: "",
  });

  // Receptionist Report Upload Form
  const [receptionistReportForm, setReceptionistReportForm] = useState({
    patientId: "",
    patientName: "",
    doctorId: "",
    doctorName: "",
    reportType: "Blood Test",
    diagnosis: "",
  });
  const [receptionistReportFile, setReceptionistReportFile] = useState(null);
  const [receptionistUploading, setReceptionistUploading] = useState(false);


  // ========================================
  // PATIENT APPOINTMENT BOOKING STATES
  // ========================================

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [appointmentConfirmed, setAppointmentConfirmed] = useState(false);
  const [appointments, setAppointments] = useState([]);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    symptoms: "",
  });


  // ========================================
  // MEDICAL RECORDS STATES
  // ========================================

  const [medicalRecords, setMedicalRecords] = useState([]);
  const [patientMedicalRecords, setPatientMedicalRecords] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showMedicalRecordForm, setShowMedicalRecordForm] = useState(false);
  const [showPatientTimelineModal, setShowPatientTimelineModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState("");

  const [medicalForm, setMedicalForm] = useState({
    diagnosis: "",
    notes: "",
    prescription: "",
  });


  // ========================================
  // AI VOICE-TO-TEXT CLINICAL NOTES (SPEECH)
  // ========================================

  const [isListening, setIsListening] = useState(false);
  const [activeVoiceField, setActiveVoiceField] = useState("notes"); // 'diagnosis' | 'notes' | 'prescription'
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setVoiceTranscript(currentTranscript);

        if (event.results[event.results.length - 1].isFinal) {
          const finalSpeech = event.results[event.results.length - 1][0].transcript.trim();
          setMedicalForm((prev) => ({
            ...prev,
            [activeVoiceField]: prev[activeVoiceField]
              ? `${prev[activeVoiceField]} ${finalSpeech}`
              : finalSpeech,
          }));
          setVoiceTranscript("");
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [activeVoiceField]);

  const toggleVoiceRecording = (targetField) => {
    if (!recognitionRef.current) {
      alert("Speech-to-Text is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (targetField) {
      setActiveVoiceField(targetField);
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        setVoiceTranscript("");
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Start speech error:", err);
      }
    }
  };


  // ========================================
  // LOGOUT HANDLERS
  // ========================================

  const doctorLogout = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setDoctorLoggedIn(false);
    setLoggedInDoctor(null);
    setAppointments([]);
    setMedicalRecords([]);
    setSelectedPatient(null);
    setShowMedicalRecordForm(false);
    setSelectedFile(null);
    setFileError("");
    setPortal(null);
    setShowDoctorLogin(false);
    setShowDoctorRegister(false);
  };

  const receptionistLogout = () => {
    setReceptionistLoggedIn(false);
    setLoggedInReceptionist(null);
    setAllPatients([]);
    setAllClinicAppointments([]);
    setSelectedTimelinePatient(null);
    setPortal(null);
    setShowReceptionistLogin(false);
    setShowReceptionistRegister(false);
  };


  // ========================================
  // API FETCH HELPERS
  // ========================================

  const fetchDoctors = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/doctors");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch doctors");
      }
      setDoctors(data);
    } catch (error) {
      console.error("Fetch doctors error:", error);
    }
  };
  
  const fetchDoctorAppointments = async (doctor) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/appointments/doctor/${doctor._id || doctor.id}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch appointments");
      }
      setAppointments(data);
    } catch (error) {
      console.error("Fetch appointments error:", error);
    }
  };

  const fetchAllPatients = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/patients");
      const data = await response.json();
      if (response.ok) {
        setAllPatients(data);
      }
    } catch (error) {
      console.error("Fetch all patients error:", error);
    }
  };

  const fetchAllClinicAppointments = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/appointments");
      const data = await response.json();
      if (response.ok) {
        setAllClinicAppointments(data);
      }
    } catch (error) {
      console.error("Fetch all clinic appointments error:", error);
    }
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update status");

      alert(`Appointment marked as ${newStatus}!`);
      fetchAllClinicAppointments();
      if (loggedInDoctor) fetchDoctorAppointments(loggedInDoctor);
    } catch (error) {
      alert("Error updating status: " + error.message);
    }
  };

  // Fetch medical records for selected patient in Doctor Portal
  const fetchPatientMedicalRecords = async (patientId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/medical-records/patient/${encodeURIComponent(
          patientId
        )}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch medical records");
      }
      setMedicalRecords(data);
    } catch (error) {
      console.error("Fetch medical records error:", error);
      alert("Failed to load medical records: " + error.message);
    }
  };

  // Fetch timeline data for a specific patient
  const loadPatientTimeline = async (patient) => {
    setSelectedTimelinePatient(patient);
    try {
      // 1. Fetch appointments
      const aptRes = await fetch("http://localhost:5000/api/appointments");
      const aptData = await aptRes.json();
      if (aptRes.ok) {
        const patientApts = aptData.filter((a) => a.patientId === patient.patientId);
        setTimelinePatientAppointments(patientApts);
      }

      // 2. Fetch medical records
      const recRes = await fetch(`http://localhost:5000/api/medical-records/patient/${encodeURIComponent(patient.patientId)}`);
      const recData = await recRes.json();
      if (recRes.ok) {
        setTimelinePatientRecords(recData);
      }

      setReceptionistTab("timeline");
    } catch (err) {
      console.error("Load timeline error:", err);
    }
  };

  // Fetch medical records for logged-in patient in Patient Portal
  const fetchLoggedInPatientRecords = async (patientId) => {
    if (!patientId) return;
    try {
      const response = await fetch(
        `http://localhost:5000/api/medical-records/patient/${encodeURIComponent(
          patientId
        )}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch medical records");
      }
      setPatientMedicalRecords(data);
    } catch (error) {
      console.error("Fetch patient personal medical records error:", error);
    }
  };

  // Automatically fetch patient medical records when logged in as patient
  useEffect(() => {
    if (portal === "patient" && patientProfile?.patientId) {
      fetchLoggedInPatientRecords(patientProfile.patientId);
    }
  }, [portal, patientProfile?.patientId]);

  // Handle file selection with validation for formats and 10MB size limit
  const handleFileChange = (e) => {
    setFileError("");
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const allowedExtensions = ["pdf", "jpg", "jpeg", "png"];
    const fileExt = file.name.split(".").pop().toLowerCase();
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (!allowedExtensions.includes(fileExt) && !allowedTypes.includes(file.type)) {
      setFileError("Unsupported file type. Please upload PDF, JPG, JPEG or PNG.");
      setSelectedFile(null);
      e.target.value = "";
      return;
    }

    const maxSizeBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSizeBytes) {
      setFileError("File size must be less than 10 MB.");
      setSelectedFile(null);
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  // Helper to trigger report download
  const downloadReport = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || "medical-report";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.warn("Direct blob download failed, opening URL in new tab:", error);
      window.open(url, "_blank");
    }
  };

  // Save medical record with optional report upload to Firebase Storage
  const saveMedicalRecord = async () => {
    if (!selectedPatient?.patientId) {
      alert("Patient ID not found.");
      return;
    }

    if (!medicalForm.diagnosis || !medicalForm.diagnosis.trim()) {
      alert("Please enter the diagnosis.");
      return;
    }

    try {
      setUploading(true);

      let reportUrl = "";
      let reportName = "";
      let reportType = "";

      // If a file was selected, upload it to Firebase Storage
      if (selectedFile) {
        const cleanFileName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `medical-reports/${selectedPatient.patientId}/${Date.now()}_${cleanFileName}`;
        const storageRef = ref(storage, storagePath);

        const metadata = {
          contentType: selectedFile.type || "application/octet-stream",
        };

        const uploadResult = await uploadBytes(storageRef, selectedFile, metadata);
        reportUrl = await getDownloadURL(uploadResult.ref);
        reportName = selectedFile.name;
        reportType = selectedFile.type || cleanFileName.split(".").pop().toLowerCase();
      }

      // Save record metadata to MongoDB
      const response = await fetch(
        "http://localhost:5000/api/medical-records",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patientId: selectedPatient.patientId,
            patientName: selectedPatient.patientName,
            doctorId: loggedInDoctor._id || loggedInDoctor.id,
            doctorName: loggedInDoctor.name,
            diagnosis: medicalForm.diagnosis.trim(),
            notes: medicalForm.notes || "",
            prescription: medicalForm.prescription || "",
            reportName,
            reportUrl,
            reportType,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save medical record");
      }

      alert("Medical record saved successfully!");

      setMedicalRecords((prev) => [data.medicalRecord, ...prev]);

      if (patientProfile?.patientId === selectedPatient.patientId) {
        setPatientMedicalRecords((prev) => [data.medicalRecord, ...prev]);
      }

      setMedicalForm({
        diagnosis: "",
        notes: "",
        prescription: "",
      });
      setSelectedFile(null);
      setFileError("");
      setShowMedicalRecordForm(false);
    } catch (error) {
      console.error("Save medical record error:", error);
      alert("Error saving medical record: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Receptionist: Register Walk-in Patient
  const handleWalkinPatientRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(walkinForm),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to register patient");

      setWalkinSuccessId(data.patient.patientId);
      alert(`Patient successfully registered! Permanent Patient ID: ${data.patient.patientId}`);
      setWalkinForm({ name: "", email: "", phone: "" });
      fetchAllPatients();
    } catch (err) {
      alert("Error registering patient: " + err.message);
    }
  };

  // Receptionist: Book Appointment for Patient
  const handleReceptionistBookApt = async (e) => {
    e.preventDefault();
    if (!receptionistAptForm.doctorId) {
      alert("Please select a doctor.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receptionistAptForm),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to book appointment");

      alert("Appointment successfully booked by reception desk!");
      setReceptionistAptForm({
        patientId: "",
        patientName: "",
        phone: "",
        doctorId: "",
        doctorName: "",
        date: "",
        time: "",
        symptoms: "",
      });
      fetchAllClinicAppointments();
      setReceptionistTab("appointments");
    } catch (err) {
      alert("Error booking appointment: " + err.message);
    }
  };

  // Receptionist: Upload Diagnostic Report (X-Ray, MRI, Blood Test, etc.)
  const handleReceptionistUploadReport = async (e) => {
    e.preventDefault();
    if (!receptionistReportForm.patientId) {
      alert("Please enter or select a Patient ID.");
      return;
    }
    if (!receptionistReportFile) {
      alert("Please select a medical report file (PDF/Image).");
      return;
    }

    try {
      setReceptionistUploading(true);

      const cleanFileName = receptionistReportFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `medical-reports/${receptionistReportForm.patientId}/${Date.now()}_${cleanFileName}`;
      const storageRef = ref(storage, storagePath);

      const metadata = {
        contentType: receptionistReportFile.type || "application/octet-stream",
      };

      const uploadResult = await uploadBytes(storageRef, receptionistReportFile, metadata);
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      const response = await fetch("http://localhost:5000/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: receptionistReportForm.patientId,
          patientName: receptionistReportForm.patientName || "Patient",
          doctorId: receptionistReportForm.doctorId || "RECEPTION-STAFF",
          doctorName: receptionistReportForm.doctorName || loggedInReceptionist.name,
          diagnosis: receptionistReportForm.diagnosis || `${receptionistReportForm.reportType} Report`,
          notes: `Uploaded by Reception Desk (${loggedInReceptionist.name}) - ${receptionistReportForm.reportType}`,
          prescription: "",
          reportName: receptionistReportFile.name,
          reportUrl: downloadUrl,
          reportType: receptionistReportForm.reportType,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save report record");

      alert(`Report "${receptionistReportFile.name}" successfully uploaded and linked to ${receptionistReportForm.patientId}!`);
      setReceptionistReportFile(null);
      setReceptionistReportForm({
        patientId: "",
        patientName: "",
        doctorId: "",
        doctorName: "",
        reportType: "Blood Test",
        diagnosis: "",
      });
      const fileInput = document.getElementById("receptionist-file-input");
      if (fileInput) fileInput.value = "";
    } catch (err) {
      alert("Report upload failed: " + err.message);
    } finally {
      setReceptionistUploading(false);
    }
  };


  // ========================================
  // FORM CHANGE HANDLER
  // ========================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  // ========================================
  // BOOK APPOINTMENT (PATIENT)
  // ========================================

  const bookAppointment = (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedTime("");
    setAppointmentConfirmed(false);
    setFormData({
      name: "",
      phone: "",
      date: "",
      symptoms: "",
    });

    setTimeout(() => {
      document.getElementById("appointment")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  };


  // ========================================
  // CONFIRM APPOINTMENT (PATIENT)
  // ========================================

  const confirmAppointment = async (e) => {
    e.preventDefault();

    if (!selectedDoctor) {
      alert("Please select a doctor.");
      return;
    }

    if (!selectedTime) {
      alert("Please select a time slot.");
      return;
    }

    if (!formData.name || !formData.phone || !formData.date) {
      alert("Please fill all required details.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: patientProfile?.patientId || "",
          patientName: formData.name,
          phone: formData.phone,
          doctorName: selectedDoctor.name,
          doctorId: selectedDoctor._id || selectedDoctor.id,
          date: formData.date,
          time: selectedTime,
          symptoms: formData.symptoms,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to book appointment");
      }

      console.log("Appointment saved:", data);

      const newAppointment = {
        id: Date.now(),
        patientId: patientProfile?.patientId || "",
        patientName: formData.name,
        phone: formData.phone,
        doctorName: selectedDoctor.name,
        doctorId: selectedDoctor._id || selectedDoctor.id,
        date: formData.date,
        time: selectedTime,
        symptoms: formData.symptoms,
      };

      setAppointments((prev) => [...prev, newAppointment]);
      setAppointmentConfirmed(true);
      alert("Appointment booked successfully!");
    } catch (error) {
      console.error("Appointment booking error:", error);
      alert("Failed to book appointment: " + error.message);
    }
  };


  // ========================================
  // STEP 1: ROLE SELECTION
  // ========================================

  if (!portal) {
    return (
      <RoleSelection
        onPatient={async () => {
          setPortal("patient");
          await fetchDoctors();
        }}
        onDoctor={async () => {
          setPortal("doctor");
          setShowDoctorLogin(true);
          await fetchDoctors();
        }}
        onReceptionist={async () => {
          setPortal("receptionist");
          setShowReceptionistLogin(true);
          await fetchDoctors();
          await fetchAllPatients();
          await fetchAllClinicAppointments();
        }}
      />
    );
  }


  // ========================================
  // STEP 2: PATIENT LOGIN / REGISTER
  // ========================================

  if (portal === "patient" && !user) {
    if (showRegister) {
      return (
        <Register
          onRegisterSuccess={async (newUser) => {
            setUser(newUser);
            setShowRegister(false);

            try {
              const response = await fetch(
                `http://localhost:5000/api/patients/email/${encodeURIComponent(
                  newUser.email
                )}`
              );
              const data = await response.json();
              if (!response.ok) throw new Error(data.message || "Patient record not found");

              setPatientProfile(data);
              if (data.patientId) {
                fetchLoggedInPatientRecords(data.patientId);
              }
            } catch (error) {
              console.error("Patient profile error:", error);
            }
          }}
          onLogin={() => {
            setShowRegister(false);
          }}
        />
      );
    }

    return (
      <Login
        onLogin={async (loggedInUser) => {
          setUser(loggedInUser);

          try {
            const response = await fetch(
              `http://localhost:5000/api/patients/email/${encodeURIComponent(
                loggedInUser.email
              )}`
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Patient record not found");

            setPatientProfile(data);
            if (data.patientId) {
              fetchLoggedInPatientRecords(data.patientId);
            }
          } catch (error) {
            console.error("Patient profile error:", error);
          }
        }}
        onRegister={() => {
          setShowRegister(true);
        }}
      />
    );
  }


  // ========================================
  // STEP 3: DOCTOR REGISTRATION
  // ========================================

  if (portal === "doctor" && showDoctorRegister) {
    return (
      <DoctorRegister
        onRegisterSuccess={(doctor) => {
          setLoggedInDoctor(doctor);
          setDoctorLoggedIn(true);
          setShowDoctorRegister(false);
        }}
        onLogin={() => {
          setShowDoctorRegister(false);
          setShowDoctorLogin(true);
        }}
      />
    );
  }


  // ========================================
  // STEP 4: DOCTOR LOGIN
  // ========================================

  if (portal === "doctor" && !doctorLoggedIn) {
    return (
      <DoctorLogin
        onLogin={async (doctor) => {
          setLoggedInDoctor(doctor);
          setDoctorLoggedIn(true);
          setShowDoctorLogin(false);
          setShowDoctorRegister(false);
          await fetchDoctorAppointments(doctor);
        }}
        onCreateAccount={() => {
          setShowDoctorLogin(false);
          setShowDoctorRegister(true);
        }}
      />
    );
  }


  // ========================================
  // STEP 5: RECEPTIONIST REGISTRATION
  // ========================================

  if (portal === "receptionist" && showReceptionistRegister) {
    return (
      <ReceptionistRegister
        onRegisterSuccess={(receptionist) => {
          setLoggedInReceptionist(receptionist);
          setReceptionistLoggedIn(true);
          setShowReceptionistRegister(false);
          fetchAllPatients();
          fetchAllClinicAppointments();
        }}
        onLogin={() => {
          setShowReceptionistRegister(false);
          setShowReceptionistLogin(true);
        }}
      />
    );
  }


  // ========================================
  // STEP 6: RECEPTIONIST LOGIN
  // ========================================

  if (portal === "receptionist" && !receptionistLoggedIn) {
    return (
      <ReceptionistLogin
        onLogin={async (receptionist) => {
          setLoggedInReceptionist(receptionist);
          setReceptionistLoggedIn(true);
          setShowReceptionistLogin(false);
          setShowReceptionistRegister(false);
          await fetchAllPatients();
          await fetchAllClinicAppointments();
          await fetchDoctors();
        }}
        onCreateAccount={() => {
          setShowReceptionistLogin(false);
          setShowReceptionistRegister(true);
        }}
      />
    );
  }


  // ========================================
  // STEP 7: DOCTOR PORTAL (WITH AI VOICE-TO-TEXT & TIMELINE)
  // ========================================

  if (portal === "doctor" && doctorLoggedIn && loggedInDoctor) {
    return (
      <div className="min-h-screen bg-green-50">
        {/* DOCTOR NAVBAR */}
        <nav className="bg-white shadow-sm px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-green-600">
              MediSync AI <span className="text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded-full uppercase">Doctor Suite</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-gray-800">
                {loggedInDoctor.name}
              </p>
              <p className="text-sm text-gray-500">
                {loggedInDoctor.specialization}
              </p>
            </div>

            <button
              onClick={() => {
                doctorLogout();
                setPortal(null);
              }}
              className="bg-red-500 text-white px-5 py-2.5 rounded-full hover:bg-red-600 transition shadow-sm"
            >
              Logout
            </button>
          </div>
        </nav>

        {/* DOCTOR DASHBOARD */}
        <section className="py-10 px-6 sm:px-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* WELCOME CARD */}
            <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-200">
              <p className="text-green-600 font-semibold uppercase text-xs tracking-wider">
                CLINICAL WORKSPACE
              </p>
              <h2 className="text-3xl font-bold mt-1 text-gray-900">
                Welcome, {loggedInDoctor.name}
              </h2>
              <p className="text-gray-500 mt-1">
                Manage appointment queues, speak clinical notes with AI Voice-to-Text, and review patient timelines.
              </p>

              {/* DOCTOR STATS */}
              <div className="grid sm:grid-cols-3 gap-5 mt-6">
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                  <p className="text-gray-500 text-sm">Specialization</p>
                  <p className="text-lg font-bold text-green-700 mt-1">
                    {loggedInDoctor.specialization || "General Medicine"}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                  <p className="text-gray-500 text-sm">Experience</p>
                  <p className="text-lg font-bold text-blue-700 mt-1">
                    {loggedInDoctor.experience ? `${loggedInDoctor.experience} Years` : "Experienced"}
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
                  <p className="text-gray-500 text-sm">Phone Contact</p>
                  <p className="text-lg font-bold text-purple-700 mt-1">
                    {loggedInDoctor.phone || "Not set"}
                  </p>
                </div>
              </div>
            </div>

            {/* PATIENT APPOINTMENTS */}
            <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-200">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Patient Consultation Queue
                  </h3>
                  <p className="text-sm text-gray-500">
                    Patients scheduled for consultation with you
                  </p>
                </div>

                <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold text-sm">
                  {appointments.filter((a) => String(a.doctorId) === String(loggedInDoctor._id || loggedInDoctor.id)).length} Scheduled
                </span>
              </div>

              {appointments.filter((a) => String(a.doctorId) === String(loggedInDoctor._id || loggedInDoctor.id)).length === 0 ? (
                <div className="mt-6 bg-gray-50 rounded-2xl p-8 text-center">
                  <div className="text-5xl mb-3">📅</div>
                  <p className="text-gray-500 font-medium">No patient appointments scheduled yet.</p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {appointments
                    .filter((a) => String(a.doctorId) === String(loggedInDoctor._id || loggedInDoctor.id))
                    .map((appointment) => (
                      <div
                        key={appointment._id || appointment.id}
                        className="bg-gray-50 border border-gray-200 rounded-2xl p-6 hover:shadow-sm transition"
                      >
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div>
                            <span className="text-xs font-bold text-green-700 uppercase tracking-wider">PATIENT</span>
                            <h4 className="text-xl font-bold text-gray-900 mt-1">{appointment.patientName}</h4>
                            <p className="text-blue-600 font-bold mt-1">
                              Patient ID: {appointment.patientId || "Not available"}
                            </p>
                            <p className="text-gray-500 text-sm mt-1">📞 {appointment.phone}</p>
                          </div>

                          <div className="bg-white border border-gray-200 rounded-xl p-4 text-left sm:text-right flex flex-col justify-center">
                            <p className="text-sm"><strong>Date:</strong> {appointment.date}</p>
                            <p className="text-sm mt-1"><strong>Time:</strong> {appointment.time}</p>
                            <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 mt-2">
                              {appointment.status || "Pending"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 bg-white rounded-xl p-3 border border-gray-200">
                          <p className="text-xs font-bold text-gray-500 uppercase">Symptoms / Reason</p>
                          <p className="text-sm text-gray-700 mt-1">{appointment.symptoms || "Regular Checkup"}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* PATIENT MEDICAL RECORDS & CLINICAL DOCUMENTATION */}
            <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">
                Patient Medical Records & AI Clinical Documentation
              </h3>
              <p className="text-gray-500 text-sm mt-1 mb-6">
                Select an appointment below to view patient history, use AI Voice-to-Text, and upload reports.
              </p>

              {appointments
                .filter((a) => String(a.doctorId) === String(loggedInDoctor._id || loggedInDoctor.id))
                .map((appointment) => (
                  <div
                    key={appointment._id || appointment.id}
                    className="mt-5 bg-gray-50 border border-gray-200 rounded-2xl p-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">PATIENT PROFILE</p>
                        <h4 className="text-xl font-bold mt-1 text-gray-900">{appointment.patientName}</h4>
                        <p className="text-blue-600 font-bold mt-0.5">Patient ID: {appointment.patientId || "Not assigned"}</p>
                        <p className="text-gray-500 text-sm mt-1">📞 {appointment.phone}</p>
                      </div>

                      {appointment.patientId && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={async () => {
                              setSelectedPatient(appointment);
                              await fetchPatientMedicalRecords(appointment.patientId);
                              setShowMedicalRecordForm(false);
                              setShowPatientTimelineModal(false);
                              setSelectedFile(null);
                              setFileError("");
                            }}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition shadow-sm text-sm"
                          >
                            View Medical Records
                          </button>

                          <button
                            onClick={async () => {
                              setSelectedPatient(appointment);
                              await fetchPatientMedicalRecords(appointment.patientId);
                              setShowPatientTimelineModal(true);
                              setShowMedicalRecordForm(false);
                            }}
                            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-sm text-sm"
                          >
                            ⏱️ Patient Timeline
                          </button>
                        </div>
                      )}
                    </div>

                    {/* SELECTED PATIENT EXPANDED SECTION */}
                    {selectedPatient?.patientId === appointment.patientId && (
                      <div className="mt-6 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        {/* HEADER BUTTONS */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                          <div>
                            <h4 className="text-xl font-bold text-gray-800">
                              Clinical History: {selectedPatient.patientName}
                            </h4>
                            <p className="text-sm text-blue-600 font-semibold">
                              Permanent ID: {selectedPatient.patientId}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setShowMedicalRecordForm(!showMedicalRecordForm);
                                setShowPatientTimelineModal(false);
                                setSelectedFile(null);
                                setFileError("");
                              }}
                              className="bg-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-700 transition shadow-sm text-sm"
                            >
                              {showMedicalRecordForm ? "Close Form" : "+ Add Medical Record"}
                            </button>
                          </div>
                        </div>

                        {/* ADD MEDICAL RECORD FORM WITH AI VOICE-TO-TEXT */}
                        {showMedicalRecordForm && (
                          <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-2xl">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                              <h5 className="text-lg font-bold text-green-900">
                                📝 Add Medical Record
                              </h5>

                              {/* AI VOICE-TO-TEXT CONTROLS */}
                              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-green-300 shadow-sm">
                                <span className="text-xs font-bold text-gray-600">🎙️ AI Dictation:</span>
                                <select
                                  value={activeVoiceField}
                                  onChange={(e) => setActiveVoiceField(e.target.value)}
                                  className="text-xs font-semibold bg-gray-50 border border-gray-300 rounded-lg px-2 py-1 outline-none"
                                >
                                  <option value="diagnosis">Diagnosis</option>
                                  <option value="notes">Doctor's Notes</option>
                                  <option value="prescription">Prescription</option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() => toggleVoiceRecording(activeVoiceField)}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                                    isListening
                                      ? "bg-red-600 text-white animate-pulse"
                                      : "bg-green-600 text-white hover:bg-green-700"
                                  }`}
                                >
                                  {isListening ? "🔴 Recording..." : "🎤 Start Dictation"}
                                </button>
                              </div>
                            </div>

                            {isListening && (
                              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between text-xs text-red-700 animate-pulse">
                                <span>🎤 <strong>Listening...</strong> Speaking into: <strong>{activeVoiceField.toUpperCase()}</strong></span>
                                {voiceTranscript && <span className="italic truncate max-w-md">"{voiceTranscript}"</span>}
                              </div>
                            )}

                            <div className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Patient Name (Auto-filled)
                                  </label>
                                  <input
                                    type="text"
                                    value={selectedPatient.patientName}
                                    disabled
                                    className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-700 font-medium cursor-not-allowed"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Patient ID (Permanent & Locked)
                                  </label>
                                  <input
                                    type="text"
                                    value={selectedPatient.patientId}
                                    disabled
                                    className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-2.5 text-blue-600 font-bold cursor-not-allowed"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                  Diagnosis <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Viral Fever, Hypertension, Acute Bronchitis"
                                  value={medicalForm.diagnosis}
                                  onChange={(e) =>
                                    setMedicalForm({
                                      ...medicalForm,
                                      diagnosis: e.target.value,
                                    })
                                  }
                                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                  Doctor's Notes
                                </label>
                                <textarea
                                  placeholder="Patient advised complete rest, hydration, and follow-up in 3 days."
                                  value={medicalForm.notes}
                                  onChange={(e) =>
                                    setMedicalForm({
                                      ...medicalForm,
                                      notes: e.target.value,
                                    })
                                  }
                                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
                                  rows="3"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                  Prescription (Rx)
                                </label>
                                <textarea
                                  placeholder="1. Tab Paracetamol 650mg TDS x 3 days&#10;2. Syrup Ascoril 10ml TDS x 5 days"
                                  value={medicalForm.prescription}
                                  onChange={(e) =>
                                    setMedicalForm({
                                      ...medicalForm,
                                      prescription: e.target.value,
                                    })
                                  }
                                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
                                  rows="3"
                                />
                              </div>

                              {/* Upload Medical Report */}
                              <div className="bg-white p-4 rounded-xl border border-gray-300">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                  Upload Medical Report / Diagnostic File (Optional)
                                </label>
                                <p className="text-xs text-gray-500 mb-3">
                                  Supported formats: PDF, JPG, JPEG, PNG (Max size: 10 MB)
                                </p>

                                <input
                                  type="file"
                                  id="doctor-report-upload"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={handleFileChange}
                                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200 cursor-pointer"
                                />

                                {selectedFile && (
                                  <div className="mt-3 flex items-center justify-between bg-green-50 px-4 py-2 rounded-xl border border-green-200">
                                    <span className="text-xs font-medium text-green-900 truncate">
                                      Selected file: <strong>{selectedFile.name}</strong> ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedFile(null);
                                        const fileInput = document.getElementById("doctor-report-upload");
                                        if (fileInput) fileInput.value = "";
                                      }}
                                      className="text-red-500 hover:text-red-700 text-xs font-semibold ml-2"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                )}

                                {fileError && (
                                  <p className="text-red-500 text-xs font-medium mt-2">
                                    {fileError}
                                  </p>
                                )}
                              </div>

                              <div className="flex gap-3 pt-2">
                                <button
                                  type="button"
                                  onClick={saveMedicalRecord}
                                  disabled={uploading}
                                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition shadow-sm"
                                >
                                  {uploading ? "Saving & Uploading..." : "Save Medical Record"}
                                </button>

                                <button
                                  type="button"
                                  disabled={uploading}
                                  onClick={() => {
                                    setShowMedicalRecordForm(false);
                                    setSelectedFile(null);
                                    setFileError("");
                                  }}
                                  className="border border-gray-300 bg-white px-6 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TIMELINE MODAL OR RECORDS LIST */}
                        {showPatientTimelineModal ? (
                          <div className="mt-6">
                            <PatientTimeline
                              patient={selectedPatient}
                              appointments={appointments.filter((a) => a.patientId === selectedPatient.patientId)}
                              medicalRecords={medicalRecords}
                              onDownload={downloadReport}
                            />
                          </div>
                        ) : (
                          /* RECORDS LIST */
                          medicalRecords.length === 0 ? (
                            <p className="text-gray-500 mt-5 text-center py-6">
                              No previous medical records found.
                            </p>
                          ) : (
                            <div className="mt-5 space-y-4">
                              {medicalRecords.map((record) => (
                                <div
                                  key={record._id}
                                  className="border border-gray-200 bg-gray-50 rounded-2xl p-5"
                                >
                                  <div className="flex justify-between items-center border-b pb-2 mb-3">
                                    <span className="font-semibold text-blue-600 text-sm">
                                      📅 {new Date(record.createdAt).toLocaleDateString("en-GB", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </span>
                                    <span className="text-xs text-gray-500 font-medium">
                                      Doctor: {record.doctorName}
                                    </span>
                                  </div>

                                  <div className="space-y-2 text-sm">
                                    <p className="font-bold text-gray-800">
                                      Diagnosis: <span className="font-normal text-gray-700">{record.diagnosis || "Not provided"}</span>
                                    </p>
                                    <p className="font-bold text-gray-800">
                                      Doctor's Notes: <span className="font-normal text-gray-700">{record.notes || "Not provided"}</span>
                                    </p>
                                    <p className="font-bold text-gray-800">
                                      Prescription: <span className="font-normal text-gray-700">{record.prescription || "Not provided"}</span>
                                    </p>

                                    {record.reportUrl && (
                                      <div className="mt-3 pt-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xl">📄</span>
                                          <span className="text-xs font-semibold text-gray-800">
                                            {record.reportName || "Medical Report"}
                                          </span>
                                        </div>

                                        <div className="flex gap-2">
                                          <a
                                            href={record.reportUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 inline-flex items-center"
                                          >
                                            View Report
                                          </a>
                                          <button
                                            type="button"
                                            onClick={() => downloadReport(record.reportUrl, record.reportName)}
                                            className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200 border border-gray-300 inline-flex items-center"
                                          >
                                            Download
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </section>
      </div>
    );
  }


  // ========================================
  // STEP 8: RECEPTIONIST PORTAL (COMPLETE CLINIC SUITE)
  // ========================================

  if (portal === "receptionist" && receptionistLoggedIn && loggedInReceptionist) {
    const filteredPatients = allPatients.filter((p) => {
      if (!patientSearchQuery.trim()) return true;
      const q = patientSearchQuery.toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.patientId?.toLowerCase().includes(q) ||
        p.phone?.includes(q) ||
        p.email?.toLowerCase().includes(q)
      );
    });

    return (
      <div className="min-h-screen bg-slate-100">
        {/* RECEPTIONIST NAVBAR */}
        <nav className="bg-white shadow-sm px-6 sm:px-8 py-4 flex justify-between items-center border-b">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-indigo-700 flex items-center gap-2">
              <span>🏥</span> MediSync AI <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full uppercase">Front Desk</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-gray-900 text-sm">
                {loggedInReceptionist.name}
              </p>
              <p className="text-xs text-gray-500">
                {loggedInReceptionist.clinicName || "Clinic Reception"}
              </p>
            </div>

            <button
              onClick={receptionistLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition shadow-sm text-sm"
            >
              Logout
            </button>
          </div>
        </nav>

        {/* RECEPTIONIST DASHBOARD CONTAINER */}
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase">Registered Patients</p>
              <p className="text-3xl font-extrabold text-indigo-600 mt-1">{allPatients.length}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase">Total Appointments</p>
              <p className="text-3xl font-extrabold text-blue-600 mt-1">{allClinicAppointments.length}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase">Doctors on Staff</p>
              <p className="text-3xl font-extrabold text-green-600 mt-1">{doctors.length}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase">Permanent ID Format</p>
              <p className="text-sm font-extrabold text-purple-600 mt-2">PAT-YYYY-XXXX</p>
            </div>
          </div>

          {/* MAIN DESK TABS */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex flex-wrap border-b border-gray-200 bg-gray-50 px-6 pt-3 gap-2">
              <button
                onClick={() => setReceptionistTab("patients")}
                className={`py-3 px-5 text-sm font-bold border-b-2 rounded-t-xl transition ${
                  receptionistTab === "patients"
                    ? "border-indigo-600 text-indigo-700 bg-white shadow-sm"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                👥 Patient Directory
              </button>

              <button
                onClick={() => setReceptionistTab("register")}
                className={`py-3 px-5 text-sm font-bold border-b-2 rounded-t-xl transition ${
                  receptionistTab === "register"
                    ? "border-indigo-600 text-indigo-700 bg-white shadow-sm"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                📝 Walk-in Registration
              </button>

              <button
                onClick={() => setReceptionistTab("appointments")}
                className={`py-3 px-5 text-sm font-bold border-b-2 rounded-t-xl transition ${
                  receptionistTab === "appointments"
                    ? "border-indigo-600 text-indigo-700 bg-white shadow-sm"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                📅 Clinic Appointments
              </button>

              <button
                onClick={() => setReceptionistTab("upload")}
                className={`py-3 px-5 text-sm font-bold border-b-2 rounded-t-xl transition ${
                  receptionistTab === "upload"
                    ? "border-indigo-600 text-indigo-700 bg-white shadow-sm"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                📑 Upload Diagnostic Report
              </button>

              {selectedTimelinePatient && (
                <button
                  onClick={() => setReceptionistTab("timeline")}
                  className={`py-3 px-5 text-sm font-bold border-b-2 rounded-t-xl transition ${
                    receptionistTab === "timeline"
                      ? "border-indigo-600 text-indigo-700 bg-white shadow-sm"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  ⏱️ Patient Timeline ({selectedTimelinePatient.patientId})
                </button>
              )}
            </div>

            <div className="p-6 sm:p-8">
              {/* TAB 1: PATIENT DIRECTORY */}
              {receptionistTab === "patients" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Hospital Patient Directory</h3>
                      <p className="text-sm text-gray-500">Search and manage permanent patient health records</p>
                    </div>

                    <input
                      type="text"
                      placeholder="🔍 Search by name, ID, phone, email..."
                      value={patientSearchQuery}
                      onChange={(e) => setPatientSearchQuery(e.target.value)}
                      className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm w-full sm:w-80 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {filteredPatients.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl">
                      <p className="text-gray-500">No patients found matching your search.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="bg-gray-50 text-gray-600 uppercase text-xs border-b">
                            <th className="py-3 px-4">Patient ID</th>
                            <th className="py-3 px-4">Name</th>
                            <th className="py-3 px-4">Contact</th>
                            <th className="py-3 px-4">Registration Date</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredPatients.map((p) => (
                            <tr key={p._id || p.patientId} className="hover:bg-slate-50 transition">
                              <td className="py-3.5 px-4 font-bold text-blue-700">{p.patientId}</td>
                              <td className="py-3.5 px-4 font-semibold text-gray-900">{p.name}</td>
                              <td className="py-3.5 px-4 text-gray-600">
                                <div>📞 {p.phone || "No phone"}</div>
                                <div className="text-xs text-gray-400">{p.email}</div>
                              </td>
                              <td className="py-3.5 px-4 text-gray-500">
                                {new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                              </td>
                              <td className="py-3.5 px-4 text-right space-x-2">
                                <button
                                  onClick={() => loadPatientTimeline(p)}
                                  className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold px-3 py-1.5 rounded-lg text-xs transition border border-indigo-200"
                                >
                                  ⏱️ View Timeline
                                </button>
                                <button
                                  onClick={() => {
                                    setReceptionistAptForm((prev) => ({
                                      ...prev,
                                      patientId: p.patientId,
                                      patientName: p.name,
                                      phone: p.phone,
                                    }));
                                    setReceptionistTab("appointments");
                                  }}
                                  className="bg-blue-600 text-white hover:bg-blue-700 font-semibold px-3 py-1.5 rounded-lg text-xs transition"
                                >
                                  + Book Apt
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: WALK-IN REGISTRATION */}
              {receptionistTab === "register" && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Walk-in Patient Digital Registration</h3>
                    <p className="text-sm text-gray-500">Generates a permanent Patient ID saved in MongoDB</p>
                  </div>

                  {walkinSuccessId && (
                    <div className="p-4 bg-green-50 border border-green-300 rounded-2xl text-center">
                      <p className="text-green-800 font-bold">Patient Registered Successfully!</p>
                      <p className="text-2xl font-extrabold text-green-600 mt-1">{walkinSuccessId}</p>
                      <p className="text-xs text-gray-500 mt-1">This ID is permanent and linked across all visits.</p>
                    </div>
                  )}

                  <form onSubmit={handleWalkinPatientRegister} className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-gray-200">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={walkinForm.name}
                        onChange={(e) => setWalkinForm({ ...walkinForm, name: e.target.value })}
                        placeholder="e.g. Rahul Patil"
                        required
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={walkinForm.email}
                        onChange={(e) => setWalkinForm({ ...walkinForm, email: e.target.value })}
                        placeholder="e.g. rahul@example.com"
                        required
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={walkinForm.phone}
                        onChange={(e) => setWalkinForm({ ...walkinForm, phone: e.target.value })}
                        placeholder="e.g. 9876543210"
                        required
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition shadow-md"
                    >
                      Generate Patient ID & Register Patient
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: CLINIC APPOINTMENTS */}
              {receptionistTab === "appointments" && (
                <div className="space-y-8">
                  {/* BOOK NEW APPOINTMENT FORM */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
                    <h4 className="text-lg font-bold text-indigo-900 mb-4">
                      ➕ Book Appointment for Patient
                    </h4>

                    <form onSubmit={handleReceptionistBookApt} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Patient ID *</label>
                        <input
                          type="text"
                          placeholder="e.g. PAT-2026-0001"
                          value={receptionistAptForm.patientId}
                          onChange={(e) => {
                            const pid = e.target.value;
                            const matched = allPatients.find((p) => p.patientId === pid);
                            setReceptionistAptForm((prev) => ({
                              ...prev,
                              patientId: pid,
                              patientName: matched ? matched.name : prev.patientName,
                              phone: matched ? matched.phone : prev.phone,
                            }));
                          }}
                          required
                          className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Name *</label>
                        <input
                          type="text"
                          placeholder="Patient name"
                          value={receptionistAptForm.patientName}
                          onChange={(e) => setReceptionistAptForm({ ...receptionistAptForm, patientName: e.target.value })}
                          required
                          className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Phone *</label>
                        <input
                          type="tel"
                          placeholder="Phone number"
                          value={receptionistAptForm.phone}
                          onChange={(e) => setReceptionistAptForm({ ...receptionistAptForm, phone: e.target.value })}
                          required
                          className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Select Doctor *</label>
                        <select
                          value={receptionistAptForm.doctorId}
                          onChange={(e) => {
                            const doc = doctors.find((d) => (d._id || d.id) === e.target.value);
                            setReceptionistAptForm({
                              ...receptionistAptForm,
                              doctorId: e.target.value,
                              doctorName: doc ? doc.name : "",
                            });
                          }}
                          required
                          className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm outline-none"
                        >
                          <option value="">-- Choose Doctor --</option>
                          {doctors.map((d) => (
                            <option key={d._id || d.id} value={d._id || d.id}>
                              {d.name} ({d.specialization})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Date *</label>
                        <input
                          type="date"
                          value={receptionistAptForm.date}
                          onChange={(e) => setReceptionistAptForm({ ...receptionistAptForm, date: e.target.value })}
                          required
                          className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Time Slot *</label>
                        <select
                          value={receptionistAptForm.time}
                          onChange={(e) => setReceptionistAptForm({ ...receptionistAptForm, time: e.target.value })}
                          required
                          className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm outline-none"
                        >
                          <option value="">-- Choose Slot --</option>
                          {timeSlots.map((slot) => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Symptoms / Reason</label>
                        <input
                          type="text"
                          placeholder="e.g. Fever, Consultation, Follow-up"
                          value={receptionistAptForm.symptoms}
                          onChange={(e) => setReceptionistAptForm({ ...receptionistAptForm, symptoms: e.target.value })}
                          className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2 lg:col-span-3">
                        <button
                          type="submit"
                          className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition"
                        >
                          Book Appointment Now
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* ALL APPOINTMENTS LIST */}
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-4">
                      All Clinic Appointments ({allClinicAppointments.length})
                    </h4>

                    {allClinicAppointments.length === 0 ? (
                      <p className="text-gray-500 py-6 text-center">No appointments booked in clinic yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="bg-gray-50 text-gray-600 uppercase text-xs border-b">
                              <th className="py-3 px-4">Date & Time</th>
                              <th className="py-3 px-4">Patient</th>
                              <th className="py-3 px-4">Doctor</th>
                              <th className="py-3 px-4">Symptoms</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4 text-right">Update Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {allClinicAppointments.map((apt) => (
                              <tr key={apt._id || apt.id} className="hover:bg-slate-50">
                                <td className="py-3 px-4 font-medium text-gray-900">
                                  {apt.date} • {apt.time}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-bold text-gray-900">{apt.patientName}</div>
                                  <div className="text-xs text-blue-600 font-semibold">{apt.patientId || "N/A"}</div>
                                </td>
                                <td className="py-3 px-4 text-indigo-700 font-semibold">
                                  {apt.doctorName}
                                </td>
                                <td className="py-3 px-4 text-gray-600 text-xs">
                                  {apt.symptoms || "Checkup"}
                                </td>
                                <td className="py-3 px-4">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                      apt.status === "Completed"
                                        ? "bg-green-100 text-green-800"
                                        : apt.status === "Cancelled"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {apt.status || "Pending"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right space-x-1.5">
                                  <button
                                    onClick={() => updateAppointmentStatus(apt._id || apt.id, "Confirmed")}
                                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded hover:bg-blue-100"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => updateAppointmentStatus(apt._id || apt.id, "Completed")}
                                    className="px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded hover:bg-green-100"
                                  >
                                    Complete
                                  </button>
                                  <button
                                    onClick={() => updateAppointmentStatus(apt._id || apt.id, "Cancelled")}
                                    className="px-2 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded hover:bg-red-100"
                                  >
                                    Cancel
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: UPLOAD MEDICAL REPORT */}
              {receptionistTab === "upload" && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Upload Diagnostic Scan & Medical Report</h3>
                    <p className="text-sm text-gray-500">
                      Uploads files (PDF, JPG, PNG) directly to Firebase Storage and indexes them to the Patient ID
                    </p>
                  </div>

                  <form onSubmit={handleReceptionistUploadReport} className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-gray-200">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Patient ID *</label>
                      <input
                        type="text"
                        placeholder="e.g. PAT-2026-0001"
                        value={receptionistReportForm.patientId}
                        onChange={(e) => {
                          const pid = e.target.value;
                          const matched = allPatients.find((p) => p.patientId === pid);
                          setReceptionistReportForm({
                            ...receptionistReportForm,
                            patientId: pid,
                            patientName: matched ? matched.name : receptionistReportForm.patientName,
                          });
                        }}
                        required
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Patient Name</label>
                      <input
                        type="text"
                        placeholder="Patient Name"
                        value={receptionistReportForm.patientName}
                        onChange={(e) => setReceptionistReportForm({ ...receptionistReportForm, patientName: e.target.value })}
                        required
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Report Category</label>
                        <select
                          value={receptionistReportForm.reportType}
                          onChange={(e) => setReceptionistReportForm({ ...receptionistReportForm, reportType: e.target.value })}
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Blood Test">🩸 Blood Test</option>
                          <option value="X-Ray">🦴 X-Ray</option>
                          <option value="MRI Scan">🧠 MRI Scan</option>
                          <option value="CT Scan">🫁 CT Scan</option>
                          <option value="Ultrasound">📡 Ultrasound</option>
                          <option value="Pathology">🔬 Pathology</option>
                          <option value="General Report">📑 General Report</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Referring Doctor (Optional)</label>
                        <select
                          value={receptionistReportForm.doctorId}
                          onChange={(e) => {
                            const doc = doctors.find((d) => (d._id || d.id) === e.target.value);
                            setReceptionistReportForm({
                              ...receptionistReportForm,
                              doctorId: e.target.value,
                              doctorName: doc ? doc.name : "",
                            });
                          }}
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">-- Clinic Laboratory --</option>
                          {doctors.map((d) => (
                            <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Select Report File (PDF/JPG/PNG)</label>
                      <input
                        type="file"
                        id="receptionist-file-input"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setReceptionistReportFile(e.target.files?.[0] || null)}
                        required
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={receptionistUploading}
                      className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-md"
                    >
                      {receptionistUploading ? "Uploading to Firebase Storage..." : "Upload & Link Medical Report"}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 5: PATIENT TIMELINE */}
              {receptionistTab === "timeline" && selectedTimelinePatient && (
                <div className="space-y-6">
                  <PatientTimeline
                    patient={selectedTimelinePatient}
                    appointments={timelinePatientAppointments}
                    medicalRecords={timelinePatientRecords}
                    onDownload={downloadReport}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }


  // ========================================
  // STEP 9: PATIENT PORTAL (WITH INTERACTIVE TIMELINE & RECORDS)
  // ========================================

  if (portal === "patient") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* PATIENT NAVBAR */}
        <nav className="bg-white shadow-sm px-8 py-5 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-blue-600">
            MediSync AI <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full uppercase">Patient</span>
          </h1>

          <div className="flex items-center gap-4">
            <p className="text-gray-600 font-medium">
              Welcome {user?.displayName || user?.email || "Patient"}
            </p>

            <button
              onClick={async () => {
                try {
                  await signOut(auth);
                  setUser(null);
                  setPatientProfile(null);
                  setPortal(null);
                  setSelectedDoctor(null);
                  setSelectedTime("");
                  setAppointmentConfirmed(false);
                  setAppointments([]);
                  setShowRegister(false);
                } catch (error) {
                  console.error("Logout error:", error);
                  alert("Logout failed");
                }
              }}
              className="bg-red-500 text-white px-5 py-2 rounded-full hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </nav>

        {/* PATIENT ID BANNER */}
        {patientProfile?.patientId && (
          <div className="max-w-6xl mx-auto px-8 pt-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Your Permanent Patient ID
                </p>
                <p className="text-3xl font-extrabold text-blue-700 mt-1">
                  {patientProfile.patientId}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Keep this ID safe. It is used across all your appointments, reports, and clinical records.
                </p>
              </div>

              <div className="bg-white px-5 py-3 rounded-2xl border border-blue-100 shadow-sm text-left sm:text-right">
                <p className="text-xs text-gray-400 font-semibold uppercase">Registered Patient</p>
                <p className="font-bold text-gray-800 text-lg">
                  {patientProfile.name || user?.displayName || "Patient"}
                </p>
                {patientProfile.phone && (
                  <p className="text-xs text-gray-500 mt-0.5">📞 {patientProfile.phone}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* HERO */}
        <section className="bg-blue-50 px-8 py-16">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-blue-600 font-semibold mb-3 uppercase tracking-wider text-sm">
              HEALTHCARE MADE SIMPLE
            </p>
            <h2 className="text-5xl font-bold text-gray-900">
              Find the right doctor <span className="text-blue-600">for your health.</span>
            </h2>
            <p className="text-gray-600 text-lg mt-4 max-w-2xl mx-auto">
              Book appointments with trusted specialists, track your health journey, and access medical records anytime.
            </p>
          </div>
        </section>

        {/* PATIENT MEDICAL TIMELINE & RECORDS SECTION */}
        <section className="max-w-6xl mx-auto px-8 py-12">
          {patientProfile?.patientId && (
            <PatientTimeline
              patient={patientProfile}
              appointments={appointments.filter((a) => a.patientId === patientProfile.patientId)}
              medicalRecords={patientMedicalRecords}
              onDownload={downloadReport}
            />
          )}
        </section>

        {/* DOCTORS LIST */}
        <section className="max-w-6xl mx-auto px-8 py-12">
          <div className="text-center mb-10">
            <p className="text-blue-600 font-semibold uppercase text-xs tracking-wider">OUR SPECIALISTS</p>
            <h2 className="text-4xl font-bold mt-1 text-gray-900">Choose Your Doctor</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {doctors.map((doctor) => (
              <div
                key={doctor._id}
                className="bg-white rounded-3xl p-6 shadow-md hover:shadow-xl transition border border-gray-100 flex flex-col justify-between"
              >
                <div>
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto text-3xl mb-4">
                    👨‍⚕️
                  </div>
                  <h3 className="text-xl font-bold text-center text-gray-900">{doctor.name}</h3>
                  <p className="text-blue-600 text-center font-semibold text-sm mt-1">{doctor.specialization}</p>
                  <p className="text-gray-500 text-center text-sm mt-2">{doctor.experience || 0} years experience</p>
                </div>

                <button
                  onClick={() => bookAppointment(doctor)}
                  className="w-full mt-6 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition"
                >
                  Book Appointment
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* APPOINTMENT BOOKING SECTION */}
        {selectedDoctor && (
          <section id="appointment" className="bg-blue-50 py-16 px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-lg p-8 border border-blue-100">
              <div className="text-center mb-8">
                <p className="text-blue-600 font-semibold text-xs uppercase tracking-wider">APPOINTMENT</p>
                <h2 className="text-3xl font-bold mt-1">Book Your Appointment</h2>
                <div className="mt-4 bg-gray-50 rounded-2xl p-4 inline-block text-left">
                  <h3 className="text-lg font-bold">{selectedDoctor.name}</h3>
                  <p className="text-blue-600 text-sm">{selectedDoctor.specialization}</p>
                </div>
              </div>

              {!appointmentConfirmed ? (
                <form onSubmit={confirmAppointment} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Patient Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      required
                      className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      required
                      className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">Appointment Date</label>
                    <input
                      type="date"
                      name="date"
                      required
                      value={formData.date}
                      onChange={handleChange}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Select Time Slot</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {timeSlots.map((time) => (
                        <button
                          type="button"
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`py-3 rounded-xl border text-sm font-semibold transition ${
                            selectedTime === time
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">Reason / Symptoms</label>
                    <textarea
                      name="symptoms"
                      value={formData.symptoms}
                      onChange={handleChange}
                      placeholder="Briefly describe your symptoms"
                      rows="3"
                      className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-md"
                  >
                    Confirm Appointment
                  </button>
                </form>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">✅</div>
                  <h2 className="text-3xl font-bold text-green-600">Appointment Confirmed!</h2>
                  <p className="text-gray-600 mt-2">Your consultation has been booked successfully.</p>
                  <div className="bg-gray-50 rounded-2xl p-6 mt-6 text-left space-y-2 text-sm border">
                    <p><strong>Doctor:</strong> {selectedDoctor.name}</p>
                    <p><strong>Date & Time:</strong> {formData.date} at {selectedTime}</p>
                    <p><strong>Patient:</strong> {formData.name}</p>
                    <p><strong>Patient ID:</strong> <span className="text-blue-600 font-bold">{patientProfile?.patientId || "Permanent ID Linked"}</span></p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDoctor(null);
                      setSelectedTime("");
                      setAppointmentConfirmed(false);
                    }}
                    className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold"
                  >
                    Book Another Appointment
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer className="bg-gray-900 text-white text-center py-8">
          <h2 className="text-2xl font-bold">MediSync AI</h2>
          <p className="text-gray-400 mt-1 text-sm">Empowering healthcare professionals and patients with intelligent care.</p>
        </footer>
      </div>
    );
  }

  return null;
}

export default App;
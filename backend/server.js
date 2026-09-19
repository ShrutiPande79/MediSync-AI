const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Doctor = require("./models/Doctor");
const Appointment = require("./models/Appointment");
const Patient = require("./models/Patient");
const MedicalRecord = require("./models/MedicalRecord");
const Receptionist = require("./models/Receptionist");

const app = express();

app.use(cors());
app.use(express.json());


// ==========================================
// MONGODB CONNECTION
// ==========================================

mongoose
  .connect("mongodb://127.0.0.1:27017/prescripto")
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });


// ==========================================
// TEST ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.send("MediSync AI Backend is running!");
});


// ==========================================
// DOCTOR
// ==========================================

// Create Doctor
app.post("/api/doctors", async (req, res) => {
  try {
    const doctor = new Doctor(req.body);

    await doctor.save();

    res.status(201).json({
      message: "Doctor created successfully",
      doctor,
    });
  } catch (error) {
    console.error("Doctor creation error:", error);

    res.status(500).json({
      message: "Error creating doctor",
      error: error.message,
    });
  }
});


// Doctor Login
app.post("/api/doctors/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const doctor = await Doctor.findOne({ email });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    const isMatch = await doctor.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    res.json({
      message: "Doctor login successful",
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
        experience: doctor.experience,
        phone: doctor.phone,
        image: doctor.image,
        available: doctor.available,
      },
    });
  } catch (error) {
    console.error("Doctor login error:", error);

    res.status(500).json({
      message: "Login error",
      error: error.message,
    });
  }
});

// Get All Doctors
app.get("/api/doctors", async (req, res) => {
  try {
    const doctors = await Doctor.find().select("-password");

    res.json(doctors);
  } catch (error) {
    console.error("Fetch doctors error:", error);

    res.status(500).json({
      message: "Error fetching doctors",
      error: error.message,
    });
  }
});

// ==========================================
// PATIENT
// ==========================================

// Create Patient
app.post("/api/patients", async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Check if patient already exists
    const existingPatient = await Patient.findOne({ email });

    if (existingPatient) {
      return res.status(200).json({
        message: "Patient already exists",
        patient: existingPatient,
      });
    }

    // Count existing patients
    const patientCount = await Patient.countDocuments();

    // Generate unique Patient ID
    const patientId = `PAT-${new Date().getFullYear()}-${String(
      patientCount + 1
    ).padStart(4, "0")}`;

    const patient = new Patient({
      patientId,
      name,
      email,
      phone,
    });

    await patient.save();

    res.status(201).json({
      message: "Patient created successfully",
      patient,
    });
  } catch (error) {
    console.error("Patient creation error:", error);

    res.status(500).json({
      message: "Error creating patient",
      error: error.message,
    });
  }
});


// Get Patient by Email
app.get("/api/patients/email/:email", async (req, res) => {
  try {
    const patient = await Patient.findOne({
      email: req.params.email,
    });

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    res.json(patient);
  } catch (error) {
    console.error("Fetch patient error:", error);

    res.status(500).json({
      message: "Error fetching patient",
      error: error.message,
    });
  }
});

// Get All Patients (for Receptionist Directory / Search)
app.get("/api/patients", async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    console.error("Fetch patients error:", error);
    res.status(500).json({
      message: "Error fetching patients",
      error: error.message,
    });
  }
});


// ==========================================
// RECEPTIONIST
// ==========================================

// Create Receptionist
app.post("/api/receptionists", async (req, res) => {
  try {
    const { name, email, password, phone, clinicName } = req.body;

    const existingReceptionist = await Receptionist.findOne({ email });
    if (existingReceptionist) {
      return res.status(400).json({
        message: "Receptionist with this email already exists",
      });
    }

    const receptionist = new Receptionist({
      name,
      email,
      password,
      phone: phone || "",
      clinicName: clinicName || "MediSync Clinic",
    });

    await receptionist.save();

    res.status(201).json({
      message: "Receptionist registered successfully",
      receptionist: {
        id: receptionist._id,
        name: receptionist.name,
        email: receptionist.email,
        phone: receptionist.phone,
        clinicName: receptionist.clinicName,
      },
    });
  } catch (error) {
    console.error("Receptionist creation error:", error);
    res.status(500).json({
      message: "Error creating receptionist account",
      error: error.message,
    });
  }
});


// Receptionist Login
app.post("/api/receptionists/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const receptionist = await Receptionist.findOne({ email });
    if (!receptionist) {
      return res.status(404).json({
        message: "Receptionist account not found",
      });
    }

    const isMatch = await receptionist.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    res.json({
      message: "Receptionist login successful",
      receptionist: {
        id: receptionist._id,
        name: receptionist.name,
        email: receptionist.email,
        phone: receptionist.phone,
        clinicName: receptionist.clinicName,
      },
    });
  } catch (error) {
    console.error("Receptionist login error:", error);
    res.status(500).json({
      message: "Login error",
      error: error.message,
    });
  }
});


// ==========================================
// APPOINTMENTS
// ==========================================

// Get All Appointments (for Receptionist schedule overview)
app.get("/api/appointments", async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    console.error("Fetch all appointments error:", error);
    res.status(500).json({
      message: "Error fetching appointments",
      error: error.message,
    });
  }
});

// Update Appointment Status
app.put("/api/appointments/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({
      message: "Appointment status updated",
      appointment,
    });
  } catch (error) {
    console.error("Update appointment error:", error);
    res.status(500).json({
      message: "Error updating appointment",
      error: error.message,
    });
  }
});

// Create Appointment
app.post("/api/appointments", async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      phone,
      doctorName,
      doctorId,
      date,
      time,
      symptoms,
    } = req.body;

    const appointment = new Appointment({
      patientId,
      patientName,
      phone,
      doctorName,
      doctorId,
      date,
      time,
      symptoms,
    });

    await appointment.save();

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    console.error("Appointment error:", error);

    res.status(500).json({
      message: "Error creating appointment",
      error: error.message,
    });
  }
});


// Get appointments for a doctor
app.get("/api/appointments/doctor/:doctorId", async (req, res) => {
  try {
    const appointments = await Appointment.find({
      doctorId: req.params.doctorId,
    }).sort({ createdAt: -1 });

    res.json(appointments);
  } catch (error) {
    console.error("Fetch appointments error:", error);

    res.status(500).json({
      message: "Error fetching appointments",
      error: error.message,
    });
  }
});


// ==========================================
// MEDICAL RECORDS
// ==========================================

// Create Medical Record
app.post("/api/medical-records", async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      doctorId,
      doctorName,
      diagnosis,
      notes,
      prescription,
      reportName,
      reportUrl,
      reportType,
    } = req.body;

    if (!patientId || !patientName) {
      return res.status(400).json({
        message: "Patient ID and Patient Name are required.",
      });
    }

    if (!doctorId || !doctorName) {
      return res.status(400).json({
        message: "Doctor ID and Doctor Name are required.",
      });
    }

    if (!diagnosis || !diagnosis.trim()) {
      return res.status(400).json({
        message: "Diagnosis is required.",
      });
    }

    const medicalRecord = new MedicalRecord({
      patientId,
      patientName,
      doctorId,
      doctorName,
      diagnosis,
      notes: notes || "",
      prescription: prescription || "",
      reportName: reportName || "",
      reportUrl: reportUrl || "",
      reportType: reportType || "",
    });

    await medicalRecord.save();

    res.status(201).json({
      message: "Medical record created successfully",
      medicalRecord,
    });
  } catch (error) {
    console.error("Medical record error:", error);

    res.status(500).json({
      message: "Error creating medical record",
      error: error.message,
    });
  }
});


// Get Medical Records for a Patient
app.get("/api/medical-records/patient/:patientId", async (req, res) => {
  try {
    const records = await MedicalRecord.find({
      patientId: req.params.patientId,
    }).sort({ createdAt: -1 });

    res.json(records);
  } catch (error) {
    console.error("Fetch patient medical records error:", error);

    res.status(500).json({
      message: "Error fetching medical records",
      error: error.message,
    });
  }
});


// Get Medical Records for a Doctor
app.get("/api/medical-records/doctor/:doctorId", async (req, res) => {
  try {
    const records = await MedicalRecord.find({
      doctorId: req.params.doctorId,
    }).sort({ createdAt: -1 });

    res.json(records);
  } catch (error) {
    console.error("Fetch doctor medical records error:", error);

    res.status(500).json({
      message: "Error fetching medical records",
      error: error.message,
    });
  }
});


// ==========================================
// START SERVER
// ==========================================

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
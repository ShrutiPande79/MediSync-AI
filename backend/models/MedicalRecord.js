const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
    },

    patientName: {
      type: String,
      required: true,
    },

    doctorId: {
      type: String,
      required: true,
    },

    doctorName: {
      type: String,
      required: true,
    },

    diagnosis: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      default: "",
    },

    prescription: {
      type: String,
      default: "",
    },

    reportName: {
      type: String,
      default: "",
    },

    reportUrl: {
      type: String,
      default: "",
    },

    reportType: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { 
      type: String, 
      default: "" ,
    },

    patientName: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    doctorName: {
      type: String,
      required: true,
    },

    doctorId: {
      type: String,
      required: true,
    },

    date: {
      type: String,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    symptoms: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
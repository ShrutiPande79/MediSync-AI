const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const receptionistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      default: "",
    },

    clinicName: {
      type: String,
      default: "MediSync Clinic",
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving receptionist
receptionistSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
receptionistSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Receptionist", receptionistSchema);

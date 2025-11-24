import mongoose from "mongoose";

const TouristSchema = new mongoose.Schema({
  userType: { type: String, enum: ["IND", "FOR"], required: true },

  name: { type: String, required: true },
  phone: { type: String, required: true },

  aadhaar: { type: String },
  passport: { type: String },
  nationality: { type: String },
  visaType: { type: String },
  homeState: { type: String },

  email: { type: String },

  digitalId: { type: String, required: true, unique: true },

  photoPath: { type: String }, // file upload

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Tourist", TouristSchema);

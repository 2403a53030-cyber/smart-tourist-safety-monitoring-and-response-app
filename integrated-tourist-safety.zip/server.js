import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import Tourist from "./models/Tourist.js";

const app = express();
app.use(express.json());
app.use(cors());

// ====== MongoDB Connection ======
mongoose.connect("mongodb://127.0.0.1:27017/touristID", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error", err));


// ====== Multer for Photo Upload ======
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });


// ======================================
//  POST /register   → SAVE DATA
// ======================================
app.post("/register", upload.single("photo"), async (req, res) => {
  try {
    const {
      userType,
      name,
      phone,
      aadhaar,
      passport,
      nationality,
      visaType,
      homeState,
      email,
      digitalId
    } = req.body;

    const newTourist = new Tourist({
      userType,
      name,
      phone,
      aadhaar,
      passport,
      nationality,
      visaType,
      homeState,
      email,
      digitalId,
      photoPath: req.file ? req.file.path : null
    });

    await newTourist.save();
    res.json({ success: true, msg: "Saved Successfully!" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, msg: "Server Error" });
  }
});


// ======================================
//  GET /tourist/:id   → FETCH DETAILS VIA QR
// ======================================
app.get("/tourist/:digitalId", async (req, res) => {
  try {
    const tourist = await Tourist.findOne({ digitalId: req.params.digitalId });

    if (!tourist) {
      return res.status(404).json({ success: false, msg: "Not Found" });
    }

    res.json({ success: true, data: tourist });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});


// ====== Server Start ======
app.listen(5000, () => console.log("🚀 Backend Running on port 5000"));

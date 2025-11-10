import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

app.post("/analyze", upload.single("timetable"), async (req, res) => {
  res.json({
    Monday: ["Math", "Physics", "Chemistry", "PE", "Free", "CS"],
    Tuesday: ["English", "Math", "Art", "Free", "Physics", "Lab"],
    Wednesday: ["Chemistry", "Math", "PE", "English", "CS", "Free"],
    Thursday: ["Art", "Physics", "Chemistry", "Math", "CS", "Free"],
    Friday: ["Math", "Lab", "PE", "Art", "Free", "English"],
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`💡 Mock backend running on http://localhost:${process.env.PORT}`)
);

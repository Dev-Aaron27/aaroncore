import express from "express";
import cors from "cors";
import multer from "multer";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

const UPLOAD_DIR = "./uploads";
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname)
});
const upload = multer({ storage });

// SQLite DB
const dbPromise = open({
  filename: "posts.db",
  driver: sqlite3.Database
});

const initDB = async () => {
  const db = await dbPromise;
  await db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      content TEXT,
      image_path TEXT
    )
  `);
};
initDB();

// Serve uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Upload endpoint
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { username, content } = req.body;
    if (!req.file) return res.status(400).json({ status: "error", message: "No file uploaded" });

    const image_path = req.file.filename;
    const db = await dbPromise;
    await db.run("INSERT INTO posts (username, content, image_path) VALUES (?, ?, ?)", 
      [username, content, image_path]
    );
    res.json({ status: "success" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", error: err.message });
  }
});

// Get all posts
app.get("/posts", async (req, res) => {
  try {
    const db = await dbPromise;
    const posts = await db.all("SELECT username, content, image_path FROM posts ORDER BY id DESC");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// Health check for Render
app.get("/", (req, res) => res.send("Aaron Core API is running"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Aaron Core API running on port ${PORT}`));

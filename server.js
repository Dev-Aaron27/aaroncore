import express from "express";
import cors from "cors";
import multer from "multer";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname)
});
const upload = multer({ storage });

// SQLite setup
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

// Upload endpoint
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { username, content } = req.body;
    const image_path = req.file.path;
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
  const db = await dbPromise;
  const posts = await db.all("SELECT username, content, image_path FROM posts ORDER BY id DESC");
  res.json(posts);
});

app.listen(3000, () => console.log("Aaron Core API running on http://localhost:3000"));

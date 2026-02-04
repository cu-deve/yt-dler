import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());

// ===============================
// PATH SETUP
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOWNLOAD_DIR = path.join(__dirname, "downloads");
const COOKIES_PATH = path.join(__dirname, "cookies.txt");

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// ===============================
// BASIC CHECK
// ===============================
app.get("/", (req, res) => {
  res.send("🎬 Video Downloader API running");
});

// ===============================
// DOWNLOAD (MP4 + AUDIO, MAX 1080p)
// ===============================
app.get("/download", (req, res) => {
  const { url, quality } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing URL" });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  // 🔒 DEFAULT = 1080p
  // (prepare for future quality selector)
  const maxHeight = quality === "720" ? 720 : 1080;

  const id = Date.now();
  const outputTemplate = path.join(DOWNLOAD_DIR, `${id}.%(ext)s`);

  const args = [
    "--no-playlist",

    // ⭐ LIMIT MAX QUALITY (AAC audio, MP4 video)
    "-f",
    `bv*[ext=mp4][height<=${maxHeight}]+ba[ext=m4a]/bv*[height<=${maxHeight}]+ba/b`,

    "--merge-output-format",
    "mp4",

    "-o",
    outputTemplate,

    url
  ];

  // Optional cookies (for blocked videos)
  if (fs.existsSync(COOKIES_PATH)) {
    args.push("--cookies", COOKIES_PATH);
  }

  const yt = spawn("yt-dlp", args);
  let stderr = "";

  yt.stderr.on("data", (d) => {
    stderr += d.toString();
  });

  yt.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({
        error: "Download failed",
        detail: stderr.slice(0, 2000),
      });
    }

    const files = fs.readdirSync(DOWNLOAD_DIR);
    const mp4File = files.find(
      (f) => f.startsWith(id.toString()) && f.endsWith(".mp4")
    );

    if (!mp4File) {
      return res.status(500).json({
        error: "MP4 not created",
        files,
      });
    }

    const filePath = path.join(DOWNLOAD_DIR, mp4File);

    // Send file then delete
    res.download(filePath, () => {
      fs.unlink(filePath, () => { });
    });
  });
});

// ===============================
// SERVER
// ===============================
const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});

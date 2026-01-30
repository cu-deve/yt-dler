import express from "express";
import cors from "cors";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// ROOT PATH (HEALTH CHECK)
// ===============================
app.get("/", (req, res) => {
  res.status(200).send("🚀 YouTube Downloader API is running");
});

// ===============================
// SETUP PATHS
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOWNLOAD_DIR = path.join(__dirname, "downloads");

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR);
}

// ===============================
// DOWNLOAD ENDPOINT (FIXED)
// ===============================
app.get("/download", (req, res) => {
  let { url, format } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing URL" });
  }

  // clean URL (remove ?si= etc.)
  url = url.split("?")[0];

  // default format
  format = format === "mp3" ? "mp3" : "mp4";

  const id = Date.now();
  const outputTemplate = path.join(DOWNLOAD_DIR, `${id}.%(ext)s`);

  let command = "";

  // ---- FORCE MP3 ----
  if (format === "mp3") {
    command = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${outputTemplate}" "${url}"`;
  }
  // ---- FORCE MP4 (NO WEBM) ----
  else {
    command = `yt-dlp -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]" --merge-output-format mp4 -o "${outputTemplate}" "${url}"`;
  }

  exec(command, (error) => {
    if (error) {
      console.error("yt-dlp error:", error);
      return res.status(500).json({ error: "Download failed" });
    }

    const file = fs.readdirSync(DOWNLOAD_DIR)
      .find(f => f.startsWith(id.toString()));

    if (!file) {
      return res.status(500).json({ error: "File not found" });
    }

    const filePath = path.join(DOWNLOAD_DIR, file);

    res.download(filePath, () => {
      try {
        fs.unlinkSync(filePath); // cleanup
      } catch (err) {
        console.error("Cleanup error:", err);
      }
    });
  });
});

// ===============================
// START SERVER (RAILWAY)
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});

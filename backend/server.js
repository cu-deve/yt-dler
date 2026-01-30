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
// PATH SETUP
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOWNLOAD_DIR = path.join(__dirname, "downloads");

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR);
}

// ===============================
// DOWNLOAD ENDPOINT
// ===============================
app.get("/download", (req, res) => {
  let { url, format } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing URL" });
  }

  // Clean URL
  url = url.split("?")[0];
  format = format === "mp3" ? "mp3" : "mp4";

  const id = Date.now();
  const outputTemplate = path.join(DOWNLOAD_DIR, `${id}.%(ext)s`);

  let command = "";

  if (format === "mp3") {
    command =
      `yt-dlp --js-runtime node ` +
      `-x --audio-format mp3 --audio-quality 0 ` +
      `-o "${outputTemplate}" "${url}"`;
  } else {
    command =
      `yt-dlp --js-runtime node ` +
      `-f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]" ` +
      `--merge-output-format mp4 ` +
      `-o "${outputTemplate}" "${url}"`;
  }

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("yt-dlp ERROR:");
      console.error(stderr || error.message);

      return res.status(500).json({
        error: "Download failed",
        detail: stderr || error.message
      });
    }

    const file = fs
      .readdirSync(DOWNLOAD_DIR)
      .find(f => f.startsWith(id.toString()));

    if (!file) {
      return res.status(500).json({ error: "File not found" });
    }

    const filePath = path.join(DOWNLOAD_DIR, file);

    res.download(filePath, () => {
      try {
        fs.unlinkSync(filePath);
      } catch {}
    });
  });
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});

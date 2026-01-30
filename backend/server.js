import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// BASIC
// ===============================
app.get("/", (req, res) => {
  res.send("🚀 Downloader API running");
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOWNLOAD_DIR = path.join(__dirname, "downloads");
const COOKIES_PATH = path.join(__dirname, "cookies.txt");

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// ===============================
// DOWNLOAD
// ===============================
app.get("/download", (req, res) => {
  const { url, format } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing URL" });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  const id = Date.now();
  const output = path.join(DOWNLOAD_DIR, `${id}.%(ext)s`);
  const isMp3 = format === "mp3";

 const args = [];

if (fs.existsSync(COOKIES_PATH)) {
  args.push("--cookies", COOKIES_PATH);
}

args.push("--no-playlist");

if (isMp3) {
  args.push(
    "-x",
    "--audio-format", "mp3",
    "--audio-quality", "0"
  );
} else {
  args.push(
    "-f", "bv*+ba/b",
    "--merge-output-format", "mp4"
  );
}

args.push("-o", output, url);


  const yt = spawn("yt-dlp", args);

  let errorLog = "";

  yt.stderr.on("data", d => {
    errorLog += d.toString();
  });

yt.on("close", code => {
  if (code !== 0) {
    console.error("yt-dlp failed:\n", errorLog);

    // ❗ IMPORTANT: respond, DO NOT crash
    if (!res.headersSent) {
      return res.status(500).json({
        error: "Download failed",
        reason: "YouTube blocked server or format unavailable",
        detail: errorLog.slice(0, 2000)
      });
    }
    return;
  }

  const file = fs.readdirSync(DOWNLOAD_DIR)
    .find(f => f.startsWith(id.toString()));

  if (!file) {
    return res.status(500).json({ error: "File not found" });
  }

  res.download(path.join(DOWNLOAD_DIR, file), () => {
    fs.unlinkSync(path.join(DOWNLOAD_DIR, file));
  });
});

});

// ===============================
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});

import express from "express";
import cors from "cors";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

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
  const { url, format } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing URL" });
  }

  const id = Date.now();
  const outputTemplate = path.join(DOWNLOAD_DIR, `${id}.%(ext)s`);

  let command = "";

  if (format === "mp3") {
    command = `yt-dlp -x --audio-format mp3 -o "${outputTemplate}" "${url}"`;
  } else {
    command = `yt-dlp -f "bv*+ba/b" -o "${outputTemplate}" "${url}"`;
  }

  exec(command, (error) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Download failed" });
    }

    const files = fs.readdirSync(DOWNLOAD_DIR);
    const file = files.find(f => f.startsWith(id.toString()));

    if (!file) {
      return res.status(500).json({ error: "File not found" });
    }

    const filePath = path.join(DOWNLOAD_DIR, file);
    res.download(filePath, () => {
      fs.unlinkSync(filePath); // cleanup
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

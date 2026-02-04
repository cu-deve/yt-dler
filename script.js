// ===============================
// CONFIG
// ===============================
const BACKEND_URL = "https://yt-dler-production.up.railway.app";

// ===============================
// ELEMENTS
// ===============================
const hamburger = document.getElementById("hamburger");
const sidebar = document.getElementById("sidebar");
const sidebarLinks = document.querySelectorAll(".sidebar-link");
const urlInput = document.getElementById("urlInput");
const downloadBtn = document.querySelector(".download-btn");
const clearBtn = document.getElementById("clearBtn");
const pasteBtn = document.getElementById("pasteBtn");

// ===============================
// SIDEBAR
// ===============================
const overlay = document.createElement("div");
overlay.classList.add("sidebar-overlay");
document.body.appendChild(overlay);

function toggleSidebar() {
  hamburger.classList.toggle("active");
  sidebar.classList.toggle("open");
  overlay.classList.toggle("active");
}

function closeSidebar() {
  hamburger.classList.remove("active");
  sidebar.classList.remove("open");
  overlay.classList.remove("active");
}

hamburger?.addEventListener("click", toggleSidebar);
overlay?.addEventListener("click", closeSidebar);
sidebarLinks.forEach(link => link.addEventListener("click", closeSidebar));

// ===============================
// INPUT UX (PASTE / CLEAR)
// ===============================
function updateInputButtons() {
  if (urlInput.value.trim() === "") {
    clearBtn.style.display = "none";
    pasteBtn.style.display = "flex";
  } else {
    clearBtn.style.display = "flex";
    pasteBtn.style.display = "none";
  }
}

updateInputButtons();
urlInput.addEventListener("input", updateInputButtons);

clearBtn.addEventListener("click", () => {
  urlInput.value = "";
  updateInputButtons();
  urlInput.focus();
});

pasteBtn.addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      urlInput.value = text;
      updateInputButtons();
    }
  } catch {
    alert("Clipboard access denied. Please paste manually.");
  }
});

// ===============================
// HELPER: YOUTUBE URL VALIDATION
// ===============================
function isValidYouTubeUrl(url) {
  try {
    const u = new URL(url);
    return (
      u.hostname.includes("youtube.com") ||
      u.hostname.includes("youtu.be")
    );
  } catch {
    return false;
  }
}

// ===============================
// DOWNLOAD HANDLER
// ===============================
downloadBtn.addEventListener("click", () => {
  const videoUrl = urlInput.value.trim();

  if (!videoUrl) {
    alert("Please enter YouTube URL");
    return;
  }

  if (!isValidYouTubeUrl(videoUrl)) {
    alert("Invalid YouTube URL");
    return;
  }

  downloadBtn.disabled = true;
  downloadBtn.textContent = "Processing...";

  const downloadUrl =
    `${BACKEND_URL}/download?url=${encodeURIComponent(videoUrl)}`;

  window.location.href = downloadUrl;

  setTimeout(() => {
    downloadBtn.disabled = false;
    downloadBtn.textContent = "Download";
  }, 2000);
});


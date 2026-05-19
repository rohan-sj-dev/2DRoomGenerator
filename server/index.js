const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4000;
const LAYOUTS_DIR = path.join(__dirname, "layouts");
const DEFAULT_LAYOUT_FILE = path.join(LAYOUTS_DIR, "layout.json");

if (!fs.existsSync(LAYOUTS_DIR)) {
  fs.mkdirSync(LAYOUTS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Save layout: writes the full payload to layouts/layout.json (and a timestamped copy for history)
app.post("/api/layout", (req, res) => {
  const payload = req.body;

  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ error: "Invalid payload" });
  }
  if (!Array.isArray(payload.items)) {
    return res.status(400).json({ error: "Payload must contain an items array" });
  }

  const record = {
    version: payload.version || 1,
    savedAt: new Date().toISOString(),
    room: payload.room || null,
    items: payload.items,
  };

  try {
    fs.writeFileSync(DEFAULT_LAYOUT_FILE, JSON.stringify(record, null, 2), "utf8");

    // History snapshot — lets the user roll back if desired
    const stamp = record.savedAt.replace(/[:.]/g, "-");
    const historyFile = path.join(LAYOUTS_DIR, `layout-${stamp}.json`);
    fs.writeFileSync(historyFile, JSON.stringify(record, null, 2), "utf8");

    res.json({ ok: true, savedAt: record.savedAt, file: path.basename(DEFAULT_LAYOUT_FILE) });
  } catch (err) {
    console.error("Failed to save layout:", err);
    res.status(500).json({ error: "Failed to write layout file" });
  }
});

// Load the most recently saved layout
app.get("/api/layout", (_req, res) => {
  try {
    if (!fs.existsSync(DEFAULT_LAYOUT_FILE)) {
      return res.json({ ok: true, layout: null });
    }
    const raw = fs.readFileSync(DEFAULT_LAYOUT_FILE, "utf8");
    const parsed = JSON.parse(raw);
    res.json({ ok: true, layout: parsed });
  } catch (err) {
    console.error("Failed to load layout:", err);
    res.status(500).json({ error: "Failed to read layout file" });
  }
});

app.listen(PORT, () => {
  console.log(`[server] Room generator API listening on http://localhost:${PORT}`);
  console.log(`[server] Layouts directory: ${LAYOUTS_DIR}`);
});

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Room from "./components/Room.jsx";
import { CATALOG_BY_TYPE } from "./data/furniture.jsx";

const LAYOUT_VERSION = 1;
const API_BASE = "/api";

function makeId() {
  return `it_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [savingState, setSavingState] = useState("idle"); // idle | saving | ok | error
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const roomSizeRef = useRef({ width: 0, height: 0 });
  const zCounter = useRef(1);

  // On first load, try to fetch the most recently saved layout from the server.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/layout`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data?.layout) return;
        const incoming = Array.isArray(data.layout.items) ? data.layout.items : [];
        if (incoming.length > 0) {
          setItems(incoming);
          zCounter.current =
            incoming.reduce((m, it) => Math.max(m, it.zIndex || 1), 1) + 1;
          setLastSavedAt(data.layout.savedAt);
        }
      } catch (err) {
        console.warn("Could not load saved layout:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAdd = useCallback((type) => {
    const spec = CATALOG_BY_TYPE[type];
    if (!spec) return;
    const room = roomSizeRef.current;
    const width = spec.defaultWidth;
    const height = spec.defaultHeight;
    const x = Math.max(0, Math.min((room.width || 600) / 2 - width / 2, (room.width || 600) - width));
    const y = Math.max(0, Math.min((room.height || 400) / 2 - height / 2, (room.height || 400) - height));
    const id = makeId();
    const z = zCounter.current++;
    setItems((prev) => [
      ...prev,
      { id, type, x, y, width, height, rotation: 0, zIndex: z },
    ]);
    setSelectedId(id);
  }, []);

  const handleChange = useCallback((id, patch) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  // Selecting an item no longer changes z-order — otherwise the user could
  // never keep a rug below a sofa (clicking the rug would put it on top).
  // Use Bring to Front / Send to Back explicitly.
  const handleSelect = useCallback((id) => {
    setSelectedId(id);
  }, []);

  const handleRemove = useCallback((id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setSelectedId((sel) => (sel === id ? null : sel));
  }, []);

  const handleClear = useCallback(() => {
    if (items.length === 0) return;
    if (!window.confirm("Remove all furniture from the room?")) return;
    setItems([]);
    setSelectedId(null);
  }, [items.length]);

  const handleRotate = useCallback((id) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const nextRot = ((it.rotation || 0) + 90) % 360;
        // Every 90° step flips the bounding box's aspect, regardless of direction.
        return {
          ...it,
          rotation: nextRot,
          width: it.height,
          height: it.width,
        };
      })
    );
  }, []);

  const handleBringToFront = useCallback((id) => {
    setItems((prev) => {
      const maxZ = prev.reduce((m, it) => Math.max(m, it.zIndex || 1), 0);
      return prev.map((it) => (it.id === id ? { ...it, zIndex: maxZ + 1 } : it));
    });
    zCounter.current += 1;
  }, []);

  const handleSendToBack = useCallback((id) => {
    setItems((prev) => {
      const minZ = prev.reduce((m, it) => Math.min(m, it.zIndex || 1), Infinity);
      return prev.map((it) => (it.id === id ? { ...it, zIndex: minZ - 1 } : it));
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSavingState("saving");
    const payload = {
      version: LAYOUT_VERSION,
      room: { width: roomSizeRef.current.width, height: roomSizeRef.current.height },
      items,
    };
    try {
      const res = await fetch(`${API_BASE}/layout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLastSavedAt(data.savedAt || new Date().toISOString());
      setSavingState("ok");
      setTimeout(() => setSavingState("idle"), 2000);
    } catch (err) {
      console.error("Save failed:", err);
      setSavingState("error");
      setTimeout(() => setSavingState("idle"), 3000);
    }
  }, [items]);

  const handleReload = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/layout`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.layout?.items) {
        setItems(data.layout.items);
        setLastSavedAt(data.layout.savedAt);
        zCounter.current =
          data.layout.items.reduce((m, it) => Math.max(m, it.zIndex || 1), 1) + 1;
        setSelectedId(null);
      } else {
        window.alert("No saved layout found yet.");
      }
    } catch (err) {
      console.error("Reload failed:", err);
      window.alert("Could not reach the server. Is it running?");
    }
  }, []);

  // Keyboard shortcuts for the selected item.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (!selectedId) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        handleRemove(selectedId);
      } else if (e.key === "r" || e.key === "R") {
        handleRotate(selectedId);
      } else if (e.key === "[") {
        handleSendToBack(selectedId);
      } else if (e.key === "]") {
        handleBringToFront(selectedId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, handleRemove, handleRotate, handleSendToBack, handleBringToFront]);

  const handleRoomMeasured = useCallback((s) => {
    roomSizeRef.current = s;
  }, []);

  const selectedItem = useMemo(
    () => items.find((it) => it.id === selectedId) || null,
    [items, selectedId]
  );

  return (
    <div className="app">
      <Sidebar
        onAdd={handleAdd}
        onSave={handleSave}
        onReload={handleReload}
        onClear={handleClear}
        savingState={savingState}
        lastSavedAt={lastSavedAt}
        selectedItem={selectedItem}
        onRotate={handleRotate}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
        onRemove={handleRemove}
      />
      <main className="canvas-area">
        <Room
          items={items}
          selectedId={selectedId}
          onSelect={handleSelect}
          onChange={handleChange}
          onRoomMeasured={handleRoomMeasured}
        />
      </main>
    </div>
  );
}

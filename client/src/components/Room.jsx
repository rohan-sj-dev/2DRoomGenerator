import React, { useEffect, useRef, useState } from "react";
import FurnitureItem from "./FurnitureItem.jsx";

// Optional remote empty-room image. Set to a URL to use a photo as the
// background; leave null to use the built-in top-down floor plan, which is
// guaranteed empty and works offline.
const ROOM_IMAGE = null;

// Top-down empty room: wooden plank floor, four walls, a door and a window.
function EmptyFloorPlan() {
  return (
    <svg
      className="floorplan-svg"
      viewBox="0 0 1000 750"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <pattern id="planks" width="1000" height="60" patternUnits="userSpaceOnUse">
          <rect width="1000" height="60" fill="#d8b483" />
          <rect width="1000" height="60" fill="url(#plankGrain)" opacity="0.35" />
          <line x1="0" y1="60" x2="1000" y2="60" stroke="#9b7747" strokeWidth="1.5" />
          <line x1="120" y1="0" x2="120" y2="60" stroke="#9b7747" strokeWidth="1" />
          <line x1="340" y1="0" x2="340" y2="60" stroke="#9b7747" strokeWidth="1" />
          <line x1="560" y1="0" x2="560" y2="60" stroke="#9b7747" strokeWidth="1" />
          <line x1="780" y1="0" x2="780" y2="60" stroke="#9b7747" strokeWidth="1" />
        </pattern>
        <linearGradient id="plankGrain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b78b56" />
          <stop offset="50%" stopColor="#d8b483" />
          <stop offset="100%" stopColor="#a87644" />
        </linearGradient>
      </defs>

      {/* Floor */}
      <rect x="0" y="0" width="1000" height="750" fill="url(#planks)" />

      {/* Walls (drawn as a thick border inside the SVG) */}
      <rect
        x="0" y="0" width="1000" height="750"
        fill="none" stroke="#5a4632" strokeWidth="24"
      />

      {/* Window on top wall */}
      <rect x="380" y="0" width="240" height="24" fill="#bcd9e8" />
      <line x1="500" y1="0" x2="500" y2="24" stroke="#5a4632" strokeWidth="3" />

      {/* Door on right wall (a gap + arc) */}
      <rect x="976" y="500" width="24" height="160" fill="#d8b483" />
      <path
        d="M 976 500 A 160 160 0 0 1 836 660"
        fill="none" stroke="#5a4632" strokeWidth="2" strokeDasharray="4 4"
      />
      <line x1="976" y1="500" x2="836" y2="500" stroke="#5a4632" strokeWidth="3" />
    </svg>
  );
}

export default function Room({
  items,
  selectedId,
  onSelect,
  onChange,
  onRoomMeasured,
}) {
  const roomRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Observe room size so the parent can store it with the layout.
  useEffect(() => {
    if (!roomRef.current) return;
    const el = roomRef.current;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const next = { width: rect.width, height: rect.height };
      setSize(next);
      onRoomMeasured?.(next);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [onRoomMeasured]);

  // Deselect only when the click landed on empty room space, not on furniture.
  // Without this guard, clicking a piece would (a) select it via furniture's
  // mousedown, then (b) bubble up here and immediately deselect.
  const handleBackgroundMouseDown = (e) => {
    if (e.target.closest && e.target.closest(".furniture")) return;
    onSelect(null);
  };

  return (
    <div className="room-wrapper" onMouseDown={handleBackgroundMouseDown}>
      <div
        ref={roomRef}
        className={`room ${ROOM_IMAGE ? "room-with-image" : "room-floorplan"}`}
        style={ROOM_IMAGE ? { backgroundImage: `url("${ROOM_IMAGE}")` } : undefined}
      >
        {!ROOM_IMAGE && <EmptyFloorPlan />}
        {items.map((item) => (
          <FurnitureItem
            key={item.id}
            item={item}
            bounds="parent"
            selected={selectedId === item.id}
            onSelect={onSelect}
            onChange={onChange}
          />
        ))}
      </div>
      <div className="room-meta">
        Room: {Math.round(size.width)} × {Math.round(size.height)} px • {items.length} item
        {items.length === 1 ? "" : "s"}
        {selectedId && (() => {
          const sel = items.find((i) => i.id === selectedId);
          if (!sel) return null;
          return (
            <>
              {" "}• Selected: {sel.type} ({Math.round(sel.x)}, {Math.round(sel.y)}) {Math.round(sel.width)}×{Math.round(sel.height)}
            </>
          );
        })()}
      </div>
    </div>
  );
}

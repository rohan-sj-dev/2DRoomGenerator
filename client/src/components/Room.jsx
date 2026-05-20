import React, { useEffect, useMemo, useRef, useState } from "react";
import FurnitureItem from "./FurnitureItem.jsx";

// Optional remote empty-room image. Set to a URL to use a photo as the
// background; leave null to use the built-in top-down floor plan, which is
// guaranteed empty and works offline.
const ROOM_IMAGE = null;

// Pixel threshold for showing an alignment guide / snapping on drop.
const SNAP_THRESHOLD = 6;

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

      <rect x="0" y="0" width="1000" height="750" fill="url(#planks)" />

      <rect
        x="0" y="0" width="1000" height="750"
        fill="none" stroke="#5a4632" strokeWidth="24"
      />

      <rect x="380" y="0" width="240" height="24" fill="#bcd9e8" />
      <line x1="500" y1="0" x2="500" y2="24" stroke="#5a4632" strokeWidth="3" />

      <rect x="976" y="500" width="24" height="160" fill="#d8b483" />
      <path
        d="M 976 500 A 160 160 0 0 1 836 660"
        fill="none" stroke="#5a4632" strokeWidth="2" strokeDasharray="4 4"
      />
      <line x1="976" y1="500" x2="836" y2="500" stroke="#5a4632" strokeWidth="3" />
    </svg>
  );
}

// Snap one edge candidate to the nearest target edge within threshold.
// Returns the delta to apply, or 0 if nothing to snap.
function bestSnapDelta(selfEdges, otherEdges, threshold) {
  let best = 0;
  let bestAbs = Infinity;
  for (const s of selfEdges) {
    for (const o of otherEdges) {
      const d = o - s;
      const ad = Math.abs(d);
      if (ad <= threshold && ad < bestAbs) {
        best = d;
        bestAbs = ad;
      }
    }
  }
  return best;
}

export default function Room({
  items,
  selectedId,
  onSelect,
  onChange,
  onRoomMeasured,
}) {
  const interiorRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  // Live drag state for the active item; null when nothing is being dragged.
  const [dragRect, setDragRect] = useState(null);

  // Measure the interior (the area furniture can actually occupy).
  useEffect(() => {
    if (!interiorRef.current) return;
    const el = interiorRef.current;
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

  // Active alignment guides for the dragging item.
  const guides = useMemo(() => {
    if (!dragRect) return { v: [], h: [] };
    const T = SNAP_THRESHOLD;
    const others = items.filter((it) => it.id !== dragRect.id);
    const v = new Set();
    const h = new Set();
    const { x, y, width, height } = dragRect;
    const selfX = [x, x + width / 2, x + width];
    const selfY = [y, y + height / 2, y + height];
    for (const o of others) {
      const oX = [o.x, o.x + o.width / 2, o.x + o.width];
      const oY = [o.y, o.y + o.height / 2, o.y + o.height];
      for (const s of selfX) for (const t of oX) if (Math.abs(s - t) <= T) v.add(t);
      for (const s of selfY) for (const t of oY) if (Math.abs(s - t) <= T) h.add(t);
    }
    return { v: [...v], h: [...h] };
  }, [dragRect, items]);

  const handleItemDrag = (id, rect) => {
    setDragRect({ id, ...rect });
  };

  // On drop: snap to nearest aligned edge in each axis, then commit.
  const handleItemDragEnd = (id, rect) => {
    const others = items.filter((it) => it.id !== id);
    let { x, y, width, height } = rect;

    const selfX = [x, x + width / 2, x + width];
    const selfY = [y, y + height / 2, y + height];
    const targetsX = others.flatMap((o) => [o.x, o.x + o.width / 2, o.x + o.width]);
    const targetsY = others.flatMap((o) => [o.y, o.y + o.height / 2, o.y + o.height]);

    const dx = bestSnapDelta(selfX, targetsX, SNAP_THRESHOLD);
    const dy = bestSnapDelta(selfY, targetsY, SNAP_THRESHOLD);
    x += dx;
    y += dy;

    // Re-clamp to interior in case snap pushed us out.
    x = Math.max(0, Math.min(x, size.width - width));
    y = Math.max(0, Math.min(y, size.height - height));

    onChange(id, { x, y });
    setDragRect(null);
  };

  const handleBackgroundMouseDown = (e) => {
    if (e.target.closest && e.target.closest(".furniture")) return;
    onSelect(null);
  };

  return (
    <div className="room-wrapper" onMouseDown={handleBackgroundMouseDown}>
      <div
        className={`room ${ROOM_IMAGE ? "room-with-image" : "room-floorplan"}`}
        style={ROOM_IMAGE ? { backgroundImage: `url("${ROOM_IMAGE}")` } : undefined}
      >
        {!ROOM_IMAGE && <EmptyFloorPlan />}
        <div ref={interiorRef} className="room-interior">
          {items.map((item) => (
            <FurnitureItem
              key={item.id}
              item={item}
              bounds="parent"
              selected={selectedId === item.id}
              onSelect={onSelect}
              onChange={onChange}
              onDrag={handleItemDrag}
              onDragEnd={handleItemDragEnd}
            />
          ))}
          {guides.v.map((vx) => (
            <div key={`v-${vx}`} className="guide guide-v" style={{ left: `${vx}px` }} />
          ))}
          {guides.h.map((hy) => (
            <div key={`h-${hy}`} className="guide guide-h" style={{ top: `${hy}px` }} />
          ))}
        </div>
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

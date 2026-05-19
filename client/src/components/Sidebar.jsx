import React from "react";
import { FURNITURE_CATALOG, CATALOG_BY_TYPE, FurnitureIcon } from "../data/furniture.jsx";

export default function Sidebar({
  onAdd,
  onSave,
  onReload,
  onClear,
  savingState,
  lastSavedAt,
  selectedItem,
  onRotate,
  onBringToFront,
  onSendToBack,
  onRemove,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>2D Room Generator</h1>
        <p className="subtitle">
          Click a piece to drop it in the room. Click a piece in the room to select it
          (drag corners to resize).
        </p>
      </div>

      <div className="catalog">
        {FURNITURE_CATALOG.map((item) => (
          <button
            key={item.type}
            className="catalog-item"
            title={`Add ${item.label}`}
            onClick={() => onAdd(item.type)}
          >
            <div className="catalog-icon">
              <FurnitureIcon type={item.type} width={56} height={56} />
            </div>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {selectedItem && (
        <div className="selected-panel">
          <div className="selected-title">
            Selected: <span>{CATALOG_BY_TYPE[selectedItem.type]?.label ?? selectedItem.type}</span>
          </div>
          <div className="selected-meta">
            {Math.round(selectedItem.width)} × {Math.round(selectedItem.height)} px · rot {selectedItem.rotation || 0}°
          </div>
          <div className="selected-actions">
            <button className="btn btn-sm" onClick={() => onRotate(selectedItem.id)} title="R">
              ↻ Rotate 90°
            </button>
            <button className="btn btn-sm" onClick={() => onBringToFront(selectedItem.id)} title="]">
              ⬆ Bring to Front
            </button>
            <button className="btn btn-sm" onClick={() => onSendToBack(selectedItem.id)} title="[">
              ⬇ Send to Back
            </button>
            <button className="btn btn-sm btn-danger" onClick={() => onRemove(selectedItem.id)} title="Delete">
              ✕ Delete
            </button>
          </div>
          <p className="kbd-hint">Shortcuts: R rotate · [ back · ] front · Del remove</p>
        </div>
      )}

      <div className="actions">
        <button className="btn btn-primary" onClick={onSave} disabled={savingState === "saving"}>
          {savingState === "saving" ? "Saving…" : "Save Layout"}
        </button>
        <button className="btn" onClick={onReload}>Reload Saved</button>
        <button className="btn btn-danger" onClick={onClear}>Clear Room</button>
      </div>

      {lastSavedAt && (
        <p className="status">Last saved: {new Date(lastSavedAt).toLocaleTimeString()}</p>
      )}
      {savingState === "error" && <p className="status error">Save failed — is the server running?</p>}
      {savingState === "ok" && <p className="status ok">Layout saved!</p>}
    </aside>
  );
}

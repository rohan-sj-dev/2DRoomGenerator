import React from "react";
import { Rnd } from "react-rnd";
import { CATALOG_BY_TYPE, FurnitureIcon } from "../data/furniture.jsx";

const HANDLE_CLASSES = {
  topLeft: "rnd-handle rnd-handle-corner rnd-handle-tl",
  topRight: "rnd-handle rnd-handle-corner rnd-handle-tr",
  bottomLeft: "rnd-handle rnd-handle-corner rnd-handle-bl",
  bottomRight: "rnd-handle rnd-handle-corner rnd-handle-br",
  top: "rnd-handle rnd-handle-edge rnd-handle-t",
  right: "rnd-handle rnd-handle-edge rnd-handle-r",
  bottom: "rnd-handle rnd-handle-edge rnd-handle-b",
  left: "rnd-handle rnd-handle-edge rnd-handle-l",
};

export default function FurnitureItem({
  item,
  bounds,
  onChange,
  onSelect,
  onDrag,
  onDragEnd,
  selected,
}) {
  const spec = CATALOG_BY_TYPE[item.type];
  const minWidth = spec?.minWidth ?? 30;
  const minHeight = spec?.minHeight ?? 30;
  const rot = item.rotation || 0;
  const swap = rot === 90 || rot === 270;
  // Inner SVG draws in its "natural" orientation (pre-rotation), then a CSS
  // rotate makes it fill the rotated bounding box.
  const innerW = swap ? item.height : item.width;
  const innerH = swap ? item.width : item.height;

  return (
    <Rnd
      size={{ width: item.width, height: item.height }}
      position={{ x: item.x, y: item.y }}
      bounds={bounds}
      minWidth={minWidth}
      minHeight={minHeight}
      resizeHandleClasses={HANDLE_CLASSES}
      onDragStart={() => onSelect(item.id)}
      onDrag={(_e, d) =>
        onDrag?.(item.id, {
          x: d.x,
          y: d.y,
          width: item.width,
          height: item.height,
        })
      }
      onDragStop={(_e, d) => {
        if (onDragEnd) {
          onDragEnd(item.id, {
            x: d.x,
            y: d.y,
            width: item.width,
            height: item.height,
          });
        } else {
          onChange(item.id, { x: d.x, y: d.y });
        }
      }}
      onResizeStart={() => onSelect(item.id)}
      onResizeStop={(_e, _dir, ref, _delta, position) => {
        onChange(item.id, {
          width: parseFloat(ref.style.width),
          height: parseFloat(ref.style.height),
          x: position.x,
          y: position.y,
        });
      }}
      style={{ zIndex: item.zIndex ?? 1 }}
      className={`furniture ${selected ? "selected" : ""}`}
    >
      <div
        className="furniture-inner"
        onMouseDown={() => onSelect(item.id)}
      >
        <div
          className="furniture-rotator"
          style={{
            width: `${innerW}px`,
            height: `${innerH}px`,
            transform: `translate(-50%, -50%) rotate(${rot}deg)`,
          }}
        >
          <FurnitureIcon type={item.type} width={innerW} height={innerH} />
        </div>
      </div>
    </Rnd>
  );
}

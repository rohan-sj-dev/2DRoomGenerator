# 2D Room Generator

A prototype interior-design web application. Pick furniture from the sidebar, drop it into a virtual room, drag it around, resize it, then save the layout to disk through a Node.js backend. Reload the saved layout at any time to keep editing.

---

## Quick Start (single-line setup, single-line run)

> Requirements: Node.js 18+ and npm.

```bash
git clone <this-repo-url> && cd Task && npm run setup
```

```bash
npm start
```

Then open **http://localhost:5173** in your browser. The backend runs on **http://localhost:4000**.

`npm run setup` installs dependencies for the root, server, and client in one step.
`npm start` boots the Express API and the Vite React dev server together via `concurrently`.

---

## Features

- **Responsive React + Vite frontend** with a clearly defined "Empty Room" workspace.
- **Sidebar catalog** of furniture assets: sofa, armchair, coffee table, dining table, bed, lamp, plant, TV, rug, bookshelf. Click any item to drop it into the room.
- **Drag-anywhere** inside the room (constrained to the room bounds — items can't escape).
- **Resize via corner / edge handles** (`react-rnd`). Each item has a sensible minimum size so it can't be shrunk into oblivion.
- **The room stays fixed** while objects are resized — resizing changes only the item's `width`/`height`, never the canvas.
- **Spatial state is tracked continuously**: every item carries `{id, type, x, y, width, height, zIndex, rotation}`. The status bar under the room shows live coordinates for the selected piece.
- **Z-ordering**: clicking an item raises it to the top.
- **Delete**: select an item and press `Delete`/`Backspace`, or click the red `×` badge.
- **Save Layout**: POSTs the full payload to the backend, which writes `server/layouts/layout.json` plus a timestamped history snapshot.
- **Reload Saved**: pulls the most recently persisted layout back. The app also auto-loads on first mount so you can pick up where you left off.

---

## Project layout

```
Task/
├── package.json            # root scripts: setup, start (concurrently)
├── server/
│   ├── index.js            # Express API (save / load / health)
│   ├── package.json
│   └── layouts/            # written layouts live here
└── client/
    ├── index.html
    ├── vite.config.js      # /api → http://localhost:4000 proxy
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── styles.css
        ├── components/
        │   ├── Sidebar.jsx
        │   ├── Room.jsx
        │   └── FurnitureItem.jsx
        └── data/
            └── furniture.jsx
```

---

## Backend API

| Method | Path           | Purpose                                              |
| ------ | -------------- | ---------------------------------------------------- |
| GET    | `/api/health`  | Liveness check.                                      |
| POST   | `/api/layout`  | Persist a layout payload to disk.                    |
| GET    | `/api/layout`  | Return the most recently saved layout.               |

### Save payload schema

```json
{
  "version": 1,
  "room": { "width": 1056, "height": 792 },
  "items": [
    {
      "id": "it_lz9p_a4f2k",
      "type": "sofa",
      "x": 220,
      "y": 410,
      "width": 180,
      "height": 80,
      "rotation": 0,
      "zIndex": 3
    }
  ]
}
```

The server attaches a `savedAt` ISO timestamp, writes `server/layouts/layout.json` (the canonical "latest"), **and** drops a timestamped copy (e.g. `layout-2026-05-18T19-30-04-117Z.json`) so prior sessions can be recovered.

### Reload mechanism

The saved metadata contains everything needed to fully rehydrate the editing session: the catalog `type` reproduces the visual asset, the `id` lets future edits target the same item, `x/y/width/height` reproduce the geometry, and `zIndex` re-establishes stacking order. On mount the client calls `GET /api/layout` automatically; the **Reload Saved** button is a manual trigger for the same flow.

---

## Screenshots

> Add your captured screenshots here after running the app. Suggested shots:

| Empty room with sidebar              | After placing & resizing furniture     | Saved-toast feedback                 |
| ------------------------------------ | -------------------------------------- | ------------------------------------ |
| `docs/screenshot-empty.png`          | `docs/screenshot-furnished.png`        | `docs/screenshot-saved.png`          |

```
![Empty room](docs/screenshot-empty.png)
![Furnished](docs/screenshot-furnished.png)
![Saved toast](docs/screenshot-saved.png)
```

---

## Edge cases — and how they are handled

| #  | Edge case                                                                 | Current handling                                                                                                                                  |
| -- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | User drags a piece past the room edge.                                    | `react-rnd` is given `bounds="parent"`, so items physically cannot leave the room.                                                                |
| 2  | User shrinks a piece below a usable size.                                 | Each catalog entry declares `minWidth`/`minHeight`; resizing stops at the floor.                                                                  |
| 3  | Resizing accidentally changes the room.                                   | The room is a fixed `aspect-ratio: 4/3` parent; only `furniture` children resize. CSS contains the visual; logic only mutates the item's record.  |
| 4  | Backend is down when **Save** is clicked.                                 | Status pill flips to "Save failed — is the server running?" and reverts after 3s. No data is lost client-side.                                    |
| 5  | Backend is down on initial mount.                                         | Auto-load fetch fails silently; the user gets an empty room and can keep working. Manual **Reload Saved** shows an explicit alert.                |
| 6  | User opens a saved layout on a smaller screen than the one it was saved on. | The saved `room.width/height` is stored alongside items so future versions can rescale positions. *Current handling:* items keep absolute pixel coords; if the room is smaller, `bounds="parent"` clamps them back inside on first drag. *Planned:* scale positions by `(newRoomW/savedRoomW)` on load. |
| 7  | Two items perfectly overlap.                                              | Clicking any item raises it via an incrementing `zIndex`, so the active item is always on top.                                                    |
| 8  | Item is selected but user starts typing in an input.                      | The `Delete` keyboard shortcut explicitly bails out when the focused element is an `INPUT` or `TEXTAREA`.                                         |
| 9  | The Unsplash room image URL is blocked / offline.                         | The room has a CSS fallback color (`#d8c5a8`) plus a `.room-fallback` diagonal pattern, so the workspace is still visible and usable.             |
| 10 | A corrupt `layout.json` on disk.                                          | The `GET /api/layout` handler wraps `JSON.parse` in try/catch and returns HTTP 500 with `{error}`; the client surfaces this as a reload error.    |
| 11 | Catalog `type` in a saved file is unknown to the current client build.    | `FurnitureIcon` returns a neutral grey square for unknown types instead of crashing the render.                                                   |
| 12 | Many save clicks in rapid succession.                                     | The Save button is disabled while a save is in flight (`savingState === "saving"`).                                                               |
| 13 | Browser refresh mid-edit (no save).                                       | In-flight unsaved state is lost. *Planned:* persist to `localStorage` on every change as a recovery cache.                                        |

### Planned future hardening
- Rotation handles (`rotation` is already in the schema but no UI control yet).
- Snap-to-grid / snap-to-edge alignment guides.
- Multiple named layouts (`POST /api/layout/:name`) with a layout picker.
- Undo / redo stack.
- Drag-and-drop *from* sidebar (currently click-to-add); HTML5 DnD would feel more natural.
- Touch-friendly resize handles for tablets.

---

## Running remotely

The app is portable to any host that exposes ports 5173 (frontend) and 4000 (backend). To run on a remote box:

```bash
ssh user@host
git clone <repo-url> && cd Task && npm run setup && npm start
```

Vite is started with `--host`, so it binds to `0.0.0.0` — point your browser at `http://<host>:5173`. The Vite proxy forwards `/api/*` to the local backend on 4000 so you don't need to expose the API publicly.

---

## License

MIT — prototype / demo code.

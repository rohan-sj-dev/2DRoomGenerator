// Furniture catalog. Each entry defines the asset's defaults and how to render its icon.
// Icons are inline SVGs so the app stays portable and works offline.
//
// IMPORTANT: every SVG below is drawn so its visual fills the full 0..100 viewBox
// in both axes (where the shape is naturally rectangular). The Rnd bounding box
// then matches the visible furniture — no whitespace mismatch.
// Symmetry: visuals are mirrored left-to-right where the real-life object is.

export const FURNITURE_CATALOG = [
  { type: "sofa", label: "Sofa", defaultWidth: 180, defaultHeight: 80, minWidth: 80, minHeight: 40 },
  { type: "armchair", label: "Armchair", defaultWidth: 90, defaultHeight: 90, minWidth: 50, minHeight: 50 },
  { type: "table", label: "Coffee Table", defaultWidth: 140, defaultHeight: 80, minWidth: 60, minHeight: 40 },
  { type: "diningTable", label: "Dining Table", defaultWidth: 180, defaultHeight: 110, minWidth: 90, minHeight: 60 },
  { type: "bed", label: "Bed", defaultWidth: 200, defaultHeight: 140, minWidth: 100, minHeight: 80 },
  { type: "lamp", label: "Lamp", defaultWidth: 50, defaultHeight: 50, minWidth: 30, minHeight: 30 },
  { type: "plant", label: "Plant", defaultWidth: 60, defaultHeight: 60, minWidth: 30, minHeight: 30 },
  { type: "tv", label: "TV", defaultWidth: 160, defaultHeight: 40, minWidth: 80, minHeight: 25 },
  { type: "rug", label: "Rug", defaultWidth: 220, defaultHeight: 140, minWidth: 100, minHeight: 80 },
  { type: "bookshelf", label: "Bookshelf", defaultWidth: 120, defaultHeight: 50, minWidth: 60, minHeight: 30 },
];

export const CATALOG_BY_TYPE = FURNITURE_CATALOG.reduce((acc, item) => {
  acc[item.type] = item;
  return acc;
}, {});

const BOOK_COLORS = ["#d9534f", "#5bc0de", "#5cb85c", "#f0ad4e", "#9b59b6", "#3498db"];

function Bookshelf(props) {
  const shelfYs = [5, 30, 55, 80];
  const shelfH = 20;
  const lastShelfH = 17;
  const books = [];
  shelfYs.forEach((shelfY, si) => {
    for (let i = 0; i < 10; i++) {
      const x = 6 + i * 9;
      books.push(
        <rect
          key={`${si}-${i}`}
          x={x}
          y={shelfY + 2}
          width={6}
          height={16}
          fill={BOOK_COLORS[(si * 3 + i) % BOOK_COLORS.length]}
        />
      );
    }
  });
  return (
    <svg {...props}>
      <rect x="0" y="0" width="100" height="100" fill="#7a5230" />
      <rect x="3" y={shelfYs[0]} width="94" height={shelfH} fill="#a87344" />
      <rect x="3" y={shelfYs[1]} width="94" height={shelfH} fill="#a87344" />
      <rect x="3" y={shelfYs[2]} width="94" height={shelfH} fill="#a87344" />
      <rect x="3" y={shelfYs[3]} width="94" height={lastShelfH} fill="#a87344" />
      {books}
    </svg>
  );
}

export function FurnitureIcon({ type, width = 80, height = 80 }) {
  const props = { width, height, viewBox: "0 0 100 100", preserveAspectRatio: "none" };

  switch (type) {
    case "sofa":
      return (
        <svg {...props}>
          {/* backrest / outer frame */}
          <rect x="0" y="10" width="100" height="35" rx="6" fill="#6f5a3f" />
          {/* left arm */}
          <rect x="0" y="20" width="18" height="80" rx="6" fill="#5c4b35" />
          {/* right arm (mirror) */}
          <rect x="82" y="20" width="18" height="80" rx="6" fill="#5c4b35" />
          {/* seat base */}
          <rect x="3" y="40" width="94" height="58" rx="6" fill="#8b6f4e" />
          {/* three seat cushions, symmetric about x=50 */}
          <rect x="20" y="48" width="18" height="44" rx="3" fill="#c8a980" />
          <rect x="41" y="48" width="18" height="44" rx="3" fill="#c8a980" />
          <rect x="62" y="48" width="18" height="44" rx="3" fill="#c8a980" />
        </svg>
      );
    case "armchair":
      return (
        <svg {...props}>
          {/* outer frame (backrest+arms) */}
          <rect x="0" y="0" width="100" height="100" rx="10" fill="#3a5572" />
          {/* inner body */}
          <rect x="12" y="10" width="76" height="86" rx="8" fill="#4a6c8a" />
          {/* seat cushion */}
          <rect x="22" y="28" width="56" height="58" rx="6" fill="#7da3c2" />
        </svg>
      );
    case "table":
      return (
        <svg {...props}>
          <rect x="0" y="0" width="100" height="100" rx="8" fill="#a07655" />
          <rect x="6" y="6" width="88" height="88" rx="6" fill="#c89674" />
        </svg>
      );
    case "diningTable":
      return (
        <svg {...props}>
          <ellipse cx="50" cy="50" rx="49" ry="49" fill="#8b5a2b" />
          <ellipse cx="50" cy="50" rx="44" ry="44" fill="#b07d4b" />
        </svg>
      );
    case "bed":
      return (
        <svg {...props}>
          <rect x="0" y="0" width="100" height="100" rx="6" fill="#cfd8e3" />
          {/* headboard */}
          <rect x="3" y="3" width="94" height="22" rx="3" fill="#f0f4f8" />
          {/* mattress */}
          <rect x="3" y="28" width="94" height="69" rx="3" fill="#9bb3c9" />
          {/* two pillows, symmetric */}
          <rect x="10" y="6" width="36" height="16" rx="3" fill="#fff" />
          <rect x="54" y="6" width="36" height="16" rx="3" fill="#fff" />
        </svg>
      );
    case "lamp":
      return (
        <svg {...props}>
          {/* shade — symmetric triangle filling top half */}
          <polygon points="50,2 6,55 94,55" fill="#f6c453" />
          {/* pole, centered */}
          <rect x="46" y="55" width="8" height="32" fill="#555" />
          {/* base, centered */}
          <ellipse cx="50" cy="93" rx="42" ry="7" fill="#333" />
        </svg>
      );
    case "plant":
      return (
        <svg {...props}>
          {/* foliage clusters, symmetric about cx=50 */}
          <ellipse cx="50" cy="35" rx="44" ry="32" fill="#3f8a4d" />
          <ellipse cx="28" cy="28" rx="16" ry="14" fill="#4fa05c" />
          <ellipse cx="72" cy="28" rx="16" ry="14" fill="#4fa05c" />
          <ellipse cx="50" cy="20" rx="20" ry="14" fill="#5ab268" />
          {/* pot */}
          <polygon points="20,65 80,65 73,98 27,98" fill="#a05a2c" />
          <ellipse cx="50" cy="65" rx="30" ry="4" fill="#7a4520" />
        </svg>
      );
    case "tv":
      return (
        <svg {...props}>
          {/* bezel */}
          <rect x="0" y="2" width="100" height="80" rx="4" fill="#222" />
          {/* screen */}
          <rect x="4" y="7" width="92" height="70" rx="2" fill="#3a6fa1" />
          {/* stand, centered */}
          <rect x="35" y="82" width="30" height="10" fill="#333" />
          <rect x="20" y="92" width="60" height="6" rx="2" fill="#333" />
        </svg>
      );
    case "rug":
      return (
        <svg {...props}>
          <rect x="0" y="0" width="100" height="100" rx="6" fill="#c44d4d" />
          <rect x="6" y="6" width="88" height="88" rx="4" fill="none" stroke="#f1d8a3" strokeWidth="3" />
          <rect x="16" y="16" width="68" height="68" rx="3" fill="none" stroke="#f1d8a3" strokeWidth="2" />
          <rect x="40" y="40" width="20" height="20" rx="2" fill="#f1d8a3" opacity="0.5" />
        </svg>
      );
    case "bookshelf":
      return <Bookshelf {...props} />;
    default:
      return (
        <svg {...props}>
          <rect x="0" y="0" width="100" height="100" fill="#888" />
        </svg>
      );
  }
}

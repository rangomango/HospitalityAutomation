import { useStore } from '../store/useStore';
import { SUPPLY_TYPES } from '../data/constants';
import { SupplyIcon, SUPPLY_ABBR } from './SupplyIcon';

// SVG layout constants
const ROOM_W = 26;
const ROOM_H = 38;
const GAP = 2;
const LEFT_PAD = 38;
const CLOSET_W = 42;
const SVG_W = LEFT_PAD + 10 * (ROOM_W + GAP) + CLOSET_W + 8;
const TOP_Y = 28;
const CORRIDOR_Y = TOP_Y + ROOM_H + 4;
const CORRIDOR_H = 22;
const BOT_Y = CORRIDOR_Y + CORRIDOR_H + 4;
const SVG_H = BOT_Y + ROOM_H + 18;

// Lance palette values used directly in SVG (Tailwind can't reach SVG attributes)
const C = {
  bg:        '#08090a',
  surface:   '#0e1c1f',
  elevated:  '#152428',
  border:    'rgba(43,202,149,0.2)',
  accent:    '#2BCA95',
  accentLt:  '#7ff2c6',
  gold:      '#C9902F',
  goldLt:    '#e8b254',
  teal:      '#315F75',
  text:      '#d8ebe5',
  textMd:    '#8ab4a8',
  textSub:   '#4a7068',
  event:     '#2e1e06',   // gold-dim for event rooms
  eventBdr:  '#C9902F',
};

const DOT_COLORS = {
  iron:          '#6366f1',
  iron_board:    '#C9902F',
  steamer:       '#2BCA95',
  toothbrush:    '#10b981',
  razor:         '#ef4444',
  shaving_cream: '#8b5cf6',
};

function SupplyDot({ typeId, x, y }) {
  const abbr = SUPPLY_ABBR[typeId] || '??';
  return (
    <g>
      <circle cx={x} cy={y} r={7} fill={DOT_COLORS[typeId] || C.textSub} opacity={0.9} />
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="5.5" fontWeight="700" fill="white">
        {abbr}
      </text>
    </g>
  );
}

function Room({ roomNum, floor, x, y, isEvent, suppliesHere }) {
  const hasSupplies = suppliesHere.length > 0;
  const bg     = isEvent ? C.event   : C.elevated;
  const border = isEvent ? C.eventBdr : C.border;

  return (
    <g>
      <rect x={x} y={y} width={ROOM_W} height={ROOM_H} rx={3} fill={bg} stroke={border} strokeWidth={1} />
      <text x={x + ROOM_W / 2} y={y + 12} textAnchor="middle" fontSize="7" fill={isEvent ? C.goldLt : C.textSub} fontWeight="500">
        {`${floor}${String(roomNum).padStart(2, '0')}`}
      </text>
      {hasSupplies && (
        <circle cx={x + ROOM_W - 5} cy={y + 5} r={4} fill={C.accent} />
      )}
      <title>{`Room ${floor}${String(roomNum).padStart(2, '0')}${isEvent ? ' (Event Guest)' : ''}${hasSupplies ? ' • Has supplies' : ''}`}</title>
    </g>
  );
}

function Closet({ x, y, h, units }) {
  const countByType = {};
  units.forEach(u => { countByType[u.typeId] = (countByType[u.typeId] || 0) + 1; });
  const types = Object.entries(countByType);

  return (
    <g>
      <rect x={x} y={y} width={CLOSET_W} height={h} rx={4} fill={C.surface} stroke={C.accent} strokeWidth={1.5} />
      <text x={x + CLOSET_W / 2} y={y + 10} textAnchor="middle" fontSize="7" fill={C.accentLt} fontWeight="700">
        CLOSET
      </text>
      {types.slice(0, 6).map(([typeId, count], i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        return (
          <g key={typeId}>
            <SupplyDot typeId={typeId} x={x + 10 + col * 20} y={y + 22 + row * 16} />
            <text x={x + 10 + col * 20 + 8} y={y + 22 + row * 16 + 1} fontSize="6" fill={C.textMd} dominantBaseline="middle">
              ×{count}
            </text>
          </g>
        );
      })}
      {!types.length && (
        <text x={x + CLOSET_W / 2} y={y + h / 2 + 4} textAnchor="middle" fontSize="7" fill={C.textSub}>
          empty
        </text>
      )}
    </g>
  );
}

export default function FloorMap() {
  const { currentMapFloor, events, supplyUnits, setMapFloor } = useStore();
  const floor = currentMapFloor;

  const eventRoomIds = new Set(events.flatMap(e => e.rooms || []));
  const floorUnits = supplyUnits.filter(u => u.floor === floor);
  const closetUnits = floorUnits.filter(u => u.location === 'closet' && u.status === 'available');
  const unitsInRoom = (roomId) => floorUnits.filter(u => u.location === String(roomId) && u.status === 'checked_out');

  const closetX = LEFT_PAD + 10 * (ROOM_W + GAP) + 4;
  const closetY = TOP_Y;
  const closetH = BOT_Y + ROOM_H - TOP_Y;

  return (
    <div>
      {/* Floor selector — 3D button treatment */}
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map(f => (
          <button
            key={f}
            onClick={() => setMapFloor(f)}
            className="flex-1 py-1.5 text-sm font-bold rounded-lg transition-all"
            style={f === floor ? {
              color: '#2BCA95',
              background: 'rgba(43,202,149,0.07)',
              boxShadow: 'inset 0 1px 0 rgba(43,202,149,0.15)',
            } : {
              color: '#4a7068',
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(43,202,149,0.1)',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-2 text-xs text-lance-text-sub flex-wrap">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded inline-block" style={{ background: C.event, border: `1px solid ${C.eventBdr}` }} />
          Event room
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded inline-block" style={{ background: C.elevated, border: `1px solid ${C.border}` }} />
          Standard
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: C.accent }} />
          Has supplies
        </span>
      </div>

      {/* SVG floor plan */}
      <div className="rounded-xl overflow-x-auto p-2" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" style={{ maxHeight: 220 }}>
          {/* Background */}
          <rect width={SVG_W} height={SVG_H} fill={C.bg} />

          {/* Floor label */}
          <text x={SVG_W / 2} y={14} textAnchor="middle" fontSize="9" fontWeight="700" fill={C.accentLt} letterSpacing={1}>
            FLOOR {floor} — HOTEL
          </text>

          {/* Stairwell/elevator */}
          <rect x={0} y={TOP_Y} width={LEFT_PAD - 4} height={closetH} rx={4} fill={C.surface} stroke={C.border} strokeWidth={1} />
          <text x={(LEFT_PAD - 4) / 2} y={TOP_Y + closetH / 2} textAnchor="middle" dominantBaseline="middle" fontSize="6" fontWeight="700" fill={C.textMd} letterSpacing={0.5}>ELEV</text>

          {/* Top row: rooms 1–10 */}
          {Array.from({ length: 10 }, (_, i) => {
            const roomNum = i + 1;
            const roomId = floor * 100 + roomNum;
            return (
              <Room
                key={roomNum}
                roomNum={roomNum}
                floor={floor}
                x={LEFT_PAD + i * (ROOM_W + GAP)}
                y={TOP_Y}
                isEvent={eventRoomIds.has(roomId)}
                suppliesHere={unitsInRoom(roomId)}
              />
            );
          })}

          {/* Corridor */}
          <rect x={LEFT_PAD} y={CORRIDOR_Y} width={10 * (ROOM_W + GAP) - GAP} height={CORRIDOR_H} rx={2}
            fill={C.surface} stroke={C.teal} strokeWidth={0.5} strokeDasharray="4 2" />
          <text x={LEFT_PAD + (10 * (ROOM_W + GAP)) / 2 - GAP} y={CORRIDOR_Y + CORRIDOR_H / 2 + 3}
            textAnchor="middle" fontSize="7" fill={C.teal} letterSpacing={2}>
            CORRIDOR
          </text>

          {/* Bottom row: rooms 11–20 */}
          {Array.from({ length: 10 }, (_, i) => {
            const roomNum = i + 11;
            const roomId = floor * 100 + roomNum;
            return (
              <Room
                key={roomNum}
                roomNum={roomNum}
                floor={floor}
                x={LEFT_PAD + i * (ROOM_W + GAP)}
                y={BOT_Y}
                isEvent={eventRoomIds.has(roomId)}
                suppliesHere={unitsInRoom(roomId)}
              />
            );
          })}

          {/* Closet */}
          <Closet x={closetX} y={closetY} h={closetH} units={closetUnits} />
        </svg>
      </div>

      {/* Closet inventory summary */}
      <div className="mt-3">
        <p className="text-xs font-semibold text-lance-text-sub mb-2">Floor {floor} Closet Inventory</p>
        {SUPPLY_TYPES.map(type => {
          const count   = closetUnits.filter(u => u.typeId === type.id).length;
          const inRooms = floorUnits.filter(u => u.location !== 'closet' && u.typeId === type.id).length;
          const incoming = floorUnits.filter(u => u.status === 'in_transit' && u.typeId === type.id).length;
          return (
            <div key={type.id} className="flex items-center justify-between py-1.5 border-b border-lance-border-sub last:border-0">
              <span className="text-sm text-lance-text flex items-center gap-1.5">
                <SupplyIcon typeId={type.id} size={15} className="text-lance-accent" /> {type.name}
              </span>
              <div className="flex gap-3 text-xs">
                <span className="text-lance-accent font-semibold">{count} in closet</span>
                {incoming > 0 && <span className="text-lance-gold-lt">↓ {incoming} incoming</span>}
                {inRooms > 0 && <span className="text-blue-400">{inRooms} in rooms</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

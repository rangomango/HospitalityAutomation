import { useStore } from '../store/useStore';
import { SUPPLY_TYPES, SUPPLY_TYPE_MAP } from '../data/constants';

const ROOM_W = 26;
const ROOM_H = 38;
const GAP = 2;
const LEFT_PAD = 38;  // stairwell width
const CLOSET_W = 42;
const SVG_W = LEFT_PAD + 10 * (ROOM_W + GAP) + CLOSET_W + 8;
const TOP_Y = 30;
const CORRIDOR_Y = TOP_Y + ROOM_H + 4;
const CORRIDOR_H = 22;
const BOT_Y = CORRIDOR_Y + CORRIDOR_H + 4;
const SVG_H = BOT_Y + ROOM_H + 20;

function IronIcon({ x, y, size = 14 }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <polygon points={`0,${size} ${size * 0.7},${size} ${size},0 0,0`} fill="#6366f1" rx="2" />
      <line x1={size * 0.15} y1={size * 0.5} x2={size * 0.85} y2={size * 0.5} stroke="white" strokeWidth="1.5" />
    </g>
  );
}

function BoardIcon({ x, y, size = 14 }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="0" y={size * 0.3} width={size} height={size * 0.2} rx="2" fill="#f59e0b" />
      <line x1={size * 0.25} y1={size * 0.5} x2={size * 0.1} y2={size} stroke="#f59e0b" strokeWidth="1.5" />
      <line x1={size * 0.75} y1={size * 0.5} x2={size * 0.9} y2={size} stroke="#f59e0b" strokeWidth="1.5" />
    </g>
  );
}

function SteamerIcon({ x, y, size = 14 }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={size * 0.1} y={size * 0.4} width={size * 0.8} height={size * 0.6} rx="3" fill="#06b6d4" />
      <path d={`M${size * 0.3},${size * 0.35} Q${size * 0.35},0 ${size * 0.5},${size * 0.1} Q${size * 0.65},0 ${size * 0.7},${size * 0.35}`} fill="none" stroke="#06b6d4" strokeWidth="1.2" />
    </g>
  );
}

function SupplyDot({ typeId, x, y }) {
  const colors = {
    iron: '#6366f1', iron_board: '#f59e0b', steamer: '#06b6d4',
    toothbrush: '#10b981', razor: '#ef4444', shaving_cream: '#8b5cf6',
  };
  const emoji = SUPPLY_TYPE_MAP[typeId]?.emoji || '📦';
  return (
    <g>
      <circle cx={x} cy={y} r={7} fill={colors[typeId] || '#94a3b8'} opacity={0.9} />
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="white">
        {emoji}
      </text>
    </g>
  );
}

function Room({ roomNum, floor, x, y, isEvent, suppliesHere }) {
  const hasSupplies = suppliesHere.length > 0;
  const bg = isEvent ? '#fef3c7' : '#f8fafc';
  const border = isEvent ? '#f59e0b' : '#cbd5e1';

  return (
    <g>
      <rect x={x} y={y} width={ROOM_W} height={ROOM_H} rx={3} fill={bg} stroke={border} strokeWidth={1} />
      <text x={x + ROOM_W / 2} y={y + 12} textAnchor="middle" fontSize="7" fill="#475569" fontWeight="500">
        {`${floor}${String(roomNum).padStart(2, '0')}`}
      </text>
      {hasSupplies && (
        <circle cx={x + ROOM_W - 5} cy={y + 5} r={4} fill="#22c55e" />
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
      <rect x={x} y={y} width={CLOSET_W} height={h} rx={4} fill="#e0f2fe" stroke="#0284c7" strokeWidth={1.5} />
      <text x={x + CLOSET_W / 2} y={y + 10} textAnchor="middle" fontSize="7" fill="#0369a1" fontWeight="700">
        CLOSET
      </text>
      {types.slice(0, 6).map(([typeId, count], i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        return (
          <g key={typeId}>
            <SupplyDot typeId={typeId} x={x + 10 + col * 20} y={y + 22 + row * 16} />
            <text x={x + 10 + col * 20 + 8} y={y + 22 + row * 16 + 1} fontSize="6" fill="#334155" dominantBaseline="middle">
              ×{count}
            </text>
          </g>
        );
      })}
      {!types.length && (
        <text x={x + CLOSET_W / 2} y={y + h / 2 + 4} textAnchor="middle" fontSize="7" fill="#94a3b8">
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
      {/* Floor selector */}
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map(f => (
          <button
            key={f}
            onClick={() => setMapFloor(f)}
            className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
              f === floor ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-2 text-xs text-slate-500 flex-wrap">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-amber-100 border border-amber-400 inline-block" />
          Event guest room
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300 inline-block" />
          Standard room
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
          Has supplies
        </span>
      </div>

      {/* SVG Floor Plan */}
      <div className="overflow-x-auto rounded-xl bg-white border border-slate-200 p-2">
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" style={{ maxHeight: 220 }}>
          {/* Floor label */}
          <text x={SVG_W / 2} y={14} textAnchor="middle" fontSize="9" fontWeight="700" fill="#334155">
            FLOOR {floor} — HOTEL PREMIER
          </text>

          {/* Stairwell/elevator */}
          <rect x={0} y={TOP_Y} width={LEFT_PAD - 4} height={closetH} rx={4} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={1} />
          <text x={(LEFT_PAD - 4) / 2} y={TOP_Y + closetH / 2 - 4} textAnchor="middle" fontSize="7" fill="#64748b" fontWeight="600">🛗</text>
          <text x={(LEFT_PAD - 4) / 2} y={TOP_Y + closetH / 2 + 6} textAnchor="middle" fontSize="6" fill="#94a3b8">ELEV</text>

          {/* Top row rooms 1–10 */}
          {Array.from({ length: 10 }, (_, i) => {
            const roomNum = i + 1;
            const roomId = floor * 100 + roomNum;
            const x = LEFT_PAD + i * (ROOM_W + GAP);
            return (
              <Room
                key={roomNum}
                roomNum={roomNum}
                floor={floor}
                x={x}
                y={TOP_Y}
                isEvent={eventRoomIds.has(roomId)}
                suppliesHere={unitsInRoom(roomId)}
              />
            );
          })}

          {/* Corridor */}
          <rect x={LEFT_PAD} y={CORRIDOR_Y} width={10 * (ROOM_W + GAP) - GAP} height={CORRIDOR_H} rx={2} fill="#f0f9ff" stroke="#bae6fd" strokeWidth={1} strokeDasharray="4 2" />
          <text x={LEFT_PAD + (10 * (ROOM_W + GAP)) / 2 - GAP} y={CORRIDOR_Y + CORRIDOR_H / 2 + 3} textAnchor="middle" fontSize="7" fill="#7dd3fc" letterSpacing={2}>
            CORRIDOR
          </text>

          {/* Bottom row rooms 11–20 */}
          {Array.from({ length: 10 }, (_, i) => {
            const roomNum = i + 11;
            const roomId = floor * 100 + roomNum;
            const x = LEFT_PAD + i * (ROOM_W + GAP);
            return (
              <Room
                key={roomNum}
                roomNum={roomNum}
                floor={floor}
                x={x}
                y={BOT_Y}
                isEvent={eventRoomIds.has(roomId)}
                suppliesHere={unitsInRoom(roomId)}
              />
            );
          })}

          {/* Storage Closet */}
          <Closet x={closetX} y={closetY} h={closetH} units={closetUnits} />
        </svg>
      </div>

      {/* Supply summary for this floor */}
      <div className="mt-3">
        <p className="text-xs font-semibold text-slate-500 mb-2">Floor {floor} Closet Inventory</p>
        {SUPPLY_TYPES.map(type => {
          const count = closetUnits.filter(u => u.typeId === type.id).length;
          const inRooms = floorUnits.filter(u => u.location !== 'closet' && u.typeId === type.id).length;
          return (
            <div key={type.id} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
              <span className="text-sm text-slate-700 flex items-center gap-1.5">
                <span>{type.emoji}</span> {type.name}
              </span>
              <div className="flex gap-3 text-xs">
                <span className="text-brand-600 font-semibold">{count} in closet</span>
                {inRooms > 0 && <span className="text-amber-600">{inRooms} in rooms</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

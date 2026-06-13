import { useStore } from '../store/useStore';
import { SUPPLY_TYPES } from '../data/constants';
import { SupplyIcon } from './SupplyIcon';

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

const CLOSET_ICON = 12;  // icon size inside closet (SVG user units)
const ROOM_ICON   = 7;   // icon size inside room

// Renders an MD icon via foreignObject so it works inside SVG
function SvgIcon({ typeId, x, y, size, color }) {
  return (
    <foreignObject x={x} y={y} width={size} height={size} style={{ overflow: 'visible' }}>
      <div
        // eslint-disable-next-line react/no-unknown-property
        xmlns="http://www.w3.org/1999/xhtml"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, color }}
      >
        <SupplyIcon typeId={typeId} size={size} />
      </div>
    </foreignObject>
  );
}

function Room({ roomNum, floor, x, y, isEvent, suppliesHere, eventShortName }) {
  const bg     = isEvent ? C.event    : C.elevated;
  const border = isEvent ? C.eventBdr : C.border;
  // Unique types in this room, max 2 visible
  const types = [...new Set(suppliesHere.map(u => u.typeId))].slice(0, 2);
  const totalW = types.length * ROOM_ICON + Math.max(0, types.length - 1) * 2;
  const iconsX = x + (ROOM_W - totalW) / 2;

  return (
    <g>
      <rect x={x} y={y} width={ROOM_W} height={ROOM_H} rx={3} fill={bg} stroke={border} strokeWidth={1} />
      <text x={x + ROOM_W / 2} y={y + 10} textAnchor="middle" fontSize="6.5"
        fill={isEvent ? C.goldLt : C.textSub} fontWeight="500">
        {`${floor}${String(roomNum).padStart(2, '0')}`}
      </text>
      {isEvent && eventShortName && (
        <text x={x + ROOM_W / 2} y={y + 20} textAnchor="middle" fontSize="5"
          fill={C.gold} fontWeight="600">
          {eventShortName}
        </text>
      )}
      {types.map((typeId, i) => (
        <SvgIcon
          key={typeId}
          typeId={typeId}
          x={iconsX + i * (ROOM_ICON + 2)}
          y={y + ROOM_H - ROOM_ICON - 4}
          size={ROOM_ICON}
          color={C.accentLt}
        />
      ))}
      <title>{`Room ${floor}${String(roomNum).padStart(2, '0')}${isEvent ? ` (${eventShortName || 'Event'})` : ''}${types.length ? ' • Has supplies' : ''}`}</title>
    </g>
  );
}

function Closet({ x, y, h, units }) {
  const countByType = {};
  const pendingSet = new Set();
  units.forEach(u => {
    countByType[u.typeId] = (countByType[u.typeId] || 0) + 1;
    if (u.status === 'pending_transit') pendingSet.add(u.typeId);
  });
  const types = Object.entries(countByType);
  const COL_W = CLOSET_W / 2;

  return (
    <g>
      <rect x={x} y={y} width={CLOSET_W} height={h} rx={4} fill={C.surface} stroke={C.accent} strokeWidth={1.5} />
      <text x={x + CLOSET_W / 2} y={y + 11} textAnchor="middle" fontSize="7"
        fill={C.accentLt} fontWeight="700" letterSpacing={0.5}>
        CLOSET
      </text>
      {types.slice(0, 6).map(([typeId, count], i) => {
        const isPending = pendingSet.has(typeId);
        const iconColor = isPending ? C.goldLt : C.accent;
        const col     = i % 2;
        const row     = Math.floor(i / 2);
        const cx      = x + COL_W * col + COL_W / 2;
        const iconTop = y + 18 + row * 26;
        return (
          <g key={typeId}>
            <SvgIcon
              typeId={typeId}
              x={cx - CLOSET_ICON / 2}
              y={iconTop}
              size={CLOSET_ICON}
              color={iconColor}
            />
            <text x={cx} y={iconTop + CLOSET_ICON + 7} textAnchor="middle"
              fontSize="7" fontWeight="700" fill={isPending ? C.goldLt : C.text}>
              {count}
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
  const { currentMapFloor, events, supplyUnits, tasks, setMapFloor } = useStore();
  const getDeployPlan = useStore(s => s.getDeployPlan);
  const deployPlan = getDeployPlan();
  const floor = currentMapFloor;

  const eventRoomIds = new Set(events.flatMap(e => e.rooms || []));
  const roomToEventShort = {};
  events.forEach(e => (e.rooms || []).forEach(r => {
    roomToEventShort[r] = e.name.substring(0, 5);
  }));
  const floorUnits = supplyUnits.filter(u => u.floor === floor);
  // pending_transit units are still physically in the closet (task not yet accepted); in_transit units have been picked up
  const closetUnits = floorUnits.filter(u => u.location === 'closet' && (u.status === 'available' || u.status === 'pending_transit'));
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
                eventShortName={roomToEventShort[roomId]}
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
                eventShortName={roomToEventShort[roomId]}
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
        {(() => {
          // Count units incoming TO this floor from active forward_deploy tasks
          const incomingPending = {};
          const incomingTransit = {};
          tasks
            .filter(t => t.type === 'forward_deploy' && t.toFloor === floor && (t.status === 'pending' || t.status === 'accepted'))
            .forEach(t => {
              (t.supplyUnitIds || []).forEach(unitId => {
                const unit = supplyUnits.find(u => u.id === unitId);
                if (!unit) return;
                if (t.status === 'pending') {
                  incomingPending[unit.typeId] = (incomingPending[unit.typeId] || 0) + 1;
                } else {
                  incomingTransit[unit.typeId] = (incomingTransit[unit.typeId] || 0) + 1;
                }
              });
            });

          return SUPPLY_TYPES.map(type => {
            const count          = closetUnits.filter(u => u.typeId === type.id).length;
            const inRooms        = floorUnits.filter(u => u.location !== 'closet' && u.typeId === type.id).length;
            const pendingTransit = floorUnits.filter(u => u.status === 'pending_transit' && u.typeId === type.id).length;
            const inTransit      = floorUnits.filter(u => u.status === 'in_transit' && u.typeId === type.id).length;
            const incPending     = incomingPending[type.id] || 0;
            const incTransit     = incomingTransit[type.id] || 0;
            const totalPending = pendingTransit + incPending;
            const totalTransit = inTransit + incTransit;
            // Show "see status" only when deployment is already in motion AND plan still shows a shortage
            const seeStatus = (totalPending + totalTransit) > 0 && deployPlan.some(
              p => p.toFloor === floor && p.typeId === type.id && p.shortage > 0
            );
            return (
              <div key={type.id} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-lance-text flex items-center gap-1.5">
                  <SupplyIcon typeId={type.id} size={15} className="text-lance-accent" /> {type.name}
                </span>
                <div className="flex gap-3 text-xs flex-wrap justify-end">
                  <span className="text-lance-accent font-semibold">{count} in closet</span>
                  {totalPending > 0 && <span className="text-lance-text-sub">{totalPending} pending transit</span>}
                  {totalTransit > 0 && <span className="text-lance-gold-lt">{totalTransit} in transit</span>}
                  {seeStatus        && <span style={{ color: '#94a3b8' }}>see status</span>}
                  {inRooms > 0      && <span className="text-blue-400">{inRooms} in rooms</span>}
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}

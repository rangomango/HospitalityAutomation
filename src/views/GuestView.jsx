import { useState } from 'react';
import { Package, CheckCircle, Clock, ArrowRight, X, Bell } from 'lucide-react';
import { useStore, selectors } from '../store/useStore';
import { SUPPLY_TYPES, SUPPLY_TYPE_MAP } from '../data/constants';
import { formatDistanceToNow } from 'date-fns';

function RoomEntry() {
  const setGuestRoom = useStore(s => s.setGuestRoom);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = parseInt(input);
    if (isNaN(num) || num < 101 || num > 520) {
      setError('Enter a valid room number (101–520)');
      return;
    }
    const floor = Math.floor(num / 100);
    const room = num % 100;
    if (floor < 1 || floor > 5 || room < 1 || room > 20) {
      setError('Room must be 101–120, 201–220, … 501–520');
      return;
    }
    setGuestRoom(num);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="text-5xl mb-4">🏨</div>
      <h2 className="text-xl font-bold text-slate-800 mb-1">Welcome</h2>
      <p className="text-sm text-slate-500 mb-6">Enter your room number to see available supplies and request items.</p>
      <form onSubmit={handleSubmit} className="w-full max-w-xs">
        <input
          type="number"
          placeholder="Room number (e.g. 301)"
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-center text-lg font-bold focus:outline-none focus:border-brand-400 mb-3"
          value={input}
          onChange={e => { setInput(e.target.value); setError(''); }}
        />
        {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
        <button type="submit" className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
          Continue <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}

function SupplyCard({ type, floor, guestRoom }) {
  const supplyUnits = useStore(s => s.supplyUnits);
  const requests = useStore(s => s.requests);
  const createRequest = useStore(s => s.createRequest);
  const triggerReminder = useStore(s => s.triggerReturnReminder);

  const availableCount = supplyUnits.filter(
    u => u.typeId === type.id && u.floor === floor && u.location === 'closet' && u.status === 'available'
  ).length;

  const myRequest = requests.find(
    r => r.guestRoom === guestRoom && r.typeId === type.id && r.status !== 'returned'
  );

  if (availableCount === 0 && !myRequest) return null;

  const handleRequest = () => {
    createRequest(guestRoom, floor, type.id);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 mb-2">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{type.emoji}</span>
        <div className="flex-1">
          <p className="font-semibold text-slate-800 text-sm">{type.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {type.category === 'room_equipment' ? 'Room Equipment' : 'Personal Care'}
          </p>
        </div>
        <div className="text-right">
          {myRequest ? (
            <div>
              <StatusBadge status={myRequest.status} />
            </div>
          ) : (
            <div>
              <p className="text-[10px] text-green-600 font-semibold mb-1">{availableCount} on your floor</p>
              <button
                onClick={handleRequest}
                className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg font-semibold"
              >
                Request
              </button>
            </div>
          )}
        </div>
      </div>

      {myRequest && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Requested {formatDistanceToNow(myRequest.requestedAt, { addSuffix: true })}
            {myRequest.deliveredAt && ` · Delivered ${formatDistanceToNow(myRequest.deliveredAt, { addSuffix: true })}`}
          </p>
          {myRequest.status === 'delivered' && myRequest.reminderSent && (
            <div className="mt-1.5 bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700">
              <Bell size={11} className="inline mr-1" />
              Please place the item outside your door for pickup when done, or let us know if you need more time.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending:   { label: 'On the way',  cls: 'bg-amber-100 text-amber-700',   icon: <Clock size={11} /> },
    assigned:  { label: 'Assigned',    cls: 'bg-brand-100 text-brand-700',   icon: <Clock size={11} /> },
    delivered: { label: 'Delivered',   cls: 'bg-green-100 text-green-700',   icon: <CheckCircle size={11} /> },
    returned:  { label: 'Returned',    cls: 'bg-slate-100 text-slate-500',   icon: <CheckCircle size={11} /> },
  };
  const { label, cls, icon } = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${cls}`}>
      {icon} {label}
    </span>
  );
}

// Manual trigger for the 24h reminder (prototype shortcut)
function ReminderTrigger({ guestRoom }) {
  const requests = useStore(s => s.requests);
  const triggerReminder = useStore(s => s.triggerReturnReminder);

  const delivered = requests.filter(r => r.guestRoom === guestRoom && r.status === 'delivered' && !r.reminderSent);

  if (!delivered.length) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
      <p className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1">
        <Bell size={12} /> Dev: Trigger 24h Return Reminder
      </p>
      {delivered.map(r => (
        <button
          key={r.id}
          onClick={() => triggerReminder(r.id)}
          className="w-full text-left text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-2 rounded-lg mb-1 last:mb-0"
        >
          Send reminder for: {SUPPLY_TYPE_MAP[r.typeId]?.name}
        </button>
      ))}
    </div>
  );
}

export default function GuestView() {
  const guestRoom = useStore(s => s.guestRoom);
  const setGuestRoom = useStore(s => s.setGuestRoom);
  const supplyUnits = useStore(s => s.supplyUnits);
  const requests = useStore(s => s.requests);

  if (!guestRoom) return <RoomEntry />;

  const floor = Math.floor(guestRoom / 100);
  const myRequests = requests.filter(r => r.guestRoom === guestRoom && r.status !== 'returned');

  const availableTypes = SUPPLY_TYPES.filter(type => {
    const hasInCloset = supplyUnits.some(
      u => u.typeId === type.id && u.floor === floor && u.location === 'closet' && u.status === 'available'
    );
    const hasRequest = requests.some(
      r => r.guestRoom === guestRoom && r.typeId === type.id && r.status !== 'returned'
    );
    return hasInCloset || hasRequest;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Room header */}
      <div className="bg-brand-50 border-b border-brand-100 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-xs text-brand-500 font-medium">Your Room</p>
          <p className="text-xl font-bold text-brand-800">{guestRoom}</p>
          <p className="text-xs text-brand-400">Floor {floor}</p>
        </div>
        <button
          onClick={() => setGuestRoom(null)}
          className="p-2 text-brand-400 hover:text-brand-600"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollable px-4 py-3">
        <ReminderTrigger guestRoom={guestRoom} />

        {availableTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
            <Package size={40} className="mb-3 opacity-20" />
            <p className="text-sm font-medium">No supplies available on your floor yet</p>
            <p className="text-xs mt-1 max-w-xs">
              Our staff is preparing supplies for your floor. Check back shortly or contact the front desk.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Available on Floor {floor}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Tap "Request" and we'll bring it to your room.</p>
            </div>

            {/* Room Equipment */}
            {availableTypes.some(t => t.category === 'room_equipment') && (
              <>
                <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide mb-1.5 mt-3">Room Equipment</p>
                {availableTypes.filter(t => t.category === 'room_equipment').map(type => (
                  <SupplyCard key={type.id} type={type} floor={floor} guestRoom={guestRoom} />
                ))}
              </>
            )}

            {/* Personal Care */}
            {availableTypes.some(t => t.category === 'personal_care') && (
              <>
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide mb-1.5 mt-3">Personal Care</p>
                {availableTypes.filter(t => t.category === 'personal_care').map(type => (
                  <SupplyCard key={type.id} type={type} floor={floor} guestRoom={guestRoom} />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

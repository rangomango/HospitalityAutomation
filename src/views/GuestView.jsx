import { useState } from 'react';
import { Package, CheckCircle, Clock, ArrowRight, X, Bell } from 'lucide-react';
import { useStore } from '../store/useStore';
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
      <h2 className="text-xl font-bold text-lance-text mb-1">Welcome</h2>
      <p className="text-sm text-lance-text-md mb-6">Enter your room number to see available supplies and request items.</p>
      <form onSubmit={handleSubmit} className="w-full max-w-xs">
        <input
          type="number"
          placeholder="Room number (e.g. 301)"
          className="w-full bg-lance-elevated border-2 border-lance-border rounded-xl px-4 py-3 text-center text-lg font-bold text-lance-text placeholder-lance-text-sub focus:outline-none focus:border-lance-accent mb-3 transition-colors"
          value={input}
          onChange={e => { setInput(e.target.value); setError(''); }}
        />
        {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
        <button type="submit" className="w-full py-3 bg-lance-accent text-lance-bg font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-lance-accent-hov transition-colors">
          Continue <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending:   { label: 'On the way',  cls: 'bg-lance-gold-dim text-lance-gold-lt',     icon: <Clock size={11} /> },
    assigned:  { label: 'Assigned',    cls: 'bg-lance-accent-dim text-lance-accent-lt', icon: <Clock size={11} /> },
    delivered: { label: 'Delivered',   cls: 'bg-emerald-900/50 text-emerald-400',        icon: <CheckCircle size={11} /> },
    returned:  { label: 'Returned',    cls: 'bg-lance-elevated text-lance-text-sub',     icon: <CheckCircle size={11} /> },
  };
  const { label, cls, icon } = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${cls}`}>
      {icon} {label}
    </span>
  );
}

function SupplyCard({ type, floor, guestRoom }) {
  const supplyUnits = useStore(s => s.supplyUnits);
  const requests = useStore(s => s.requests);
  const createRequest = useStore(s => s.createRequest);

  const availableCount = supplyUnits.filter(
    u => u.typeId === type.id && u.floor === floor && u.location === 'closet' && u.status === 'available'
  ).length;

  const myRequest = requests.find(
    r => r.guestRoom === guestRoom && r.typeId === type.id && r.status !== 'returned'
  );

  if (availableCount === 0 && !myRequest) return null;

  return (
    <div className="bg-lance-surface border border-lance-border rounded-xl p-3 mb-2">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{type.emoji}</span>
        <div className="flex-1">
          <p className="font-semibold text-lance-text text-sm">{type.name}</p>
          <p className="text-xs text-lance-text-sub mt-0.5">
            {type.category === 'room_equipment' ? 'Room Equipment' : 'Personal Care'}
          </p>
        </div>
        <div className="text-right">
          {myRequest ? (
            <StatusBadge status={myRequest.status} />
          ) : (
            <div>
              <p className="text-[10px] text-lance-accent-lt font-semibold mb-1">{availableCount} available</p>
              <button
                onClick={() => createRequest(guestRoom, floor, type.id)}
                className="text-xs bg-lance-accent text-lance-bg px-3 py-1.5 rounded-lg font-semibold hover:bg-lance-accent-hov transition-colors"
              >
                Request
              </button>
            </div>
          )}
        </div>
      </div>

      {myRequest && (
        <div className="mt-2 pt-2 border-t border-lance-border-sub">
          <p className="text-xs text-lance-text-sub">
            Requested {formatDistanceToNow(myRequest.requestedAt, { addSuffix: true })}
            {myRequest.deliveredAt && ` · Delivered ${formatDistanceToNow(myRequest.deliveredAt, { addSuffix: true })}`}
          </p>
          {myRequest.status === 'delivered' && myRequest.reminderSent && (
            <div className="mt-1.5 bg-lance-gold-dim border border-lance-gold/30 rounded-lg p-2 text-xs text-lance-gold-lt">
              <Bell size={11} className="inline mr-1" />
              Please place the item outside your door for pickup when done.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReminderTrigger({ guestRoom }) {
  const requests = useStore(s => s.requests);
  const triggerReminder = useStore(s => s.triggerReturnReminder);
  const delivered = requests.filter(r => r.guestRoom === guestRoom && r.status === 'delivered' && !r.reminderSent);
  if (!delivered.length) return null;

  return (
    <div className="bg-lance-gold-dim border border-lance-gold/30 rounded-xl p-3 mb-3">
      <p className="text-xs font-semibold text-lance-gold-lt mb-2 flex items-center gap-1">
        <Bell size={12} /> Dev: Trigger 24h Return Reminder
      </p>
      {delivered.map(r => (
        <button
          key={r.id}
          onClick={() => triggerReminder(r.id)}
          className="w-full text-left text-xs bg-lance-gold/10 hover:bg-lance-gold/20 text-lance-gold-lt px-3 py-2 rounded-lg mb-1 last:mb-0 transition-colors"
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
      <div className="bg-lance-surface border-b border-lance-border px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-xs text-lance-text-sub font-medium">Your Room</p>
          <p className="text-xl font-bold text-lance-accent">{guestRoom}</p>
          <p className="text-xs text-lance-text-sub">Floor {floor}</p>
        </div>
        <button
          onClick={() => setGuestRoom(null)}
          className="p-2 text-lance-text-sub hover:text-lance-text transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollable px-4 py-3">
        <ReminderTrigger guestRoom={guestRoom} />

        {availableTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-lance-text-sub">
            <Package size={40} className="mb-3 opacity-20" />
            <p className="text-sm font-medium text-lance-text-md">No supplies available on your floor yet</p>
            <p className="text-xs mt-1 max-w-xs">Our staff is preparing supplies for your floor. Check back shortly or contact the front desk.</p>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <p className="text-xs font-semibold text-lance-text-sub uppercase tracking-wide">Available on Floor {floor}</p>
              <p className="text-xs text-lance-text-sub mt-0.5">Tap "Request" and we'll bring it to your room.</p>
            </div>

            {availableTypes.some(t => t.category === 'room_equipment') && (
              <>
                <p className="text-[11px] font-bold text-lance-accent uppercase tracking-wide mb-1.5 mt-3">Room Equipment</p>
                {availableTypes.filter(t => t.category === 'room_equipment').map(type => (
                  <SupplyCard key={type.id} type={type} floor={floor} guestRoom={guestRoom} />
                ))}
              </>
            )}

            {availableTypes.some(t => t.category === 'personal_care') && (
              <>
                <p className="text-[11px] font-bold text-lance-accent-lt uppercase tracking-wide mb-1.5 mt-3">Personal Care</p>
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

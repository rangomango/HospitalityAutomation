import { ArrowRight, X, Bell } from 'lucide-react';
import { MdHotel } from 'react-icons/md';
import { useStore } from '../store/useStore';
import { SUPPLY_TYPES, SUPPLY_TYPE_MAP } from '../data/constants';
import { SupplyIcon } from '../components/SupplyIcon';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

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
      <MdHotel size={52} className="text-lance-accent mb-4" />
      <h2 className="text-xl font-bold text-lance-text mb-1">Welcome</h2>
      <p className="text-sm text-lance-text-md mb-6">Enter your room number to see available supplies and request items.</p>
      <form onSubmit={handleSubmit} className="w-full max-w-xs">
        <input
          type="number"
          placeholder="e.g. 301"
          className="w-full bg-transparent border border-lance-border rounded-xl px-4 py-3 text-center text-lg font-semibold text-lance-text placeholder-lance-text-sub focus:outline-none focus:border-lance-accent mb-3 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          value={input}
          onChange={e => { setInput(e.target.value); setError(''); }}
        />
        {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
        <button
          type="submit"
          className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
          style={{
            color: '#2BCA95',
            background: 'rgba(43,202,149,0.07)',
            boxShadow: 'inset 0 1px 0 rgba(43,202,149,0.15)',
          }}
        >
          Continue <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}

function SupplyCard({ type, floor, guestRoom }) {
  const requests = useStore(s => s.requests);
  const createRequest = useStore(s => s.createRequest);
  const cancelRequest = useStore(s => s.cancelRequest);

  const myRequest = requests.find(
    r => r.guestRoom === guestRoom && r.typeId === type.id && r.status !== 'returned'
  );
  const canCancel = myRequest && (myRequest.status === 'pending' || myRequest.status === 'assigned');

  const statusText = myRequest ? {
    pending:   `Requested ${formatDistanceToNow(myRequest.requestedAt, { addSuffix: true })}`,
    assigned:  'On the way',
    delivered: 'Delivered',
    returned:  null,
  }[myRequest.status] : null;

  return (
    <div className="bg-lance-surface rounded-xl p-3 mb-2">
      <div className="flex items-center gap-3">
        <SupplyIcon typeId={type.id} size={24} className="text-lance-accent flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-lance-text text-sm">{type.name}</p>
        </div>
        <div className="flex-shrink-0">
          {!myRequest && (
            <button
              onClick={() => createRequest(guestRoom, floor, type.id)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{
                color: '#2BCA95',
                background: 'rgba(43,202,149,0.07)',
                boxShadow: 'inset 0 1px 0 rgba(43,202,149,0.15)',
              }}
            >
              Request
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => cancelRequest(myRequest.id)}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all"
              style={{ color: '#4a7068', background: 'rgba(0,0,0,0.2)' }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {myRequest && statusText && (
        <div className="mt-1.5">
          <p className={`text-xs ${myRequest.status === 'assigned' ? 'text-lance-accent-lt font-medium' : 'text-lance-text-sub'}`}>
            {statusText}
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

function DevPanel({ guestRoom, setGuestRoom }) {
  const requests = useStore(s => s.requests);
  const triggerReminder = useStore(s => s.triggerReturnReminder);
  const delivered = requests.filter(r => r.guestRoom === guestRoom && r.status === 'delivered' && !r.reminderSent);

  return (
    <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <p className="text-[10px] font-semibold text-lance-text-sub uppercase tracking-widest mb-2">Dev</p>
      <button
        onClick={() => setGuestRoom(null)}
        className="w-full text-left text-xs text-lance-text-sub px-3 py-2 rounded-lg transition-colors mb-1"
        style={{ background: 'rgba(255,255,255,0.04)' }}
      >
        Reset room
      </button>
      {delivered.map(r => (
        <button
          key={r.id}
          onClick={() => triggerReminder(r.id)}
          className="w-full text-left text-xs text-lance-text-sub px-3 py-2 rounded-lg transition-colors mt-1"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          Trigger 24h reminder: {SUPPLY_TYPE_MAP[r.typeId]?.name}
        </button>
      ))}
    </div>
  );
}

export default function GuestView() {
  const guestRoom = useStore(s => s.guestRoom);
  const setGuestRoom = useStore(s => s.setGuestRoom);

  if (!guestRoom) return <RoomEntry />;

  const floor = Math.floor(guestRoom / 100);
  const garmentCare = SUPPLY_TYPES.filter(t => t.category === 'room_equipment');
  const personalCare = SUPPLY_TYPES.filter(t => t.category === 'personal_care');

  return (
    <div className="flex flex-col h-full">
      {/* Room header */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="bg-lance-surface rounded-xl px-4 py-3 flex items-center justify-between">
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
      </div>

      <div className="flex-1 overflow-y-auto scrollable px-4 pb-4">
        {garmentCare.length > 0 && (
          <>
            <p className="text-[11px] font-bold text-lance-accent uppercase tracking-wide mb-1.5 mt-1">Garment Care</p>
            {garmentCare.map(type => (
              <SupplyCard key={type.id} type={type} floor={floor} guestRoom={guestRoom} />
            ))}
          </>
        )}

        {personalCare.length > 0 && (
          <>
            <p className="text-[11px] font-bold text-lance-accent-lt uppercase tracking-wide mb-1.5 mt-3">Personal Care</p>
            {personalCare.map(type => (
              <SupplyCard key={type.id} type={type} floor={floor} guestRoom={guestRoom} />
            ))}
          </>
        )}

        <DevPanel guestRoom={guestRoom} setGuestRoom={setGuestRoom} />
      </div>
    </div>
  );
}

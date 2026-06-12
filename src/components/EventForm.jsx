import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { EVENT_TYPES, FLOORS } from '../data/constants';

const today = new Date().toISOString().split('T')[0];

const empty = {
  name: '', type: 'Wedding', date: today, startTime: '18:00',
  bufferHours: 3, floorStart: 1, floorEnd: 1, roomStart: 1, roomEnd: 10,
};

// No border — just elevated bg with a subtle focus glow
const inputCls = 'w-full bg-lance-elevated rounded-lg px-3 py-2 text-sm text-lance-text placeholder-lance-text-sub focus:outline-none focus:ring-1 focus:ring-lance-accent transition-colors';
const selectCls = inputCls;

export default function EventForm({ onClose }) {
  const addEvent = useStore(s => s.addEvent);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const buildRooms = () => {
    const rooms = [];
    for (let fl = Number(form.floorStart); fl <= Number(form.floorEnd); fl++) {
      for (let r = Number(form.roomStart); r <= Number(form.roomEnd); r++) {
        rooms.push(fl * 100 + r);
      }
    }
    return rooms;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Event name is required'); return; }
    const rooms = buildRooms();
    if (!rooms.length) { setError('No rooms selected'); return; }
    addEvent({ ...form, rooms, bufferHours: Number(form.bufferHours) });
    onClose?.();
  };

  const previewRooms = buildRooms();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-lance-text-sub mb-1">Event Name *</label>
        <input className={inputCls} placeholder="e.g. Johnson Wedding"
          value={form.name} onChange={e => set('name', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-lance-text-sub mb-1">Event Type</label>
          <select className={selectCls} value={form.type} onChange={e => set('type', e.target.value)}>
            {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-lance-text-sub mb-1">Deploy Buffer</label>
          <select className={selectCls} value={form.bufferHours} onChange={e => set('bufferHours', e.target.value)}>
            {[1,2,3,4,5,6].map(h => <option key={h} value={h}>{h}h before</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-lance-text-sub mb-1">Date</label>
          <input type="date" className={inputCls} value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-lance-text-sub mb-1">Start Time</label>
          <input type="time" className={inputCls} value={form.startTime} onChange={e => set('startTime', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-lance-text-sub mb-2">Room Block</label>
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div>
            <label className="block text-[10px] text-lance-text-sub mb-0.5">Floor start</label>
            <select className={selectCls} value={form.floorStart} onChange={e => set('floorStart', e.target.value)}>
              {FLOORS.map(f => <option key={f} value={f}>Floor {f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-lance-text-sub mb-0.5">Floor end</label>
            <select className={selectCls} value={form.floorEnd} onChange={e => set('floorEnd', e.target.value)}>
              {FLOORS.map(f => <option key={f} value={f}>Floor {f}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-lance-text-sub mb-0.5">Room start (1–20)</label>
            <input type="number" min={1} max={20} className={inputCls}
              value={form.roomStart} onChange={e => set('roomStart', e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] text-lance-text-sub mb-0.5">Room end (1–20)</label>
            <input type="number" min={1} max={20} className={inputCls}
              value={form.roomEnd} onChange={e => set('roomEnd', e.target.value)} />
          </div>
        </div>
        <p className="text-[11px] text-lance-text-sub mt-1">
          {previewRooms.length} rooms: {previewRooms.slice(0, 5).join(', ')}{previewRooms.length > 5 ? ` …+${previewRooms.length - 5} more` : ''}
        </p>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-2 pt-1">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ color: '#4a7068', background: 'rgba(0,0,0,0.2)' }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-all"
          style={{
            color: '#2BCA95',
            background: 'rgba(43,202,149,0.07)',
            boxShadow: 'inset 0 1px 0 rgba(43,202,149,0.15)',
          }}
        >
          <PlusCircle size={15} /> Add Event
        </button>
      </div>
    </form>
  );
}

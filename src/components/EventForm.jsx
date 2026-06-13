import { useState } from 'react';
import { PlusCircle, Save, Plus, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { EVENT_TYPES, FLOORS } from '../data/constants';

const today = new Date().toISOString().split('T')[0];

const empty = {
  name: '', type: 'Wedding', date: today, startTime: '18:00',
  bufferHours: 3, floorStart: 1, floorEnd: 1, roomStart: 1, roomEnd: 10,
};

const inputCls = 'w-full min-w-0 rounded-lg px-2.5 py-2 text-sm text-lance-text placeholder-lance-text-sub focus:outline-none focus:border-lance-accent transition-colors';
const inputStyle = { background: '#232b2f', border: '1px solid rgba(255,255,255,0.1)' };
const selectCls = inputCls;

function deriveFormFromEvent(event) {
  const rooms = event.rooms || [];
  const floors = rooms.map(r => Math.floor(r / 100));
  const roomNums = rooms.map(r => r % 100);
  return {
    name:        event.name,
    type:        event.type,
    date:        event.date,
    startTime:   event.startTime,
    bufferHours: event.bufferHours,
    floorStart:  floors.length ? Math.min(...floors) : 1,
    floorEnd:    floors.length ? Math.max(...floors) : 1,
    roomStart:   roomNums.length ? Math.min(...roomNums) : 1,
    roomEnd:     roomNums.length ? Math.max(...roomNums) : 10,
  };
}

export default function EventForm({ onClose, initialData, onSave }) {
  const addEvent    = useStore(s => s.addEvent);
  const updateEvent = useStore(s => s.updateEvent);
  const isEditing   = !!initialData;

  const derived = isEditing ? deriveFormFromEvent(initialData) : empty;
  const [form, setForm] = useState(derived);
  const [error, setError] = useState('');
  const [showFloorEnd, setShowFloorEnd] = useState(
    isEditing && derived.floorStart !== derived.floorEnd
  );

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFloorStart = (v) => {
    setForm(f => ({ ...f, floorStart: v, floorEnd: showFloorEnd ? f.floorEnd : v }));
  };

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
    const data = { ...form, rooms, bufferHours: Number(form.bufferHours) };
    if (isEditing) {
      updateEvent(initialData.id, data);
      onSave?.();
    } else {
      addEvent(data);
      onClose?.();
    }
  };

  const previewRooms = buildRooms();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-lance-text-sub mb-1">Event Name *</label>
        <input className={inputCls} style={inputStyle} placeholder="e.g. Johnson Wedding"
          value={form.name} onChange={e => set('name', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <label className="block text-xs font-semibold text-lance-text-sub mb-1">Event Type</label>
          <select className={selectCls} style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}>
            {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="min-w-0">
          <label className="block text-xs font-semibold text-lance-text-sub mb-1">Deploy</label>
          <select className={selectCls} style={inputStyle} value={form.bufferHours} onChange={e => set('bufferHours', e.target.value)}>
            {[1,2,3,4,5,6].map(h => <option key={h} value={h}>{h}h before</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <label className="block text-xs font-semibold text-lance-text-sub mb-1">Date</label>
          <input type="date" className="rounded-lg text-lance-text focus:outline-none transition-colors" style={{ ...inputStyle, fontSize: '14px', padding: '8px 10px', boxSizing: 'border-box', width: '100%', display: 'block', WebkitAppearance: 'none' }} value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div className="min-w-0">
          <label className="block text-xs font-semibold text-lance-text-sub mb-1">Start Time</label>
          <input type="time" className="rounded-lg text-lance-text focus:outline-none transition-colors" style={{ ...inputStyle, fontSize: '14px', padding: '8px 10px', boxSizing: 'border-box', width: '100%', display: 'block', WebkitAppearance: 'none' }} value={form.startTime} onChange={e => set('startTime', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-lance-text-sub mb-2">Room Block</label>

        {/* Floor row */}
        <div className="flex items-end gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] text-lance-text-sub mb-0.5">
              {showFloorEnd ? 'Floor start' : 'Floor'}
            </label>
            <select className={selectCls} style={inputStyle} value={form.floorStart} onChange={e => handleFloorStart(e.target.value)}>
              {FLOORS.map(f => <option key={f} value={f}>Floor {f}</option>)}
            </select>
          </div>

          {showFloorEnd ? (
            <>
              <span className="text-lance-text-sub text-xs pb-2.5 flex-shrink-0">to</span>
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] text-lance-text-sub mb-0.5">Floor end</label>
                <select className={selectCls} style={inputStyle} value={form.floorEnd} onChange={e => set('floorEnd', e.target.value)}>
                  {FLOORS.map(f => <option key={f} value={f}>Floor {f}</option>)}
                </select>
              </div>
              <button
                type="button"
                onClick={() => { setShowFloorEnd(false); set('floorEnd', form.floorStart); }}
                className="flex-shrink-0 w-7 h-7 mb-0.5 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'rgba(0,0,0,0.25)', color: '#4a7068' }}
              >
                <X size={12} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowFloorEnd(true)}
              className="flex-shrink-0 w-7 h-7 mb-0.5 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'rgba(43,202,149,0.1)', color: '#2BCA95' }}
            >
              <Plus size={13} />
            </button>
          )}
        </div>

        {/* Room range */}
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label className="block text-[10px] text-lance-text-sub mb-0.5">Room start (1–20)</label>
            <input type="number" min={1} max={20} className={inputCls} style={inputStyle}
              value={form.roomStart} onChange={e => set('roomStart', e.target.value)} />
          </div>
          <div className="min-w-0">
            <label className="block text-[10px] text-lance-text-sub mb-0.5">Room end (1–20)</label>
            <input type="number" min={1} max={20} className={inputCls} style={inputStyle}
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
          {isEditing
            ? <><Save size={14} /> Save Changes</>
            : <><PlusCircle size={15} /> Add Event</>
          }
        </button>
      </div>
    </form>
  );
}

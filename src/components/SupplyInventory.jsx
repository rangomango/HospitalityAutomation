import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SUPPLY_TYPES, FLOORS } from '../data/constants';
import { SupplyIcon } from './SupplyIcon';

function SupplyRow({ type, floor }) {
  const supplyUnits = useStore(s => s.supplyUnits);
  const addSupplyUnits = useStore(s => s.addSupplyUnits);
  const removeSupplyUnits = useStore(s => s.removeSupplyUnits);

  const floorUnits = supplyUnits.filter(u => u.typeId === type.id && u.floor === floor);
  const available = floorUnits.filter(u => u.status === 'available').length;
  const inTransit = floorUnits.filter(u => u.status === 'in_transit').length;
  const checkedOut = floorUnits.filter(u => u.status === 'checked_out').length;
  const total = floorUnits.length;

  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <SupplyIcon typeId={type.id} size={20} className="text-lance-accent flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-lance-text">{type.name}</p>
            <div className="flex gap-2 text-[10px] mt-0.5">
              {available > 0  && <span className="text-lance-accent">{available} avail</span>}
              {inTransit > 0  && <span className="text-lance-gold-lt">↓ {inTransit} incoming</span>}
              {checkedOut > 0 && <span className="text-blue-400">{checkedOut} with guest</span>}
              {total === 0    && <span className="text-lance-text-sub">none on this floor</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => removeSupplyUnits(type.id, 1, floor)}
            disabled={available === 0}
            className="w-7 h-7 rounded-full bg-lance-elevated flex items-center justify-center text-lance-text-md disabled:opacity-30 hover:text-lance-text transition-colors"
          >
            <Minus size={13} />
          </button>
          <span className="w-6 text-center text-sm font-bold text-lance-text">{total}</span>
          <button
            onClick={() => addSupplyUnits(type.id, 1, floor)}
            className="w-7 h-7 rounded-full bg-lance-accent-dim flex items-center justify-center text-lance-accent hover:bg-lance-accent/20 transition-colors"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SupplyInventory() {
  const [selectedFloor, setSelectedFloor] = useState(1);
  const supplyUnits = useStore(s => s.supplyUnits);
  const totalByType = (typeId) => supplyUnits.filter(u => u.typeId === typeId).length;

  return (
    <div>
      {/* Global totals — no border */}
      <div className="bg-lance-surface rounded-xl p-3 mb-4">
        <p className="text-xs font-semibold text-lance-text-sub mb-2 uppercase tracking-wide">Total Inventory</p>
        <div className="grid grid-cols-3 gap-2">
          {SUPPLY_TYPES.map(t => (
            <div key={t.id} className="bg-lance-elevated rounded-lg p-2.5 text-center">
              <SupplyIcon typeId={t.id} size={22} className="text-lance-accent mx-auto mb-1" />
              <div className="text-sm font-bold text-lance-accent">{totalByType(t.id)}</div>
              <div className="text-[9px] text-lance-text-sub leading-tight">{t.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Floor selector */}
      <div className="flex gap-1 mb-4">
        {FLOORS.map(f => (
          <button
            key={f}
            onClick={() => setSelectedFloor(f)}
            className="flex-1 py-1.5 text-sm font-bold rounded-lg transition-all"
            style={f === selectedFloor ? {
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

      {/* Room Equipment — no borders */}
      <div className="mb-2">
        <p className="text-[10px] font-bold text-lance-accent uppercase tracking-widest mb-2">Room Equipment</p>
        <div className="bg-lance-surface rounded-xl px-3">
          {SUPPLY_TYPES.filter(t => t.category === 'room_equipment').map((type, i, arr) => (
            <div key={type.id} className={i < arr.length - 1 ? 'border-b border-lance-border-sub' : ''}>
              <SupplyRow type={type} floor={selectedFloor} />
            </div>
          ))}
        </div>
      </div>

      {/* Personal Care — no borders */}
      <div>
        <p className="text-[10px] font-bold text-lance-accent-lt uppercase tracking-widest mb-2">Personal Care</p>
        <div className="bg-lance-surface rounded-xl px-3">
          {SUPPLY_TYPES.filter(t => t.category === 'personal_care').map((type, i, arr) => (
            <div key={type.id} className={i < arr.length - 1 ? 'border-b border-lance-border-sub' : ''}>
              <SupplyRow type={type} floor={selectedFloor} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

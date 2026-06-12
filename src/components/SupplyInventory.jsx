import { useState } from 'react';
import { Plus, Minus, Package } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SUPPLY_TYPES, FLOORS } from '../data/constants';

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
    <div className="py-2.5 border-b border-lance-border-sub last:border-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{type.emoji}</span>
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
            className="w-7 h-7 rounded-full bg-lance-elevated border border-lance-border flex items-center justify-center text-lance-text-md disabled:opacity-30 hover:border-lance-accent transition-colors"
          >
            <Minus size={13} />
          </button>
          <span className="w-6 text-center text-sm font-bold text-lance-text">{total}</span>
          <button
            onClick={() => addSupplyUnits(type.id, 1, floor)}
            className="w-7 h-7 rounded-full bg-lance-accent-dim border border-lance-accent/30 flex items-center justify-center text-lance-accent hover:bg-lance-accent/20 transition-colors"
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
      {/* Global totals */}
      <div className="bg-lance-surface border border-lance-border rounded-xl p-3 mb-4">
        <p className="text-xs font-semibold text-lance-text-sub mb-2 flex items-center gap-1">
          <Package size={12} /> Total Inventory (All Floors)
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {SUPPLY_TYPES.map(t => (
            <div key={t.id} className="bg-lance-elevated border border-lance-border rounded-lg p-2 text-center">
              <div className="text-lg">{t.emoji}</div>
              <div className="text-sm font-bold text-lance-accent">{totalByType(t.id)}</div>
              <div className="text-[9px] text-lance-text-sub leading-tight">{t.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Floor selector — 3D button treatment */}
      <div className="flex gap-1 mb-3">
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

      {/* Room Equipment */}
      <div className="bg-lance-surface border border-lance-border rounded-xl mb-3 overflow-hidden">
        <div className="px-3 py-2 border-b border-lance-border-sub bg-lance-elevated">
          <p className="text-xs font-bold text-lance-accent uppercase tracking-wide">Room Equipment</p>
        </div>
        <div className="px-3">
          {SUPPLY_TYPES.filter(t => t.category === 'room_equipment').map(type => (
            <SupplyRow key={type.id} type={type} floor={selectedFloor} />
          ))}
        </div>
      </div>

      {/* Personal Care */}
      <div className="bg-lance-surface border border-lance-border rounded-xl overflow-hidden">
        <div className="px-3 py-2 border-b border-lance-border-sub bg-lance-elevated">
          <p className="text-xs font-bold text-lance-accent-lt uppercase tracking-wide">Personal Care</p>
        </div>
        <div className="px-3">
          {SUPPLY_TYPES.filter(t => t.category === 'personal_care').map(type => (
            <SupplyRow key={type.id} type={type} floor={selectedFloor} />
          ))}
        </div>
      </div>
    </div>
  );
}

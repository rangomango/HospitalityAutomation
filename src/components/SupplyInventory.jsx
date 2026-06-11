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
    <div className="py-2.5 border-b border-slate-100 last:border-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{type.emoji}</span>
          <div>
            <p className="text-sm font-medium text-slate-800">{type.name}</p>
            <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5">
              {available > 0 && <span className="text-green-600">{available} avail</span>}
              {inTransit > 0 && <span className="text-amber-500">↓ {inTransit} incoming</span>}
              {checkedOut > 0 && <span className="text-blue-500">{checkedOut} with guest</span>}
              {total === 0 && <span>none on this floor</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => removeSupplyUnits(type.id, 1, floor)}
            disabled={available === 0}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 disabled:opacity-30"
          >
            <Minus size={13} />
          </button>
          <span className="w-6 text-center text-sm font-semibold text-slate-700">{total}</span>
          <button
            onClick={() => addSupplyUnits(type.id, 1, floor)}
            className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700"
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
      {/* Totals summary */}
      <div className="bg-white rounded-xl p-3 mb-4 border border-slate-200">
        <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
          <Package size={12} /> Total Inventory (All Floors)
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {SUPPLY_TYPES.map(t => (
            <div key={t.id} className="bg-slate-50 rounded-lg p-2 text-center">
              <div className="text-lg">{t.emoji}</div>
              <div className="text-xs font-bold text-slate-700">{totalByType(t.id)}</div>
              <div className="text-[9px] text-slate-400 leading-tight">{t.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Floor selector */}
      <div className="flex gap-1 mb-3">
        {FLOORS.map(f => (
          <button
            key={f}
            onClick={() => setSelectedFloor(f)}
            className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
              f === selectedFloor ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Category: Room Equipment */}
      <div className="bg-white rounded-xl border border-slate-200 mb-3 overflow-hidden">
        <div className="px-3 py-2 bg-indigo-50 border-b border-slate-100">
          <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Room Equipment</p>
        </div>
        <div className="px-3">
          {SUPPLY_TYPES.filter(t => t.category === 'room_equipment').map(type => (
            <SupplyRow key={type.id} type={type} floor={selectedFloor} />
          ))}
        </div>
      </div>

      {/* Category: Personal Care */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-emerald-50 border-b border-slate-100">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Personal Care</p>
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

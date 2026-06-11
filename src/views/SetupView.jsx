import { useState } from 'react';
import { CalendarDays, Package, Map, Truck, PlusCircle, Trash2, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import EventForm from '../components/EventForm';
import SupplyInventory from '../components/SupplyInventory';
import FloorMap from '../components/FloorMap';
import DeployPlan from '../components/DeployPlan';

const TABS = [
  { id: 'events',    label: 'Events',   Icon: CalendarDays },
  { id: 'inventory', label: 'Inventory', Icon: Package    },
  { id: 'map',       label: 'Floor Map', Icon: Map        },
  { id: 'deploy',    label: 'Deploy',    Icon: Truck      },
];

function EventCard({ event }) {
  const removeEvent = useStore(s => s.removeEvent);
  const triggerEventDeploy = useStore(s => s.triggerEventDeploy);
  const [triggerState, setTriggerState] = useState(null); // null | 'ok' | 'empty'

  const [h, m] = event.startTime.split(':').map(Number);
  const deployH = h - event.bufferHours;
  const deployTime = `${String(deployH < 0 ? deployH + 24 : deployH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const floors = [...new Set((event.rooms || []).map(r => Math.floor(r / 100)))].sort();
  const suppliesNeeded = Math.ceil((event.rooms?.length || 0) / 3);

  const handleTrigger = () => {
    const count = triggerEventDeploy(event.id);
    setTriggerState(count > 0 ? 'ok' : 'empty');
    setTimeout(() => setTriggerState(null), 3000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 mb-2">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base">🎉</span>
            <p className="font-semibold text-slate-800 text-sm">{event.name}</p>
            <span className="text-[10px] bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-medium">
              {event.type}
            </span>
          </div>
          <div className="mt-1.5 space-y-0.5">
            <p className="text-xs text-slate-500">📅 {event.date} at {event.startTime}</p>
            <p className="text-xs text-slate-500">🚚 Deploy by {deployTime} ({event.bufferHours}h buffer)</p>
            <p className="text-xs text-slate-500">
              🏨 {event.rooms?.length || 0} rooms · Floors {floors.join(', ')} · ~{suppliesNeeded} units/type needed
            </p>
          </div>
        </div>
        <button
          onClick={() => removeEvent(event.id)}
          className="p-1.5 text-slate-400 hover:text-red-400 transition-colors flex-shrink-0"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Manual deploy trigger */}
      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-2">
        <button
          onClick={handleTrigger}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
            triggerState === 'ok'    ? 'bg-green-100 text-green-700' :
            triggerState === 'empty' ? 'bg-slate-100 text-slate-500' :
            'bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
        >
          <Zap size={12} />
          {triggerState === 'ok'    ? 'Tasks created!' :
           triggerState === 'empty' ? 'Nothing to deploy' :
           'Trigger Deploy Now'}
        </button>
        <p className="text-[10px] text-slate-400">Simulates buffer time passing</p>
      </div>
    </div>
  );
}

export default function SetupView() {
  const [activeTab, setActiveTab] = useState('events');
  const [showForm, setShowForm] = useState(false);
  const events = useStore(s => s.events);

  return (
    <div className="flex flex-col h-full">
      {/* Sub-nav tabs */}
      <div className="bg-white border-b border-slate-100 px-2 py-1.5 flex gap-0.5 flex-shrink-0">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center py-1.5 rounded-lg text-[10px] font-semibold transition-colors gap-0.5 ${
              activeTab === id ? 'bg-brand-50 text-brand-700' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollable px-4 py-4">
        {activeTab === 'events' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {events.length} Event Block{events.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={() => setShowForm(v => !v)}
                className="flex items-center gap-1 text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg"
              >
                <PlusCircle size={13} /> Add Event
              </button>
            </div>

            {showForm && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-4">
                <p className="text-sm font-bold text-slate-700 mb-3">New Event Block</p>
                <EventForm onClose={() => setShowForm(false)} />
              </div>
            )}

            {events.length === 0 && !showForm && (
              <div className="text-center py-10 text-slate-400">
                <CalendarDays size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No events added yet</p>
                <p className="text-xs mt-1">Tap "Add Event" to get started</p>
              </div>
            )}

            {events.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {activeTab === 'inventory' && <SupplyInventory />}

        {activeTab === 'map' && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Live Floor Plan
            </p>
            <FloorMap />
          </div>
        )}

        {activeTab === 'deploy' && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Deployment Recommendations
            </p>
            <DeployPlan />
          </div>
        )}
      </div>
    </div>
  );
}

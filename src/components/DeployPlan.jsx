import { useState } from 'react';
import { Truck, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { SupplyIcon } from './SupplyIcon';

export default function DeployPlan() {
  const plan = useStore(s => s.getDeployPlan());
  const events = useStore(s => s.events);
  const createDeployTasks = useStore(s => s.createDeployTasks);
  const [created, setCreated] = useState(false);

  if (!events.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-lance-text-sub">
        <Truck size={40} className="mb-3 opacity-20" />
        <p className="text-sm font-medium">No events set up yet</p>
        <p className="text-xs mt-1">Add events in the Events tab first</p>
      </div>
    );
  }

  if (!plan.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle size={40} className="mb-3 text-lance-accent opacity-60" />
        <p className="text-sm font-medium text-lance-accent">All floors are stocked!</p>
        <p className="text-xs mt-1 text-lance-text-sub">No forward deployments needed</p>
      </div>
    );
  }

  const conflicts = plan.filter(p => p.shortage > 0);

  const handleCreateTasks = () => {
    createDeployTasks(plan);
    setCreated(true);
  };

  const byEvent = {};
  plan.forEach(p => {
    if (!byEvent[p.eventName]) byEvent[p.eventName] = [];
    byEvent[p.eventName].push(p);
  });

  return (
    <div className="space-y-4">
      {/* Shortage warnings */}
      {conflicts.length > 0 && (
        <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-400" />
            <p className="text-sm font-bold text-red-300">Supply Shortages Detected</p>
          </div>
          {conflicts.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-red-400 py-1">
              <SupplyIcon typeId={p.typeId} size={14} className="text-red-400 flex-shrink-0" />
              <span>
                Floor {p.toFloor} needs {p.toSend}× {p.typeName} but only {p.canFulfill} available.
                <span className="font-bold text-red-300"> Source {p.shortage} more.</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Plan by event */}
      {Object.entries(byEvent).map(([eventName, items]) => {
        const deadline = items[0]?.deadline;
        return (
          <div key={eventName} className="bg-lance-surface border border-lance-border rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-lance-elevated border-b border-lance-border flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-lance-text">{eventName}</p>
                {deadline && (
                  <p className="text-[11px] text-lance-gold-lt">
                    Deploy by: {format(deadline, 'MMM d, h:mm a')}
                  </p>
                )}
              </div>
              <ChevronRight size={16} className="text-lance-text-sub" />
            </div>
            <div>
              {items.map((p, i) => (
                <div key={i} className="px-3 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SupplyIcon typeId={p.typeId} size={18} className="text-lance-accent flex-shrink-0" />
                    <div>
                      <p className="text-sm text-lance-text">{p.typeName}</p>
                      <p className="text-[10px] text-lance-text-sub">→ Floor {p.toFloor} closet</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {p.shortage > 0 ? (
                      <>
                        <p className="text-sm font-bold text-lance-gold-lt">{p.canFulfill} / {p.toSend} units</p>
                        <p className="text-[10px] text-red-400 font-semibold">{p.shortage} short</p>
                      </>
                    ) : (
                      <p className="text-sm font-bold text-lance-accent">{p.canFulfill} units ✓</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Action button */}
      <button
        onClick={handleCreateTasks}
        disabled={created}
        className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
          created
            ? 'bg-lance-accent-dim text-lance-accent border border-lance-accent/30'
            : 'bg-lance-accent text-lance-bg hover:bg-lance-accent-hov'
        }`}
      >
        {created ? (
          <><CheckCircle size={16} /> Tasks Created — Check Staff View</>
        ) : conflicts.length > 0 ? (
          <><Truck size={16} /> Deploy Available Items (shortages flagged)</>
        ) : (
          <><Truck size={16} /> Approve & Create Deploy Tasks</>
        )}
      </button>
    </div>
  );
}

import { useState } from 'react';
import { Truck, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';

export default function DeployPlan() {
  const plan = useStore(s => s.getDeployPlan());
  const events = useStore(s => s.events);
  const createDeployTasks = useStore(s => s.createDeployTasks);
  const [created, setCreated] = useState(false);

  if (!events.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
        <Truck size={40} className="mb-3 opacity-30" />
        <p className="text-sm font-medium">No events set up yet</p>
        <p className="text-xs mt-1">Add events in the Events tab first</p>
      </div>
    );
  }

  if (!plan.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
        <CheckCircle size={40} className="mb-3 text-green-400" />
        <p className="text-sm font-medium text-green-600">All floors are stocked!</p>
        <p className="text-xs mt-1">No forward deployments needed</p>
      </div>
    );
  }

  const conflicts = plan.filter(p => p.shortage > 0);
  // Always pass the full plan — createDeployTasks skips items with canFulfill=0
  // and auto-notifies staff about shortages for those.
  const handleCreateTasks = () => {
    createDeployTasks(plan);
    setCreated(true);
  };

  // Group by event
  const byEvent = {};
  plan.forEach(p => {
    if (!byEvent[p.eventName]) byEvent[p.eventName] = [];
    byEvent[p.eventName].push(p);
  });

  return (
    <div className="space-y-4">
      {/* Conflict warnings */}
      {conflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-500" />
            <p className="text-sm font-bold text-red-700">Supply Shortages Detected</p>
          </div>
          {conflicts.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-red-600 py-1 border-b border-red-100 last:border-0">
              <span>{p.emoji}</span>
              <span>
                Floor {p.toFloor} needs {p.toSend}× {p.typeName} but only {p.canFulfill} available.
                <span className="font-bold"> Source {p.shortage} more.</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Plan by event */}
      {Object.entries(byEvent).map(([eventName, items]) => {
        const deadline = items[0]?.deadline;
        return (
          <div key={eventName} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-brand-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-brand-800">{eventName}</p>
                {deadline && (
                  <p className="text-[11px] text-brand-500">
                    Deploy by: {format(deadline, 'MMM d, h:mm a')}
                  </p>
                )}
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
            <div className="divide-y divide-slate-100">
              {items.map((p, i) => (
                <div key={i} className="px-3 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{p.emoji}</span>
                    <div>
                      <p className="text-sm text-slate-700">{p.typeName}</p>
                      <p className="text-[10px] text-slate-400">→ Floor {p.toFloor} closet</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {p.shortage > 0 ? (
                      <>
                        <p className="text-sm font-bold text-amber-600">{p.canFulfill} / {p.toSend} units</p>
                        <p className="text-[10px] text-red-500 font-semibold">{p.shortage} short — source more</p>
                      </>
                    ) : (
                      <p className="text-sm font-bold text-brand-600">{p.canFulfill} units ✓</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Action button — always shown so partial-shortage tasks still get created */}
      <button
        onClick={handleCreateTasks}
        disabled={created}
        className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
          created
            ? 'bg-green-100 text-green-700 border border-green-200'
            : 'bg-brand-600 text-white hover:bg-brand-700'
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

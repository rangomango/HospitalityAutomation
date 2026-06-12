import { useState } from 'react';
import { Truck, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';
import { format, formatDistanceToNow } from 'date-fns';
import { SupplyIcon } from './SupplyIcon';

export default function DeployPlan() {
  const plan = useStore(s => s.getDeployPlan());
  const events = useStore(s => s.events);
  const tasks = useStore(s => s.tasks);
  const createDeployTasks = useStore(s => s.createDeployTasks);
  const [created, setCreated] = useState(false);

  const inProgressTasks = tasks.filter(t => t.type === 'forward_deploy' && (t.status === 'pending' || t.status === 'accepted'));

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
      {/* In-progress deploy tasks */}
      {inProgressTasks.length > 0 && (
        <div className="bg-lance-surface rounded-xl overflow-hidden">
          <div className="px-3 py-2 flex items-center gap-2 border-b" style={{ borderColor: 'rgba(43,202,149,0.12)' }}>
            <Clock size={13} className="text-lance-accent" />
            <p className="text-xs font-bold text-lance-accent uppercase tracking-wide">In Progress</p>
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(43,202,149,0.15)', color: '#7ff2c6' }}>
              {inProgressTasks.length} task{inProgressTasks.length !== 1 ? 's' : ''}
            </span>
          </div>
          {inProgressTasks.map(t => (
            <div key={t.id} className="px-3 py-2.5 flex items-start gap-2.5">
              <Truck size={14} className={t.status === 'accepted' ? 'text-lance-accent mt-0.5' : 'text-lance-text-sub mt-0.5'} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-lance-text leading-snug">{t.label}</p>
                <p className="text-[10px] text-lance-text-sub mt-0.5">{formatDistanceToNow(t.createdAt, { addSuffix: true })}</p>
              </div>
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={t.status === 'accepted'
                  ? { background: 'rgba(43,202,149,0.2)', color: '#5eead4' }
                  : { background: 'rgba(245,158,11,0.2)', color: '#fcd34d' }}
              >
                {t.status === 'accepted' ? 'EN ROUTE' : 'PENDING'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Shortage warnings */}
      {conflicts.length > 0 && (
        <div className="bg-red-950/40 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-400" />
            <p className="text-sm font-bold text-red-300">Potential Supply Shortage</p>
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
          <div key={eventName} className="bg-lance-surface rounded-xl overflow-hidden">
            <div className="px-3 py-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-lance-text">{eventName}</p>
                {deadline && (
                  <p className="text-[11px] text-lance-gold-lt">
                    Deploy by: {format(deadline, 'MMM d, h:mm a')}
                  </p>
                )}
              </div>
            </div>
            <div>
              {items.map((p, i) => (
                <div key={i} className="px-3 py-2 flex items-center justify-between">
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

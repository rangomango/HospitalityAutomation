import { useState } from 'react';
import { Bell, CheckCircle, Clock, Truck, Package, AlertTriangle, ChevronRight, BellOff, Timer } from 'lucide-react';
import { useStore, selectors } from '../store/useStore';
import { SUPPLY_TYPE_MAP } from '../data/constants';
import { formatDistanceToNow } from 'date-fns';

const TYPE_ICON = {
  forward_deploy: <Truck size={14} className="text-lance-accent" />,
  deliver:        <Package size={14} className="text-emerald-400" />,
  retrieve:       <ChevronRight size={14} className="text-lance-text-sub" />,
};

const NOTIF_ICONS = {
  task:     <Truck size={14} className="text-lance-accent" />,
  request:  <Package size={14} className="text-emerald-400" />,
  conflict: <AlertTriangle size={14} className="text-red-400" />,
  reminder: <Bell size={14} className="text-lance-gold-lt" />,
};

function TaskCard({ task }) {
  const acceptTask = useStore(s => s.acceptTask);
  const completeTask = useStore(s => s.completeTask);
  const removeTask = useStore(s => s.removeTask);

  const fromLabel = task.fromLocation === 'closet'
    ? `Floor ${task.fromFloor} Closet`
    : `Room ${task.fromLocation}`;
  const toLabel = task.toLocation === 'closet'
    ? `Floor ${task.toFloor} Closet`
    : `Room ${task.toLocation} (Floor ${task.toFloor})`;

  const typeLabel = {
    forward_deploy: 'Replenish',
    deliver:        'Guest Delivery',
    retrieve:       'Item Retrieval',
  }[task.type] || task.type;

  const statusBadgeStyle = {
    pending:   { background: 'rgba(245,158,11,0.28)',  color: '#fcd34d' },
    accepted:  { background: 'rgba(43,202,149,0.28)',  color: '#5eead4' },
    completed: { background: 'rgba(52,211,153,0.22)',  color: '#6ee7b7' },
    cancelled: { background: 'rgba(239,68,68,0.2)',    color: '#fca5a5' },
  }[task.status] || {};

  const isCancelled = task.status === 'cancelled';

  return (
    <div className={`rounded-xl p-3 mb-2 bg-lance-surface ${isCancelled ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-2 mb-1.5">
        {TYPE_ICON[task.type]}
        <p className="text-[10px] font-bold uppercase tracking-wide text-lance-text-sub">{typeLabel}</p>
        <span
          className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={statusBadgeStyle}
        >
          {task.status.toUpperCase()}
        </span>
      </div>

      <p className="text-sm font-semibold text-lance-text mb-0.5">{task.label}</p>
      <div className="flex items-center gap-1 text-xs text-lance-text-sub mb-1">
        <span>{fromLabel}</span>
        <span>→</span>
        <span className="font-medium text-lance-text-md">{toLabel}</span>
      </div>
      {task.deadline && (
        <p className="text-[10px] text-lance-gold-lt mb-1.5 flex items-center gap-1">
          <Timer size={10} />
          Due by {new Date(task.deadline).toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' })}
        </p>
      )}
      <p className="text-[10px] text-lance-text-sub mb-2">
        {formatDistanceToNow(task.createdAt, { addSuffix: true })}
      </p>

      <div className="flex gap-2">
        {task.status === 'pending' && (
          <button
            onClick={() => acceptTask(task.id)}
            className="flex-1 py-2 text-xs font-bold rounded-lg transition-all"
            style={{
              color: '#2BCA95',
              background: 'rgba(43,202,149,0.07)',
              boxShadow: 'inset 0 1px 0 rgba(43,202,149,0.15)',
            }}
          >
            Accept Task
          </button>
        )}
        {task.status === 'accepted' && (
          <button
            onClick={() => completeTask(task.id)}
            className="flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all"
            style={{
              color: '#10b981',
              background: 'rgba(16,185,129,0.07)',
              boxShadow: 'inset 0 1px 0 rgba(16,185,129,0.15)',
            }}
          >
            <CheckCircle size={13} /> Mark Delivered
          </button>
        )}
        {isCancelled && (
          <button
            onClick={() => removeTask(task.id)}
            className="flex-1 py-2 text-xs font-bold rounded-lg transition-all"
            style={{ color: '#4a7068', background: 'rgba(0,0,0,0.2)' }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

function NotificationItem({ notif }) {
  const markRead = useStore(s => s.markRead);
  const clearNotification = useStore(s => s.clearNotification);

  const bgStyle = {
    conflict: 'bg-red-950/30',
    reminder: 'bg-lance-gold-dim',
  }[notif.type] || 'bg-lance-surface';

  return (
    <div className={`rounded-xl p-3 mb-2 transition-opacity ${notif.read ? 'opacity-50' : ''} ${bgStyle}`}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex-shrink-0">{NOTIF_ICONS[notif.type] || <Bell size={14} />}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-lance-text leading-snug">{notif.message}</p>
          <p className="text-[10px] text-lance-text-sub mt-1">
            {formatDistanceToNow(notif.createdAt, { addSuffix: true })}
          </p>
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          {!notif.read && (
            <button onClick={() => markRead(notif.id)} className="p-1 text-lance-text-sub hover:text-lance-accent transition-colors">
              <CheckCircle size={13} />
            </button>
          )}
          <button onClick={() => clearNotification(notif.id)} className="p-1 text-lance-text-sub hover:text-red-400 transition-colors text-sm leading-none">
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StaffView() {
  const [tab, setTab] = useState('tasks');
  const tasks = useStore(s => s.tasks);
  const notifications = useStore(s => s.notifications);
  const markAllRead = useStore(s => s.markAllRead);
  const clearAllNotifications = useStore(s => s.clearAllNotifications);
  const clearTasks = useStore(s => s.clearTasks);
  const clearCompletedTasks = useStore(s => s.clearCompletedTasks);
  const unread = useStore(selectors.unreadCount);

  const activeTasks = tasks.filter(t => t.status !== 'completed').sort((a, b) => a.createdAt - b.createdAt);
  const completedTasks = tasks.filter(t => t.status === 'completed').sort((a, b) => b.completedAt - a.completedAt);

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs */}
      <div className="flex px-3 py-2 gap-1 flex-shrink-0 bg-lance-bg">
        {[
          {
            id: 'tasks',
            label: 'Tasks',
            badge: activeTasks.length,
            badgeStyle: { background: 'rgba(245,158,11,0.3)', color: '#fcd34d' },
          },
          {
            id: 'done',
            label: 'Completed',
            badge: completedTasks.length,
            badgeStyle: { background: 'rgba(52,211,153,0.2)', color: '#6ee7b7' },
          },
          {
            id: 'notifs',
            label: 'Alerts',
            badge: unread,
            badgeStyle: { background: 'rgba(239,68,68,0.3)', color: '#fca5a5' },
          },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            style={tab === t.id ? {
              color: '#2BCA95',
              background: 'rgba(43,202,149,0.07)',
              boxShadow: 'inset 0 1px 0 rgba(43,202,149,0.15)',
            } : {
              color: '#4a7068',
              background: 'rgba(0,0,0,0.2)',
            }}
          >
            {t.label}
            {t.badge > 0 && (
              <span
                className="text-[9px] font-bold rounded-full px-1.5 leading-4 min-w-[16px] text-center"
                style={t.badgeStyle}
              >
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollable px-4 py-3">
        {tab === 'tasks' && (
          <>
            {tasks.length > 0 && (
              <button
                onClick={clearTasks}
                className="w-full text-xs text-red-400 font-semibold mb-3 text-right"
              >
                Clear all tasks
              </button>
            )}
            {activeTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-lance-text-sub">
                <CheckCircle size={40} className="mb-3 opacity-20" />
                <p className="text-sm">All clear — no active tasks</p>
              </div>
            )}
            {activeTasks.map(t => <TaskCard key={t.id} task={t} />)}
          </>
        )}

        {tab === 'done' && (
          <>
            {completedTasks.length > 0 && (
              <button
                onClick={clearCompletedTasks}
                className="w-full text-xs text-red-400 font-semibold mb-3 text-right"
              >
                Clear all
              </button>
            )}
            {completedTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-lance-text-sub">
                <Clock size={40} className="mb-3 opacity-20" />
                <p className="text-sm">No completed tasks yet</p>
              </div>
            )}
            {completedTasks.map(t => <TaskCard key={t.id} task={t} />)}
          </>
        )}

        {tab === 'notifs' && (
          <>
            {(() => {
              const conflicts = notifications.filter(n => n.type === 'conflict');
              return (
                <>
                  {conflicts.length > 0 && (
                    <div className="flex items-center justify-between mb-3">
                      {unread > 0 ? (
                        <button onClick={markAllRead} className="text-xs text-lance-accent font-semibold">
                          Mark all read
                        </button>
                      ) : <span />}
                      <button onClick={clearAllNotifications} className="text-xs text-red-400 font-semibold">
                        Clear all
                      </button>
                    </div>
                  )}
                  {conflicts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-lance-text-sub">
                      <BellOff size={40} className="mb-3 opacity-20" />
                      <p className="text-sm">No shortage alerts</p>
                    </div>
                  )}
                  {conflicts.map(n => <NotificationItem key={n.id} notif={n} />)}
                </>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}

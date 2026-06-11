import { useState } from 'react';
import { Bell, CheckCircle, Clock, Truck, Package, AlertTriangle, ChevronRight, BellOff } from 'lucide-react';
import { useStore, selectors } from '../store/useStore';
import { SUPPLY_TYPE_MAP } from '../data/constants';
import { formatDistanceToNow } from 'date-fns';

const TYPE_ICON = {
  forward_deploy: <Truck size={14} className="text-brand-600" />,
  deliver:        <Package size={14} className="text-emerald-600" />,
  retrieve:       <ChevronRight size={14} className="text-slate-400" />,
};

const STATUS_COLORS = {
  pending:   'bg-amber-50 border-amber-200 text-amber-700',
  accepted:  'bg-brand-50 border-brand-200 text-brand-700',
  completed: 'bg-green-50 border-green-200 text-green-700',
};

const NOTIF_ICONS = {
  task:     <Truck size={14} className="text-brand-500" />,
  request:  <Package size={14} className="text-emerald-500" />,
  conflict: <AlertTriangle size={14} className="text-red-500" />,
  reminder: <Bell size={14} className="text-amber-500" />,
};

function TaskCard({ task }) {
  const acceptTask = useStore(s => s.acceptTask);
  const completeTask = useStore(s => s.completeTask);
  const supply = SUPPLY_TYPE_MAP[task.supplyUnitIds ? null : null] || {};

  const fromLabel = task.fromLocation === 'closet'
    ? `Floor ${task.fromFloor} Closet`
    : `Room ${task.fromLocation}`;
  const toLabel = task.toLocation === 'closet'
    ? `Floor ${task.toFloor} Closet`
    : `Room ${task.toLocation} (Floor ${task.toFloor})`;

  const typeLabel = {
    forward_deploy: 'Forward Deploy',
    deliver: 'Guest Delivery',
    retrieve: 'Item Retrieval',
  }[task.type] || task.type;

  return (
    <div className={`rounded-xl border p-3 mb-2 ${STATUS_COLORS[task.status] || 'bg-white border-slate-200'}`}>
      <div className="flex items-center gap-2 mb-1.5">
        {TYPE_ICON[task.type]}
        <p className="text-xs font-bold uppercase tracking-wide opacity-70">{typeLabel}</p>
        <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          task.status === 'pending' ? 'bg-amber-100 text-amber-700' :
          task.status === 'accepted' ? 'bg-brand-100 text-brand-700' :
          'bg-green-100 text-green-700'
        }`}>
          {task.status.toUpperCase()}
        </span>
      </div>

      <p className="text-sm font-semibold text-slate-800 mb-0.5">{task.label}</p>
      <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
        <span>{fromLabel}</span>
        <span>→</span>
        <span className="font-medium text-slate-700">{toLabel}</span>
      </div>
      {task.deadline && (
        <p className="text-[10px] text-amber-600 mb-1.5">
          ⏰ Due by {new Date(task.deadline).toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' })}
        </p>
      )}
      <p className="text-[10px] text-slate-400 mb-2">
        {formatDistanceToNow(task.createdAt, { addSuffix: true })}
      </p>

      <div className="flex gap-2">
        {task.status === 'pending' && (
          <button
            onClick={() => acceptTask(task.id)}
            className="flex-1 py-2 bg-brand-600 text-white text-xs font-bold rounded-lg"
          >
            Accept Task
          </button>
        )}
        {task.status === 'accepted' && (
          <button
            onClick={() => completeTask(task.id)}
            className="flex-1 py-2 bg-green-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1"
          >
            <CheckCircle size={13} /> Mark Delivered
          </button>
        )}
      </div>
    </div>
  );
}

function NotificationItem({ notif }) {
  const markRead = useStore(s => s.markRead);
  const clearNotification = useStore(s => s.clearNotification);

  return (
    <div className={`rounded-xl border p-3 mb-2 transition-opacity ${notif.read ? 'opacity-60' : ''} ${
      notif.type === 'conflict' ? 'bg-red-50 border-red-200' :
      notif.type === 'reminder' ? 'bg-amber-50 border-amber-200' :
      'bg-white border-slate-200'
    }`}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5">{NOTIF_ICONS[notif.type] || <Bell size={14} />}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-700 leading-snug">{notif.message}</p>
          <p className="text-[10px] text-slate-400 mt-1">
            {formatDistanceToNow(notif.createdAt, { addSuffix: true })}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          {!notif.read && (
            <button onClick={() => markRead(notif.id)} className="p-1 text-slate-400 hover:text-brand-500">
              <CheckCircle size={13} />
            </button>
          )}
          <button onClick={() => clearNotification(notif.id)} className="p-1 text-slate-300 hover:text-red-400">
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
  const unread = useStore(selectors.unreadCount);

  const activeTasks = tasks.filter(t => t.status !== 'completed').sort((a, b) => a.createdAt - b.createdAt);
  const completedTasks = tasks.filter(t => t.status === 'completed').sort((a, b) => b.completedAt - a.completedAt);

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs */}
      <div className="bg-white border-b border-slate-100 flex px-3 py-1.5 gap-1 flex-shrink-0">
        {[
          { id: 'tasks', label: `Tasks (${activeTasks.length})` },
          { id: 'done',  label: `Done (${completedTasks.length})` },
          { id: 'notifs', label: unread > 0 ? `Alerts (${unread})` : 'Alerts' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === t.id ? 'bg-brand-600 text-white' : 'text-slate-400 bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollable px-4 py-3">
        {tab === 'tasks' && (
          <>
            {activeTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <CheckCircle size={40} className="mb-3 opacity-20" />
                <p className="text-sm">All clear — no active tasks</p>
              </div>
            )}
            {activeTasks.map(t => <TaskCard key={t.id} task={t} />)}
          </>
        )}

        {tab === 'done' && (
          <>
            {completedTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Clock size={40} className="mb-3 opacity-20" />
                <p className="text-sm">No completed tasks yet</p>
              </div>
            )}
            {completedTasks.map(t => <TaskCard key={t.id} task={t} />)}
          </>
        )}

        {tab === 'notifs' && (
          <>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="w-full text-xs text-brand-600 font-semibold mb-3 text-right"
              >
                Mark all read
              </button>
            )}
            {notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <BellOff size={40} className="mb-3 opacity-20" />
                <p className="text-sm">No notifications</p>
              </div>
            )}
            {notifications.map(n => <NotificationItem key={n.id} notif={n} />)}
          </>
        )}
      </div>
    </div>
  );
}

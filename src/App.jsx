import { useState } from 'react';
import { Users, User, Wrench, X } from 'lucide-react';
import { MdVilla, MdManageAccounts } from 'react-icons/md';
import { useStore, selectors } from './store/useStore';
import SetupView from './views/SetupView';
import StaffView from './views/StaffView';
import GuestView from './views/GuestView';

const TABS = [
  { id: 'staff', label: 'Employee', Icon: Users },
  { id: 'guest', label: 'Guest',    Icon: User  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('staff');
  const [showSetup, setShowSetup] = useState(false);
  const [guestOverlayOpen, setGuestOverlayOpen] = useState(false);
  const [showResetToast, setShowResetToast] = useState(false);
  const unread = useStore(selectors.unreadCount);
  const guestRoom = useStore(s => s.guestRoom);
  const setGuestRoom = useStore(s => s.setGuestRoom);
  const resetAll = useStore(s => s.resetAll);

  const handleConfirmReset = () => {
    resetAll();
    setShowResetToast(false);
    setShowSetup(false);
  };

  const subtitle = activeTab === 'staff' ? 'Task manager' : activeTab === 'guest' ? 'Guest services' : null;

  return (
    <div className="flex flex-col h-screen bg-lance-bg relative">
      {/* Header */}
      <header className="bg-lance-surface px-4 pt-10 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MdVilla size={26} className="text-lance-accent" />
            <div>
              <h1 className="font-bold text-base leading-tight text-lance-text">Claremont Resort & Club</h1>
              <p className="text-[11px] text-lance-text-sub">{subtitle}</p>
            </div>
          </div>
          {/* Staff: wrench opens setup */}
          {activeTab === 'staff' && (
            <button
              onClick={() => setShowSetup(true)}
              className="p-2 text-lance-text-sub hover:text-lance-accent transition-colors"
              aria-label="Open setup"
            >
              <Wrench size={18} />
            </button>
          )}
          {/* Guest + room selected: X exits room view (hidden when overlay is open) */}
          {activeTab === 'guest' && guestRoom && !guestOverlayOpen && (
            <button
              onClick={() => setGuestRoom(null)}
              className="p-2 text-lance-text-sub hover:text-lance-text transition-colors"
              aria-label="Exit room"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'staff' && <StaffView />}
        {activeTab === 'guest' && <GuestView onOpenSetup={() => setShowSetup(true)} onOverlayChange={setGuestOverlayOpen} />}
      </main>

      {/* Footer navigation */}
      <nav
        className="flex-shrink-0 safe-bottom bg-lance-bg"
        style={{ boxShadow: '0 -8px 28px rgba(0,0,0,0.7)', paddingBottom: '25px' }}
      >
        <div className="flex">
          {TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 relative transition-all ${
                  active ? 'text-lance-accent' : 'text-lance-text-sub'
                }`}
              >
                {active && (
                  <span
                    className="absolute inset-x-3 top-0.5 bottom-1 rounded-xl pointer-events-none"
                    style={{ background: 'rgba(43,202,149,0.07)', boxShadow: 'inset 0 1px 0 rgba(43,202,149,0.15)' }}
                  />
                )}
                {active && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-px rounded-full"
                    style={{ background: 'linear-gradient(to right, transparent, #2BCA95, transparent)' }}
                  />
                )}
                <span className="relative z-10">
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                  {id === 'staff' && unread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </span>
                <span className={`text-[10px] font-semibold relative z-10 ${active ? 'text-lance-accent' : 'text-lance-text-sub'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Setup overlay */}
      {showSetup && (
        <div
          className="absolute inset-0 z-50 flex flex-col overflow-hidden"
          style={{ background: '#08090a' }}
        >
          <div className="relative bg-lance-surface px-4 pt-10 pb-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowResetToast(true)}
                className="p-0.5 -m-0.5 rounded-lg transition-opacity active:opacity-50"
                aria-label="Hard reset"
              >
                <MdManageAccounts size={26} className="text-lance-accent" />
              </button>
              <div>
                <h2 className="font-bold text-base leading-tight text-lance-text">Hotel Manager</h2>
                <p className="text-[11px] text-lance-text-sub">Supply management</p>
              </div>
            </div>
            <button
              onClick={() => setShowSetup(false)}
              className="p-2 text-lance-text-sub hover:text-lance-text transition-colors"
              aria-label="Close setup"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden" style={{ background: '#08090a' }}>
            <SetupView />
          </div>

          {/* Hard reset toast */}
          {showResetToast && (
            <div className="absolute inset-0 z-10 flex items-end" style={{ background: 'rgba(0,0,0,0.55)' }}>
              <div
                className="w-full px-4 pb-8 pt-1"
                style={{ background: '#191e21', borderTop: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px 20px 0 0' }}
              >
                <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.15)' }} />
                <p className="text-base font-bold text-white mb-1">Reset all app data?</p>
                <p className="text-sm text-lance-text-sub mb-6 leading-snug">
                  This will wipe all events, inventory, tasks, and guest data. It cannot be undone.
                </p>
                <button
                  onClick={handleConfirmReset}
                  className="w-full py-3 rounded-xl text-sm font-bold mb-3"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
                >
                  Reset everything
                </button>
                <button
                  onClick={() => setShowResetToast(false)}
                  className="w-full py-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#a0b8b2' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

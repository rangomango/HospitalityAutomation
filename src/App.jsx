import { useState } from 'react';
import { Users, User, Wrench, X } from 'lucide-react';
import { useStore, selectors } from './store/useStore';
import SetupView from './views/SetupView';
import StaffView from './views/StaffView';
import GuestView from './views/GuestView';

const TABS = [
  { id: 'staff', label: 'Staff', Icon: Users },
  { id: 'guest', label: 'Guest', Icon: User  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('staff');
  const [showSetup, setShowSetup] = useState(false);
  const unread = useStore(selectors.unreadCount);

  return (
    <div className="flex flex-col h-screen bg-lance-bg relative">
      {/* Header */}
      <header className="bg-lance-surface border-b border-lance-border px-4 pt-10 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🏨</span>
            <div>
              <h1 className="font-bold text-base leading-tight text-lance-text">Hotel Supply Hub</h1>
              <p className="text-lance-text-sub text-xs">Supply Management</p>
            </div>
          </div>
          <button
            onClick={() => setShowSetup(true)}
            className="p-2 rounded-xl bg-lance-elevated border border-lance-border hover:border-lance-accent text-lance-text-md hover:text-lance-accent transition-colors"
            aria-label="Open setup"
          >
            <Wrench size={18} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'staff' && <StaffView />}
        {activeTab === 'guest' && <GuestView />}
      </main>

      {/* Footer navigation */}
      <nav className="bg-lance-surface border-t border-lance-border flex-shrink-0 safe-bottom">
        <div className="flex">
          {TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 relative transition-colors ${
                  active ? 'text-lance-accent' : 'text-lance-text-sub'
                }`}
              >
                <span className="relative">
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                  {id === 'staff' && unread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </span>
                <span className={`text-[10px] font-semibold ${active ? 'text-lance-accent' : 'text-lance-text-sub'}`}>
                  {label}
                </span>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-lance-accent rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Setup overlay */}
      {showSetup && (
        <div className="absolute inset-0 z-50 flex flex-col bg-lance-bg">
          <div className="bg-lance-surface border-b border-lance-border px-4 pt-10 pb-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Wrench size={16} className="text-lance-accent" />
              <h2 className="font-bold text-base text-lance-text">Hotel Setup</h2>
            </div>
            <button
              onClick={() => setShowSetup(false)}
              className="p-2 rounded-xl bg-lance-elevated border border-lance-border text-lance-text-md hover:text-lance-text transition-colors"
              aria-label="Close setup"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <SetupView />
          </div>
        </div>
      )}
    </div>
  );
}

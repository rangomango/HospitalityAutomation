import { useState } from 'react';
import { Settings, Users, User } from 'lucide-react';
import { useStore, selectors } from './store/useStore';
import SetupView from './views/SetupView';
import StaffView from './views/StaffView';
import GuestView from './views/GuestView';

const TABS = [
  { id: 'setup', label: 'Setup',    Icon: Settings },
  { id: 'staff', label: 'Staff',    Icon: Users    },
  { id: 'guest', label: 'Guest',    Icon: User     },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('setup');
  const unread = useStore(selectors.unreadCount);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-brand-600 text-white px-4 pt-10 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏨</span>
          <div>
            <h1 className="font-bold text-lg leading-tight">Hotel Supply Hub</h1>
            <p className="text-brand-100 text-xs">Supply Management Prototype</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'setup' && <SetupView />}
        {activeTab === 'staff' && <StaffView />}
        {activeTab === 'guest' && <GuestView />}
      </main>

      {/* Footer navigation */}
      <nav className="bg-white border-t border-slate-200 flex-shrink-0 safe-bottom">
        <div className="flex">
          {TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 relative transition-colors ${
                  active ? 'text-brand-600' : 'text-slate-400'
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
                <span className={`text-[10px] font-medium ${active ? 'text-brand-600' : 'text-slate-400'}`}>
                  {label}
                </span>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

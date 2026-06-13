import { ArrowRight, ArrowLeft, Plus, Minus, Send } from 'lucide-react';
import { MdHotel, MdAccessTime, MdLocalShipping, MdCheckCircle, MdNotificationsActive, MdRoomService, MdExplore, MdRestaurant, MdLocalCafe, MdPark, MdMuseum, MdDirectionsWalk, MdOpenInNew, MdChat } from 'react-icons/md';
import { useStore } from '../store/useStore';
import { SUPPLY_TYPES, SUPPLY_TYPE_MAP } from '../data/constants';
import { SupplyIcon } from '../components/SupplyIcon';
import { formatDistanceToNow } from 'date-fns';
import { useState, useRef, useEffect } from 'react';

const ROOM_SERVICE_MENU = [
  {
    category: 'Breakfast',
    items: [
      { id: 'eggs_ben',  name: 'Classic Eggs Benedict',  desc: 'Poached eggs, Canadian bacon, hollandaise',          price: 22 },
      { id: 'fr_toast',  name: 'Brioche French Toast',   desc: 'Whipped cream, seasonal berries, maple syrup',       price: 18 },
      { id: 'avo_toast', name: 'Avocado Toast',          desc: 'Multigrain, heirloom tomatoes, micro greens',        price: 16 },
    ],
  },
  {
    category: 'Lunch & Dinner',
    items: [
      { id: 'club',    name: 'Club Sandwich',  desc: 'Turkey, bacon, avocado, house-baked bread',              price: 24 },
      { id: 'caesar',  name: 'Caesar Salad',   desc: 'Romaine, parmesan, house caesar, focaccia croutons',    price: 18 },
      { id: 'salmon',  name: 'Grilled Salmon', desc: 'Lemon butter, seasonal vegetables, wild rice',          price: 36 },
    ],
  },
  {
    category: 'Beverages',
    items: [
      { id: 'water',  name: 'Still or Sparkling Water', desc: 'Chilled, 500ml',                      price: 6 },
      { id: 'oj',     name: 'Fresh Orange Juice',       desc: 'Freshly squeezed, 12 oz',             price: 8 },
      { id: 'coffee', name: 'Coffee or Tea',            desc: 'Locally sourced, served with cream',  price: 5 },
    ],
  },
  {
    category: 'Desserts',
    items: [
      { id: 'lava',   name: 'Chocolate Lava Cake', desc: 'Warm, vanilla bean ice cream',       price: 14 },
      { id: 'sorbet', name: 'Seasonal Sorbet',     desc: 'Three scoops, fresh fruit garnish',  price: 12 },
    ],
  },
];

function RoomEntry() {
  const setGuestRoom = useStore(s => s.setGuestRoom);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = parseInt(input);
    if (isNaN(num) || num < 101 || num > 520) {
      setError('Enter a valid room number (101–520)');
      return;
    }
    const floor = Math.floor(num / 100);
    const room = num % 100;
    if (floor < 1 || floor > 5 || room < 1 || room > 20) {
      setError('Room must be 101–120, 201–220, … 501–520');
      return;
    }
    setGuestRoom(num);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <MdHotel size={52} className="text-lance-accent mb-4" />
      <h2 className="text-xl font-bold text-lance-text mb-1">Welcome</h2>
      <p className="text-sm text-lance-text-md mb-6">Enter your room number to see available supplies and request items.</p>
      <form onSubmit={handleSubmit} className="w-full max-w-xs">
        <input
          type="number"
          placeholder="e.g. 301"
          className="w-full bg-transparent border border-lance-border rounded-xl px-4 py-3 text-center text-lg font-semibold text-lance-text placeholder-lance-text-sub focus:outline-none focus:border-lance-accent mb-3 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          value={input}
          onChange={e => { setInput(e.target.value); setError(''); }}
        />
        {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
        <button
          type="submit"
          className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
          style={{
            color: '#2BCA95',
            background: 'rgba(43,202,149,0.07)',
            boxShadow: 'inset 0 1px 0 rgba(43,202,149,0.15)',
          }}
        >
          Continue <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}

function SupplyCard({ type, floor, guestRoom }) {
  const requests = useStore(s => s.requests);
  const createRequest = useStore(s => s.createRequest);
  const cancelRequest = useStore(s => s.cancelRequest);

  const myRequest = requests.find(
    r => r.guestRoom === guestRoom && r.typeId === type.id && r.status !== 'returned'
  );
  const canCancel = myRequest && (myRequest.status === 'pending' || myRequest.status === 'assigned');

  const isReminder = myRequest?.status === 'delivered' && myRequest?.reminderSent;

  const statusMap = myRequest ? {
    pending:   { text: `Requested ${formatDistanceToNow(myRequest.requestedAt, { addSuffix: true })}`, icon: <MdAccessTime size={13} />,       cls: 'text-lance-text-sub',   iconBg: 'rgba(74,112,104,0.2)' },
    assigned:  { text: 'On the way',  icon: <MdLocalShipping size={13} />,     cls: 'text-lance-accent-lt',  iconBg: 'rgba(43,202,149,0.15)' },
    delivered: { text: 'Delivered',   icon: <MdCheckCircle size={13} />,        cls: 'text-lance-text-sub',   iconBg: 'rgba(52,211,153,0.13)' },
    returned:  null,
  }[myRequest.status] : null;

  const statusEntry = isReminder
    ? { text: 'Please place the item outside your door for pickup when done.', icon: <MdNotificationsActive size={13} />, cls: 'text-lance-gold-lt', iconBg: 'rgba(201,144,47,0.18)' }
    : statusMap;

  return (
    <div className="bg-lance-surface rounded-xl p-3 mb-2">
      <div className="flex items-center gap-3">
        <SupplyIcon typeId={type.id} size={24} className="text-lance-accent flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-lance-text text-sm">{type.name}</p>
        </div>
        <div className="flex-shrink-0">
          {!myRequest && (
            <button
              onClick={() => createRequest(guestRoom, floor, type.id)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{
                color: '#2BCA95',
                background: 'rgba(43,202,149,0.07)',
                boxShadow: 'inset 0 1px 0 rgba(43,202,149,0.15)',
              }}
            >
              Request
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => cancelRequest(myRequest.id)}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all"
              style={{ color: '#4a7068', background: 'rgba(0,0,0,0.2)' }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {statusEntry && (
        <div className={`flex items-center gap-3 text-xs mt-1.5 ${statusEntry.cls}`}>
          <span
            className="w-6 h-[22px] flex justify-center items-center flex-shrink-0 rounded-md"
            style={{ background: statusEntry.iconBg }}
          >
            {statusEntry.icon}
          </span>
          <span className="font-light">{statusEntry.text}</span>
        </div>
      )}
    </div>
  );
}

function RoomServiceView({ guestRoom, onClose }) {
  const [cart, setCart] = useState({});
  const [ordered, setOrdered] = useState(false);

  const addItem = (id) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const removeItem = (id) => setCart(c => {
    if (!c[id] || c[id] <= 1) { const { [id]: _, ...rest } = c; return rest; }
    return { ...c, [id]: c[id] - 1 };
  });

  const allItems = ROOM_SERVICE_MENU.flatMap(s => s.items);
  const total = allItems.reduce((sum, item) => sum + (cart[item.id] || 0) * item.price, 0);
  const itemCount = Object.values(cart).reduce((s, q) => s + q, 0);

  const handleOrder = () => {
    if (!itemCount) return;
    setOrdered(true);
    setTimeout(() => { setOrdered(false); setCart({}); }, 3000);
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col" style={{ background: '#08090a' }}>
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 flex-shrink-0 bg-lance-surface">
        <button
          onClick={onClose}
          className="p-1.5 text-lance-text-sub hover:text-lance-text transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <MdRoomService size={20} className="text-lance-accent" />
        <div>
          <h2 className="font-bold text-base leading-tight text-lance-text">Room Service</h2>
          <p className="text-[11px] text-lance-text-sub">Room {guestRoom}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollable px-4 pb-36">
        {ROOM_SERVICE_MENU.map(section => (
          <div key={section.category} className="mt-4">
            <p className="text-[11px] font-bold text-lance-accent uppercase tracking-wide mb-2">
              {section.category}
            </p>
            {section.items.map(item => (
              <div key={item.id} className="bg-lance-surface rounded-xl p-3 mb-2 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-lance-text">{item.name}</p>
                  <p className="text-[11px] text-lance-text-sub mt-0.5 leading-snug">{item.desc}</p>
                  <p className="text-sm font-bold mt-1.5" style={{ color: '#e8b254' }}>${item.price}</p>
                </div>
                <div className="flex-shrink-0 flex items-center mt-1">
                  {!cart[item.id] ? (
                    <button
                      onClick={() => addItem(item.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                      style={{ color: '#2BCA95', background: 'rgba(43,202,149,0.07)', boxShadow: 'inset 0 1px 0 rgba(43,202,149,0.15)' }}
                    >
                      Add
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: 'rgba(0,0,0,0.3)', color: '#4a7068' }}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-bold text-lance-text w-4 text-center">{cart[item.id]}</span>
                      <button
                        onClick={() => addItem(item.id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: 'rgba(43,202,149,0.12)', color: '#2BCA95' }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-8 flex-shrink-0"
        style={{ background: 'linear-gradient(to top, #08090a 70%, transparent)' }}
      >
        {itemCount > 0 && (
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs text-lance-text-sub">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
            <p className="text-base font-bold text-lance-text">${total.toFixed(2)}</p>
          </div>
        )}
        <button
          onClick={handleOrder}
          disabled={!itemCount}
          className="w-full py-3 rounded-xl text-sm font-bold transition-all"
          style={
            ordered
              ? { color: '#2BCA95', background: 'rgba(43,202,149,0.1)', boxShadow: 'inset 0 1px 0 rgba(43,202,149,0.15)' }
              : itemCount
                ? { background: '#2BCA95', color: '#08090a' }
                : { background: 'rgba(0,0,0,0.2)', color: '#4a7068' }
          }
        >
          {ordered ? '✓ Order placed!' : itemCount ? `Place Order · $${total.toFixed(2)}` : 'Select items to order'}
        </button>
      </div>
    </div>
  );
}

function ChatView({ guestRoom, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      from: 'hotel',
      text: `Welcome to the Claremont Resort & Spa! 🏨 How can we help you today?`,
      time: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const guestMsg = { id: `g-${Date.now()}`, from: 'guest', text, time: Date.now() };
    setMessages(m => [...m, guestMsg]);
    setInput('');
    setTimeout(() => {
      setMessages(m => [...m, {
        id: `h-${Date.now()}`,
        from: 'hotel',
        text: "Thank you for reaching out! A member of our concierge team will respond shortly. Is there anything else we can help with?",
        time: Date.now(),
      }]);
    }, 1200);
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col" style={{ background: '#08090a' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 flex-shrink-0 bg-lance-surface">
        <button onClick={onClose} className="p-1.5 text-lance-text-sub hover:text-lance-text transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(43,202,149,0.15)' }}>
          <MdChat size={19} className="text-lance-accent" />
        </div>
        <div>
          <h2 className="font-bold text-sm leading-tight text-lance-text">Hotel Concierge</h2>
          <p className="text-[11px] text-lance-text-sub">Room {guestRoom} · Typically replies in minutes</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollable px-4 py-4 flex flex-col gap-2">
        {messages.map((msg, i) => {
          const isGuest = msg.from === 'guest';
          const showAvatar = !isGuest && (i === 0 || messages[i - 1]?.from === 'guest');
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isGuest ? 'justify-end' : 'justify-start'}`}>
              {!isGuest && (
                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mb-0.5 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}
                  style={{ background: 'rgba(43,202,149,0.15)' }}>
                  <MdChat size={12} className="text-lance-accent" />
                </div>
              )}
              <div
                className="max-w-[72%] px-3.5 py-2.5 text-sm leading-snug"
                style={isGuest ? {
                  background: '#2BCA95',
                  color: '#08090a',
                  borderRadius: '18px 18px 4px 18px',
                  fontWeight: 500,
                } : {
                  background: '#1e2528',
                  color: '#ffffff',
                  borderRadius: '18px 18px 18px 4px',
                }}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-3 py-3 flex items-center gap-2 flex-shrink-0 bg-lance-surface">
        <input
          type="text"
          placeholder="Message…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          className="flex-1 text-sm text-lance-text placeholder-lance-text-sub focus:outline-none px-4 py-2 rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        />
        <button
          onClick={send}
          disabled={!input.trim()}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
          style={input.trim()
            ? { background: '#2BCA95', color: '#08090a' }
            : { background: 'rgba(0,0,0,0.25)', color: '#4a7068' }}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

const LOCAL_GUIDE = [
  {
    category: 'Dining',
    Icon: MdRestaurant,
    places: [
      { name: 'Chez Panisse',        desc: 'Iconic farm-to-table fine dining by Alice Waters',  dist: '1.5 mi' },
      { name: 'Cheeseboard Pizza',   desc: 'Beloved vegetarian pizza collective, always a line', dist: '1.8 mi' },
      { name: 'The Ramen Shop',      desc: 'Japanese ramen with local California ingredients',   dist: '2.1 mi' },
      { name: 'Gather Restaurant',   desc: 'Plant-forward seasonal menu, great cocktails',       dist: '1.9 mi' },
    ],
  },
  {
    category: 'Coffee & Cafés',
    Icon: MdLocalCafe,
    places: [
      { name: 'Elmwood Café',        desc: 'Cozy neighborhood spot, excellent espresso',         dist: '1.6 mi' },
      { name: 'Philz Coffee',        desc: 'Hand-crafted pour-over with creative blends',        dist: '2.3 mi' },
    ],
  },
  {
    category: 'Outdoors',
    Icon: MdPark,
    places: [
      { name: 'Tilden Regional Park', desc: 'Scenic trails, lake, botanical garden & golf',     dist: '1.5 mi' },
      { name: 'Lake Merritt',         desc: 'Scenic urban lake with 3.4-mile walking path',     dist: '3.2 mi' },
      { name: 'Claremont Canyon',     desc: 'Trailhead steps from the resort, panoramic views', dist: '0.2 mi' },
    ],
  },
  {
    category: 'Culture',
    Icon: MdMuseum,
    places: [
      { name: 'Oakland Museum of CA', desc: 'Art, history & natural science under one roof',    dist: '3.5 mi' },
      { name: 'UC Botanical Garden',  desc: '34-acre garden with 13,000 plant species',         dist: '1.2 mi' },
      { name: 'Berkeley Art Museum',  desc: 'Contemporary & modern art on the UC campus',       dist: '2.0 mi' },
    ],
  },
  {
    category: 'Shopping',
    Icon: MdDirectionsWalk,
    places: [
      { name: 'Rockridge Market Hall', desc: 'Artisan food shops, butcher, bakery & wine',      dist: '2.0 mi' },
      { name: 'College Ave Strip',     desc: 'Independent boutiques, bookstores & cafés',       dist: '1.7 mi' },
    ],
  },
];

function LocalGuideView({ onClose }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col" style={{ background: '#08090a' }}>
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 flex-shrink-0 bg-lance-surface">
        <button
          onClick={onClose}
          className="p-1.5 text-lance-text-sub hover:text-lance-text transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <MdExplore size={20} className="text-lance-accent" />
        <div>
          <h2 className="font-bold text-base leading-tight text-lance-text">Local Guide</h2>
          <p className="text-[11px] text-lance-text-sub">Berkeley Hills &amp; Oakland</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollable px-4 pb-4">
        <a
          href="https://maps.app.goo.gl/F5MJeeQj39ySxcGn7"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full mt-3 mb-4 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(43,202,149,0.07)', boxShadow: 'inset 0 1px 0 rgba(43,202,149,0.15)' }}
        >
          <div className="flex items-center gap-2.5">
            <MdExplore size={18} className="text-lance-accent" />
            <div>
              <p className="text-xs font-bold text-lance-accent">View full guide on Google Maps</p>
              <p className="text-[10px] text-lance-text-sub">Curated by Claremont Resort</p>
            </div>
          </div>
          <MdOpenInNew size={14} className="text-lance-text-sub flex-shrink-0" />
        </a>

        {LOCAL_GUIDE.map(({ category, Icon, places }) => (
          <div key={category} className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon size={13} className="text-lance-accent" />
              <p className="text-[11px] font-bold text-lance-accent uppercase tracking-wide">{category}</p>
            </div>
            {places.map(place => (
              <div key={place.name} className="bg-lance-surface rounded-xl px-3 py-2.5 mb-1.5 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-lance-text">{place.name}</p>
                  <p className="text-[11px] text-lance-text-sub mt-0.5 leading-snug">{place.desc}</p>
                </div>
                <span className="text-[10px] text-lance-text-sub font-medium flex-shrink-0 mt-0.5">{place.dist}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function GuestToggles({ onRoomService, onLocalGuide }) {
  return (
    <div className="flex gap-2 mt-3">
      <button
        onClick={onRoomService}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all"
        style={{ color: '#4a7068', background: 'rgba(0,0,0,0.2)' }}
      >
        <MdRoomService size={16} />
        Room Service
      </button>
      <button
        onClick={onLocalGuide}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all"
        style={{ color: '#4a7068', background: 'rgba(0,0,0,0.2)' }}
      >
        <MdExplore size={16} />
        Local Guide
      </button>
    </div>
  );
}

function DevPanel({ guestRoom, onOpenSetup }) {
  const requests = useStore(s => s.requests);
  const triggerReminder = useStore(s => s.triggerReturnReminder);
  const resetGuestRoom = useStore(s => s.resetGuestRoom);
  const delivered = requests.filter(r => r.guestRoom === guestRoom && r.status === 'delivered' && !r.reminderSent);

  const btnCls = 'w-full text-left text-xs text-lance-text-sub px-3 py-2 rounded-lg transition-colors';
  const btnStyle = { background: 'rgba(255,255,255,0.04)' };

  return (
    <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <p className="text-[10px] font-semibold text-lance-text-sub uppercase tracking-widest mb-2">Dev</p>
      <button onClick={() => resetGuestRoom(guestRoom)} className={`${btnCls} mb-1`} style={btnStyle}>
        Reset room
      </button>
      <button onClick={onOpenSetup} className={`${btnCls} mb-1`} style={btnStyle}>
        View setup
      </button>
      {delivered.map(r => (
        <button
          key={r.id}
          onClick={() => triggerReminder(r.id)}
          className={`${btnCls} mt-1`}
          style={btnStyle}
        >
          Trigger 24h reminder: {SUPPLY_TYPE_MAP[r.typeId]?.name}
        </button>
      ))}
    </div>
  );
}

export default function GuestView({ onOpenSetup }) {
  const guestRoom = useStore(s => s.guestRoom);
  const events = useStore(s => s.events);
  const [showRoomService, setShowRoomService] = useState(false);
  const [showLocalGuide, setShowLocalGuide] = useState(false);
  const [showChat, setShowChat] = useState(false);

  if (!guestRoom) return <RoomEntry />;

  const floor = Math.floor(guestRoom / 100);
  const matchingEvent = events.find(e => e.rooms?.includes(guestRoom));
  const garmentCare = SUPPLY_TYPES.filter(t => t.category === 'room_equipment');
  const personalCare = SUPPLY_TYPES.filter(t => t.category === 'personal_care');

  return (
    <div className="relative flex flex-col h-full">
      {/* Room header */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        {matchingEvent && (
          <div className="relative rounded-xl overflow-hidden mb-2">
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
              {[
                {cx:'3%',cy:'30%',r:2},{cx:'7%',cy:'72%',r:3.5},{cx:'11%',cy:'20%',r:1.5},{cx:'14%',cy:'55%',r:4},
                {cx:'18%',cy:'85%',r:2.5},{cx:'22%',cy:'38%',r:5},{cx:'26%',cy:'65%',r:2},{cx:'29%',cy:'15%',r:3},
                {cx:'33%',cy:'80%',r:1.5},{cx:'37%',cy:'45%',r:4.5},{cx:'41%',cy:'25%',r:2},{cx:'44%',cy:'70%',r:3},
                {cx:'48%',cy:'90%',r:1.5},{cx:'51%',cy:'40%',r:5.5},{cx:'55%',cy:'60%',r:2},{cx:'58%',cy:'20%',r:3.5},
                {cx:'62%',cy:'75%',r:2.5},{cx:'65%',cy:'50%',r:4},{cx:'69%',cy:'85%',r:1.5},{cx:'72%',cy:'30%',r:3},
                {cx:'76%',cy:'65%',r:5},{cx:'79%',cy:'15%',r:2},{cx:'83%',cy:'55%',r:3.5},{cx:'86%',cy:'80%',r:2},
                {cx:'90%',cy:'35%',r:4},{cx:'93%',cy:'70%',r:1.5},{cx:'97%',cy:'50%',r:3},
                {cx:'5%',cy:'55%',r:1.5},{cx:'16%',cy:'28%',r:2},{cx:'35%',cy:'60%',r:2},{cx:'53%',cy:'82%',r:2.5},
                {cx:'67%',cy:'40%',r:1.5},{cx:'81%',cy:'22%',r:2.5},{cx:'95%',cy:'75%',r:2},
              ].map((d, i) => (
                <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={`rgba(232,178,84,${0.234 + (d.r / 19.2)})`} />
              ))}
            </svg>
            <div className="relative z-10 flex justify-center px-4 py-2.5">
              <span
                className="text-sm font-semibold px-4 py-1 rounded-lg"
                style={{ color: '#23a87c', background: 'rgba(0,0,0,0.8)' }}
              >
                Welcome {matchingEvent.name} party
              </span>
            </div>
          </div>
        )}
        <div className="bg-lance-surface rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-lance-text-sub font-medium">Your Room</p>
            <p className="text-xl font-bold text-white">{guestRoom}</p>
            <p className="text-xs text-lance-text-sub">Floor {floor}</p>
          </div>
          <button
            onClick={() => setShowChat(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{ background: 'rgba(43,202,149,0.1)', color: '#2BCA95' }}
            aria-label="Open chat"
          >
            <MdChat size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollable px-4 pb-4">
        {garmentCare.length > 0 && (
          <>
            <p className="text-[11px] font-bold text-lance-accent uppercase tracking-wide mb-1.5 mt-1">Garment Care</p>
            {garmentCare.map(type => (
              <SupplyCard key={type.id} type={type} floor={floor} guestRoom={guestRoom} />
            ))}
          </>
        )}

        {personalCare.length > 0 && (
          <>
            <p className="text-[11px] font-bold text-lance-accent-lt uppercase tracking-wide mb-1.5 mt-3">Personal Care</p>
            {personalCare.map(type => (
              <SupplyCard key={type.id} type={type} floor={floor} guestRoom={guestRoom} />
            ))}
          </>
        )}

        <GuestToggles
          onRoomService={() => setShowRoomService(true)}
          onLocalGuide={() => setShowLocalGuide(true)}
        />
        <DevPanel guestRoom={guestRoom} onOpenSetup={onOpenSetup} />
      </div>

      {showRoomService && (
        <RoomServiceView guestRoom={guestRoom} onClose={() => setShowRoomService(false)} />
      )}
      {showLocalGuide && (
        <LocalGuideView onClose={() => setShowLocalGuide(false)} />
      )}
      {showChat && (
        <ChatView guestRoom={guestRoom} onClose={() => setShowChat(false)} />
      )}
    </div>
  );
}

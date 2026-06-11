export const SUPPLY_TYPES = [
  // Room Equipment
  { id: 'iron',       name: 'Iron',          category: 'room_equipment', emoji: '🧲', svgIcon: 'iron'    },
  { id: 'iron_board', name: 'Ironing Board', category: 'room_equipment', emoji: '📐', svgIcon: 'board'   },
  { id: 'steamer',    name: 'Steamer',        category: 'room_equipment', emoji: '💨', svgIcon: 'steamer' },
  // Personal Care
  { id: 'toothbrush',    name: 'Toothbrush',    category: 'personal_care', emoji: '🪥' },
  { id: 'razor',         name: 'Razor',          category: 'personal_care', emoji: '🪒' },
  { id: 'shaving_cream', name: 'Shaving Cream',  category: 'personal_care', emoji: '🫧' },
];

export const SUPPLY_TYPE_MAP = Object.fromEntries(SUPPLY_TYPES.map(t => [t.id, t]));

export const FLOORS = [1, 2, 3, 4, 5];
export const ROOMS_PER_FLOOR = 20;

export const generateRooms = () => {
  const rooms = [];
  for (let floor = 1; floor <= 5; floor++) {
    for (let n = 1; n <= 20; n++) {
      rooms.push({
        id: floor * 100 + n,
        floor,
        number: n,
        label: `${floor}${String(n).padStart(2, '0')}`,
      });
    }
  }
  return rooms;
};

export const EVENT_TYPES = ['Wedding', 'Conference', 'Birthday', 'Corporate', 'Reunion', 'Other'];

export const ROOMS = generateRooms();

// How many of each supply type a guest-room might need
export const SUPPLY_NEED = {
  iron:          1,
  iron_board:    1,
  steamer:       1,
  toothbrush:    2,
  razor:         2,
  shaving_cream: 1,
};

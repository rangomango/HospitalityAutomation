export const SUPPLY_TYPES = [
  // Room Equipment
  { id: 'iron',          name: 'Iron',          plural: 'Irons',          category: 'room_equipment' },
  { id: 'iron_board',    name: 'Ironing Board', plural: 'Ironing Boards', category: 'room_equipment' },
  { id: 'steamer',       name: 'Steamer',       plural: 'Steamers',       category: 'room_equipment' },
  // Personal Care
  { id: 'toothbrush',    name: 'Toothbrush',    plural: 'Toothbrushes',   category: 'personal_care'  },
  { id: 'razor',         name: 'Razor',         plural: 'Razors',         category: 'personal_care'  },
  { id: 'shaving_cream', name: 'Shaving Cream', plural: 'Shaving Cream',  category: 'personal_care'  },
];

export const SUPPLY_TYPE_MAP = Object.fromEntries(SUPPLY_TYPES.map(t => [t.id, t]));

export function pluralName(typeId, count) {
  const type = SUPPLY_TYPE_MAP[typeId];
  if (!type) return '';
  return count === 1 ? type.name : (type.plural ?? type.name + 's');
}

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

import {
  MdIron,
  MdDry,
  MdShower,
  MdSpa,
  MdContentCut,
  MdSoap,
  MdInventory2,
} from 'react-icons/md';

const ICON_MAP = {
  iron:          MdIron,
  iron_board:    MdDry,
  steamer:       MdShower,
  toothbrush:    MdSpa,
  razor:         MdContentCut,
  shaving_cream: MdSoap,
};

// Short codes for SVG contexts where React components can't render
export const SUPPLY_ABBR = {
  iron:          'IR',
  iron_board:    'IB',
  steamer:       'ST',
  toothbrush:    'TB',
  razor:         'RZ',
  shaving_cream: 'SC',
};

export function SupplyIcon({ typeId, size = 20, className = '' }) {
  const Icon = ICON_MAP[typeId] || MdInventory2;
  return <Icon size={size} className={className} />;
}

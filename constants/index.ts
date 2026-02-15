// constants/index.ts

import { Category, CategoryItem, City } from '../types';

export const Colors = {
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  primaryDark: '#1B5E20',
  cta: '#F9A825',
  white: '#FFFFFF',
  black: '#000000',
  light: {
    background: '#F5F5F5', surface: '#FFFFFF', text: '#1A1A1A',
    textSecondary: '#666666', border: '#E0E0E0', card: '#FFFFFF',
  },
  dark: {
    background: '#0D0D0D', surface: '#1E1E1E', text: '#F5F5F5',
    textSecondary: '#AAAAAA', border: '#333333', card: '#1E1E1E',
  },
};

export const CATEGORIES: CategoryItem[] = [
  { label: 'Alimentation',  icon: '🍽️', color: '#E65100' },  // maquis, restaurants, street food
  { label: 'Mode & Tissus', icon: '👔', color: '#6A1B9A' },  // faso dan fani, pagnes, tailleurs
  { label: 'Électronique',  icon: '📱', color: '#1565C0' },  // téléphones, réparations
  { label: 'Services',      icon: '🔧', color: '#00695C' },  // plombiers, électriciens, menuisiers
  { label: 'Transport',     icon: '🎫', color: '#F57F17' },  // zémidjans, taxis, location motos
  { label: 'Beauté',        icon: '💈', color: '#AD1457' },  // coiffure, salons, soins
  { label: 'Santé',         icon: '🏥', color: '#00838F' },  // cliniques, pharmacies, tradipraticiens
  { label: 'Agriculture',   icon: '🌾', color: '#558B2F' },  // vivriers, maraîchage, élevage
  { label: 'Artisanat',     icon: '🪘', color: '#A0522D' },  // sculpture, bijoux, poterie, bronze
  { label: 'Éducation',     icon: '📚', color: '#1976D2' },  // écoles, cours particuliers, formations
  { label: 'Immobilier',    icon: '🏠', color: '#455A64' },  // locations, ventes, construction
  { label: 'Autre',         icon: '📦', color: '#37474F' },
];

export const CITIES: City[] = [
  'Ouagadougou', 'Bobo-Dioulasso', 'Koudougou',
  'Banfora', 'Ouahigouya', 'Autre',
];

export const WHATSAPP_GREETING = 'Bonjour, j\'ai trouvé votre entreprise sur BurkinaBizz 🇧🇫. Je voudrais avoir plus d\'informations.';

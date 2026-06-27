// constants/index.ts

import { Category, CategoryItem, City } from '../types/index';

export const Colors = {
  primary: '#2E7D32',       // Forest green - main brand color
  primaryLight: '#66BB6A',  // Lighter, more vibrant green
  primaryDark: '#1B5E20',   // Deep forest green
  cta: '#FFA726',          // Warm orange for call-to-action
  white: '#FFFFFF',
  black: '#1A1A1A',        // Softer black for better readability
  
  light: {
    background: '#d2dfc0',    // Fallback solid color
    backgroundGradient: ['#e1ebdf', '#dcdec0', '#b5e49d'], // Gradient array
    surface: '#ffffff',       // Pure white surfaces (no transparency)
    text: '#1A1A1A',          // Dark text
    textSecondary: '#252629fc', // Cool gray for secondary text
    border: '#E5E7EB',        // Light gray borders
    card: '#FFFFFF',          // Pure white cards for clarity
  },
  dark: {
    background: '#c4e1b8',    // Fallback solid color
    backgroundGradient: ['#e1ebdf', '#dcdec0', '#b5e49d'], // Gradient array
    surface: '#FFFFFF',       // Pure white surfaces (no transparency)
    text: '#1A1A1A',          // Dark text
    textSecondary: '#252629fc', // Cool gray for secondary text
    border: '#E5E7EB',        // Light gray borders
    card: '#FFFFFF',          // Pure white cards for clarity
  },
};

// Refined color palette with real icon names (Tailwind-inspired)
export const CATEGORIES: CategoryItem[] = [
  { label: 'Shopping',           icon: 'shopping-bag',         iconFamily: 'MaterialIcons', color: '#F97316' },
  { label: 'Restauration',       icon: 'restaurant',           iconFamily: 'MaterialIcons', color: '#8B5CF6' },
  { label: 'Hôtellerie',         icon: 'hotel',                iconFamily: 'MaterialIcons', color: '#3B82F6' },
  { label: 'Sport-Gym',          icon: 'fitness-center',       iconFamily: 'MaterialIcons', color: '#0EA5E9' },
  { label: 'Résidence meublée',  icon: 'apartment',            iconFamily: 'MaterialIcons', color: '#6366F1' },
  { label: 'Electroniques',      icon: 'devices',              iconFamily: 'MaterialIcons', color: '#F59E0B' },
  { label: 'Coiffure & Beauté',  icon: 'content-cut',          iconFamily: 'MaterialIcons', color: '#EC4899' },
  { label: 'Pharmacies',         icon: 'local-pharmacy',       iconFamily: 'MaterialIcons', color: '#06B6D4' },
  { label: 'Produits Locaux',    icon: 'eco',                  iconFamily: 'MaterialIcons', color: '#163dcc' },
  { label: 'Soirées',            icon: 'nightlife',            iconFamily: 'MaterialIcons', color: '#A855F7' },
  { label: 'Attractions',        icon: 'place',                iconFamily: 'MaterialIcons', color: '#0284C7' },
  { label: 'Immobilier',         icon: 'home-work',            iconFamily: 'MaterialIcons', color: '#64748B' },
  { label: 'Alimentation',       icon: 'local-grocery-store',  iconFamily: 'MaterialIcons', color: '#6B7280' },
  { label: 'Services',           icon: 'build',                iconFamily: 'MaterialIcons', color: '#10B981' },
  { label: 'Automobile',         icon: 'directions-car',       iconFamily: 'MaterialIcons', color: '#EF4444' },
  { label: 'Autres',             icon: 'more-horiz',           iconFamily: 'MaterialIcons', color: '#6B7280' },
];

export const CITIES: City[] = [
  'Ouagadougou', 'Bobo-Dioulasso'
];

// City-specific category mapping
export const CITY_CATEGORIES: { [key: string]: Category[] } = {
  'Ouagadougou': [
    'Shopping', 'Restauration', 'Hôtellerie', 'Sport-Gym', 'Résidence meublée',
    'Electroniques', 'Coiffure & Beauté', 'Pharmacies', 'Produits Locaux',
    'Soirées', 'Attractions', 'Immobilier', 'Alimentation', 'Services',
    'Automobile', 'Autres'
  ],
  'Bobo-Dioulasso': [
    'Shopping', 'Restauration', 'Hôtellerie', 'Sport-Gym', 'Résidence meublée',
    'Electroniques', 'Coiffure & Beauté', 'Pharmacies', 'Produits Locaux',
    'Soirées', 'Attractions', 'Immobilier', 'Alimentation', 'Services',
    'Automobile', 'Autres'
  ],
};

// City display info with photos for home screen
export const CITY_INFO = [
  {
    name: 'Burkina Faso',
    cities: ['Ouagadougou', 'Bobo-Dioulasso'],
    image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80',
    description: 'Entreprises au Burkina Faso'
  },
];

export const WHATSAPP_GREETING = 'Bonjour, j\'ai trouvé votre entreprise sur BurkinaBizz 🇧🇫. Je voudrais avoir plus d\'informations.';

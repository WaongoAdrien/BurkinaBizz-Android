// types/index.ts

export interface BusinessLocation {
  address?: string;          // typed address string
  latitude?: number;
  longitude?: number;
}

export interface Business {
  id: string;
  name: string;
  category: Category;
  categories?: Category[];     // NEW: Multiple categories
  description: string;
  city: City;
  phone: string;
  whatsapp?: string;
  strictWhatsapp?: boolean; // NEW: when true, don't fall back to `phone` for the WhatsApp button — only businesses created after this flag was introduced have it
  facebook?: string;
  instagram?: string;
  website?: string;        // NEW: business website URL
  photos: string[];        // array of image URLs
  coverPhoto: string;      // first photo or main image
  location?: BusinessLocation;  // optional GPS/address
  ownerId: string;
  ownerName: string;
  status: 'pending' | 'approved';
  createdAt: string | Date;
  pinned?: boolean;        // admin pin to top
  priority?: number;       // NEW: manual ordering (0-100, higher = appears first)
    verified?: boolean;  // NEW: admin verified status
}

export interface User {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: 'pending' | 'vendor' | 'admin';
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: Category;
  city: City;
  imageUrl?: string;
  price: number;
  createdAt?: string | Date;
}


export type Category =
  | 'Shopping'
  | 'Restauration'
  | 'Hôtellerie'
  |'Sport-Gym'
  | 'Résidence meublée'
  | 'Services'
  | 'Electroniques'
  | 'Coiffure & Beauté'
  | 'Pharmacies'
  | 'Produits Locaux'
  | 'Soirées'
  | 'Attractions'
  | 'Immobilier'
  | 'Alimentation'
  | 'Automobile'
  | 'Autres';

export type City =
  | 'Ouagadougou'
  | 'Bobo-Dioulasso'
  | 'China'
  | 'New York'
  | 'South Korea';

export interface CategoryItem {
  label: Category;
  icon: string;
  iconFamily: 'Ionicons' | 'MaterialCommunityIcons' | 'MaterialIcons';
  color: string;
}

export interface AddBusinessForm {
  name: string;
  category: Category;
  description: string;
  city: City;
  phone: string;
  whatsapp: string;
  facebook: string;
  instagram: string;
  photoUris: string[];   // local URIs before upload
}

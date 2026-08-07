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
  description: string;
  city: City;
  phone: string;
  whatsapp?: string;
  strictWhatsapp?: boolean; // NEW: when true, don't fall back to `phone` for the WhatsApp button — only businesses created after this flag was introduced have it
  facebook?: string;
  instagram?: string;
  photos: string[];        // array of image URLs
  coverPhoto: string;      // first photo or main image
  location?: BusinessLocation;  // optional GPS/address
  ownerId: string;
  ownerName: string;
  status: 'pending' | 'approved';
  createdAt: string | Date;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: 'pending' | 'vendor' | 'admin';
  createdAt?: string;
}

export type Category =
  | 'Alimentation'
  | 'Restauration'
  | 'Hôtellerie'
  |'Sport-Gym'
  | 'Résidence meublée'
  | 'Services'
  | 'Transport'
  | 'Mode-Beauté'
  | 'Santé'
  | 'Produits Locaux'
  | 'Soirées au Faso'
  | 'Attractions'
  | 'Immobilier'
  | 'Autre';

export type City =
  | 'Ouagadougou'
  | 'Bobo-Dioulasso';

export interface CategoryItem {
  label: Category;
  icon: string;
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

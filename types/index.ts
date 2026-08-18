// types/index.ts

export interface BusinessLocation {
  address?: string;          // typed address string
  latitude?: number;
  longitude?: number;
}

export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface DayHours {
  open?: string;    // "HH:MM", 24h
  close?: string;   // "HH:MM", 24h
  closed: boolean;
}

export type OpeningHours = Record<DayKey, DayHours>;

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
  relatedBusinessId?: string; // NEW: admin-linked "see also" business
  openingHours?: OpeningHours; // NEW: per-day open/close times, computed in Africa/Ouagadougou time (UTC+0)
}

export interface User {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: 'pending' | 'vendor' | 'admin';
  createdAt?: string;
}

export type ProductCategory =
  | 'Téléphones & Tablettes'
  | 'Électronique'
  | 'Produits Locaux'
  | 'Véhicules'
  | 'Mode & Vêtements'
  | 'Meubles & Maison'
  | 'Immobilier'
  | 'Loisirs & Sports'
  | 'Bébé & Enfants'
  | 'Autres';

export interface ProductCategoryItem {
  label: ProductCategory;
  icon: string;
  iconFamily: 'Ionicons' | 'MaterialCommunityIcons' | 'MaterialIcons';
  color: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  city: City;
  imageUrl?: string;       // legacy single-photo field
  photos?: string[];       // NEW: multiple photos, photos[0] is the cover
  price: number;
  negotiable?: boolean;    // NEW: price is open to negotiation
  stockStatus?: 'in_stock' | 'out_of_stock' | 'sold'; // NEW: inventory status shown as a badge
  stockQty?: number;       // NEW: remaining quantity when in_stock (shown instead of the generic "In stock" badge)
  whatsapp?: string;       // NEW: seller WhatsApp number
  phone?: string;          // NEW: seller phone number
  ownerId?: string;        // NEW: uid of the seller
  ownerName?: string;      // NEW: display name of the seller, for admin visibility
  status?: 'pending' | 'approved'; // NEW: moderation status, mirrors businesses
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

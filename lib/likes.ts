// lib/likes.ts — helper functions for liking/unliking products

import {
  doc, setDoc, deleteDoc, onSnapshot,
  collection, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';

// Path: users/{uid}/likes/{productId}
export function likesRef(uid: string) {
  return collection(db, 'users', uid, 'likes');
}

export function likeDocRef(uid: string, productId: string) {
  return doc(db, 'users', uid, 'likes', productId);
}

export async function likeProduct(uid: string, product: { id: string; name: string; imageUrl: string; price: number; city: string; category: string }) {
  await setDoc(likeDocRef(uid, product.id), {
    productId: product.id,
    name: product.name,
    imageUrl: product.imageUrl,
    price: product.price,
    city: product.city,
    category: product.category,
    likedAt: new Date().toISOString(),
  });
}

export async function unlikeProduct(uid: string, productId: string) {
  await deleteDoc(likeDocRef(uid, productId));
}

// Subscribe to the user's likes list in real-time
export function subscribeLikes(uid: string, cb: (ids: Set<string>) => void) {
  return onSnapshot(likesRef(uid), (snap) => {
    cb(new Set(snap.docs.map((d) => d.id)));
  });
}

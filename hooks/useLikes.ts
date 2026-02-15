// hooks/useLikes.ts
// Manages liked products for the current user.
// Likes are stored in Firestore: likes/{userId}/items/{productId}

import { useState, useEffect } from 'react';
import {
  collection, doc, setDoc, deleteDoc,
  onSnapshot, getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';

export function useLikes(userId: string | undefined) {
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likedProducts, setLikedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener on the user's likes subcollection
  useEffect(() => {
    if (!userId) { setLikedIds(new Set()); setLikedProducts([]); setLoading(false); return; }

    const ref = collection(db, 'likes', userId, 'items');
    const unsub = onSnapshot(ref, (snap) => {
      const ids = new Set(snap.docs.map(d => d.id));
      const products = snap.docs.map(d => d.data() as Product);
      setLikedIds(ids);
      setLikedProducts(products);
      setLoading(false);
    });
    return unsub;
  }, [userId]);

  const like = async (product: Product) => {
    if (!userId) return;
    const ref = doc(db, 'likes', userId, 'items', product.id);
    // Store the full product snapshot so we can display it offline too
    await setDoc(ref, product);
  };

  const unlike = async (productId: string) => {
    if (!userId) return;
    await deleteDoc(doc(db, 'likes', userId, 'items', productId));
  };

  const toggleLike = async (product: Product) => {
    if (likedIds.has(product.id)) {
      await unlike(product.id);
    } else {
      await like(product);
    }
  };

  const isLiked = (productId: string) => likedIds.has(productId);

  return { likedIds, likedProducts, loading, like, unlike, toggleLike, isLiked };
}

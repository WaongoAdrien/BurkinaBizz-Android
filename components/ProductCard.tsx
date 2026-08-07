// components/ProductCard.tsx

import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Product } from '../types/index';
import { useColorTheme } from '../hooks/useColorTheme';
import { Colors } from '../constants';
import { useAuth } from '../lib/AuthContext';
import { likeProduct, unlikeProduct, subscribeLikes } from '../lib/likes';
import { useTranslation, registerTranslations } from '../lib/LanguageContext';

registerTranslations({
  'Connexion requise': 'Sign-in required',
  'Connectez-vous pour sauvegarder des favoris.': 'Sign in to save favorites.',
  'Annuler': 'Cancel',
  'Se connecter': 'Sign in',
  'Erreur': 'Error',
  'Impossible de modifier vos favoris.': 'Unable to update your favorites.',
});

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { theme } = useColorTheme();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    return subscribeLikes(user.uid, (ids) => setLiked(ids.has(product.id)));
  }, [user, product.id]);

  const handleLike = async () => {
    if (!user) {
      Alert.alert(t('Connexion requise'), t('Connectez-vous pour sauvegarder des favoris.'), [
        { text: t('Annuler'), style: 'cancel' },
        { text: t('Se connecter'), onPress: () => router.push('/auth') },
      ]);
      return;
    }
    setLikeLoading(true);
    try {
      if (liked) {
        await unlikeProduct(user.uid, product.id);
      } else {
        await likeProduct(user.uid, {
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          price: product.price,
          city: product.city,
          category: product.category,
        });
      }
    } catch {
      Alert.alert(t('Erreur'), t('Impossible de modifier vos favoris.'));
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
      activeOpacity={0.85}
    >
      <Image
        source={product.imageUrl ? { uri: product.imageUrl } : require('../assets/images/placeholder.png')}
        style={styles.image}
        resizeMode="cover"
        fadeDuration={200}
      />

      {/* Category badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{product.category}</Text>
      </View>

      {/* Like button */}
      <TouchableOpacity
        style={[styles.likeBtn, liked && { backgroundColor: '#b39da0c4' }]}
        onPress={handleLike}
        disabled={likeLoading}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {likeLoading
          ? <ActivityIndicator size="small" color="#e53935" />
          : <Text style={styles.likeIcon}>{liked ? '❤️' : '🤍'}</Text>
        }
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={[styles.city, { color: theme.textSecondary }]}>📍 {product.city}</Text>
        <Text style={styles.price}>{product.price.toLocaleString('fr-FR')} FCFA</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8, overflow: 'hidden',
    marginBottom: 12, marginHorizontal: 6, flex: 1, borderWidth: 1,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6,
  },
  image: { width: '100%', height: 140, backgroundColor: '#E0E0E0' },
  badge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: Colors.primary + 'DD',
    borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '400' },
  likeBtn: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 11, width: 32, height: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  likeIcon: { fontSize: 16 },
  info: { padding: 10, gap: 4 },
  name: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  city: { fontSize: 12 },
  price: { fontSize: 15, fontWeight: '400', color: Colors.primary, marginTop: 2 },
});

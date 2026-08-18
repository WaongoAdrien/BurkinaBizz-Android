// app/product/[id].tsx — Product Detail Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Share,
  StyleSheet, Linking, Alert, ActivityIndicator, FlatList, Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/AuthContext';
import { likeProduct, unlikeProduct, subscribeLikes } from '../../lib/likes';
import { Product } from '../../types';
import { Colors, PRODUCT_CATEGORIES } from '../../constants';
import { useColorTheme } from '../../hooks/useColorTheme';
import { CategoryIcon } from '../../components/CategoryIcon';
import { ContentContainer } from '../../components/ContentContainer';
import { AppHeader } from '../../components/AppHeader';
import { useTranslation, registerTranslations } from '../../lib/LanguageContext';
import { getStockBadge } from '../../lib/productStock';

registerTranslations({
  'Produit introuvable': 'Product not found',
  'Erreur': 'Error',
  'Connexion requise': 'Login required',
  'Connectez-vous pour sauvegarder des favoris.': 'Log in to save favorites.',
  'Se connecter': 'Log in',
  'Annuler': 'Cancel',
  'Impossible de modifier vos favoris.': 'Unable to update your favorites.',
  'Négociable': 'Negotiable',
  'À propos': 'About',
  'Contacter': 'Contact',
  'Appeler': 'Call',
  'Négocier sur WhatsApp': 'Negotiate on WhatsApp',
  'Contacter sur WhatsApp': 'Contact on WhatsApp',
  'Ville': 'City',
  'Partager': 'Share',
  'Trouvé sur BurkinaBizz': 'Found on BurkinaBizz',
  "Impossible d'ouvrir WhatsApp.": 'Unable to open WhatsApp.',
  'Téléphones & Tablettes': 'Phones & Tablets',
  'Électronique': 'Electronics',
  'Produits Locaux': 'Local Products',
  'Véhicules': 'Vehicles',
  'Mode & Vêtements': 'Fashion & Clothing',
  'Meubles & Maison': 'Furniture & Home',
  'Immobilier': 'Real Estate',
  'Loisirs & Sports': 'Leisure & Sports',
  'Bébé & Enfants': 'Baby & Kids',
  'Autres': 'Other',
});

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useColorTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useTranslation();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'products', id)).then(snap => {
      if (snap.exists()) setProduct({ id: snap.id, ...snap.data() } as Product);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    return subscribeLikes(user.uid, (ids) => setLiked(ids.has(id)));
  }, [user, id]);

  const cat = PRODUCT_CATEGORIES.find(c => c.label === product?.category);
  const photos = product?.photos?.length ? product.photos : product?.imageUrl ? [product.imageUrl] : [];

  const priceLabel = product ? `${product.price.toLocaleString('fr-FR')} FCFA` : '';

  const openPhone = () => product?.phone && Linking.openURL(`tel:${product.phone.replace(/\s+/g, '')}`);

  const openWhatsApp = () => {
    if (!product?.whatsapp) return;
    const num = product.whatsapp.replace(/\D/g, '');
    const message = product.negotiable
      ? `Bonjour! Je suis intéressé(e) par "${product.name}" à ${priceLabel} sur BurkinaBizz. Est-ce toujours disponible ? Seriez-vous ouvert(e) à négocier le prix ?`
      : `Bonjour! Je suis intéressé(e) par "${product.name}" à ${priceLabel} sur BurkinaBizz. Est-ce toujours disponible ?`;
    Linking.openURL(`https://wa.me/${num}?text=${encodeURIComponent(message)}`)
      .catch(() => Alert.alert(t('Erreur'), t("Impossible d'ouvrir WhatsApp.")));
  };

  const handleLike = async () => {
    if (!user) {
      Alert.alert(t('Connexion requise'), t('Connectez-vous pour sauvegarder des favoris.'), [
        { text: t('Annuler'), style: 'cancel' },
        { text: t('Se connecter'), onPress: () => router.push('/auth') },
      ]);
      return;
    }
    if (!product) return;
    setLikeLoading(true);
    try {
      if (liked) {
        await unlikeProduct(user.uid, product.id);
      } else {
        await likeProduct(user.uid, {
          id: product.id,
          name: product.name,
          imageUrl: photos[0] || '',
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

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `${product.name}\n${priceLabel} • ${product.city}\n\n${product.description?.slice(0, 100)}...\n\n${t('Trouvé sur BurkinaBizz')}`,
        title: product.name,
      });
    } catch {}
  };

  if (loading) return (
    <View style={{ flex: 1 }}>
      <AppHeader title={t('Produits à vendre')} />
      <LinearGradient
        colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
        style={styles.center}
      >
        <ActivityIndicator color={Colors.primary} size="large" />
      </LinearGradient>
    </View>
  );

  if (!product) return (
    <View style={{ flex: 1 }}>
      <AppHeader title={t('Produits à vendre')} />
      <LinearGradient
        colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
        style={styles.center}
      >
        <Text style={{ fontSize: 48 }}>😕</Text>
        <Text style={[styles.errorText, { color: theme.text }]}>{t('Produit introuvable')}</Text>
      </LinearGradient>
    </View>
  );

  const hasContact = !!(product.phone || product.whatsapp || product.ownerName);
  const stockBadge = getStockBadge(product, language);

  return (
    <>
      <AppHeader title={product.name} />

      <LinearGradient
        colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

          {/* PHOTO GALLERY */}
          <View style={{ width: '100%', alignItems: 'center' }}>
            <View style={{ width: '100%', maxWidth: 600, position: 'relative' }}>
              <TouchableOpacity style={styles.shareFab} onPress={handleShare} activeOpacity={0.8}>
                <Ionicons name="share-outline" size={18} color="#fff" />
              </TouchableOpacity>
              {photos.length > 0 ? (
                <View style={{ width: '100%', height: 280, marginBottom: 16, position: 'relative' }}>
                  <FlatList
                    data={photos}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(_, i) => String(i)}
                    onScroll={(e) => {
                      const offsetX = e.nativeEvent.contentOffset.x;
                      const containerWidth = e.nativeEvent.layoutMeasurement.width;
                      setActivePhoto(Math.round(offsetX / containerWidth));
                    }}
                    scrollEventThrottle={16}
                    renderItem={({ item }) => (
                      <Image source={{ uri: item }} style={[styles.photo, { width: Math.min(width, 600) }]} resizeMode="cover" />
                    )}
                  />
                  {photos.length > 1 && (
                    <View style={styles.dotRow}>
                      {photos.map((_, i) => (
                        <View key={i} style={[styles.dot, { backgroundColor: i === activePhoto ? '#fff' : 'rgba(255,255,255,0.4)' }]} />
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <View style={[styles.photoPlaceholder, { backgroundColor: (cat?.color || Colors.primary) + '22' }]}>
                  {cat ? (
                    <CategoryIcon iconName={cat.icon} iconFamily={cat.iconFamily} size={72} color={cat.color} />
                  ) : (
                    <MaterialCommunityIcons name="tag-outline" size={72} color={Colors.primary} />
                  )}
                </View>
              )}
            </View>
          </View>

          <ContentContainer maxWidth={600} style={styles.body}>
            {/* NAME + LIKE */}
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.price, { color: Colors.primary }]}>{priceLabel}</Text>
                <Text style={[styles.name, { color: theme.text }]}>{product.name}</Text>
                <View style={styles.metaRow}>
                  <View style={[styles.catBadge, { backgroundColor: (cat?.color || Colors.primary) + '22' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      {cat && <CategoryIcon iconName={cat.icon} iconFamily={cat.iconFamily} size={14} color={cat.color} />}
                      <Text style={[styles.catBadgeText, { color: cat?.color || Colors.primary }]}>{t(product.category)}</Text>
                    </View>
                  </View>
                  {product.negotiable && (
                    <View style={[styles.negotiableBadge, { backgroundColor: '#2E7D3222' }]}>
                      <Text style={[styles.negotiableBadgeText, { color: '#2E7D32' }]}>{t('Négociable')}</Text>
                    </View>
                  )}
                  {stockBadge && (
                    <View style={[styles.negotiableBadge, { backgroundColor: stockBadge.color + '22' }]}>
                      <Text style={[styles.negotiableBadgeText, { color: stockBadge.color }]}>{stockBadge.label}</Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                  <Ionicons name="location" size={14} color={theme.textSecondary} />
                  <Text style={[styles.city, { color: theme.textSecondary }]}>{product.city}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.likeBtn, { backgroundColor: liked ? '#FFEBEE' : theme.surface, borderColor: theme.border }]}
                onPress={handleLike} disabled={likeLoading}
                activeOpacity={0.8}
              >
                {likeLoading ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Ionicons name={liked ? 'heart' : 'heart-outline'} size={26} color={liked ? '#D32F2F' : theme.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            {/* DESCRIPTION */}
            {!!product.description && (
              <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.sectionBadge, { backgroundColor: Colors.headerGradient[0] + '22' }]}>
                    <Ionicons name="document-text-outline" size={16} color={Colors.headerGradient[0]} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('À propos')}</Text>
                </View>
                <Text style={[styles.description, { color: theme.textSecondary }]}>{product.description}</Text>
              </View>
            )}

            {/* CONTACT */}
            {hasContact && (
              <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.sectionBadge, { backgroundColor: '#1096c322' }]}>
                    <Ionicons name="call" size={16} color="#1096c3" />
                  </View>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('Contacter')}</Text>
                </View>
                {!!product.ownerName && (
                  <View style={styles.sellerRow}>
                    <Ionicons name="person-outline" size={16} color={theme.textSecondary} />
                    <Text style={[styles.sellerName, { color: theme.text }]}>{product.ownerName}</Text>
                  </View>
                )}
                <View style={styles.contactRow}>
                  {product.phone && (
                    <TouchableOpacity style={[styles.contactBtn, { backgroundColor: Colors.headerGradient[0] }]} onPress={openPhone}>
                      <Ionicons name="call" size={14} color="#fff" />
                      <Text style={styles.contactBtnText}>{t('Appeler')}</Text>
                    </TouchableOpacity>
                  )}
                  {product.whatsapp && (
                    <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#1B5E20' }]} onPress={openWhatsApp}>
                      <Ionicons name="logo-whatsapp" size={14} color="#fff" />
                      <Text style={styles.contactBtnText}>{t(product.negotiable ? 'WhatsApp' : 'Contacter sur WhatsApp')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </ContentContainer>

          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 16, fontWeight: '400' },
  photo: { height: 280, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  photoPlaceholder: { height: 220, alignItems: 'center', justifyContent: 'center', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: 'hidden' },
  dotRow: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  body: { padding: 16, gap: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  price: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  name: { fontSize: 22, fontWeight: '600', lineHeight: 28 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  catBadge: { borderRadius: 5, paddingHorizontal: 10, paddingVertical: 4 },
  catBadgeText: { fontSize: 12, fontWeight: '400' },
  negotiableBadge: { borderRadius: 5, paddingHorizontal: 10, paddingVertical: 4 },
  negotiableBadgeText: { fontSize: 12, fontWeight: '400' },
  city: { fontSize: 13 },
  likeBtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  sectionCard: { borderRadius: 10, padding: 16 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionBadge: { width: 28, height: 28, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '400' },
  description: { fontSize: 14, lineHeight: 22 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sellerName: { fontSize: 14, fontWeight: '400' },
  contactRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, paddingHorizontal: 14, borderRadius: 7, gap: 5 },
  contactBtnText: { color: '#fff', fontSize: 12.5, fontWeight: '400' },
  shareFab: {
    position: 'absolute', top: 16, right: 16, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(11,30,61,0.6)', alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
});

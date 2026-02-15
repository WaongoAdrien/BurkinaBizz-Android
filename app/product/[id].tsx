// app/business/[id].tsx — Business Detail Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Linking, Alert, ActivityIndicator, FlatList, Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { useLikes } from '../../hooks/useLikes';
import { Business } from '../../types';
import { Colors, CATEGORIES, WHATSAPP_GREETING } from '../../constants';
import { useColorTheme } from '../../hooks/useColorTheme';

const { width } = Dimensions.get('window');

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useColorTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { isLiked, toggleLike } = useLikes(user?.uid);

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'businesses', id)).then(snap => {
      if (snap.exists()) setBusiness({ id: snap.id, ...snap.data() } as Business);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const openPhone = () => {
    if (!business?.phone) return;
    Linking.openURL(`tel:${business.phone}`);
  };

  const openWhatsApp = () => {
    if (!business?.whatsapp && !business?.phone) return;
    const num = (business.whatsapp || business.phone).replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${num}?text=${encodeURIComponent(WHATSAPP_GREETING)}`);
  };

  const openFacebook = () => {
    if (!business?.facebook) return;
    const url = business.facebook.startsWith('http') ? business.facebook : `https://facebook.com/${business.facebook}`;
    Linking.openURL(url).catch(() => Alert.alert('Erreur', 'Impossible douvrir Facebook.'));
  };

  const openInstagram = () => {
    if (!business?.instagram) return;
    const handle = business.instagram.replace('@', '');
    Linking.openURL(`https://instagram.com/${handle}`).catch(() => Alert.alert('Erreur', 'Impossible d ouvrir Instagram.'));
  };

  const openMaps = () => {
    if (!business?.location) return;
    const { latitude, longitude, address } = business.location;
    let url = '';
    if (latitude && longitude) {
      // Coords → Google Maps directions
      url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    } else if (address) {
      // Address → Google Maps search
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    }
    if (url) Linking.openURL(url).catch(() => Alert.alert('Erreur', "Impossible douvrir Google Maps."));
  };

  const handleLike = async () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour sauvegarder des favoris.',
        [{ text: 'Se connecter', onPress: () => router.push('/auth') }, { text: 'Annuler', style: 'cancel' }]);
      return;
    }
    if (!business) return;
    setLikeLoading(true);
    try { await toggleLike(business as any); }
    finally { setLikeLoading(false); }
  };

  if (loading) return (
    <View style={[styles.center, { backgroundColor: theme.background }]}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );

  if (!business) return (
    <View style={[styles.center, { backgroundColor: theme.background }]}>
      <Text style={{ fontSize: 48 }}>😕</Text>
      <Text style={[styles.errorText, { color: theme.text }]}>Entreprise introuvable</Text>
    </View>
  );

  const cat = CATEGORIES.find(c => c.label === business.category);
  const liked = isLiked(business.id);
  const photos = business.photos?.length ? business.photos : business.coverPhoto ? [business.coverPhoto] : [];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>

      {/* PHOTO GALLERY */}
      {photos.length > 0 ? (
        <View>
          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            onMomentumScrollEnd={(e) => {
              setActivePhoto(Math.round(e.nativeEvent.contentOffset.x / width));
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={[styles.photo, { width }]} resizeMode="cover" />
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
          <Text style={{ fontSize: 64 }}>{cat?.icon || '🏢'}</Text>
        </View>
      )}

      <View style={styles.body}>
        {/* NAME + LIKE */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.text }]}>{business.name}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.catBadge, { backgroundColor: (cat?.color || Colors.primary) + '22' }]}>
                <Text style={[styles.catBadgeText, { color: cat?.color || Colors.primary }]}>
                  {cat?.icon} {business.category}
                </Text>
              </View>
              <Text style={[styles.city, { color: theme.textSecondary }]}>📍 {business.city}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.likeBtn, { backgroundColor: liked ? '#FFEBEE' : theme.surface, borderColor: theme.border }]}
            onPress={handleLike}
            disabled={likeLoading}
          >
            {likeLoading
              ? <ActivityIndicator size="small" color={Colors.primary} />
              : <Text style={{ fontSize: 24 }}>{liked ? '❤️' : '🤍'}</Text>
            }
          </TouchableOpacity>
        </View>

        {/* DESCRIPTION */}
        <View style={[styles.section, { borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>À propos</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>{business.description}</Text>
        </View>

        {/* CONTACT BUTTONS */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Contacter</Text>
        <View style={styles.contactRow}>
          {business.phone && (
            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: Colors.primary }]} onPress={openPhone}>
              <Text style={styles.contactIcon}>📞</Text>
              <Text style={styles.contactBtnText}>Appeler</Text>
            </TouchableOpacity>
          )}
          {(business.whatsapp || business.phone) && (
            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#25D366' }]} onPress={openWhatsApp}>
              <Text style={styles.contactIcon}>💬</Text>
              <Text style={styles.contactBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* SOCIAL MEDIA */}
        {(business.facebook || business.instagram) && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Réseaux sociaux</Text>
            <View style={styles.socialRow}>
              {business.facebook && (
                <TouchableOpacity
                  style={[styles.socialBtn, { backgroundColor: '#1877F2' }]}
                  onPress={openFacebook}
                >
                  <Text style={styles.socialBtnText}>🔵 Facebook</Text>
                </TouchableOpacity>
              )}
              {business.instagram && (
                <TouchableOpacity
                  style={[styles.socialBtn, { backgroundColor: '#E1306C' }]}
                  onPress={openInstagram}
                >
                  <Text style={styles.socialBtnText}>📸 Instagram</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* LOCATION */}
        {business.location && (business.location.address || business.location.latitude) && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Localisation</Text>
            <TouchableOpacity
              style={[styles.mapsBtn, { borderColor: theme.border }]}
              onPress={openMaps}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                {business.location.address && (
                  <Text style={[styles.mapsBtnAddress, { color: theme.text }]} numberOfLines={2}>
                    📍 {business.location.address}
                  </Text>
                )}
                {business.location.latitude && (
                  <Text style={[styles.mapsBtnCoords, { color: theme.textSecondary }]}>
                    {business.location.latitude.toFixed(4)}, {business.location.longitude?.toFixed(4)}
                  </Text>
                )}
              </View>
              <View style={styles.mapsBtnIcon}>
                <Text style={{ fontSize: 22 }}>🗺️</Text>
                <Text style={styles.mapsBtnIconText}>Ouvrir</Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* CONTACT INFO */}
        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {business.phone && <InfoRow icon="📞" label="Téléphone" value={business.phone} theme={theme} />}
          {business.whatsapp && <InfoRow icon="💬" label="WhatsApp" value={business.whatsapp} theme={theme} />}
          {business.facebook && <InfoRow icon="🔵" label="Facebook" value={business.facebook} theme={theme} />}
          {business.instagram && <InfoRow icon="📸" label="Instagram" value={business.instagram} theme={theme} />}
          <InfoRow icon="📍" label="Ville" value={business.city} theme={theme} />
        </View>
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value, theme }: { icon: string; label: string; value: string; theme: any }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.icon}>{icon}</Text>
      <Text style={[infoStyles.label, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[infoStyles.value, { color: theme.text }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  icon: { fontSize: 16, width: 24 },
  label: { fontSize: 13, width: 90 },
  value: { flex: 1, fontSize: 13, fontWeight: '600', textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 16, fontWeight: '700' },
  photo: { height: 280 },
  photoPlaceholder: { height: 220, alignItems: 'center', justifyContent: 'center' },
  dotRow: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  body: { padding: 16, gap: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  name: { fontSize: 22, fontWeight: '900', lineHeight: 28 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  catBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  catBadgeText: { fontSize: 12, fontWeight: '700' },
  city: { fontSize: 13 },
  likeBtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  section: { borderTopWidth: 1, paddingTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  description: { fontSize: 14, lineHeight: 22 },
  contactRow: { flexDirection: 'row', gap: 10 },
  contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 6 },
  contactIcon: { fontSize: 18 },
  contactBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
  socialBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  infoCard: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14 },
  mapsBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, padding: 14, gap: 12, marginBottom: 4 },
  mapsBtnAddress: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  mapsBtnCoords: { fontSize: 11, marginTop: 2 },
  mapsBtnIcon: { alignItems: 'center', gap: 2 },
  mapsBtnIconText: { fontSize: 11, color: '#1976D2', fontWeight: '700' },
});
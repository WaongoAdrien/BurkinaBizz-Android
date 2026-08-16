// app/tourism/[id].tsx — Tourist Site Detail Screen

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Share,
  StyleSheet, Linking, Alert, ActivityIndicator, FlatList, Dimensions, StatusBar, Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants';
import { useAuth } from '../../lib/AuthContext';
import { useColorTheme } from '../../hooks/useColorTheme';
import { ContentContainer } from '../../components/ContentContainer';
import { AppHeader } from '../../components/AppHeader';
import { useTranslation, registerTranslations } from '../../lib/LanguageContext';

registerTranslations({
  'Site introuvable': 'Site not found',
  'Horaires': 'Hours',
  'À propos': 'About',
  'Informations': 'Information',
  'Appeler': 'Call',
  'Voir dans Maps': 'View on Maps',
  'Site web': 'Website',
  'Erreur': 'Error',
  "Impossible d'ouvrir Google Maps.": 'Unable to open Google Maps.',
  "Impossible d'ouvrir Facebook.": 'Unable to open Facebook.',
  "Impossible d'ouvrir le site web.": 'Unable to open the website.',
  "Impossible d'ouvrir ce lien.": 'Unable to open this link.',
  'Découvert sur BurkinaBizz': 'Discovered on BurkinaBizz',
  'Hôtels recommandés': 'Recommended hotels',
});

const { width } = Dimensions.get('window');
const normalizeUrl = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

interface Attraction {
  id: string;
  name: string;
  image: string;
  photos?: string[];
  category: string;
  location: string;
  phone?: string;
  description: string;
  mapLink?: string;
  facebook?: string;
  website?: string;
  schedule?: string;
  latitude?: number;
  longitude?: number;
  hotels?: { name: string; link: string }[];
}

function SectionHeader({ icon, color, title, theme }: { icon: keyof typeof Ionicons.glyphMap; color: string; title: string; theme: any }) {
  return (
    <View style={shStyles.row}>
      <View style={[shStyles.badge, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[shStyles.title, { color: theme.text }]}>{title}</Text>
    </View>
  );
}

const shStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  badge: { width: 28, height: 28, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '400' },
});

export default function TourismSiteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { theme } = useColorTheme();
  const { t } = useTranslation();

  const [site, setSite] = useState<Attraction | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerPhotoIndex, setViewerPhotoIndex] = useState(0);
  const imageViewerRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'touristSites', id)).then(snap => {
      if (snap.exists()) setSite({ id: snap.id, ...snap.data() } as Attraction);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const openPhone = () => site?.phone && Linking.openURL(`tel:${site.phone.replace(/\s+/g, '')}`);

  const openMaps = () => {
    if (!site?.mapLink) return;
    Linking.openURL(normalizeUrl(site.mapLink)).catch(() => Alert.alert(t('Erreur'), t("Impossible d'ouvrir Google Maps.")));
  };

  const openFacebook = () => {
    if (!site?.facebook) return;
    Linking.openURL(normalizeUrl(site.facebook)).catch(() => Alert.alert(t('Erreur'), t("Impossible d'ouvrir Facebook.")));
  };

  const openWebsite = () => {
    if (!site?.website) return;
    Linking.openURL(normalizeUrl(site.website)).catch(() => Alert.alert(t('Erreur'), t("Impossible d'ouvrir le site web.")));
  };

  const openHotelLink = (link: string) => {
    Linking.openURL(normalizeUrl(link)).catch(() => Alert.alert(t('Erreur'), t("Impossible d'ouvrir ce lien.")));
  };

  const handleShare = async () => {
    if (!site) return;
    try {
      await Share.share({
        message: `${site.name}\n${site.location} • ${site.category}\n\n${site.description?.slice(0, 100)}...\n\n${t('Découvert sur BurkinaBizz')}`,
        title: site.name,
      });
    } catch {}
  };

  if (loading) return (
    <View style={{ flex: 1 }}>
      <AppHeader title={t('Sites touristiques')} />
      <LinearGradient
        colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
        style={styles.center}
      >
        <ActivityIndicator color={Colors.primary} size="large" />
      </LinearGradient>
    </View>
  );

  if (!site) return (
    <View style={{ flex: 1 }}>
      <AppHeader title={t('Sites touristiques')} />
      <LinearGradient
        colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
        style={styles.center}
      >
        <Text style={{ fontSize: 48 }}>😕</Text>
        <Text style={[styles.errorText, { color: theme.text }]}>{t('Site introuvable')}</Text>
      </LinearGradient>
    </View>
  );

  const photos = site.photos?.length ? site.photos : site.image ? [site.image] : [];
  const hasContact = !!(site.phone || site.mapLink || site.facebook || site.website);

  return (
    <>
      <AppHeader
        title={site.name}
        rightElement={isAdmin ? (
          <TouchableOpacity onPress={() => router.push(`/admin?tab=attractions&editId=${site.id}`)} style={styles.headerBtn}>
            <Ionicons name="create-outline" size={22} color="#fff" />
          </TouchableOpacity>
        ) : undefined}
      />

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
                    renderItem={({ item, index }) => (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => {
                          setViewerPhotoIndex(index);
                          setShowImageViewer(true);
                        }}
                        style={{ width: Math.min(width, 600) }}
                      >
                        <Image source={{ uri: item }} style={[styles.photo, { width: Math.min(width, 600) }]} resizeMode="cover" />
                      </TouchableOpacity>
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
                <View style={[styles.photoPlaceholder, { backgroundColor: Colors.primary + '22' }]}>
                  <Ionicons name="image-outline" size={72} color={Colors.primary} />
                </View>
              )}
            </View>
          </View>

          <ContentContainer maxWidth={600} style={styles.body}>
            {/* NAME + META */}
            <View>
              <Text style={[styles.name, { color: theme.text }]}>{site.name}</Text>
              <View style={styles.metaRow}>
                <View style={[styles.catBadge, { backgroundColor: Colors.primary + '22' }]}>
                  <Text style={[styles.catBadgeText, { color: Colors.primary }]}>{site.category}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="location" size={14} color={theme.textSecondary} />
                  <Text style={[styles.location, { color: theme.textSecondary }]}>{site.location}</Text>
                </View>
              </View>
            </View>

            {/* HORAIRES */}
            {!!site.schedule && (
              <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
                <SectionHeader icon="time-outline" color={Colors.headerGradient[0]} title={t('Horaires')} theme={theme} />
                <Text style={[styles.bodyText, { color: theme.textSecondary }]}>{site.schedule}</Text>
              </View>
            )}

            {/* DESCRIPTION */}
            {!!site.description && (
              <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
                <SectionHeader icon="document-text-outline" color={Colors.headerGradient[0]} title={t('À propos')} theme={theme} />
                <Text style={[styles.bodyText, { color: theme.textSecondary }]}>{site.description}</Text>
              </View>
            )}

            {/* CONTACT */}
            {hasContact && (
              <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
                <SectionHeader icon="information-circle-outline" color={Colors.headerGradient[0]} title={t('Informations')} theme={theme} />
                <View style={styles.contactRow}>
                  {site.phone && (
                    <TouchableOpacity style={[styles.contactBtn, { backgroundColor: Colors.headerGradient[0] }]} onPress={openPhone}>
                      <Ionicons name="call" size={18} color="#fff" />
                      <Text style={styles.contactBtnText}>{t('Appeler')}</Text>
                    </TouchableOpacity>
                  )}
                  {site.mapLink && (
                    <TouchableOpacity style={[styles.contactBtn, { backgroundColor: Colors.headerGradient[0] }]} onPress={openMaps}>
                      <Ionicons name="navigate" size={18} color="#fff" />
                      <Text style={styles.contactBtnText}>{t('Voir dans Maps')}</Text>
                    </TouchableOpacity>
                  )}
                  {site.facebook && (
                    <TouchableOpacity style={[styles.contactBtn, { backgroundColor: Colors.headerGradient[0] }]} onPress={openFacebook}>
                      <Ionicons name="logo-facebook" size={18} color="#fff" />
                      <Text style={styles.contactBtnText}>Facebook</Text>
                    </TouchableOpacity>
                  )}
                  {site.website && (
                    <TouchableOpacity style={[styles.contactBtn, { backgroundColor: Colors.headerGradient[0] }]} onPress={openWebsite}>
                      <Ionicons name="globe-outline" size={18} color="#fff" />
                      <Text style={styles.contactBtnText}>{t('Site web')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* HÔTELS RECOMMANDÉS */}
            {!!site.hotels?.length && (
              <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
                <SectionHeader icon="bed-outline" color={Colors.headerGradient[0]} title={t('Hôtels recommandés')} theme={theme} />
                <View style={{ gap: 8 }}>
                  {site.hotels.map((hotel, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.hotelRow, { borderColor: theme.border }]}
                      onPress={() => openHotelLink(hotel.link)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="bed-outline" size={18} color={Colors.headerGradient[0]} />
                      <Text style={[styles.hotelRowText, { color: theme.text }]} numberOfLines={1}>{hotel.name}</Text>
                      <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ContentContainer>

          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>

      {/* FULL-SCREEN IMAGE VIEWER */}
      <Modal
        visible={showImageViewer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageViewer(false)}
      >
        <View style={styles.imageViewerContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />

          <TouchableOpacity
            style={styles.imageViewerClose}
            onPress={() => setShowImageViewer(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          {photos.length > 1 && (
            <View style={styles.imageViewerCounter}>
              <Text style={styles.imageViewerCounterText}>
                {viewerPhotoIndex + 1} / {photos.length}
              </Text>
            </View>
          )}

          <FlatList
            ref={imageViewerRef}
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => `viewer-${i}`}
            initialScrollIndex={viewerPhotoIndex}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                imageViewerRef.current?.scrollToIndex({ index: info.index, animated: false });
              }, 50);
            }}
            onMomentumScrollEnd={e => setViewerPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => (
              <View style={styles.imageViewerSlide}>
                <Image
                  source={{ uri: item }}
                  style={styles.imageViewerPhoto}
                  resizeMode="contain"
                />
              </View>
            )}
          />

          {photos.length > 1 && (
            <View style={styles.imageViewerDots}>
              {photos.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.imageViewerDot,
                    { backgroundColor: i === viewerPhotoIndex ? '#fff' : 'rgba(255,255,255,0.4)' }
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBtn: { paddingHorizontal: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 16, fontWeight: '400' },
  photo: { height: 280, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  photoPlaceholder: { height: 220, alignItems: 'center', justifyContent: 'center', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: 'hidden' },
  dotRow: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  body: { padding: 16, gap: 16 },
  name: { fontSize: 22, fontWeight: '600', lineHeight: 28 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  catBadge: { borderRadius: 5, paddingHorizontal: 10, paddingVertical: 4 },
  catBadgeText: { fontSize: 12, fontWeight: '400' },
  location: { fontSize: 13 },
  sectionCard: {
    borderRadius: 10, padding: 16,
  },
  bodyText: { fontSize: 14, lineHeight: 22 },
  contactRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  contactBtn: { flex: 1, minWidth: 140, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 7, gap: 6 },
  contactBtnText: { color: '#fff', fontSize: 14, fontWeight: '400' },
  hotelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 7, paddingVertical: 12, paddingHorizontal: 12 },
  hotelRowText: { flex: 1, fontSize: 14 },
  shareFab: {
    position: 'absolute', top: 16, right: 16, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(11,30,61,0.6)', alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  imageViewerContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  imageViewerClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  imageViewerCounter: { position: 'absolute', top: 50, left: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 7 },
  imageViewerCounterText: { fontSize: 14, color: '#fff', fontWeight: '400' },
  imageViewerSlide: { width, height: '100%', justifyContent: 'center', alignItems: 'center' },
  imageViewerPhoto: { width: '100%', height: '100%' },
  imageViewerDots: { position: 'absolute', bottom: 40, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  imageViewerDot: { width: 8, height: 8, borderRadius: 4 },
});

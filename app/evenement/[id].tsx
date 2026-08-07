// app/evenement/[id].tsx — Event Detail Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Share,
  StyleSheet, Linking, Alert, ActivityIndicator, FlatList, Dimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants';
import { useColorTheme } from '../../hooks/useColorTheme';
import { ContentContainer } from '../../components/ContentContainer';
import { AppHeader } from '../../components/AppHeader';
import { useTranslation, registerTranslations } from '../../lib/LanguageContext';

registerTranslations({
  'Événement introuvable': 'Event not found',
  'Date': 'Date',
  'À propos': 'About',
  'Contacter': 'Contact',
  'Appeler': 'Call',
  'Voir dans Maps': 'View on Maps',
  'Site web': 'Website',
  'Erreur': 'Error',
  "Impossible d'ouvrir Google Maps.": 'Unable to open Google Maps.',
  "Impossible d'ouvrir Facebook.": 'Unable to open Facebook.',
  "Impossible d'ouvrir le site web.": 'Unable to open the website.',
  'Découvert sur BurkinaBizz': 'Discovered on BurkinaBizz',
});

const { width } = Dimensions.get('window');
const normalizeUrl = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

interface EventItem {
  id: string;
  name: string;
  image?: string;
  photos?: string[];
  category: string;
  location: string;
  phone?: string;
  date?: string;
  description: string;
  mapLink?: string;
  facebook?: string;
  website?: string;
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

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useColorTheme();
  const { t } = useTranslation();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'events', id)).then(snap => {
      if (snap.exists()) setEvent({ id: snap.id, ...snap.data() } as EventItem);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const openPhone = () => event?.phone && Linking.openURL(`tel:${event.phone.replace(/\s+/g, '')}`);

  const openMaps = () => {
    if (!event?.mapLink) return;
    Linking.openURL(normalizeUrl(event.mapLink)).catch(() => Alert.alert(t('Erreur'), t("Impossible d'ouvrir Google Maps.")));
  };

  const openFacebook = () => {
    if (!event?.facebook) return;
    Linking.openURL(normalizeUrl(event.facebook)).catch(() => Alert.alert(t('Erreur'), t("Impossible d'ouvrir Facebook.")));
  };

  const openWebsite = () => {
    if (!event?.website) return;
    Linking.openURL(normalizeUrl(event.website)).catch(() => Alert.alert(t('Erreur'), t("Impossible d'ouvrir le site web.")));
  };

  const handleShare = async () => {
    if (!event) return;
    try {
      await Share.share({
        message: `${event.name}\n${event.location} • ${event.category}\n\n${event.description?.slice(0, 100)}...\n\n${t('Découvert sur BurkinaBizz')}`,
        title: event.name,
      });
    } catch {}
  };

  if (loading) return (
    <View style={{ flex: 1 }}>
      <AppHeader title={t('Événements')} />
      <LinearGradient
        colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
        style={styles.center}
      >
        <ActivityIndicator color={Colors.primary} size="large" />
      </LinearGradient>
    </View>
  );

  if (!event) return (
    <View style={{ flex: 1 }}>
      <AppHeader title={t('Événements')} />
      <LinearGradient
        colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
        style={styles.center}
      >
        <Text style={{ fontSize: 48 }}>😕</Text>
        <Text style={[styles.errorText, { color: theme.text }]}>{t('Événement introuvable')}</Text>
      </LinearGradient>
    </View>
  );

  const photos = event.photos?.length ? event.photos : event.image ? [event.image] : [];
  const hasContact = !!(event.phone || event.mapLink || event.facebook || event.website);

  return (
    <>
      <AppHeader title={event.name} />

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
                <View style={[styles.photoPlaceholder, { backgroundColor: Colors.primary + '22' }]}>
                  <Ionicons name="calendar-outline" size={72} color={Colors.primary} />
                </View>
              )}
            </View>
          </View>

          <ContentContainer maxWidth={600} style={styles.body}>
            {/* NAME + META */}
            <View>
              <Text style={[styles.name, { color: theme.text }]}>{event.name}</Text>
              <View style={styles.metaRow}>
                <View style={[styles.catBadge, { backgroundColor: Colors.primary + '22' }]}>
                  <Text style={[styles.catBadgeText, { color: Colors.primary }]}>{event.category}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="location" size={14} color={theme.textSecondary} />
                  <Text style={[styles.location, { color: theme.textSecondary }]}>{event.location}</Text>
                </View>
              </View>
            </View>

            {/* DATE */}
            {!!event.date && (
              <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
                <SectionHeader icon="calendar-outline" color={Colors.headerGradient[0]} title={t('Date')} theme={theme} />
                <Text style={[styles.bodyText, { color: theme.textSecondary }]}>{event.date}</Text>
              </View>
            )}

            {/* DESCRIPTION */}
            {!!event.description && (
              <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
                <SectionHeader icon="document-text-outline" color={Colors.headerGradient[0]} title={t('À propos')} theme={theme} />
                <Text style={[styles.bodyText, { color: theme.textSecondary }]}>{event.description}</Text>
              </View>
            )}

            {/* CONTACT */}
            {hasContact && (
              <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
                <SectionHeader icon="call" color={Colors.headerGradient[0]} title={t('Contacter')} theme={theme} />
                <View style={styles.contactRow}>
                  {event.phone && (
                    <TouchableOpacity style={[styles.contactBtn, { backgroundColor: Colors.headerGradient[0] }]} onPress={openPhone}>
                      <Ionicons name="call" size={18} color="#fff" />
                      <Text style={styles.contactBtnText}>{t('Appeler')}</Text>
                    </TouchableOpacity>
                  )}
                  {event.mapLink && (
                    <TouchableOpacity style={[styles.contactBtn, { backgroundColor: Colors.headerGradient[0] }]} onPress={openMaps}>
                      <Ionicons name="navigate" size={18} color="#fff" />
                      <Text style={styles.contactBtnText}>{t('Voir dans Maps')}</Text>
                    </TouchableOpacity>
                  )}
                  {event.facebook && (
                    <TouchableOpacity style={[styles.contactBtn, { backgroundColor: Colors.headerGradient[0] }]} onPress={openFacebook}>
                      <Ionicons name="logo-facebook" size={18} color="#fff" />
                      <Text style={styles.contactBtnText}>Facebook</Text>
                    </TouchableOpacity>
                  )}
                  {event.website && (
                    <TouchableOpacity style={[styles.contactBtn, { backgroundColor: Colors.headerGradient[0] }]} onPress={openWebsite}>
                      <Ionicons name="globe-outline" size={18} color="#fff" />
                      <Text style={styles.contactBtnText}>{t('Site web')}</Text>
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
  shareFab: {
    position: 'absolute', top: 16, right: 16, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(11,30,61,0.6)', alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
});

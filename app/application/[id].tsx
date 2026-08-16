// app/application/[id].tsx — Useful Application Detail Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Share,
  StyleSheet, Linking, Alert, ActivityIndicator,
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
  'Application introuvable': 'Application not found',
  'À propos': 'About',
  'Disponible sur': 'Available on',
  'App Store': 'App Store',
  'Google Play': 'Google Play',
  'Site web': 'Website',
  'Erreur': 'Error',
  "Impossible d'ouvrir ce lien.": 'Unable to open this link.',
  'Découvert sur BurkinaBizz': 'Discovered on BurkinaBizz',
});

const normalizeUrl = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

interface AppItem {
  id: string;
  name: string;
  image?: string;
  category: string;
  description: string;
  androidUrl?: string;
  iosUrl?: string;
  website?: string;
}

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { theme } = useColorTheme();
  const { t } = useTranslation();

  const [app, setApp] = useState<AppItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'usefulApps', id)).then(snap => {
      if (snap.exists()) setApp({ id: snap.id, ...snap.data() } as AppItem);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const openLink = (link?: string) => {
    if (!link) return;
    Linking.openURL(normalizeUrl(link)).catch(() => Alert.alert(t('Erreur'), t("Impossible d'ouvrir ce lien.")));
  };

  const handleShare = async () => {
    if (!app) return;
    try {
      await Share.share({
        message: `${app.name}\n${app.category}\n\n${app.description?.slice(0, 100)}...\n\n${t('Découvert sur BurkinaBizz')}`,
        title: app.name,
      });
    } catch {}
  };

  if (loading) return (
    <View style={{ flex: 1 }}>
      <AppHeader title={t('Applications utiles')} />
      <LinearGradient
        colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
        style={styles.center}
      >
        <ActivityIndicator color={Colors.primary} size="large" />
      </LinearGradient>
    </View>
  );

  if (!app) return (
    <View style={{ flex: 1 }}>
      <AppHeader title={t('Applications utiles')} />
      <LinearGradient
        colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
        style={styles.center}
      >
        <Text style={{ fontSize: 48 }}>😕</Text>
        <Text style={[styles.errorText, { color: theme.text }]}>{t('Application introuvable')}</Text>
      </LinearGradient>
    </View>
  );

  const hasLinks = !!(app.iosUrl || app.androidUrl || app.website);

  return (
    <>
      <AppHeader
        title={app.name}
        rightElement={isAdmin ? (
          <TouchableOpacity onPress={() => router.push(`/admin?tab=applications&editId=${app.id}`)} style={styles.headerBtn}>
            <Ionicons name="create-outline" size={22} color="#fff" />
          </TouchableOpacity>
        ) : undefined}
      />

      <LinearGradient
        colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

          {/* ICON HERO */}
          <View style={styles.hero}>
            <TouchableOpacity style={styles.shareFab} onPress={handleShare} activeOpacity={0.8}>
              <Ionicons name="share-outline" size={18} color="#fff" />
            </TouchableOpacity>
            {app.image ? (
              <Image source={{ uri: app.image }} style={styles.icon} resizeMode="cover" />
            ) : (
              <View style={[styles.icon, styles.iconPlaceholder, { backgroundColor: Colors.primary + '22' }]}>
                <Ionicons name="apps" size={48} color={Colors.primary} />
              </View>
            )}
          </View>

          <ContentContainer maxWidth={600} style={styles.body}>
            {/* NAME + META */}
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.name, { color: theme.text }]}>{app.name}</Text>
              <View style={[styles.catBadge, { backgroundColor: Colors.primary + '22' }]}>
                <Text style={[styles.catBadgeText, { color: Colors.primary }]}>{app.category}</Text>
              </View>
            </View>

            {/* DESCRIPTION */}
            {!!app.description && (
              <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.sectionBadge, { backgroundColor: Colors.headerGradient[0] + '22' }]}>
                    <Ionicons name="document-text-outline" size={16} color={Colors.headerGradient[0]} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('À propos')}</Text>
                </View>
                <Text style={[styles.bodyText, { color: theme.textSecondary }]}>{app.description}</Text>
              </View>
            )}

            {/* DOWNLOAD LINKS */}
            {hasLinks && (
              <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.sectionBadge, { backgroundColor: Colors.headerGradient[0] + '22' }]}>
                    <Ionicons name="download-outline" size={16} color={Colors.headerGradient[0]} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('Disponible sur')}</Text>
                </View>
                <View style={styles.linkRow}>
                  {app.androidUrl && (
                    <TouchableOpacity style={[styles.linkBtn, { backgroundColor: Colors.headerGradient[0] }]} onPress={() => openLink(app.androidUrl)}>
                      <Ionicons name="logo-google-playstore" size={18} color="#fff" />
                      <Text style={styles.linkBtnText}>{t('Google Play')}</Text>
                    </TouchableOpacity>
                  )}
                  {app.iosUrl && (
                    <TouchableOpacity style={[styles.linkBtn, { backgroundColor: Colors.headerGradient[0] }]} onPress={() => openLink(app.iosUrl)}>
                      <Ionicons name="logo-apple" size={18} color="#fff" />
                      <Text style={styles.linkBtnText}>{t('App Store')}</Text>
                    </TouchableOpacity>
                  )}
                  {app.website && (
                    <TouchableOpacity style={[styles.linkBtn, { backgroundColor: Colors.headerGradient[0] }]} onPress={() => openLink(app.website)}>
                      <Ionicons name="globe-outline" size={18} color="#fff" />
                      <Text style={styles.linkBtnText}>{t('Site web')}</Text>
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
  headerBtn: { paddingHorizontal: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 16, fontWeight: '400' },
  hero: { width: '100%', alignItems: 'center', paddingTop: 32, paddingBottom: 8, position: 'relative' },
  icon: { width: 96, height: 96, borderRadius: 22 },
  iconPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: 16, gap: 16 },
  name: { fontSize: 22, fontWeight: '600', lineHeight: 28, textAlign: 'center' },
  catBadge: { borderRadius: 5, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
  catBadgeText: { fontSize: 12, fontWeight: '400' },
  sectionCard: { borderRadius: 10, padding: 16 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionBadge: { width: 28, height: 28, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '400' },
  bodyText: { fontSize: 14, lineHeight: 22 },
  linkRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  linkBtn: { flex: 1, minWidth: 140, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 7, gap: 6 },
  linkBtnText: { color: '#fff', fontSize: 14, fontWeight: '400' },
  shareFab: {
    position: 'absolute', top: 16, right: 16, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(11,30,61,0.6)', alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
});

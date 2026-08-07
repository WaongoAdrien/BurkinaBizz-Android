// app/vendor/pending.tsx — shown while vendor awaits admin approval

import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../lib/AuthContext';
import { Colors } from '../../constants';
import { useColorTheme } from '../../hooks/useColorTheme';
import { useTranslation, registerTranslations } from '../../lib/LanguageContext';
import { AppHeader } from '../../components/AppHeader';

registerTranslations({
  "Demande en cours d'examen": 'Application under review',
  'Bonjour': 'Hello',
  'votre demande de compte vendeur a bien été reçue.': 'your vendor account application has been received.',
  'Email': 'Email',
  'WhatsApp': 'WhatsApp',
  'Statut': 'Status',
  "En attente d'approbation": 'Awaiting approval',
  '📋 Prochaines étapes': '📋 Next steps',
  'Notre équipe examine votre demande': 'Our team is reviewing your application',
  'Vous serez approuvé sous 24–48h': 'You will be approved within 24–48h',
  'Cette page se met à jour automatiquement': 'This page updates automatically',
  '🛒  Parcourir le marché': '🛒  Browse the marketplace',
  'Se déconnecter': 'Sign out',
});

export default function PendingScreen() {
  const router = useRouter();
  const { user, userProfile, isApprovedVendor, isAdmin, signOut } = useAuth();
  const { theme } = useColorTheme();
  const { t } = useTranslation();

  // Auto-redirect the moment admin approves (real-time listener in AuthContext)
  useEffect(() => {
    if (!user) { router.replace('/auth'); return; }
    if (isApprovedVendor || isAdmin) { router.replace('/vendor/dashboard'); }
  }, [isApprovedVendor, isAdmin, user]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  if (!userProfile) {
    return (
      <View style={{ flex: 1 }}>
        <AppHeader title={t('Mon espace')} />
        <LinearGradient
          colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
          style={styles.center}
        >
          <ActivityIndicator color={Colors.primary} size="large" />
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <LinearGradient
        colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
        style={{ flex: 1 }}
      >
      <AppHeader title={t('Mon espace')} />
      <View style={styles.container}>
        {/* ICON */}
        <View style={[styles.iconCircle, { backgroundColor: Colors.cta + '22' }]}>
          <Text style={styles.icon}>⏳</Text>
        </View>

        {/* TITLE */}
        <Text style={[styles.title, { color: theme.text }]}>
          {t("Demande en cours d'examen")}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t('Bonjour')} {userProfile.name}, {t('votre demande de compte vendeur a bien été reçue.')}
        </Text>

        {/* STATUS CARD */}
        <View style={[styles.statusCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Row icon="✉️" label={t('Email')} value={userProfile.email} theme={theme} />
          <Row icon="📱" label={t('WhatsApp')} value={userProfile.phone || '—'} theme={theme} />
          <Row icon="🔖" label={t('Statut')} value={t("En attente d'approbation")} theme={theme} valueColor={Colors.cta} />
        </View>

        {/* WHAT HAPPENS NEXT */}
        <View style={[styles.infoBox, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '40' }]}>
          <Text style={[styles.infoTitle, { color: Colors.primary }]}>{t('📋 Prochaines étapes')}</Text>
          {[
            'Notre équipe examine votre demande',
            'Vous serez approuvé sous 24–48h',
            'Cette page se met à jour automatiquement',
          ].map((s, i) => (
            <View key={i} style={styles.infoRow}>
              <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
              <Text style={[styles.infoText, { color: theme.text }]}>{t(s)}</Text>
            </View>
          ))}
        </View>

        {/* BROWSE BUTTON */}
        <TouchableOpacity
          style={[styles.browseBtn, { backgroundColor: Colors.primary }]}
          onPress={() => router.push('/annuaire')}
        >
          <Text style={styles.browseBtnText}>{t('🛒  Parcourir le marché')}</Text>
        </TouchableOpacity>

        {/* SIGN OUT */}
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
          <Text style={[styles.signOutText, { color: theme.textSecondary }]}>
            {t('Se déconnecter')}
          </Text>
        </TouchableOpacity>
      </View>
      </LinearGradient>
    </View>
  );
}

function Row({ icon, label, value, theme, valueColor }: {
  icon: string; label: string; value: string;
  theme: any; valueColor?: string;
}) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.icon}>{icon}</Text>
      <Text style={[rowStyles.label, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[rowStyles.value, { color: valueColor || theme.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  icon: { fontSize: 18, width: 26 },
  label: { fontSize: 13, width: 80 },
  value: { flex: 1, fontSize: 13, fontWeight: '400', textAlign: 'right' },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: {
    flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 24,
  },
  iconCircle: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  icon: { fontSize: 44 },
  title: { fontSize: 22, fontWeight: '400', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 8 },
  statusCard: {
    width: '100%', borderRadius: 8, padding: 16,
    borderWidth: 1, marginBottom: 16,
  },
  infoBox: {
    width: '100%', borderRadius: 8, padding: 16,
    borderWidth: 1, marginBottom: 24,
  },
  infoTitle: { fontSize: 14, fontWeight: '400', marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  infoText: { fontSize: 13, flex: 1, lineHeight: 18 },
  browseBtn: {
    width: '100%', paddingVertical: 15, borderRadius: 8,
    alignItems: 'center', marginBottom: 12,
  },
  browseBtnText: { color: '#fff', fontSize: 16, fontWeight: '400' },
  signOutBtn: { padding: 12 },
  signOutText: { fontSize: 13 },
});

// app/more.tsx — Categories, submit business, contact & how it works

import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';
import { useAuth } from '../lib/AuthContext';
import { ContentContainer } from '../components/ContentContainer';
import { AppHeader } from '../components/AppHeader';
import { useTranslation, registerTranslations } from '../lib/LanguageContext';

registerTranslations({
  'Par Catégorie': 'By Category',
  'Parcourir les entreprises': 'Browse all businesses',
  'Produits à vendre': 'Products for sale',
  'Achetez et vendez des articles entre particuliers': 'Buy and sell items with other users',
  'Applications utiles au Burkina Faso': 'Useful applications in Burkina Faso',
  "Découvrez les meilleures applications": 'Discover the best Burkinabè mobile apps',
  'Vous avez une entreprise?': 'Do you have a business?',
  "Référencez-la gratuitement dans l'annuaire": 'List it for free in the directory',
  'Nous contacter sur WhatsApp': 'Contact us on WhatsApp',
  'Questions? On vous répond rapidement': 'Questions? We respond quickly',
  'Comment ça marche?': 'How does it work?',
  'Chercher': 'Search',
  'Trouvez une entreprise par catégorie ou ville': 'Find a business by category or city',
  'Contacter': 'Contact',
  'Appelez ou écrivez sur WhatsApp ou Facebook directement': 'Call or message directly on WhatsApp or Facebook',
  'Sauvegarder': 'Save',
  'Ajoutez vos entreprises préférées aux favoris': 'Add your favorite businesses to your favorites',
});

// ── Your contact number ───────────────────────────────────────────────────────
const CONTACT_WHATSAPP = '+1 646 478 6515'; // 👈 Replace with your real number
const CONTACT_MESSAGE  = 'Bonjour! Je souhaite référencer mon entreprise sur BurkinaBizz 🇧🇫';
// ─────────────────────────────────────────────────────────────────────────────

function StepCard({ step, index, theme, onPress }: {
  step: { iconName: string; title: string; desc: string; color: string };
  index: number;
  theme: any;
  onPress?: () => void;
}) {
  const { t } = useTranslation();
  const translateX = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 450,
        delay: index * 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 450,
        delay: index * 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateX }], opacity }}>
      <TouchableOpacity
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress}
        onPress={onPress}
        style={[styles.stepCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <View style={[styles.stepAccent, { backgroundColor: step.color }]} />
        <View style={[styles.stepNum, { backgroundColor: step.color }]}>
          <Text style={styles.stepNumText}>{index + 1}</Text>
        </View>
        <View style={[styles.stepIconContainer, { backgroundColor: step.color + '22', borderRadius: 12 }]}>
          <Ionicons name={step.iconName as any} size={22} color={step.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.stepTitle, { color: theme.text }]}>{t(step.title)}</Text>
          <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>{t(step.desc)}</Text>
        </View>
        {onPress && <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const { theme } = useColorTheme();
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: '#ecf0f4' }]}>
      <AppHeader title={t('Découvrir')} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <ContentContainer maxWidth={600} style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 }}>
          {/* CATEGORIES LINK */}
          <TouchableOpacity
            style={[styles.categoriesLink, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push('/categories')}
            activeOpacity={0.8}
          >
            <View style={styles.categoriesLinkIcon}>
              <Ionicons name="grid" size={22} color={Colors.cta} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.categoriesLinkTitle, { color: theme.text }]}>{t('Par Catégorie')}</Text>
              <Text style={[styles.categoriesLinkSub, { color: theme.textSecondary }]}>{t('Parcourir toutes les catégories')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          {/* MARKETPLACE LINK */}
          <TouchableOpacity
            style={[styles.categoriesLink, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push('/product-categories')}
            activeOpacity={0.8}
          >
            <View style={styles.categoriesLinkIcon}>
              <Ionicons name="pricetags" size={22} color={Colors.cta} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.categoriesLinkTitle, { color: theme.text }]}>{t('Produits à vendre')}</Text>
              <Text style={[styles.categoriesLinkSub, { color: theme.textSecondary }]}>{t('Achetez et vendez des articles entre particuliers')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          {/* USEFUL APPLICATIONS LINK */}
          <TouchableOpacity
            style={[styles.categoriesLink, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push('/applications')}
            activeOpacity={0.8}
          >
            <View style={styles.categoriesLinkIcon}>
              <Ionicons name="apps" size={22} color={Colors.cta} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.categoriesLinkTitle, { color: theme.text }]}>{t('Applications utiles au Burkina Faso')}</Text>
              <Text style={[styles.categoriesLinkSub, { color: theme.textSecondary }]}>{t('Découvrez les meilleures applications mobiles burkinabè')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          {/* SUBMIT BUSINESS CTA */}
          <TouchableOpacity
            onPress={() => router.push(user ? '/vendor/add-business' : '/auth')}
            activeOpacity={0.85}
            style={styles.submitCtaWrap}
          >
            <LinearGradient
              colors={Colors.headerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitCta}
            >
              <View style={styles.submitCtaIconCircle}>
                <MaterialCommunityIcons name="storefront" size={30} color={Colors.headerGradient[1]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.submitCtaTitle}>{t('Vous avez une entreprise?')}</Text>
                <Text style={styles.submitCtaSub}>{t("Référencez-la gratuitement dans l'annuaire")}</Text>
              </View>
              <View style={styles.submitCtaArrow}>
                <Text style={{ color: Colors.headerGradient[1], fontWeight: '400', fontSize: 18 }}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* WHATSAPP CONTACT */}
          <TouchableOpacity
            style={styles.waBtn}
            onPress={() => {
              const num = CONTACT_WHATSAPP.replace(/\D/g, '');
              Linking.openURL(`https://wa.me/${num}?text=${encodeURIComponent(CONTACT_MESSAGE)}`);
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="logo-whatsapp" size={32} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={styles.waTitle}>{t('Nous contacter sur WhatsApp')}</Text>
              <Text style={styles.waSub}>{t('Questions? On vous répond rapidement')}</Text>
            </View>
            <Text style={styles.waArrow}>→</Text>
          </TouchableOpacity>

          {/* HOW IT WORKS */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('Comment ça marche?')}</Text>
          {[
            { iconName: 'search', title: 'Chercher', desc: 'Trouvez une entreprise par catégorie ou ville', color: Colors.cta },
            { iconName: 'call', title: 'Contacter', desc: 'Appelez ou écrivez sur WhatsApp ou Facebook directement', color: Colors.headerGradient[1] },
            { iconName: 'heart', title: 'Sauvegarder', desc: 'Ajoutez vos entreprises préférées aux favoris', color: '#EC4899' },
          ].map((step, i) => (
            <StepCard
              key={step.title}
              step={step}
              index={i}
              theme={theme}
              onPress={step.title === 'Chercher' ? () => router.push('/annuaire') : undefined}
            />
          ))}
        </ContentContainer>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  appTitle: { fontSize: 26, fontWeight: '400', letterSpacing: -0.5, marginBottom: 20, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '400', marginBottom: 14 },
  categoriesLink: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 8, padding: 16, marginBottom: 24, borderWidth: 1, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  categoriesLinkIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.cta + '22', alignItems: 'center', justifyContent: 'center' },
  categoriesLinkTitle: { fontSize: 15, fontWeight: '400', marginBottom: 2 },
  categoriesLinkSub: { fontSize: 12 },
  submitCtaWrap: { marginBottom: 24, borderRadius: 10, elevation: 6, shadowColor: Colors.headerGradient[0], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 10 },
  submitCta: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 18, gap: 14 },
  submitCtaIconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  submitCtaTitle: { fontSize: 16, fontWeight: '400', color: '#fff', marginBottom: 3 },
  submitCtaSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 17 },
  submitCtaArrow: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  stepCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingRight: 14, paddingLeft: 0, borderRadius: 7, borderWidth: 1, marginBottom: 10, gap: 12, overflow: 'hidden' },
  stepAccent: { width: 5, alignSelf: 'stretch', backgroundColor: Colors.cta, borderTopLeftRadius: 7, borderBottomLeftRadius: 7, marginRight: 8 },
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: '#fff', fontWeight: '400', fontSize: 13 },
  stepIconContainer: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontSize: 14, fontWeight: '400' },
  stepDesc: { fontSize: 12, marginTop: 2 },
  waBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, padding: 16, marginBottom: 24, gap: 12, backgroundColor: '#2d7647' },
  waTitle: { fontSize: 15, fontWeight: '400', color: '#fff' },
  waSub: { fontSize: 12, marginTop: 2, color: 'rgba(255,255,255,0.85)' },
  waArrow: { color: '#fff', fontWeight: '400', fontSize: 18 },
});

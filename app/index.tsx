// app/index.tsx — HomeScreen

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';
import { ContentContainer } from '../components/ContentContainer';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useTranslation, registerTranslations } from '../lib/LanguageContext';

registerTranslations({
  "L'annuaire des entreprises fiables!": 'The directory of trusted businesses!',
  'Burkina Faso': 'Burkina Faso',
  'Local': 'Local',
  'Utilisateurs': 'Users',
  'Découvrez vos entreprises locales': 'Discover your local businesses',
  'Partout au Burkina Faso 🇧🇫': 'All across Burkina Faso 🇧🇫',
  'La ville vous accueille': 'The city welcomes you',
  'Hôtels, restaurants et adresses incontournables 🏨': 'Hotels, restaurants and must-visit spots 🏨',
  'Une nature à couper le souffle': 'Breathtaking nature',
  'Parcs, réserves et paysages sauvages du Burkina Faso 🐘': "Parks, reserves and wild landscapes of Burkina Faso 🐘",
  'BurkinaBizz 2026 — Gratuit et ne vend aucun produit.': 'BurkinaBizz 2026 — Free to use and does not sell any product.',
  'Découvrir le Burkina Faso': 'Discover Burkina Faso',
  'Entreprises locales': 'Local businesses',
  'Événements locaux': 'Local events',
  'À propos du Burkina': 'About Burkina',
  'Sites touristiques': 'Tourist sites',
  'Ciel dégagé': 'Clear sky',
  'Peu nuageux': 'Partly cloudy',
  'Nuageux': 'Cloudy',
  'Brumeux': 'Misty',
  'Pluie': 'Rain',
  'Neige': 'Snow',
  'Averses': 'Showers',
  'Orage': 'Thunderstorm',
  'Variable': 'Variable',
});

// ── Hero banner images ─────────────────────────────────────────────────────────
const HERO_IMAGE = require('../assets/indeximage.png');
const HOTEL_IMAGE = require('../assets/hotel.png');
const NATURE_IMAGE = require('../assets/indeximage3.png');
// ─────────────────────────────────────────────────────────────────────────────

const SLIDE_COUNT = 4;
const SLIDE_INTERVAL_MS = 5000;

// Maps Open-Meteo WMO weather codes to an icon + French label.
// isNight swaps the sun for a moon so clear/partly-clear skies read correctly after dark.
function getWeatherInfo(code: number, isNight: boolean): { icon: string; label: string } {
  if (code === 0) return { icon: isNight ? 'moon' : 'sunny', label: 'Ciel dégagé' };
  if (code <= 2) return { icon: isNight ? 'cloudy-night' : 'partly-sunny', label: 'Peu nuageux' };
  if (code === 3) return { icon: 'cloud', label: 'Nuageux' };
  if (code === 45 || code === 48) return { icon: 'cloud', label: 'Brumeux' };
  if (code >= 51 && code <= 67) return { icon: 'rainy', label: 'Pluie' };
  if (code >= 71 && code <= 77) return { icon: 'snow', label: 'Neige' };
  if (code >= 80 && code <= 82) return { icon: 'rainy', label: 'Averses' };
  if (code >= 95) return { icon: 'thunderstorm', label: 'Orage' };
  return { icon: 'partly-sunny', label: 'Variable' };
}

// Grows by 100 every month starting from June 2026 baseline of 300
const LAUNCH_YEAR = 2026;
const LAUNCH_MONTH = 6; // June (1-indexed)
const now = new Date();
const monthsElapsed = (now.getFullYear() - LAUNCH_YEAR) * 12 + (now.getMonth() + 1 - LAUNCH_MONTH);
const DAILY_USERS = 300 + Math.max(0, monthsElapsed) * 100;

export default function HomeScreen() {
  const router = useRouter();
  const { theme, isDark } = useColorTheme();
  const [heroWidth, setHeroWidth] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);
  const [clock, setClock] = useState(new Date());
  const heroScrollRef = useRef<ScrollView>(null);
  const { t, language } = useTranslation();

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=12.3714&longitude=-1.5197&current_weather=true')
      .then(res => res.json())
      .then(data => {
        if (data?.current_weather) {
          setWeather({
            temp: Math.round(data.current_weather.temperature),
            code: data.current_weather.weathercode,
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  // Auto-rotate through all hero slides every 3 seconds.
  useEffect(() => {
    if (heroWidth === 0) return;
    const id = setInterval(() => {
      setActiveSlide(prev => {
        const next = (prev + 1) % SLIDE_COUNT;
        heroScrollRef.current?.scrollTo({ x: next * heroWidth, animated: true });
        return next;
      });
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [heroWidth]);

  const hourInOuaga = parseInt(
    clock.toLocaleTimeString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Africa/Ouagadougou' }),
    10
  );
  const isNight = hourInOuaga < 6 || hourInOuaga >= 18;
  const weatherInfo = getWeatherInfo(weather?.code ?? 0, isNight);
  const locale = language === 'en' ? 'en-GB' : 'fr-FR';
  const timeStr = clock.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Ouagadougou' });
  const dateStr = clock.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Ouagadougou' });

  return (
    <View style={[styles.container, { backgroundColor: '#e8ecf0' }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerGradient[0]} />

      {/* HEADER */}
      <LinearGradient
        colors={Colors.headerGradient}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <ContentContainer maxWidth={600} style={{ paddingHorizontal: 10 }}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.flag}></Text>
              <Text style={styles.appTitle}>BurkinaBizz</Text>
              <Text style={styles.tagline}>{t("L'annuaire des entreprises fiables!")}</Text>
            </View>
            <LanguageSwitcher />
          </View>
        </ContentContainer>
      </LinearGradient>

      <View style={{ flex: 1, backgroundColor: '#e8ecf0' }}>
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
        <ContentContainer maxWidth={600} style={{ paddingHorizontal: 6, paddingTop: 20 }}>
        {/* STATS BANNER */}
        <LinearGradient
          colors={['#FFFFFF', '#c6b58a']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.statsBanner}
        >
          <View style={styles.statItem}>
            <Text style={styles.statNum}>🇧🇫</Text>
            <Text style={[styles.statLbl, { color: theme.textSecondary }]}>{t('Burkina Faso')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>100%</Text>
            <Text style={[styles.statLbl, { color: theme.textSecondary }]}>{t('Local')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>+{DAILY_USERS}</Text>
            <Text style={[styles.statLbl, { color: theme.textSecondary }]}>{t('Utilisateurs')}</Text>
          </View>
        </LinearGradient>
        {/* HERO BANNER CAROUSEL */}
        <View
          style={styles.heroBanner}
          onLayout={(e) => setHeroWidth(e.nativeEvent.layout.width)}
        >
          {heroWidth > 0 && (
            <ScrollView
              ref={heroScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => setActiveSlide(Math.round(e.nativeEvent.contentOffset.x / heroWidth))}
              scrollEventThrottle={16}
            >
              {/* SLIDE 1: HERO IMAGE */}
              <View style={{ width: heroWidth, height: '100%' }}>
                <Image
                  source={HERO_IMAGE}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)']}
                  style={styles.heroOverlay}
                >
                  <Text style={styles.heroTitle}>{t('Découvrez vos entreprises locales')}</Text>
                  <Text style={styles.heroSubtitle}>{t('Partout au Burkina Faso 🇧🇫')}</Text>
                </LinearGradient>
              </View>

              {/* SLIDE 2: CITY / HOTEL */}
              <View style={{ width: heroWidth, height: '100%' }}>
                <Image
                  source={HOTEL_IMAGE}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.65)']}
                  style={styles.heroOverlay}
                >
                  <Text style={styles.heroTitle}>{t('La ville vous accueille')}</Text>
                  <Text style={styles.heroSubtitle}>{t('Hôtels, restaurants et adresses incontournables 🏨')}</Text>
                </LinearGradient>
              </View>

              {/* SLIDE 3: NATURE ESCAPE */}
              <View style={{ width: heroWidth, height: '100%' }}>
                <Image
                  source={NATURE_IMAGE}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.65)']}
                  style={styles.heroOverlay}
                >
                  <Text style={styles.heroTitle}>{t('Une nature à couper le souffle')}</Text>
                  <Text style={styles.heroSubtitle}>{t('Parcs, réserves et paysages sauvages du Burkina Faso 🐘')}</Text>
                </LinearGradient>
              </View>

              {/* SLIDE 4: WEATHER & TIME */}
              <View style={{ width: heroWidth, height: '100%' }}>
                <LinearGradient
                  colors={['#aebfdf', '#103670']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.weatherSlide}
                >
                  <Text style={styles.weatherCity}>📍 Ouagadougou, Burkina Faso</Text>
                  <Text style={styles.weatherTime}>{timeStr}</Text>
                  <Text style={styles.weatherDate}>{dateStr}</Text>
                  <View style={styles.weatherRow}>
                    <Ionicons name={weatherInfo.icon as any} size={38} color="#fff" />
                    <Text style={styles.weatherTemp}>{weather ? `${weather.temp}°C` : '--°C'}</Text>
                  </View>
                  <Text style={styles.weatherCondition}>{t(weatherInfo.label)}</Text>
                </LinearGradient>
              </View>
            </ScrollView>
          )}

          {/* PAGER DOTS */}
          <View style={styles.heroDots}>
            {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
              <View key={i} style={[styles.heroDot, activeSlide === i && styles.heroDotActive]} />
            ))}
          </View>
        </View>

        {/* APP EXPLANATION */}
        <Text style={[styles.explainText, { color: theme.text }]}>
          {t('Découvrir le Burkina Faso')}
        </Text>

        {/* CARD GRID */}
        <View style={styles.cardGrid}>
          {[
            { icon: 'compass-outline', title: 'Entreprises locales', onPress: () => router.push('/more'), accent: '#2B617C', gradient: ['#76afc9', '#4e6aad'] },
            { icon: 'megaphone-outline', title: 'Événements locaux', onPress: () => router.push('/evenement'), accent: '#8A6D1F', gradient: ['#bcb296', '#ae924b'] },
            { icon: 'earth-outline', title: 'À propos du Burkina', onPress: () => router.push('/about-burkina'), accent: '#2E7D32', gradient: ['#84b88c', '#59b851'] },
            { icon: 'camera-outline', title: 'Sites touristiques', onPress: () => router.push('/tourism-sites'), accent: '#B3492F', gradient: ['#d8c3c0', '#dfa398'] },
          ].map((item) => (
            <TouchableOpacity
              key={item.title}
              style={[styles.gridCard, { shadowColor: item.accent }]}
              onPress={item.onPress}
              disabled={!item.onPress}
              activeOpacity={item.onPress ? 0.85 : 1}
            >
              <LinearGradient
                colors={item.gradient as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.gridCardGradient}
              >
                <View style={[styles.gridCardIconCircle, { backgroundColor: item.accent + '4D' }]}>
                  <Ionicons name={item.icon as any} size={26} color="#fff" />
                </View>
                <Text style={styles.gridCardTitle}>{t(item.title)}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.disclaimer}>{t('BurkinaBizz 2026 — Gratuit et ne vend aucun produit.')}</Text>

        <View style={{ height: 32 }} />
        </ContentContainer>
      </ScrollView>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 6, paddingTop: 0, paddingBottom: 24
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  flag: { fontSize: 32 },
  appTitle: { fontSize: 28, fontWeight: '600', color: '#fff', letterSpacing: -0.5, marginTop: 5 },
  tagline: { fontSize: 13, color: '#A5D6A7', marginTop: 2 },
  dashPill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginTop: 10, height:65, justifyContent:'center', alignItems:'center' },
  dashPillText: { color: '#fff', fontWeight: '400', fontSize: 13 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },
  statsBanner: {
    flexDirection: 'row', borderRadius: 8, padding: 16,
    marginBottom: 16, alignItems: 'center', justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 18, fontWeight: '400', color: Colors.primary },
  statLbl: { fontSize: 11, marginTop: 2, fontWeight: '400' },
  statDivider: { width: 1, height: 32, opacity: 0.4 },
  // Hero banner with image
  heroBanner: {
    height: 280,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 32,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    justifyContent: 'flex-end',
  },
  heroTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '400',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  explainText: { fontSize: 16, fontWeight: '700', lineHeight: 22, marginBottom: 8, textAlign: 'center' },
  disclaimer: { fontSize: 10, color: '#9AA3AC', textAlign: 'center', marginTop: 18 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8, justifyContent: 'center' },
  heroDots: { position: 'absolute', bottom: 10, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  heroDotActive: { backgroundColor: '#fff', width: 18 },
  weatherSlide: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  weatherCity: { color: '#050303', fontSize: 13, fontWeight: '200', marginBottom: 10, opacity: 1.9},
  weatherTime: { color: '#fff', fontSize: 42, fontWeight: '600', letterSpacing: 1 },
  weatherDate: { color: '#050303', fontSize: 13, fontWeight: '200', marginBottom: 14, textTransform: 'capitalize', opacity: 1.75 },
  weatherRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weatherTemp: { color: '#fff', fontSize: 28, fontWeight: '600' },
  weatherCondition: { color: '#fff', fontSize: 13, marginTop: 4, fontWeight: '600' },
  gridCard: { width: '47%', borderRadius: 8, elevation: 3, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6 },
  gridCardGradient: { borderRadius: 8, paddingVertical: 20, paddingHorizontal: 10, alignItems: 'center', gap: 8 },
  gridCardIconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  gridCardTitle: {
    fontSize: 13, fontWeight: '600', letterSpacing: 0.2, textAlign: 'center', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
});

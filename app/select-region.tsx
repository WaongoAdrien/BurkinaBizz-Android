// app/select-region.tsx — Region Selection Screen

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, StatusBar,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, CITY_INFO } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';
import { TabBar } from '../components/TabBar';


export default function SelectRegionScreen() {
  const router = useRouter();
  const { theme } = useColorTheme();
  const gradientColors: readonly [string, string, ...string[]] =
    theme.backgroundGradient.length >= 2
      ? (theme.backgroundGradient as [string, string, ...string[]])
      : [theme.background, theme.background];

  const handleRegionPress = (regionName: string) => {
    // Navigate to correct annuaire based on region
    if (regionName === 'China') {
      router.push('/annuaire-china');
    } else if (regionName === 'New York') {
      router.push('/annuaire-newyork');
    } else if (regionName === 'South Korea') {
      router.push('/annuaire-southkorea');
    } else {
      router.push('/annuaire');
    }
  };

  return (
    <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: 'Select Region',
          headerShown: true,
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          headerBackTitle: ' .',
          headerBackTitleStyle: { fontSize: 100 },
        }}
      />

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Recherchez par Région</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Retrouvez les meuilleurs commerces et services par région.
          </Text>
        </View>

        {/* REGION CARDS */}
        <View style={styles.regionsGrid}>
          {CITY_INFO.map((cityInfo, index) => (
            <TouchableOpacity
              key={cityInfo.name}
              style={[
                styles.regionCard,
                { backgroundColor: theme.card, borderColor: theme.border }
              ]}
              onPress={() => handleRegionPress(cityInfo.name)}
              activeOpacity={0.85}
            >
              {/* IMAGE */}
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: cityInfo.image }} 
                  style={styles.image}
                  resizeMode="cover"
                />
                {/* GRADIENT OVERLAY */}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.imageOverlay}
                />
                {/* REGION NAME ON IMAGE */}
                <View style={styles.imageTextContainer}>
                  <Text style={styles.imageName}>{cityInfo.name}</Text>
                </View>
              </View>

              {/* INFO */}
              <View style={styles.cardBody}>
                <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
                  {cityInfo.description}
                </Text>
                
                {/* CITIES LIST */}
                <View style={styles.citiesList}>
                  {cityInfo.cities.map((city, idx) => (
                    <View key={idx} style={[styles.cityBadge, { backgroundColor: Colors.primary + '22' }]}>
                      <Text style={[styles.cityBadgeText, { color: Colors.primary }]}>
                        📍 {city}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* BROWSE BUTTON */}
                <View style={[styles.browseBtn, { backgroundColor: Colors.primary }]}>
                  <Text style={styles.browseBtnText}>Voir les entreprises</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={{ height: 40 }} />
    </ScrollView>
     <TabBar />
 </LinearGradient>
                     

  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { 
    paddingHorizontal: 6,
    paddingTop: 20,
    alignItems: 'center',
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 24,
    width: '100%',
    maxWidth: 900,
  },
  title: { 
    fontSize: 18, 
    fontWeight: '900', 
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: { 
    fontSize: 15, 
    textAlign: 'center',
    lineHeight: 22,
  },
  
  regionsGrid: { 
    width: '100%', 
    maxWidth: 900,
    gap: 20,
  },
  
  regionCard: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  
  imageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  imageTextContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  imageName: {
    fontSize: 19,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  
  cardBody: {
    padding: 16,
    gap: 12,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  
  citiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cityBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  browseBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});
// components/LocationPicker.tsx
// Uses OpenStreetMap + Leaflet — completely free, no API key needed.

import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  StyleSheet, ActivityIndicator, Alert, Platform,
  KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ExpoLocation from 'expo-location';
import { Colors } from '../constants';
import { BusinessLocation } from '../types/index2';
import { useTranslation, registerTranslations } from '../lib/LanguageContext';

registerTranslations({
  "📍 Appuyez sur la carte pour placer l'épingle": '📍 Tap the map to place the pin',
  '📍 Ouagadougou (défaut) — touchez la carte': '📍 Ouagadougou (default) — tap the map',
  'Permission refusée': 'Permission denied',
  'Activez la localisation dans les paramètres.': 'Enable location in settings.',
  'Erreur': 'Error',
  "Impossible d'obtenir votre position.": 'Unable to get your position.',
  'Requis': 'Required',
  'Entrez une adresse ou utilisez la carte.': 'Enter an address or use the map.',
  'Appuyez sur la carte pour placer une épingle.': 'Tap the map to place a pin.',
  'Annuler': 'Cancel',
  '📍 Localisation': '📍 Location',
  'Confirmer': 'Confirm',
  'Adresse': 'Address',
  'Carte': 'Map',
  'Localisation en cours...': 'Getting location...',
  'Utiliser ma position GPS': 'Use my GPS location',
  'ou entrez une adresse': 'or enter an address',
  'Adresse / Quartier / Repère': 'Address / District / Landmark',
  'Ex: Secteur 15, près du marché Rood Woko, Ouagadougou': 'E.g: Sector 15, near Rood Woko market, Ouagadougou',
  'Soyez précis: quartier, rue, bâtiment de référence (école, mosquée, marché...)': 'Be precise: district, street, landmark (school, mosque, market...)',
  'Supprimer la localisation': 'Remove location',
  'Chargement OpenStreetMap...': 'Loading OpenStreetMap...',
});

interface Props {
  visible: boolean;
  current?: BusinessLocation;
  onConfirm: (location: BusinessLocation) => void;
  onClose: () => void;
  theme: any;
}

type Tab = 'address' | 'map';

const DEFAULT_LAT = 12.3714;  // Ouagadougou
const DEFAULT_LNG = -1.5197;

const buildMapHTML = (lat: number, lng: number, hintText: string, barText: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; }
    #hint {
      position:fixed; top:14px; left:50%; transform:translateX(-50%);
      background:rgba(11,30,61,0.82); color:#fff; padding:9px 20px;
      border-radius:22px; font-size:13px; z-index:1000; white-space:nowrap;
      pointer-events:none; font-family:-apple-system,sans-serif;
      box-shadow:0 4px 12px rgba(0,0,0,0.25);
    }
    #bar {
      position:fixed; bottom:0; left:0; right:0;
      background:#0B1E3D; color:#fff; padding:14px 16px;
      font-size:14px; font-family:-apple-system,sans-serif; text-align:center;
      z-index:1000; font-weight:600; letter-spacing:0.2px;
    }
  </style>
</head>
<body>
  <div id="hint">${hintText}</div>
  <div id="bar">${barText}</div>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var lat = ${lat}, lng = ${lng};
    var map = L.map('map', { zoomControl: true }).setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    }).addTo(map);

    var icon = L.divIcon({
      html: '<div style="font-size:32px;line-height:1;transform:translateY(-50%)">📍</div>',
      iconSize: [32, 32], iconAnchor: [16, 32], className: ''
    });

    var marker = L.marker([lat, lng], { draggable: true, icon: icon }).addTo(map);

    function send(lt, ln) {
      document.getElementById('bar').textContent =
        '✓  ' + lt.toFixed(5) + ',  ' + ln.toFixed(5);
      window.ReactNativeWebView.postMessage(JSON.stringify({ lat: lt, lng: ln }));
    }

    marker.on('dragend', function(e) {
      var p = e.target.getLatLng();
      send(p.lat, p.lng);
    });

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      send(e.latlng.lat, e.latlng.lng);
    });

    send(lat, lng);
  </script>
</body>
</html>`;

export default function LocationPicker({ visible, current, onConfirm, onClose, theme }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('address');
  const [address, setAddress] = useState(current?.address || '');
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    current?.latitude ? { lat: current.latitude, lng: current.longitude! } : null
  );
  const [mapLoading, setMapLoading] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);
  const webviewRef = useRef<any>(null);

  const handleGPS = async () => {
    setGpsLoading(true);
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('Permission refusée'), t('Activez la localisation dans les paramètres.'));
        return;
      }
      const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      setPin({ lat: latitude, lng: longitude });
      setTab('map');
      // Pan map to GPS position
      webviewRef.current?.injectJavaScript(`
        var ll = L.latLng(${latitude}, ${longitude});
        map.setView(ll, 17);
        marker.setLatLng(ll);
        send(${latitude}, ${longitude});
        true;
      `);
    } catch {
      Alert.alert(t('Erreur'), t("Impossible d'obtenir votre position."));
    } finally {
      setGpsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (tab === 'address') {
      if (!address.trim()) {
        Alert.alert(t('Requis'), t("Entrez une adresse ou utilisez la carte."));
        return;
      }
      onConfirm({ address: address.trim() });
    } else {
      if (!pin) {
        Alert.alert(t('Requis'), t("Appuyez sur la carte pour placer une épingle."));
        return;
      }
      onConfirm({
        address: address.trim() || undefined,
        latitude: pin.lat,
        longitude: pin.lng,
      });
    }
  };

  const handleClear = () => {
    setAddress('');
    setPin(null);
    onConfirm({});
    onClose();
  };

  const startLat = pin?.lat ?? DEFAULT_LAT;
  const startLng = pin?.lng ?? DEFAULT_LNG;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <LinearGradient
        colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
        style={styles.modal}
      >
      <KeyboardAvoidingView
        style={styles.modal}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* HEADER */}
        <LinearGradient
          colors={Colors.headerGradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 10 }]}
        >
          <Text style={styles.headerTitle} numberOfLines={1}>{t('📍 Localisation')}</Text>
        </LinearGradient>

        {/* TABS */}
        <View style={[styles.tabRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {(['address', 'map'] as Tab[]).map(tabKey => (
            <TouchableOpacity
              key={tabKey}
              style={styles.tabBtn}
              onPress={() => setTab(tabKey)}
              activeOpacity={0.8}
            >
              {tab === tabKey ? (
                <LinearGradient
                  colors={Colors.headerGradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.tabBtnActive}
                >
                  <Ionicons name={tabKey === 'address' ? 'create-outline' : 'map-outline'} size={16} color="#fff" />
                  <Text style={[styles.tabText, { color: '#fff' }]}>
                    {tabKey === 'address' ? t('Adresse') : t('Carte')}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={styles.tabBtnInactive}>
                  <Ionicons name={tabKey === 'address' ? 'create-outline' : 'map-outline'} size={16} color={theme.textSecondary} />
                  <Text style={[styles.tabText, { color: theme.textSecondary }]}>
                    {tabKey === 'address' ? t('Adresse') : t('Carte')}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* CANCEL / CONFIRM */}
        <View style={[styles.tabRow, { marginTop: 0, backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity style={styles.tabBtn} onPress={onClose} activeOpacity={0.8}>
            <View style={styles.tabBtnInactive}>
              <Ionicons name="close" size={16} color={theme.textSecondary} />
              <Text style={[styles.tabText, { color: theme.textSecondary }]}>{t('Annuler')}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabBtn} onPress={handleConfirm} activeOpacity={0.8}>
            <LinearGradient
              colors={Colors.headerGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.tabBtnActive}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={[styles.tabText, { color: '#fff' }]}>{t('Confirmer')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── ADDRESS TAB ── */}
        {tab === 'address' ? (
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {/* GPS */}
            <TouchableOpacity
              style={styles.gpsBtn}
              onPress={handleGPS}
              disabled={gpsLoading}
              activeOpacity={0.85}
            >
              {gpsLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Ionicons name="navigate" size={18} color="#fff" />
              }
              <Text style={styles.gpsBtnText}>
                {gpsLoading ? t('Localisation en cours...') : t('Utiliser ma position GPS')}
              </Text>
            </TouchableOpacity>

            <View style={styles.orRow}>
              <View style={[styles.orLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.orText, { color: theme.textSecondary }]}>{t('ou entrez une adresse')}</Text>
              <View style={[styles.orLine, { backgroundColor: theme.border }]} />
            </View>

            <Text style={[styles.label, { color: theme.text }]}>{t('Adresse / Quartier / Repère')}</Text>
            <TextInput
              style={[styles.addressInput, {
                borderColor: theme.border,
                backgroundColor: theme.card,
                color: theme.text,
              }]}
              value={address}
              onChangeText={setAddress}
              placeholder={t('Ex: Secteur 15, près du marché Rood Woko, Ouagadougou')}
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoCorrect={false}
            />

            <View style={[styles.hintCard, { backgroundColor: Colors.cta + '14', borderColor: Colors.cta + '33' }]}>
              <Ionicons name="bulb-outline" size={16} color={Colors.cta} />
              <Text style={[styles.hint, { color: theme.text }]}>
                {t('Soyez précis: quartier, rue, bâtiment de référence (école, mosquée, marché...)')}
              </Text>
            </View>

            {pin && (
              <View style={[styles.pinBadge, { backgroundColor: Colors.primary + '14', borderColor: Colors.primary + '3a' }]}>
                <Ionicons name="location" size={16} color={Colors.primary} />
                <Text style={[styles.pinBadgeText, { color: theme.text }]}>
                  GPS: {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
                </Text>
              </View>
            )}

            {(address.trim() || pin) && (
              <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={15} color="#D32F2F" />
                <Text style={styles.clearText}>{t('Supprimer la localisation')}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

        ) : (
          /* ── MAP TAB ── */
          <View style={styles.mapWrap}>
            {/* GPS floating button */}
            <TouchableOpacity style={styles.gpsFloat} onPress={handleGPS} disabled={gpsLoading} activeOpacity={0.85}>
              {gpsLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Ionicons name="navigate" size={19} color="#fff" />
              }
            </TouchableOpacity>

            {/* Loading overlay */}
            {mapLoading && (
              <View style={styles.mapLoading}>
                <ActivityIndicator color={Colors.primary} size="large" />
                <Text style={[styles.mapLoadingText, { color: theme.textSecondary }]}>
                  {t('Chargement OpenStreetMap...')}
                </Text>
              </View>
            )}

            <WebView
              ref={webviewRef}
              source={{ html: buildMapHTML(startLat, startLng, t("📍 Appuyez sur la carte pour placer l'épingle"), t('📍 Ouagadougou (défaut) — touchez la carte')) }}
              style={styles.webview}
              onLoadEnd={() => setMapLoading(false)}
              onMessage={e => {
                try {
                  const d = JSON.parse(e.nativeEvent.data);
                  setPin({ lat: d.lat, lng: d.lng });
                } catch {}
              }}
              javaScriptEnabled
              domStorageEnabled
              geolocationEnabled
              originWhitelist={['*']}
            />

            {pin && (
              <View style={[styles.coordBar, { bottom: 16 + insets.bottom }]}>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.coordBarText}>
                  {pin.lat.toFixed(5)},  {pin.lng.toFixed(5)}
                </Text>
              </View>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1 },

  header: {
    paddingHorizontal: 12, paddingTop: 18, paddingBottom: 18,
  },
  headerTitle: {
    width: '100%', fontSize: 17, fontWeight: '700', color: '#fff',
    textAlign: 'center', letterSpacing: 0.2,
  },

  tabRow: {
    flexDirection: 'row', margin: 14, marginBottom: 10, borderRadius: 12, padding: 4, gap: 4,
    borderWidth: 1,
  },
  tabBtn: { flex: 1, borderRadius: 9, overflow: 'hidden' },
  tabBtnActive: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: 9,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3,
  },
  tabBtnInactive: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: 9,
  },
  tabText: { fontSize: 14, fontWeight: '600' },

  body: { padding: 16, paddingTop: 6, gap: 14 },
  gpsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 9, borderRadius: 10, paddingVertical: 15,
    backgroundColor: Colors.primary,
    elevation: 3, shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6,
  },
  gpsBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 },
  orLine: { flex: 1, height: 1 },
  orText: { fontSize: 12, fontWeight: '500' },
  label: { fontSize: 13, fontWeight: '600' },
  addressInput: {
    borderWidth: 1.5, borderRadius: 10, padding: 14,
    fontSize: 14, minHeight: 84,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3,
  },
  hintCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderWidth: 1, borderRadius: 10, padding: 12,
  },
  hint: { flex: 1, fontSize: 12, lineHeight: 18 },
  pinBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 10, padding: 12,
  },
  pinBadgeText: { flex: 1, fontSize: 12, fontWeight: '500' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  clearText: { color: '#D32F2F', fontSize: 14, fontWeight: '600' },

  mapWrap: { flex: 1, position: 'relative' },
  webview: { flex: 1 },
  mapLoading: {
    ...StyleSheet.absoluteFillObject, alignItems: 'center',
    justifyContent: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.92)', zIndex: 10,
  },
  mapLoadingText: { fontSize: 14 },
  gpsFloat: {
    position: 'absolute', top: 16, right: 16, zIndex: 20,
    backgroundColor: Colors.primary, width: 44, height: 44,
    borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    elevation: 5, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  coordBar: {
    position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 20,
    backgroundColor: Colors.primary, borderRadius: 10,
    paddingVertical: 12, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    elevation: 5, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6,
  },
  coordBarText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
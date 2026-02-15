// components/LocationPicker.tsx
// Uses OpenStreetMap + Leaflet — completely free, no API key needed.

import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  StyleSheet, ActivityIndicator, Alert, Platform,
  KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as ExpoLocation from 'expo-location';
import { Colors } from '../constants';
import { BusinessLocation } from '../types';

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

const buildMapHTML = (lat: number, lng: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; }
    #hint {
      position:fixed; top:12px; left:50%; transform:translateX(-50%);
      background:rgba(0,0,0,0.72); color:#fff; padding:8px 18px;
      border-radius:20px; font-size:13px; z-index:1000; white-space:nowrap;
      pointer-events:none; font-family:sans-serif;
    }
    #bar {
      position:fixed; bottom:0; left:0; right:0;
      background:#2E7D32; color:#fff; padding:12px 16px;
      font-size:13px; font-family:sans-serif; text-align:center;
      z-index:1000; font-weight:700;
    }
  </style>
</head>
<body>
  <div id="hint">📍 Appuyez sur la carte pour placer l'épingle</div>
  <div id="bar">📍 Ouagadougou (défaut) — touchez la carte</div>
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
        Alert.alert('Permission refusée', 'Activez la localisation dans les paramètres.');
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
      Alert.alert('Erreur', "Impossible d'obtenir votre position.");
    } finally {
      setGpsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (tab === 'address') {
      if (!address.trim()) {
        Alert.alert('Requis', "Entrez une adresse ou utilisez la carte.");
        return;
      }
      onConfirm({ address: address.trim() });
    } else {
      if (!pin) {
        Alert.alert('Requis', "Appuyez sur la carte pour placer une épingle.");
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
      <KeyboardAvoidingView
        style={[styles.modal, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* HEADER */}
        <View style={[styles.header, { borderColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={[styles.cancel, { color: theme.textSecondary }]}>Annuler</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>📍 Localisation</Text>
          <TouchableOpacity onPress={handleConfirm} style={styles.headerBtn}>
            <Text style={styles.confirm}>Confirmer</Text>
          </TouchableOpacity>
        </View>

        {/* TABS */}
        <View style={[styles.tabRow, { backgroundColor: theme.surface }]}>
          {(['address', 'map'] as Tab[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && { backgroundColor: Colors.primary }]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, { color: tab === t ? '#fff' : theme.textSecondary }]}>
                {t === 'address' ? '✏️ Adresse' : '🗺️ Carte'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── ADDRESS TAB ── */}
        {tab === 'address' ? (
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {/* GPS */}
            <TouchableOpacity
              style={[styles.gpsBtn, { borderColor: Colors.primary }]}
              onPress={handleGPS}
              disabled={gpsLoading}
            >
              {gpsLoading
                ? <ActivityIndicator color={Colors.primary} size="small" />
                : <Text style={styles.gpsBtnIcon}>📡</Text>
              }
              <Text style={[styles.gpsBtnText, { color: Colors.primary }]}>
                {gpsLoading ? 'Localisation en cours...' : 'Utiliser ma position GPS'}
              </Text>
            </TouchableOpacity>

            <View style={styles.orRow}>
              <View style={[styles.orLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.orText, { color: theme.textSecondary }]}>ou entrez une adresse</Text>
              <View style={[styles.orLine, { backgroundColor: theme.border }]} />
            </View>

            <Text style={[styles.label, { color: theme.text }]}>Adresse / Quartier / Repère</Text>
            <TextInput
              style={[styles.addressInput, {
                borderColor: theme.border,
                backgroundColor: theme.surface,
                color: theme.text,
              }]}
              value={address}
              onChangeText={setAddress}
              placeholder="Ex: Secteur 15, près du marché Rood Woko, Ouagadougou"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoCorrect={false}
            />

            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              💡 Soyez précis: quartier, rue, bâtiment de référence (école, mosquée, marché...)
            </Text>

            {pin && (
              <View style={[styles.pinBadge, { backgroundColor: Colors.primary + '18', borderColor: Colors.primary + '44' }]}>
                <Text>📍</Text>
                <Text style={[styles.pinBadgeText, { color: theme.text }]}>
                  GPS: {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
                </Text>
              </View>
            )}

            {(address.trim() || pin) && (
              <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                <Text style={styles.clearText}>🗑️ Supprimer la localisation</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

        ) : (
          /* ── MAP TAB ── */
          <View style={styles.mapWrap}>
            {/* GPS floating button */}
            <TouchableOpacity style={styles.gpsFloat} onPress={handleGPS} disabled={gpsLoading}>
              {gpsLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={{ fontSize: 18 }}>📡</Text>
              }
            </TouchableOpacity>

            {/* Loading overlay */}
            {mapLoading && (
              <View style={styles.mapLoading}>
                <ActivityIndicator color={Colors.primary} size="large" />
                <Text style={[styles.mapLoadingText, { color: theme.textSecondary }]}>
                  Chargement OpenStreetMap...
                </Text>
              </View>
            )}

            <WebView
              ref={webviewRef}
              source={{ html: buildMapHTML(startLat, startLng) }}
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
              <View style={styles.coordBar}>
                <Text style={styles.coordBarText}>
                  ✓  {pin.lat.toFixed(5)},  {pin.lng.toFixed(5)}
                </Text>
              </View>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerBtn: { minWidth: 80 },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  cancel: { fontSize: 15 },
  confirm: { fontSize: 15, fontWeight: '800', color: Colors.primary, textAlign: 'right' },

  tabRow: {
    flexDirection: 'row', margin: 14, borderRadius: 12, padding: 4, gap: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '700' },

  body: { padding: 16, gap: 14 },
  gpsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 2, borderRadius: 12, paddingVertical: 14,
  },
  gpsBtnIcon: { fontSize: 20 },
  gpsBtnText: { fontSize: 15, fontWeight: '700' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orLine: { flex: 1, height: 1 },
  orText: { fontSize: 12 },
  label: { fontSize: 13, fontWeight: '600' },
  addressInput: {
    borderWidth: 1.5, borderRadius: 10, padding: 12,
    fontSize: 14, minHeight: 80,
  },
  hint: { fontSize: 12, lineHeight: 18 },
  pinBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 10, padding: 12,
  },
  pinBadgeText: { flex: 1, fontSize: 12 },
  clearBtn: { alignItems: 'center', paddingVertical: 10 },
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
    borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    elevation: 5, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  coordBar: {
    position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 20,
    backgroundColor: Colors.primary, borderRadius: 10,
    paddingVertical: 11, alignItems: 'center',
  },
  coordBarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
// components/SitesMapView.tsx — Read-only map showing multiple sites plus "you are here"
// Uses OpenStreetMap + Leaflet — same free, no-API-key approach as LocationPicker.

import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoLocation from 'expo-location';
import { Colors } from '../constants';
import { useTranslation, registerTranslations } from '../lib/LanguageContext';

registerTranslations({
  'Carte': 'Map',
  'Fermer': 'Close',
  'Localisation en cours...': 'Getting location...',
  'Permission refusée': 'Permission denied',
  'Activez la localisation dans les paramètres pour voir la distance jusqu\'aux sites.':
    'Enable location in settings to see the distance to each site.',
  'Chargement de la carte...': 'Loading map...',
  'Vous êtes ici': 'You are here',
});

export interface MapSite {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  sites: MapSite[];
  theme: any;
}

// Haversine distance in km — exported so list screens can show a "3.2 km" badge per card too.
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DEFAULT_LAT = 12.3714; // Ouagadougou
const DEFAULT_LNG = -1.5197;

const buildMapHTML = (
  sites: MapSite[],
  userLoc: { lat: number; lng: number } | null,
  meLabel: string
) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; }
    .leaflet-popup-content { font-family:sans-serif; font-size:13px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var sites = ${JSON.stringify(sites)};
    var userLoc = ${userLoc ? JSON.stringify(userLoc) : 'null'};
    var map = L.map('map', { zoomControl: true });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    }).addTo(map);

    function haversine(lat1, lon1, lat2, lon2) {
      function toRad(x) { return x * Math.PI / 180; }
      var R = 6371;
      var dLat = toRad(lat2 - lat1);
      var dLon = toRad(lon2 - lon1);
      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    var siteIcon = L.divIcon({
      html: '<div style="font-size:30px;line-height:1;transform:translateY(-50%)">📍</div>',
      iconSize: [30, 30], iconAnchor: [15, 30], className: ''
    });
    var meIcon = L.divIcon({
      html: '<div style="width:18px;height:18px;border-radius:9px;background:#1E4D78;border:3px solid #fff;box-shadow:0 0 6px rgba(0,0,0,0.5);"></div>',
      iconSize: [18, 18], iconAnchor: [9, 9], className: ''
    });

    var bounds = [];

    sites.forEach(function(s) {
      var dist = userLoc ? haversine(userLoc.lat, userLoc.lng, s.latitude, s.longitude) : null;
      var popup = '<b>' + s.name + '</b>' + (dist !== null ? '<br/>' + dist.toFixed(1) + ' km' : '');
      L.marker([s.latitude, s.longitude], { icon: siteIcon }).addTo(map).bindPopup(popup);
      bounds.push([s.latitude, s.longitude]);
    });

    if (userLoc) {
      L.marker([userLoc.lat, userLoc.lng], { icon: meIcon }).addTo(map).bindPopup(${JSON.stringify(meLabel)});
      bounds.push([userLoc.lat, userLoc.lng]);
    }

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    } else {
      map.setView([${DEFAULT_LAT}, ${DEFAULT_LNG}], 6);
    }
  </script>
</body>
</html>`;

export default function SitesMapView({ visible, onClose, sites, theme }: Props) {
  const { t } = useTranslation();
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setGpsLoading(true);
    (async () => {
      try {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('Permission refusée'), t('Activez la localisation dans les paramètres pour voir la distance jusqu\'aux sites.'));
          return;
        }
        const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
        setUserLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      } catch {
        // Silently proceed without user location — the map still shows all sites.
      } finally {
        setGpsLoading(false);
      }
    })();
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modal}>
        <LinearGradient
          colors={Colors.headerGradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>{t('Carte')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.mapWrap}>
          {(gpsLoading || mapLoading) && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                {gpsLoading ? t('Localisation en cours...') : t('Chargement de la carte...')}
              </Text>
            </View>
          )}
          {!gpsLoading && (
            <WebView
              source={{ html: buildMapHTML(sites, userLoc, t('Vous êtes ici')) }}
              style={styles.webview}
              onLoadEnd={() => setMapLoading(false)}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={['*']}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 48, paddingBottom: 16, paddingHorizontal: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '400', color: '#fff' },
  closeBtn: { padding: 4 },
  mapWrap: { flex: 1, position: 'relative' },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: 'rgba(255,255,255,0.92)', zIndex: 10,
  },
  loadingText: { fontSize: 14 },
});

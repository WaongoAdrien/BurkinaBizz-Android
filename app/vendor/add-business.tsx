// app/vendor/add-business.tsx

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Image, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { Colors, CATEGORIES, CITIES } from '../../constants';
import { useColorTheme } from '../../hooks/useColorTheme';
import { Category, City, BusinessLocation } from '../../types';
import LocationPicker from '../../components/Locationpicker';

// ── Field outside component to prevent focus-loss bug ────────────────────────
interface FieldProps {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder: string; keyboardType?: any; multiline?: boolean;
  maxLength?: number; error?: string; optional?: boolean;
  borderColor: string; surfaceColor: string; textColor: string; secondaryColor: string;
}
function Field({ label, value, onChangeText, placeholder, keyboardType = 'default',
  multiline = false, maxLength, error, optional, borderColor, surfaceColor, textColor, secondaryColor }: FieldProps) {
  return (
    <View style={styles.fieldWrapper}>
      <View style={styles.labelRow}>
        <Text style={[styles.fieldLabel, { color: textColor }]}>{label}</Text>
        {optional && <Text style={[styles.optionalTag, { color: secondaryColor }]}>optionnel</Text>}
      </View>
      <TextInput
        style={[styles.input, multiline && styles.textArea,
          { borderColor: error ? '#D32F2F' : borderColor, backgroundColor: surfaceColor, color: textColor }]}
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={secondaryColor} keyboardType={keyboardType}
        multiline={multiline} numberOfLines={multiline ? 4 : 1}
        maxLength={maxLength} autoCorrect={false} autoCapitalize="none"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

interface PickerModalProps {
  visible: boolean; title: string; items: string[]; selected: string;
  onSelect: (v: string) => void; onClose: () => void;
  cardColor: string; textColor: string; secondaryColor: string;
}
function PickerModal({ visible, title, items, selected, onSelect, onClose, cardColor, textColor, secondaryColor }: PickerModalProps) {
  if (!visible) return null;
  return (
    <View style={styles.pickerOverlay}>
      <View style={[styles.pickerSheet, { backgroundColor: cardColor }]}>
        <Text style={[styles.pickerTitle, { color: textColor }]}>{title}</Text>
        {items.map(item => (
          <TouchableOpacity key={item}
            style={[styles.pickerItem, selected === item && { backgroundColor: Colors.primary + '22' }]}
            onPress={() => { onSelect(item); onClose(); }}>
            <Text style={[styles.pickerItemText, { color: selected === item ? Colors.primary : textColor }, selected === item && { fontWeight: '800' }]}>{item}</Text>
            {selected === item && <Text style={{ color: Colors.primary }}>✓</Text>}
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.pickerClose} onPress={onClose}>
          <Text style={[styles.pickerCloseText, { color: secondaryColor }]}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

const MAX_PHOTOS = 5;

export default function AddBusinessScreen() {
  const router = useRouter();
  const { user, userProfile, isPending } = useAuth();
  const { theme, isDark } = useColorTheme();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Alimentation');
  const [city, setCity] = useState<City>('Ouagadougou');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [location, setLocation] = useState<BusinessLocation | undefined>(undefined);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) { router.replace('/auth'); return; }
    if (isPending) { router.replace('/vendor/pending'); return; }
    // Pre-fill phone from profile
    if (userProfile?.phone) setPhone(userProfile.phone);
  }, [user, isPending]);

  const fp = { borderColor: theme.border, surfaceColor: theme.surface, textColor: theme.text, secondaryColor: theme.textSecondary };

  const pickPhotos = async () => {
    if (photoUris.length >= MAX_PHOTOS) {
      Alert.alert('Maximum atteint', `Vous pouvez ajouter au maximum ${MAX_PHOTOS} photos.`);
      return;
    }
    Alert.alert('Ajouter des photos', '', [
      { text: '📷 Prendre une photo', onPress: takePhoto },
      { text: '🖼️ Choisir depuis la galerie', onPress: pickFromGallery },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.75 });
    if (!result.canceled && result.assets[0]) {
      setPhotoUris(prev => [...prev, result.assets[0].uri].slice(0, MAX_PHOTOS));
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photoUris.length,
      allowsEditing: false,
      quality: 0.75,
    });
    if (!result.canceled) {
      const newUris = result.assets.map(a => a.uri);
      setPhotoUris(prev => [...prev, ...newUris].slice(0, MAX_PHOTOS));
    }
  };

  const removePhoto = (index: number) => {
    setPhotoUris(prev => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Nom requis';
    if (!description.trim()) e.description = 'Description requise';
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) e.phone = 'Numéro valide requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const uploadPhoto = async (uri: string, index: number): Promise<string> => {
    const blob: Blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response);
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });
    const filename = `businesses/${user!.uid}/${Date.now()}_${index}.jpg`;
    const storageRef = ref(storage, filename);
    return new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, blob);
      task.on('state_changed',
        snap => {
          const base = (index / photoUris.length) * 100;
          const chunk = (snap.bytesTransferred / snap.totalBytes) * (100 / photoUris.length);
          setUploadProgress(Math.round(base + chunk));
        },
        reject,
        async () => resolve(await getDownloadURL(task.snapshot.ref))
      );
    });
  };

  const handleSubmit = async () => {
    if (!validate() || !user) return;
    setLoading(true);
    setUploadProgress(0);
    try {
      // Upload all photos
      const uploadedUrls: string[] = [];
      for (let i = 0; i < photoUris.length; i++) {
        try {
          const url = await uploadPhoto(photoUris[i], i);
          uploadedUrls.push(url);
        } catch {
          // skip failed photo, don't block submission
        }
      }

      await addDoc(collection(db, 'businesses'), {
        name: name.trim(),
        category,
        city,
        description: description.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || null,
        facebook: facebook.trim() || null,
        instagram: instagram.trim() || null,
        photos: uploadedUrls,
        coverPhoto: uploadedUrls[0] || '',
        ownerId: user.uid,
        ownerName: userProfile?.name || user.email || '',
        location: location || null,
        status: 'pending',   // admin must approve before appearing in directory
        createdAt: serverTimestamp(),
      });

      Alert.alert(
        '✅ Demande envoyée!',
        'Votre entreprise sera examinée par notre équipe et publiée sous 24–48h.',
        [{ text: 'OK', onPress: () => router.replace('/vendor/dashboard') }]
      );
    } catch (e: any) {
      console.error(e);
      Alert.alert('Erreur', 'Impossible d\'envoyer la demande. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* PENDING NOTICE */}
        <View style={[styles.pendingNotice, { backgroundColor: Colors.cta + '22', borderColor: Colors.cta }]}>
          <Text style={styles.pendingNoticeIcon}>⏳</Text>
          <Text style={[styles.pendingNoticeText, { color: theme.text }]}>
            Votre demande sera examinée par notre équipe avant d'apparaître dans l'annuaire.
          </Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.formSection, { color: Colors.primary }]}>📋 Informations générales</Text>

          <Field label="Nom de l'entreprise *" value={name} onChangeText={setName}
            placeholder="Ex: Restaurant Chez Fatou" maxLength={80} error={errors.name} {...fp} />

          {/* Category */}
          <View style={styles.fieldWrapper}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Catégorie *</Text>
            <TouchableOpacity style={[styles.selector, { borderColor: theme.border, backgroundColor: theme.surface }]} onPress={() => setShowCategoryPicker(true)}>
              <Text style={{ color: theme.text, fontSize: 15 }}>{CATEGORIES.find(c => c.label === category)?.icon} {category}</Text>
              <Text style={{ color: theme.textSecondary }}>▾</Text>
            </TouchableOpacity>
          </View>

          {/* City */}
          <View style={styles.fieldWrapper}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Ville *</Text>
            <TouchableOpacity style={[styles.selector, { borderColor: theme.border, backgroundColor: theme.surface }]} onPress={() => setShowCityPicker(true)}>
              <Text style={{ color: theme.text, fontSize: 15 }}>📍 {city}</Text>
              <Text style={{ color: theme.textSecondary }}>▾</Text>
            </TouchableOpacity>
          </View>

          <Field label="Description *" value={description} onChangeText={setDescription}
            placeholder="Décrivez votre entreprise: services proposés, horaires, spécialités..."
            multiline maxLength={600} error={errors.description} {...fp} />
        </View>

        <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.formSection, { color: Colors.primary }]}>📞 Contact</Text>
          <Field label="Téléphone *" value={phone} onChangeText={setPhone}
            placeholder="+22670000000" keyboardType="phone-pad" error={errors.phone} {...fp} />
          <Field label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp}
            placeholder="+22670000000 (si différent)" keyboardType="phone-pad" optional {...fp} />
        </View>

        <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.formSection, { color: Colors.primary }]}>🌐 Réseaux sociaux</Text>
          <Field label="Facebook" value={facebook} onChangeText={setFacebook}
            placeholder="Lien ou nom de la page" optional {...fp} />
          <Field label="Instagram" value={instagram} onChangeText={setInstagram}
            placeholder="@votre_compte" optional {...fp} />
        </View>


        <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.formSection, { color: Colors.primary }]}>📍 Localisation <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '400' }}>(optionnel)</Text></Text>
          <Text style={[styles.photoHint, { color: theme.textSecondary }]}>
            Aidez vos clients à vous trouver. Entrez votre adresse ou placez une épingle sur la carte.
          </Text>

          {location?.address || location?.latitude ? (
            <View style={[styles.locationPreview, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '40' }]}>
              <Text style={styles.locationPreviewIcon}>📍</Text>
              <View style={{ flex: 1 }}>
                {location.address && (
                  <Text style={[styles.locationPreviewText, { color: theme.text }]} numberOfLines={2}>{location.address}</Text>
                )}
                {location.latitude && (
                  <Text style={[styles.locationPreviewCoords, { color: theme.textSecondary }]}>
                    GPS: {location.latitude.toFixed(4)}, {location.longitude?.toFixed(4)}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setShowLocationPicker(true)}>
                <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 13 }}>Modifier</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addLocationBtn, { borderColor: Colors.primary }]}
              onPress={() => setShowLocationPicker(true)}
            >
              <Text style={{ fontSize: 24 }}>🗺️</Text>
              <Text style={[styles.addLocationText, { color: Colors.primary }]}>Ajouter une localisation</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* PHOTOS */}
        <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.formSection, { color: Colors.primary }]}>📷 Photos ({photoUris.length}/{MAX_PHOTOS})</Text>
          <Text style={[styles.photoHint, { color: theme.textSecondary }]}>
            Ajoutez jusqu'à {MAX_PHOTOS} photos. La première sera la photo de couverture.
          </Text>
          <View style={styles.photoGrid}>
            {photoUris.map((uri, i) => (
              <View key={i} style={styles.photoThumbBox}>
                <Image source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
                {i === 0 && (
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverBadgeText}>Couverture</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removePhoto(i)}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {photoUris.length < MAX_PHOTOS && (
              <TouchableOpacity style={[styles.addPhotoBtn, { borderColor: Colors.primary }]} onPress={pickPhotos}>
                <Text style={{ fontSize: 28 }}>📷</Text>
                <Text style={[styles.addPhotoText, { color: Colors.primary }]}>Ajouter</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* UPLOAD PROGRESS */}
        {loading && uploadProgress > 0 && uploadProgress < 100 && (
          <View style={styles.progressBox}>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>Upload photos: {uploadProgress}%</Text>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` as any }]} />
            </View>
          </View>
        )}

        {/* SUBMIT */}
        <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <ActivityIndicator color="#1A1A1A" />
                <Text style={styles.submitText}>Envoi en cours...</Text>
              </View>
            : <Text style={styles.submitText}>🚀  Soumettre mon entreprise</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <LocationPicker
        visible={showLocationPicker}
        current={location}
        onConfirm={(loc) => { setLocation(loc); setShowLocationPicker(false); }}
        onClose={() => setShowLocationPicker(false)}
        theme={theme}
      />
      <PickerModal visible={showCategoryPicker} title="Catégorie" items={CATEGORIES.map(c => c.label)}
        selected={category} onSelect={v => setCategory(v as Category)} onClose={() => setShowCategoryPicker(false)}
        cardColor={theme.card} textColor={theme.text} secondaryColor={theme.textSecondary} />
      <PickerModal visible={showCityPicker} title="Ville" items={CITIES}
        selected={city} onSelect={v => setCity(v as City)} onClose={() => setShowCityPicker(false)}
        cardColor={theme.card} textColor={theme.text} secondaryColor={theme.textSecondary} />
    </KeyboardAvoidingView>
  );
}

const THUMB = 96;
const styles = StyleSheet.create({
  content: { padding: 16 },
  pendingNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1.5, borderRadius: 12, padding: 12, marginBottom: 14 },
  pendingNoticeIcon: { fontSize: 18 },
  pendingNoticeText: { flex: 1, fontSize: 13, lineHeight: 19 },
  formCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 14, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  formSection: { fontSize: 15, fontWeight: '800', marginBottom: 14 },
  fieldWrapper: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600' },
  optionalTag: { fontSize: 11, fontStyle: 'italic' },
  input: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15 },
  textArea: { textAlignVertical: 'top', minHeight: 90 },
  errorText: { color: '#D32F2F', fontSize: 12, marginTop: 4 },
  selector: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  photoHint: { fontSize: 12, marginBottom: 12, lineHeight: 18 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoThumbBox: { width: THUMB, height: THUMB, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  photoThumb: { width: '100%', height: '100%' },
  coverBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(46,125,50,0.85)', padding: 3, alignItems: 'center' },
  coverBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  removePhotoBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  addPhotoBtn: { width: THUMB, height: THUMB, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  addPhotoText: { fontSize: 11, fontWeight: '700' },
  progressBox: { marginBottom: 14 },
  progressText: { fontSize: 12, marginBottom: 6 },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  submitBtn: { backgroundColor: Colors.cta, paddingVertical: 16, borderRadius: 14, alignItems: 'center', elevation: 3, shadowColor: Colors.cta, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  submitText: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  pickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 999 },
  pickerSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32 },
  pickerTitle: { fontSize: 17, fontWeight: '800', marginBottom: 14 },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4 },
  pickerItemText: { fontSize: 15 },
  pickerClose: { marginTop: 8, padding: 14, alignItems: 'center' },
  pickerCloseText: { fontSize: 15, fontWeight: '600' },
  locationPreview: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  locationPreviewIcon: { fontSize: 20 },
  locationPreviewText: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  locationPreviewCoords: { fontSize: 11, marginTop: 2 },
  addLocationBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 2, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 18 },
  addLocationText: { fontSize: 15, fontWeight: '700' },
});

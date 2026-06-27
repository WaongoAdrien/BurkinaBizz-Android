// app/vendor/edit-business.tsx

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Image, StyleSheet,
  Alert, ActivityIndicator, Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { Colors, CATEGORIES, CITIES, CITY_CATEGORIES } from '../../constants';
import { useColorTheme } from '../../hooks/useColorTheme';
import { Category, City, BusinessLocation } from '../../types';
import LocationPicker from '../../components/Locationpicker';

// ── Shared components (outside to avoid focus-loss bug) ───────────────────────
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
            <Text style={[styles.pickerItemText, { color: selected === item ? Colors.primary : textColor },
              selected === item && { fontWeight: '800' }]}>{item}</Text>
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

export default function EditBusinessScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const { theme } = useColorTheme();

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Alimentation');
  const [categories, setCategories] = useState<Category[]>(['Alimentation']);
  const [city, setCity] = useState<City>('Ouagadougou');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [priority, setPriority] = useState<number>(0);
  const [location, setLocation] = useState<BusinessLocation | undefined>(undefined);

  // Existing remote photo URLs
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  // New local URIs to upload
  const [newPhotoUris, setNewPhotoUris] = useState<string[]>([]);

  const [fetchLoading, setFetchLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fp = { borderColor: '#9CA3AF', surfaceColor: '#FFFFFF', textColor: theme.text, secondaryColor: theme.textSecondary };
  const totalPhotos = existingPhotos.length + newPhotoUris.length;

  // Load existing business data
  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'businesses', id)).then(snap => {
      if (!snap.exists()) { Alert.alert('Erreur', 'Entreprise introuvable.'); router.back(); return; }
      const d = snap.data();
      // Guard: only owner or admin can edit
      if (d.ownerId !== user?.uid && !isAdmin) { 
        Alert.alert('Accès refusé', 'Vous ne pouvez modifier que vos propres entreprises.'); 
        router.back(); 
        return; 
      }
      setName(d.name || '');
      setCategory(d.category || 'Alimentation');
      setCategories(d.categories || [d.category || 'Alimentation']); // Load categories or fallback to single category
      setCity(d.city || 'Ouagadougou');
      setDescription(d.description || '');
      setPhone(d.phone || '');
      setWhatsapp(d.whatsapp || '');
      setFacebook(d.facebook || '');
      setInstagram(d.instagram || '');
      setWebsite(d.website || '');
      setPriority(d.priority || 0);
      setExistingPhotos(d.photos || (d.coverPhoto ? [d.coverPhoto] : []));
      if (d.location) setLocation(d.location);
    }).finally(() => setFetchLoading(false));
  }, [id]);

  // Clear invalid categories when city changes
  useEffect(() => {
    const availableCategories = CITY_CATEGORIES[city] || CATEGORIES.map(c => c.label);
    const validCategories = categories.filter(cat => availableCategories.includes(cat));
    
    if (validCategories.length !== categories.length) {
      // Some categories are invalid for this city
      if (validCategories.length > 0) {
        setCategories(validCategories);
        setCategory(validCategories[0]);
      } else {
        // No valid categories, set to first available
        const firstAvailable = availableCategories[0] as Category;
        setCategories([firstAvailable]);
        setCategory(firstAvailable);
      }
    }
  }, [city]);

  const pickPhotos = async () => {
    if (totalPhotos >= MAX_PHOTOS) {
      Alert.alert('Maximum atteint', `Maximum ${MAX_PHOTOS} photos.`); return;
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
    if (!result.canceled && result.assets[0])
      setNewPhotoUris(prev => [...prev, result.assets[0].uri].slice(0, MAX_PHOTOS - existingPhotos.length));
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - totalPhotos,
      quality: 0.75,
    });
    if (!result.canceled)
      setNewPhotoUris(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, MAX_PHOTOS - existingPhotos.length));
  };

  const removeExisting = (index: number) => {
    Alert.alert('Supprimer cette photo?', '', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => setExistingPhotos(prev => prev.filter((_, i) => i !== index)) },
    ]);
  };

  const removeNew = (index: number) => setNewPhotoUris(prev => prev.filter((_, i) => i !== index));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Nom requis';
    if (!description.trim()) e.description = 'Description requise';
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) e.phone = 'Numéro valide requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const uploadPhoto = async (uri: string, index: number): Promise<string> => {
    // Fetch image as blob using fetch API (compatible with new architecture)
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const storageRef = ref(storage, `businesses/${user!.uid}/${Date.now()}_${index}.jpg`);
    return new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, blob);
      task.on('state_changed',
        snap => {
          const base = (index / newPhotoUris.length) * 100;
          const chunk = (snap.bytesTransferred / snap.totalBytes) * (100 / newPhotoUris.length);
          setUploadProgress(Math.round(base + chunk));
        },
        reject,
        async () => resolve(await getDownloadURL(task.snapshot.ref))
      );
    });
  };

  const handleSave = async () => {
    if (!validate() || !id) return;
    setLoading(true);
    setUploadProgress(0);
    try {
      // Upload new photos
      const newUrls: string[] = [];
      for (let i = 0; i < newPhotoUris.length; i++) {
        try { newUrls.push(await uploadPhoto(newPhotoUris[i], i)); } catch {}
      }
      const allPhotos = [...existingPhotos, ...newUrls];

      // Build update data object
      const updateData: any = {
        name: name.trim(),
        category,              // Primary category
        categories,            // All selected categories
        city,
        description: description.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || null,
        facebook: facebook.trim() || null,
        instagram: instagram.trim() || null,
        website: website.trim() || null,
        photos: allPhotos,
        coverPhoto: allPhotos[0] || '',
        location: location && (location.address || location.latitude) ? {
          address: location.address ?? null,
          latitude: location.latitude ?? null,
          longitude: location.longitude ?? null,
        } : null,
      };

      // Only admins can update priority
      if (isAdmin) {
        updateData.priority = priority || 0;
      }

      await updateDoc(doc(db, 'businesses', id), updateData);

      Alert.alert('✅ Mise à jour réussie!', 'Les informations ont été enregistrées.',
        [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('Erreur', "Impossible de sauvegarder. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return (
    <View style={[styles.loadingBox, { backgroundColor: theme.background }]}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: 'Modifier l\'entreprise', headerBackVisible: true }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.formSection, { color: Colors.primary }]}>📋 Informations générales</Text>
          <Field label="Nom de l'entreprise *" value={name} onChangeText={setName}
            placeholder="Ex: Restaurant Chez Fatou" maxLength={80} error={errors.name} {...fp} />

          {/* CITY SELECTION - MOVED FIRST */}
          <View style={styles.fieldWrapper}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Ville *</Text>
            <TouchableOpacity style={[styles.selector, { borderColor: '#9CA3AF', backgroundColor: '#FFFFFF' }]}
              onPress={() => { Keyboard.dismiss(); setShowCityPicker(true); }}>
              <Text style={{ color: theme.text, fontSize: 15 }}>📍 {city}</Text>
              <Text style={{ color: theme.textSecondary }}>▾</Text>
            </TouchableOpacity>
          </View>

          {/* CATEGORIES - FILTERED BY CITY */}
          <View style={styles.fieldWrapper}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Catégories * (sélectionnez toutes les catégories qui s'appliquent)</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {(() => {
                // Get categories available in selected city
                const availableCategories = CITY_CATEGORIES[city] || CATEGORIES.map(c => c.label);
                const availableCategoryObjects = CATEGORIES.filter(cat => availableCategories.includes(cat.label));
                
                return availableCategoryObjects.map(cat => {
                  const isSelected = categories.includes(cat.label as Category);
                  return (
                    <TouchableOpacity
                      key={cat.label}
                      style={[
                        styles.categoryChip,
                        { 
                          backgroundColor: isSelected ? cat.color : theme.surface,
                          borderColor: cat.color,
                          borderWidth: 1.5,
                        }
                      ]}
                      onPress={() => {
                        if (isSelected) {
                          // Unselect (but keep at least one)
                          if (categories.length > 1) {
                            setCategories(categories.filter(c => c !== cat.label));
                            setCategory(categories.filter(c => c !== cat.label)[0]); // Update primary
                          }
                        } else {
                          // Select
                          setCategories([...categories, cat.label as Category]);
                          if (categories.length === 0) setCategory(cat.label as Category); // Set as primary if first
                        }
                      }}
                    >
                      <Text style={{ 
                        fontSize: 13, 
                        fontWeight: '700',
                        color: isSelected ? '#fff' : theme.text 
                      }}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                });
              })()}
            </View>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
          </View>

          <Field label="Description *" value={description} onChangeText={setDescription}
            placeholder="Décrivez votre entreprise..." multiline maxLength={600} error={errors.description} {...fp} />
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
            placeholder="@nomutilisateur" optional {...fp} />
          <Field label="Site web" value={website} onChangeText={setWebsite}
            placeholder="https://www.monentreprise.com" keyboardType="url" optional {...fp} />
        </View>

        {/* PRIORITY (ADMIN ONLY) */}
        {isAdmin && (
          <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.formSection, { color: Colors.primary }]}>⭐ Position (Admin)</Text>
            <Field 
              label="Priorité" 
              value={String(priority)} 
              onChangeText={(text) => {
                const num = parseInt(text) || 0;
                setPriority(Math.max(0, Math.min(100, num))); // Clamp 0-100
              }}
              placeholder="0-100 (plus élevé = apparaît en premier)" 
              keyboardType="number-pad"
              {...fp} 
            />
            <Text style={[styles.hint, { color: theme.textSecondary, marginTop: -8 }]}>
              💡 0 = ordre par défaut • 100 = tout en haut
            </Text>
          </View>
        )}

        {/* LOCALISATION */}
        <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.formSection, { color: Colors.primary }]}>📍 Localisation <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '400' }}>(optionnel)</Text></Text>
          {location?.address || location?.latitude ? (
            <View style={[styles.locationPreview, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '40' }]}>
              <Text style={{ fontSize: 20 }}>📍</Text>
              <View style={{ flex: 1 }}>
                {location.address && <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={2}>{location.address}</Text>}
                {location.latitude && <Text style={[styles.locationCoords, { color: theme.textSecondary }]}>GPS: {location.latitude.toFixed(4)}, {location.longitude?.toFixed(4)}</Text>}
              </View>
              <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowLocationPicker(true); }}>
                <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 13 }}>Modifier</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[styles.addLocationBtn, { borderColor: Colors.primary }]}
              onPress={() => { Keyboard.dismiss(); setShowLocationPicker(true); }}>
              <Text style={{ fontSize: 24 }}>🗺️</Text>
              <Text style={[styles.addLocationText, { color: Colors.primary }]}>Ajouter une localisation</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* PHOTOS */}
        <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.formSection, { color: Colors.primary }]}>📷 Photos ({totalPhotos}/{MAX_PHOTOS})</Text>
          <Text style={[styles.hint, { color: theme.textSecondary }]}>Appuyez sur une photo existante pour la supprimer.</Text>
          <View style={styles.photoGrid}>
            {/* Existing remote photos */}
            {existingPhotos.map((uri, i) => (
              <TouchableOpacity key={`e-${i}`} style={styles.photoThumbBox} onPress={() => removeExisting(i)}>
                <Image source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
                {i === 0 && (
                  <View style={styles.coverBadge}><Text style={styles.coverBadgeText}>Couverture</Text></View>
                )}
                <View style={styles.removeBtn}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>✕</Text>
                </View>
              </TouchableOpacity>
            ))}
            {/* New local photos */}
            {newPhotoUris.map((uri, i) => (
              <View key={`n-${i}`} style={styles.photoThumbBox}>
                <Image source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
                <View style={[styles.newBadge]}><Text style={styles.newBadgeText}>Nouveau</Text></View>
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeNew(i)}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {totalPhotos < MAX_PHOTOS && (
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
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>Upload: {uploadProgress}%</Text>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` as any }]} />
            </View>
          </View>
        )}

        <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <ActivityIndicator color="#1A1A1A" />
                <Text style={styles.saveBtnText}>Sauvegarde...</Text>
              </View>
            : <Text style={styles.saveBtnText}>💾  Sauvegarder les modifications</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <LocationPicker visible={showLocationPicker} current={location}
        onConfirm={(loc) => { setLocation(loc); setShowLocationPicker(false); }}
        onClose={() => setShowLocationPicker(false)} theme={theme} />
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
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16 },
  formCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 14, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  formSection: { fontSize: 15, fontWeight: '800', marginBottom: 14 },
  fieldWrapper: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600' },
  optionalTag: { fontSize: 11, fontStyle: 'italic' },
  input: { borderWidth: 2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15 },
  textArea: { textAlignVertical: 'top', minHeight: 90 },
  errorText: { color: '#D32F2F', fontSize: 12, marginTop: 4 },
  selector: { borderWidth: 2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hint: { fontSize: 12, marginBottom: 12, lineHeight: 18 },
  locationPreview: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  locationText: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  locationCoords: { fontSize: 11, marginTop: 2 },
  addLocationBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 2, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 18 },
  addLocationText: { fontSize: 15, fontWeight: '700' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoThumbBox: { width: THUMB, height: THUMB, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  photoThumb: { width: '100%', height: '100%' },
  coverBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(46,125,50,0.85)', padding: 3, alignItems: 'center' },
  coverBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  newBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(25,118,210,0.85)', padding: 3, alignItems: 'center' },
  newBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  removeBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  addPhotoBtn: { width: THUMB, height: THUMB, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  addPhotoText: { fontSize: 11, fontWeight: '700' },
  progressBox: { marginBottom: 14 },
  progressText: { fontSize: 12, marginBottom: 6 },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  saveBtn: { backgroundColor: Colors.cta, paddingVertical: 16, borderRadius: 14, alignItems: 'center', elevation: 3, shadowColor: Colors.cta, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  saveBtnText: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  pickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 999 },
  pickerSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32 },
  pickerTitle: { fontSize: 17, fontWeight: '800', marginBottom: 14 },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4 },
  pickerItemText: { fontSize: 15 },
  pickerClose: { marginTop: 8, padding: 14, alignItems: 'center' },
  pickerCloseText: { fontSize: 15, fontWeight: '600' },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
});

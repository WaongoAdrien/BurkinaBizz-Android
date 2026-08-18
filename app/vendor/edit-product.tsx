// app/vendor/edit-product.tsx

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Image, StyleSheet,
  Alert, ActivityIndicator, Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { containsProfanity } from '../../lib/profanityFilter';
import { useAuth } from '../../lib/AuthContext';
import { Colors, PRODUCT_CATEGORIES, CITIES } from '../../constants';
import { useColorTheme } from '../../hooks/useColorTheme';
import { ProductCategory, City } from '../../types';
import { useTranslation, registerTranslations } from '../../lib/LanguageContext';
import { AppHeader } from '../../components/AppHeader';

registerTranslations({
  'optionnel': 'optional',
  'Disponibilité': 'Availability',
  'En stock': 'In stock',
  'Rupture de stock': 'Out of stock',
  'Vendu': 'Sold',
  'Quantité restante (optionnel)': 'Remaining quantity (optional)',
  'Ex: 3': 'Ex: 3',
  'Annuler': 'Cancel',
  'Erreur': 'Error',
  'Produit introuvable.': 'Product not found.',
  'Accès refusé': 'Access denied',
  'Vous ne pouvez modifier que vos propres produits.': 'You can only edit your own products.',
  'Maximum atteint': 'Maximum reached',
  'Maximum 5 photos.': 'Maximum 5 photos.',
  'Ajouter des photos': 'Add photos',
  '📷 Prendre une photo': '📷 Take a photo',
  '🖼️ Choisir depuis la galerie': '🖼️ Choose from gallery',
  'Supprimer cette photo?': 'Delete this photo?',
  'Supprimer': 'Delete',
  'Nom requis': 'Name required',
  'Langage inapproprié / Inappropriate language': 'Inappropriate language',
  'Description requise': 'Description required',
  'Prix valide requis': 'Valid price required',
  '✅ Mise à jour réussie!': '✅ Update successful!',
  'Les informations ont été enregistrées.': 'The information has been saved.',
  'OK': 'OK',
  "Impossible de sauvegarder. Vérifiez votre connexion.": 'Unable to save. Check your connection.',
  'Modifier le produit': 'Edit product',
  "Nom du produit *": 'Product name *',
  'Ex: iPhone 13 Pro Max 256GB': 'Ex: iPhone 13 Pro Max 256GB',
  'Catégorie *': 'Category *',
  'Ville *': 'City *',
  'Description *': 'Description *',
  'État, caractéristiques, raison de la vente...': 'Condition, features, reason for selling...',
  'Prix (FCFA) *': 'Price (FCFA) *',
  'Ex: 350000': 'Ex: 350000',
  'Prix négociable': 'Negotiable price',
  "L'acheteur pourra proposer un prix différent": 'Buyers will be able to offer a different price',
  'Téléphone': 'Phone',
  'WhatsApp': 'WhatsApp',
  '+22670000000 (si différent)': '+22670000000 (if different)',
  'Appuyez sur une photo existante pour la supprimer.': 'Tap an existing photo to delete it.',
  'Couverture': 'Cover',
  'Nouveau': 'New',
  'Ajouter': 'Add',
  'Upload:': 'Upload:',
  'Sauvegarde...': 'Saving...',
  '💾  Sauvegarder les modifications': '💾  Save changes',
  'Ville': 'City',
  'Catégorie': 'Category',
  'Téléphones & Tablettes': 'Phones & Tablets',
  'Électronique': 'Electronics',
  'Produits Locaux': 'Local Products',
  'Véhicules': 'Vehicles',
  'Mode & Vêtements': 'Fashion & Clothing',
  'Meubles & Maison': 'Furniture & Home',
  'Immobilier': 'Real Estate',
  'Loisirs & Sports': 'Leisure & Sports',
  'Bébé & Enfants': 'Baby & Kids',
  'Autres': 'Other',
});

// ── Shared components (outside to avoid focus-loss bug) ───────────────────────
interface FieldProps {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder: string; keyboardType?: any; multiline?: boolean;
  maxLength?: number; error?: string; optional?: boolean;
  borderColor: string; surfaceColor: string; textColor: string; secondaryColor: string;
}
function Field({ label, value, onChangeText, placeholder, keyboardType = 'default',
  multiline = false, maxLength, error, optional, borderColor, surfaceColor, textColor, secondaryColor }: FieldProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.fieldWrapper}>
      <View style={styles.labelRow}>
        <Text style={[styles.fieldLabel, { color: textColor }]}>{label}</Text>
        {optional && <Text style={[styles.optionalTag, { color: secondaryColor }]}>{t('optionnel')}</Text>}
      </View>
      <TextInput
        style={[styles.input, multiline && styles.textArea,
          { borderColor: error ? '#D32F2F' : borderColor, backgroundColor: surfaceColor, color: textColor }]}
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={secondaryColor} keyboardType={keyboardType}
        multiline={multiline} numberOfLines={multiline ? 4 : 1}
        maxLength={maxLength} autoCorrect={false} autoCapitalize="none"
      />
      {error ? <Text style={styles.errorText}>{t(error)}</Text> : null}
    </View>
  );
}

interface PickerModalProps {
  visible: boolean; title: string; items: string[]; selected: string;
  onSelect: (v: string) => void; onClose: () => void;
  cardColor: string; textColor: string; secondaryColor: string;
}
function PickerModal({ visible, title, items, selected, onSelect, onClose, cardColor, textColor, secondaryColor }: PickerModalProps) {
  const { t } = useTranslation();
  if (!visible) return null;
  return (
    <View style={styles.pickerOverlay}>
      <View style={[styles.pickerSheet, { backgroundColor: cardColor }]}>
        <Text style={[styles.pickerTitle, { color: textColor }]}>{title}</Text>
        <ScrollView style={{ maxHeight: 360 }}>
          {items.map(item => (
            <TouchableOpacity key={item}
              style={[styles.pickerItem, selected === item && { backgroundColor: Colors.primary + '22' }]}
              onPress={() => { onSelect(item); onClose(); }}>
              <Text style={[styles.pickerItemText, { color: selected === item ? Colors.primary : textColor },
                selected === item && { fontWeight: '400' }]}>{t(item)}</Text>
              {selected === item && <Text style={{ color: Colors.primary }}>✓</Text>}
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.pickerClose} onPress={onClose}>
          <Text style={[styles.pickerCloseText, { color: secondaryColor }]}>{t('Annuler')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

const MAX_PHOTOS = 5;

export default function EditProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const { theme } = useColorTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Autres');
  const [city, setCity] = useState<City>('Ouagadougou');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [negotiable, setNegotiable] = useState(false);
  const [stockStatus, setStockStatus] = useState<'in_stock' | 'out_of_stock' | 'sold'>('in_stock');
  const [stockQty, setStockQty] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [newPhotoUris, setNewPhotoUris] = useState<string[]>([]);

  const [fetchLoading, setFetchLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fp = { borderColor: '#9CA3AF', surfaceColor: '#FFFFFF', textColor: theme.text, secondaryColor: theme.textSecondary };
  const totalPhotos = existingPhotos.length + newPhotoUris.length;

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'products', id)).then(snap => {
      if (!snap.exists()) { Alert.alert(t('Erreur'), t('Produit introuvable.')); router.back(); return; }
      const d = snap.data();
      if (d.ownerId !== user?.uid && !isAdmin) {
        Alert.alert(t('Accès refusé'), t('Vous ne pouvez modifier que vos propres produits.'));
        router.back();
        return;
      }
      setName(d.name || '');
      setCategory(d.category || 'Autres');
      setCity(d.city || 'Ouagadougou');
      setDescription(d.description || '');
      setPrice(d.price ? String(d.price) : '');
      setNegotiable(!!d.negotiable);
      setStockStatus(d.stockStatus === 'out_of_stock' || d.stockStatus === 'sold' ? d.stockStatus : 'in_stock');
      setStockQty(typeof d.stockQty === 'number' ? String(d.stockQty) : '');
      setPhone(d.phone || '');
      setWhatsapp(d.whatsapp || '');
      setExistingPhotos(d.photos || (d.imageUrl ? [d.imageUrl] : []));
    }).finally(() => setFetchLoading(false));
  }, [id]);

  const pickPhotos = async () => {
    if (totalPhotos >= MAX_PHOTOS) {
      Alert.alert(t('Maximum atteint'), t(`Maximum ${MAX_PHOTOS} photos.`)); return;
    }
    Alert.alert(t('Ajouter des photos'), '', [
      { text: t('📷 Prendre une photo'), onPress: takePhoto },
      { text: t('🖼️ Choisir depuis la galerie'), onPress: pickFromGallery },
      { text: t('Annuler'), style: 'cancel' },
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
    Alert.alert(t('Supprimer cette photo?'), '', [
      { text: t('Annuler'), style: 'cancel' },
      { text: t('Supprimer'), style: 'destructive', onPress: () => setExistingPhotos(prev => prev.filter((_, i) => i !== index)) },
    ]);
  };

  const removeNew = (index: number) => setNewPhotoUris(prev => prev.filter((_, i) => i !== index));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Nom requis';
    else if (containsProfanity(name)) e.name = 'Langage inapproprié / Inappropriate language';
    if (!description.trim()) e.description = 'Description requise';
    else if (containsProfanity(description)) e.description = 'Langage inapproprié / Inappropriate language';
    const numPrice = parseInt(price.replace(/\D/g, ''), 10);
    if (!price.trim() || isNaN(numPrice) || numPrice <= 0) e.price = 'Prix valide requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const uploadPhoto = async (uri: string, index: number): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const storageRef = ref(storage, `products/${user!.uid}/${Date.now()}_${index}.jpg`);
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
      const newUrls: string[] = [];
      for (let i = 0; i < newPhotoUris.length; i++) {
        try { newUrls.push(await uploadPhoto(newPhotoUris[i], i)); } catch {}
      }
      const allPhotos = [...existingPhotos, ...newUrls];

      await updateDoc(doc(db, 'products', id), {
        name: name.trim(),
        category,
        city,
        description: description.trim(),
        price: parseInt(price.replace(/\D/g, ''), 10),
        negotiable,
        stockStatus,
        stockQty: stockStatus === 'in_stock' && stockQty.trim() ? parseInt(stockQty, 10) : null,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        photos: allPhotos,
      });

      Alert.alert(t('✅ Mise à jour réussie!'), t('Les informations ont été enregistrées.'),
        [{ text: t('OK'), onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert(t('Erreur'), t("Impossible de sauvegarder. Vérifiez votre connexion."));
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return (
    <View style={{ flex: 1 }}>
      <AppHeader title={t('Modifier le produit')} />
      <LinearGradient
        colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
        style={styles.loadingBox}
      >
        <ActivityIndicator color={Colors.primary} size="large" />
      </LinearGradient>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient
        colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
        style={{ flex: 1 }}
      >
      <AppHeader title={t('Modifier le produit')} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 16 + insets.bottom }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Field label={t('Nom du produit *')} value={name} onChangeText={setName}
            placeholder={t('Ex: iPhone 13 Pro Max 256GB')} maxLength={80} error={errors.name} {...fp} />

          <View style={styles.fieldWrapper}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>{t('Catégorie *')}</Text>
            <TouchableOpacity style={[styles.selector, { borderColor: '#9CA3AF', backgroundColor: '#FFFFFF' }]}
              onPress={() => { Keyboard.dismiss(); setShowCategoryPicker(true); }}>
              <Text style={{ color: theme.text, fontSize: 15 }}>{t(category)}</Text>
              <Text style={{ color: theme.textSecondary }}>▾</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>{t('Ville *')}</Text>
            <TouchableOpacity style={[styles.selector, { borderColor: '#9CA3AF', backgroundColor: '#FFFFFF' }]}
              onPress={() => { Keyboard.dismiss(); setShowCityPicker(true); }}>
              <Text style={{ color: theme.text, fontSize: 15 }}>📍 {city}</Text>
              <Text style={{ color: theme.textSecondary }}>▾</Text>
            </TouchableOpacity>
          </View>

          <Field label={t('Description *')} value={description} onChangeText={setDescription}
            placeholder={t('État, caractéristiques, raison de la vente...')} multiline maxLength={600} error={errors.description} {...fp} />

          <Field label={t('Prix (FCFA) *')} value={price} onChangeText={setPrice}
            placeholder={t('Ex: 350000')} keyboardType="number-pad" error={errors.price} {...fp} />

          <TouchableOpacity style={styles.negotiableRow} onPress={() => setNegotiable(v => !v)} activeOpacity={0.8}>
            <View style={[styles.checkbox, { borderColor: Colors.primary }, negotiable && { backgroundColor: Colors.primary }]}>
              {negotiable && <Text style={{ color: '#fff', fontSize: 13, fontWeight: '400' }}>✓</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>{t('Prix négociable')}</Text>
              <Text style={[styles.hint, { color: theme.textSecondary, marginBottom: 0 }]}>{t("L'acheteur pourra proposer un prix différent")}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.fieldWrapper}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>{t('Disponibilité')}</Text>
            <View style={styles.stockRow}>
              {(['in_stock', 'out_of_stock', 'sold'] as const).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.stockPill, { borderColor: stockStatus === s ? Colors.primary : '#9CA3AF' }, stockStatus === s && { backgroundColor: Colors.primary + '18' }]}
                  onPress={() => setStockStatus(s)}
                >
                  <Text style={[styles.stockPillText, { color: stockStatus === s ? Colors.primary : theme.textSecondary }]}>
                    {t(s === 'in_stock' ? 'En stock' : s === 'out_of_stock' ? 'Rupture de stock' : 'Vendu')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {stockStatus === 'in_stock' && (
            <Field label={t('Quantité restante (optionnel)')} value={stockQty} onChangeText={v => setStockQty(v.replace(/\D/g, ''))}
              placeholder={t('Ex: 3')} keyboardType="number-pad" optional {...fp} />
          )}
        </View>

        <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Field label={t('Téléphone')} value={phone} onChangeText={setPhone}
            placeholder="+22670000000" keyboardType="phone-pad" optional {...fp} />
          <Field label={t('WhatsApp')} value={whatsapp} onChangeText={setWhatsapp}
            placeholder={t('+22670000000 (si différent)')} keyboardType="phone-pad" optional {...fp} />
        </View>

        <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.hint, { color: theme.textSecondary }]}>{t('Appuyez sur une photo existante pour la supprimer.')}</Text>
          <View style={styles.photoGrid}>
            {existingPhotos.map((uri, i) => (
              <TouchableOpacity key={`e-${i}`} style={styles.photoThumbBox} onPress={() => removeExisting(i)}>
                <Image source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
                {i === 0 && (
                  <View style={styles.coverBadge}><Text style={styles.coverBadgeText}>{t('Couverture')}</Text></View>
                )}
                <View style={styles.removeBtn}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '400' }}>✕</Text>
                </View>
              </TouchableOpacity>
            ))}
            {newPhotoUris.map((uri, i) => (
              <View key={`n-${i}`} style={styles.photoThumbBox}>
                <Image source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
                <View style={[styles.newBadge]}><Text style={styles.newBadgeText}>{t('Nouveau')}</Text></View>
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeNew(i)}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '400' }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {totalPhotos < MAX_PHOTOS && (
              <TouchableOpacity style={[styles.addPhotoBtn, { borderColor: Colors.primary }]} onPress={pickPhotos}>
                <Text style={{ fontSize: 28 }}>📷</Text>
                <Text style={[styles.addPhotoText, { color: Colors.primary }]}>{t('Ajouter')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading && uploadProgress > 0 && uploadProgress < 100 && (
          <View style={styles.progressBox}>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>{t('Upload:')} {uploadProgress}%</Text>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` as any }]} />
            </View>
          </View>
        )}

        <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <ActivityIndicator color="#1A1A1A" />
                <Text style={styles.saveBtnText}>{t('Sauvegarde...')}</Text>
              </View>
            : <Text style={styles.saveBtnText}>{t('💾  Sauvegarder les modifications')}</Text>
          }
        </TouchableOpacity>
      </ScrollView>

      <PickerModal visible={showCategoryPicker} title={t('Catégorie')} items={PRODUCT_CATEGORIES.map(c => c.label)}
        selected={category} onSelect={v => setCategory(v as ProductCategory)} onClose={() => setShowCategoryPicker(false)}
        cardColor={theme.card} textColor={theme.text} secondaryColor={theme.textSecondary} />
      <PickerModal visible={showCityPicker} title={t('Ville')} items={CITIES}
        selected={city} onSelect={v => setCity(v as City)} onClose={() => setShowCityPicker(false)}
        cardColor={theme.card} textColor={theme.text} secondaryColor={theme.textSecondary} />
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const THUMB = 96;
const styles = StyleSheet.create({
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16 },
  formCard: { borderRadius: 10, padding: 16, borderWidth: 1, marginBottom: 14, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  fieldWrapper: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '400' },
  optionalTag: { fontSize: 11, fontStyle: 'italic' },
  input: { borderWidth: 2, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15 },
  textArea: { textAlignVertical: 'top', minHeight: 90 },
  errorText: { color: '#D32F2F', fontSize: 12, marginTop: 4 },
  selector: { borderWidth: 2, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hint: { fontSize: 12, marginBottom: 12, lineHeight: 18 },
  negotiableRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 5, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  stockRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  stockPill: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  stockPillText: { fontSize: 13, fontWeight: '400' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoThumbBox: { width: THUMB, height: THUMB, borderRadius: 6, overflow: 'hidden', position: 'relative' },
  photoThumb: { width: '100%', height: '100%' },
  coverBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(46,125,50,0.85)', padding: 3, alignItems: 'center' },
  coverBadgeText: { color: '#fff', fontSize: 9, fontWeight: '400' },
  newBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(25,118,210,0.85)', padding: 3, alignItems: 'center' },
  newBadgeText: { color: '#fff', fontSize: 9, fontWeight: '400' },
  removeBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  addPhotoBtn: { width: THUMB, height: THUMB, borderRadius: 6, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  addPhotoText: { fontSize: 11, fontWeight: '400' },
  progressBox: { marginBottom: 14 },
  progressText: { fontSize: 12, marginBottom: 6 },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  saveBtn: { backgroundColor: Colors.cta, paddingVertical: 16, borderRadius: 8, alignItems: 'center', elevation: 3, shadowColor: Colors.cta, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  saveBtnText: { fontSize: 17, fontWeight: '400', color: '#1A1A1A' },
  pickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 999 },
  pickerSheet: { borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 20, paddingBottom: 32 },
  pickerTitle: { fontSize: 17, fontWeight: '400', marginBottom: 14 },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 12, borderRadius: 6, marginBottom: 4 },
  pickerItemText: { fontSize: 15 },
  pickerClose: { marginTop: 8, padding: 14, alignItems: 'center' },
  pickerCloseText: { fontSize: 15, fontWeight: '400' },
});

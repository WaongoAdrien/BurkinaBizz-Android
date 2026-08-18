// app/vendor/add-business.tsx

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Image, StyleSheet,
  Alert, ActivityIndicator, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { containsProfanity } from '../../lib/profanityFilter';
import { useAuth } from '../../lib/AuthContext';
import { Colors, CATEGORIES, CITIES, CITY_CATEGORIES } from '../../constants';
import { useColorTheme } from '../../hooks/useColorTheme';
import { Category, City, BusinessLocation, OpeningHours } from '../../types';
import { emptyOpeningHours, hasAnyOpeningHours } from '../../lib/openingHours';
import { OpeningHoursEditor } from '../../components/OpeningHoursEditor';
import { useTranslation, registerTranslations } from '../../lib/LanguageContext';
import { AppHeader } from '../../components/AppHeader';

registerTranslations({
  'optionnel': 'optional',
  'Annuler': 'Cancel',
  'Informations': 'Information',
  'Contact': 'Contact',
  'Réseaux': 'Social',
  'Localisation': 'Location',
  'Photos': 'Photos',
  'Maximum atteint': 'Maximum reached',
  'Maximum 5 photos.': 'Maximum 5 photos.',
  'Ajouter des photos': 'Add photos',
  '📷 Prendre une photo': '📷 Take a photo',
  '🖼️ Galerie': '🖼️ Gallery',
  'Nom requis': 'Name required',
  'Langage inapproprié / Inappropriate language': 'Inappropriate language',
  'Au moins une catégorie requise': 'At least one category required',
  'Description requise': 'Description required',
  'Numéro valide requis': 'Valid phone number required',
  '⚠️ Doublon possible': '⚠️ Possible duplicate',
  'Une entreprise similaire existe déjà à': 'A similar business already exists in',
  'Voulez-vous quand même soumettre?': 'Do you want to submit anyway?',
  'Soumettre quand même': 'Submit anyway',
  'Erreur': 'Error',
  "Impossible d'envoyer. Vérifiez votre connexion.": 'Unable to submit. Check your connection.',
  '✅ Demande envoyée!': '✅ Request sent!',
  'Votre entreprise sera examinée sous 24–48h.': 'Your business will be reviewed within 24–48h.',
  'OK': 'OK',
  "Nom de l'entreprise *": 'Business name *',
  'Ex: Restaurant Chez Fatou': 'Ex: Restaurant Chez Fatou',
  'Doublon possible': 'Possible duplicate',
  '| identique ': '| identical ',
  '| nom très similaire': '| very similar name',
  '| mots similaires (possible faute)': '| similar words (possible typo)',
  'Ville *': 'City *',
  "Catégories * (sélectionnez toutes les catégories qui s'appliquent)": 'Categories * (select all that apply)',
  'Description *': 'Description *',
  'Services proposés, horaires, spécialités...': 'Services offered, hours, specialties...',
  'Téléphone *': 'Phone *',
  'WhatsApp': 'WhatsApp',
  'Entrez votre numéro WhatsApp': 'Enter your WhatsApp number',
  'Facebook': 'Facebook',
  'Lien ou nom de la page': 'Link or page name',
  'Instagram': 'Instagram',
  '@nomutilisateur': '@username',
  'Site web': 'Website',
  'Optionnel. Aidez vos clients à vous trouver.': 'Optional. Help your customers find you.',
  'GPS:': 'GPS:',
  'Modifier': 'Edit',
  'Ajouter une localisation': 'Add a location',
  "Jusqu'à 5 photos. La première = couverture.": 'Up to 5 photos. The first one = cover.',
  'Couverture': 'Cover',
  'Ajouter': 'Add',
  'Upload:': 'Upload:',
  '← Retour': '← Back',
  'Suivant →': 'Next →',
  'Soumettre': 'Submit',
  'Ville': 'City',
  'Horaires': 'Hours',
  "Renseignez vos horaires d'ouverture pour chaque jour. Les clients verront un badge « Ouvert »/« Fermé » en temps réel.":
    "Set your opening hours for each day. Customers will see a live « Open »/« Closed » badge.",
});

// ── Duplicate detection ────────────────────────────────────────────────────────
const normStr = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

const diceSimilarity = (a: string, b: string): number => {
  const na = normStr(a), nb = normStr(b);
  if (na.length < 3 || nb.length < 3) return na === nb ? 1 : 0;
  const tris = (s: string) => new Set(Array.from({ length: s.length - 2 }, (_, i) => s.slice(i, i + 3)));
  const ta = tris(na), tb = tris(nb);
  let overlap = 0;
  ta.forEach(t => { if (tb.has(t)) overlap++; });
  return (2 * overlap) / (ta.size + tb.size);
};

const levenshtein = (a: string, b: string): number => {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
};

// Average best-word match across all significant words (catches typos like residance/residence)
const wordOverlapScore = (a: string, b: string): number => {
  const wa = normStr(a).split(' ').filter(w => w.length > 2);
  const wb = normStr(b).split(' ').filter(w => w.length > 2);
  if (!wa.length || !wb.length) return 0;
  const scores = wa.map(w => Math.max(...wb.map(ww => 1 - levenshtein(w, ww) / Math.max(w.length, ww.length))));
  return scores.reduce((s, v) => s + v, 0) / scores.length;
};

const DUPE_THRESHOLD = 0.8;
const WORD_OVERLAP_THRESHOLD = 0.75;
const isSameIgnoringSpacesAndPunct = (a: string, b: string) =>
  a.toLowerCase().replace(/[\s.,\-']/g, '') === b.toLowerCase().replace(/[\s.,\-']/g, '');
// ─────────────────────────────────────────────────────────────────────────────
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
        {items.map(item => (
          <TouchableOpacity key={item}
            style={[styles.pickerItem, selected === item && { backgroundColor: Colors.primary + '22' }]}
            onPress={() => { onSelect(item); onClose(); }}>
            <Text style={[styles.pickerItemText, { color: selected === item ? Colors.primary : textColor }, selected === item && { fontWeight: '400' }]}>{item}</Text>
            {selected === item && <Text style={{ color: Colors.primary }}>✓</Text>}
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.pickerClose} onPress={onClose}>
          <Text style={[styles.pickerCloseText, { color: secondaryColor }]}>{t('Annuler')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

const MAX_PHOTOS = 10;
const STEPS = ['Informations', 'Contact', 'Horaires', 'Réseaux', 'Localisation', 'Photos'];

export default function AddBusinessScreen() {
  const router = useRouter();
  const { user, userProfile, isPending } = useAuth();
  const { theme } = useColorTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);

  const [name, setName] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [city, setCity] = useState<City>('Ouagadougou');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [openingHours, setOpeningHours] = useState<OpeningHours>(emptyOpeningHours());
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [location, setLocation] = useState<BusinessLocation | undefined>(undefined);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [similarBiz, setSimilarBiz] = useState<any[]>([]);

  useEffect(() => {
    if (!user) { router.replace('/auth'); return; }
    if (isPending) { router.replace('/vendor/pending'); return; }
    
    // Load approved businesses for duplicate check
    const q = query(collection(db, 'businesses'), where('status', '==', 'approved'));
    const unsub = onSnapshot(q, snap => {
      setBusinesses(snap.docs.map(d => d.data()));
    });
    return unsub;
  }, [user, isPending]);

  // Debounced duplicate check
  useEffect(() => {
    if (name.trim().length < 3) { setSimilarBiz([]); return; }
    const timer = setTimeout(() => {
      const cityBiz = businesses.filter(b => b.city === city);
      const matches = cityBiz
        .map(b => ({
          ...b,
          _exact: isSameIgnoringSpacesAndPunct(b.name, name),
          _score: diceSimilarity(b.name, name),
          _wordScore: wordOverlapScore(b.name, name),
        }))
        .filter(b => b._exact || b._score >= DUPE_THRESHOLD || b._wordScore >= WORD_OVERLAP_THRESHOLD);
      setSimilarBiz(matches);
    }, 600);
    return () => clearTimeout(timer);
  }, [name, city, businesses]);

  // Clear invalid categories when city changes
  useEffect(() => {
    const availableCategories = CITY_CATEGORIES[city] || CATEGORIES.map(c => c.label);
    const validCategories = categories.filter(cat => availableCategories.includes(cat));
    
    if (validCategories.length !== categories.length) {
      if (validCategories.length > 0) {
        setCategories(validCategories);
      } else {
        // All selected categories invalid for new city — clear selection
        setCategories([]);
      }
    }
  }, [city]);

  const fp = { borderColor: '#9CA3AF', surfaceColor: '#FFFFFF', textColor: theme.text, secondaryColor: theme.textSecondary };

  const pickPhotos = async () => {
    if (photoUris.length >= MAX_PHOTOS) {
      Alert.alert(t('Maximum atteint'), t(`Maximum ${MAX_PHOTOS} photos.`));
      return;
    }
    Alert.alert(t('Ajouter des photos'), '', [
      { text: t('📷 Prendre une photo'), onPress: takePhoto },
      { text: t('🖼️ Galerie'), onPress: pickFromGallery },
      { text: t('Annuler'), style: 'cancel' },
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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photoUris.length,
      quality: 0.75,
    });
    if (!result.canceled) {
      setPhotoUris(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, MAX_PHOTOS));
    }
  };

  const removePhoto = (index: number) => setPhotoUris(prev => prev.filter((_, i) => i !== index));

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!name.trim()) e.name = 'Nom requis';
      else if (containsProfanity(name)) e.name = 'Langage inapproprié / Inappropriate language';
      if (categories.length === 0) e.category = 'Au moins une catégorie requise';
      if (!description.trim()) e.description = 'Description requise';
      else if (containsProfanity(description)) e.description = 'Langage inapproprié / Inappropriate language';
    }
    if (step === 1) {
      if (!phone.trim() || phone.replace(/\D/g, '').length < 8) e.phone = 'Numéro valide requis';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
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
          const base = (index / photoUris.length) * 100;
          const chunk = (snap.bytesTransferred / snap.totalBytes) * (100 / photoUris.length);
          setUploadProgress(Math.round(base + chunk));
        },
        reject,
        async () => resolve(await getDownloadURL(task.snapshot.ref))
      );
    });
  };

  const handleSubmit = () => {
    if (!validateStep() || !user) return;
    if (similarBiz.length > 0) {
      const names = similarBiz.map(b => `"${b.name}"`).join(', ');
      Alert.alert(
        t('⚠️ Doublon possible'),
        `${t('Une entreprise similaire existe déjà à')} ${city} :\n${names}\n\n${t('Voulez-vous quand même soumettre?')}`,
        [
          { text: t('Annuler'), style: 'cancel' },
          { text: t('Soumettre quand même'), onPress: submitBusiness },
        ]
      );
      return;
    }
    submitBusiness();
  };

  const submitBusiness = async () => {
    if (!user) return;
    setLoading(true);
    setUploadProgress(0);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < photoUris.length; i++) {
        try { uploadedUrls.push(await uploadPhoto(photoUris[i], i)); } catch {}
      }

      await addDoc(collection(db, 'businesses'), {
        name: name.trim(),
        category: categories[0],   // Primary category (first selected)
        categories,                // All selected categories
        city,
        description: description.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || null,
        strictWhatsapp: true,
        facebook: facebook.trim() || null,
        instagram: instagram.trim() || null,
        website: website.trim() || null,
        openingHours: hasAnyOpeningHours(openingHours) ? openingHours : null,
        photos: uploadedUrls,
        coverPhoto: uploadedUrls[0] || '',
        ownerId: user.uid,
        ownerName: userProfile?.name || user.email || '',
        location: location && (location.address || location.latitude) ? {
          address: location.address ?? null,
          latitude: location.latitude ?? null,
          longitude: location.longitude ?? null,
        } : null,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      Alert.alert(t('✅ Demande envoyée!'), t('Votre entreprise sera examinée sous 24–48h.'),
        [{ text: t('OK'), onPress: () => router.replace('/vendor/dashboard') }]);
    } catch (e: any) {
      Alert.alert(t('Erreur'), t("Impossible d'envoyer. Vérifiez votre connexion."));
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient
        colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
        style={{ flex: 1 }}
      >
      <AppHeader title={t("Ajouter une entreprise")} />
      {/* PROGRESS BAR */}
      <View style={[styles.progressBar, { backgroundColor: theme.surface }]}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.progressDot, { backgroundColor: i <= step ? Colors.primary : theme.border }]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 16 + insets.bottom }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[styles.stepTitle, { color: theme.text }]}>
          {step + 1}. {t(STEPS[step])}
        </Text>

        {/* STEP 0: Informations générales */}
        {step === 0 && (
          <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Field label={t("Nom de l'entreprise *")} value={name} onChangeText={setName}
              placeholder={t('Ex: Restaurant Chez Fatou')} maxLength={80} error={errors.name} {...fp} />

            {similarBiz.length > 0 && (
              <View style={styles.dupeWarning}>
                <MaterialIcons name="warning" size={16} color="#E65100" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.dupeWarningTitle}>{t('Doublon possible')}</Text>
                  {similarBiz.map((b, i) => (
                    <Text key={i} style={styles.dupeWarningItem}>
                      {'• '}{b.name}{' '}
                      <Text style={styles.dupeWarningReason}>
                        {b._exact
                          ? t('| identique ')
                          : b._score >= DUPE_THRESHOLD
                          ? t('| nom très similaire')
                          : t('| mots similaires (possible faute)')}
                      </Text>
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {/* CITY SELECTION - MOVED FIRST */}
            <View style={styles.fieldWrapper}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>{t('Ville *')}</Text>
              <TouchableOpacity style={[styles.selector, { borderColor: '#9CA3AF', backgroundColor: '#FFFFFF' }]}
                onPress={() => { Keyboard.dismiss(); setShowCityPicker(true); }}>
                <Text style={{ color: theme.text, fontSize: 15 }}>📍 {city}</Text>
                <Text style={{ color: theme.textSecondary }}>▾</Text>
              </TouchableOpacity>
            </View>

            {/* CATEGORIES - FILTERED BY CITY */}
            <View style={styles.fieldWrapper}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>{t("Catégories * (sélectionnez toutes les catégories qui s'appliquent)")}</Text>
              <View style={[
                styles.categoryGrid,
                errors.category ? { borderColor: '#D32F2F', borderWidth: 2, borderRadius: 7, padding: 10 } : { borderWidth: 0, padding: 0 }
              ]}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {(() => {
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
                              if (categories.length > 1) setCategories(categories.filter(c => c !== cat.label));
                            } else {
                              setCategories([...categories, cat.label as Category]);
                            }
                          }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '400', color: isSelected ? '#fff' : theme.text }}>
                            {cat.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    });
                  })()}
                </View>
              </View>
              {errors.category && (
                <View style={styles.categoryError}>
                  <MaterialIcons name="error" size={16} color="#D32F2F" />
                  <Text style={styles.categoryErrorText}>{t(errors.category)}</Text>
                </View>
              )}
            </View>

            <Field label={t('Description *')} value={description} onChangeText={setDescription}
              placeholder={t('Services proposés, horaires, spécialités...')} multiline maxLength={600} error={errors.description} {...fp} />
          </View>
        )}

        {/* STEP 1: Contact */}
        {step === 1 && (
          <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Field label={t('Téléphone *')} value={phone} onChangeText={setPhone}
              placeholder="+22670000000" keyboardType="phone-pad" error={errors.phone} {...fp} />
            <Field label={t('WhatsApp')} value={whatsapp} onChangeText={setWhatsapp}
              placeholder={t('Entrez votre numéro WhatsApp')} keyboardType="phone-pad" optional {...fp} />
          </View>
        )}

        {/* STEP 2: Horaires */}
        {step === 2 && (
          <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              {t("Renseignez vos horaires d'ouverture pour chaque jour. Les clients verront un badge « Ouvert »/« Fermé » en temps réel.")}
            </Text>
            <OpeningHoursEditor value={openingHours} onChange={setOpeningHours} theme={theme} />
          </View>
        )}

        {/* STEP 3: Réseaux sociaux */}
        {step === 3 && (
          <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Field label={t('Facebook')} value={facebook} onChangeText={setFacebook}
              placeholder={t('Lien ou nom de la page')} optional {...fp} />
            <Field label={t('Instagram')} value={instagram} onChangeText={setInstagram}
              placeholder={t('@nomutilisateur')} optional {...fp} />
            <Field label={t('Site web')} value={website} onChangeText={setWebsite}
              placeholder="https://www.monentreprise.com" keyboardType="url" optional {...fp} />
          </View>
        )}

        {/* STEP 4: Localisation */}
        {step === 4 && (
          <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              {t('Optionnel. Aidez vos clients à vous trouver.')}
            </Text>
            {location?.address || location?.latitude ? (
              <View style={[styles.locationPreview, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '40' }]}>
                <Text style={{ fontSize: 20 }}>📍</Text>
                <View style={{ flex: 1 }}>
                  {location.address && <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={2}>{location.address}</Text>}
                  {location.latitude && <Text style={[styles.locationCoords, { color: theme.textSecondary }]}>{t('GPS:')} {location.latitude.toFixed(4)}, {location.longitude?.toFixed(4)}</Text>}
                </View>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowLocationPicker(true); }}>
                  <Text style={{ color: Colors.primary, fontWeight: '400', fontSize: 13 }}>{t('Modifier')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={[styles.addLocationBtn, { borderColor: Colors.primary }]}
                onPress={() => { Keyboard.dismiss(); setShowLocationPicker(true); }}>
                <Text style={{ fontSize: 24 }}>🗺️</Text>
                <Text style={[styles.addLocationText, { color: Colors.primary }]}>{t('Ajouter une localisation')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* STEP 5: Photos */}
        {step === 5 && (
          <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              {t(`Jusqu'à ${MAX_PHOTOS} photos. La première = couverture.`)}
            </Text>
            <View style={styles.photoGrid}>
              {photoUris.map((uri, i) => (
                <View key={i} style={styles.photoThumbBox}>
                  <Image source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
                  {i === 0 && (
                    <View style={styles.coverBadge}><Text style={styles.coverBadgeText}>{t('Couverture')}</Text></View>
                  )}
                  <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removePhoto(i)}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '400' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {photoUris.length < MAX_PHOTOS && (
                <TouchableOpacity style={[styles.addPhotoBtn, { borderColor: Colors.primary }]} onPress={pickPhotos}>
                  <Text style={{ fontSize: 28 }}>📷</Text>
                  <Text style={[styles.addPhotoText, { color: Colors.primary }]}>{t('Ajouter')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {loading && uploadProgress > 0 && uploadProgress < 100 && (
          <View style={styles.progressBox}>
            <Text style={[{ color: theme.textSecondary, fontSize: 12, marginBottom: 6 }]}>{t('Upload:')} {uploadProgress}%</Text>
            <View style={[styles.uploadBar, { backgroundColor: theme.border }]}>
              <View style={[styles.uploadFill, { width: `${uploadProgress}%` }]} />
            </View>
          </View>
        )}

        {/* NAVIGATION - inside ScrollView so it stays above keyboard */}
        <View style={[styles.navRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {step > 0 && (
            <TouchableOpacity style={[styles.backBtn, { backgroundColor: Colors.cta }]} onPress={handleBack}>
              <Text style={styles.backBtnText}>{t('← Retour')}</Text>
            </TouchableOpacity>
          )}
          {step < STEPS.length - 1 ? (
            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: Colors.primary }]} onPress={handleNext}>
              <Text style={styles.nextBtnText}>{t('Suivant →')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: Colors.primary }, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextBtnText}>{t('Soumettre')}</Text>}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <LocationPicker visible={showLocationPicker} current={location}
        onConfirm={(loc) => { setLocation(loc); setShowLocationPicker(false); }}
        onClose={() => setShowLocationPicker(false)} theme={theme} />
      <PickerModal visible={showCityPicker} title={t('Ville')} items={CITIES}
        selected={city} onSelect={v => setCity(v as City)} onClose={() => setShowCityPicker(false)}
        cardColor={theme.card} textColor={theme.text} secondaryColor={theme.textSecondary} />
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const THUMB = 96;
const styles = StyleSheet.create({
  progressBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8, justifyContent: 'center' },
  progressDot: { width: 40, height: 6, borderRadius: 3 },
  content: { padding: 16 },
  stepTitle: { fontSize: 20, fontWeight: '400', marginBottom: 16 },
  formCard: { borderRadius: 10, padding: 16, borderWidth: 1, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  fieldWrapper: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '400' },
  optionalTag: { fontSize: 11, fontStyle: 'italic' },
  input: { borderWidth: 2, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15 },
  textArea: { textAlignVertical: 'top', minHeight: 90 },
  errorText: { color: '#D32F2F', fontSize: 12, marginTop: 4 },
  categoryGrid: { marginTop: 8 },
  categoryError: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: '#FFEBEE', borderRadius: 5, paddingHorizontal: 12, paddingVertical: 10 },
  dupeWarning: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FFF3E0', borderRadius: 6, padding: 12, marginTop: -6, marginBottom: 10, borderWidth: 1.5, borderColor: '#FFB300' },
  dupeWarningTitle: { fontSize: 13, fontWeight: '400', color: '#E65100', marginBottom: 4 },
  dupeWarningItem: { fontSize: 12, color: '#BF360C', lineHeight: 18 },
  dupeWarningReason: { fontSize: 11, color: '#E65100', fontStyle: 'italic' },
  categoryErrorText: { color: '#D32F2F', fontSize: 13, fontWeight: '400', flex: 1 },
  selector: { borderWidth: 2, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hint: { fontSize: 12, marginBottom: 12, lineHeight: 18 },
  locationPreview: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 7, padding: 12 },
  locationText: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  locationCoords: { fontSize: 11, marginTop: 2 },
  addLocationBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 2, borderStyle: 'dashed', borderRadius: 7, paddingVertical: 18 },
  addLocationText: { fontSize: 15, fontWeight: '400' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoThumbBox: { width: THUMB, height: THUMB, borderRadius: 6, overflow: 'hidden', position: 'relative' },
  photoThumb: { width: '100%', height: '100%' },
  coverBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(46,125,50,0.85)', padding: 3, alignItems: 'center' },
  coverBadgeText: { color: '#fff', fontSize: 9, fontWeight: '400' },
  removePhotoBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  addPhotoBtn: { width: THUMB, height: THUMB, borderRadius: 6, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  addPhotoText: { fontSize: 11, fontWeight: '400' },
  progressBox: { marginTop: 14 },
  uploadBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  uploadFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  navRow: { flexDirection: 'row', gap: 12, padding: 16, marginTop: 16, borderRadius: 7, borderWidth: 1 },
  backBtn: { flex: 1, paddingVertical: 16, borderRadius: 7, alignItems: 'center' },
  backBtnText: { fontSize: 16, fontWeight: '400', color: '#1A1A1A' },
  nextBtn: { flex: 2, paddingVertical: 16, borderRadius: 7, alignItems: 'center' },
  nextBtnText: { fontSize: 16, fontWeight: '400', color: '#fff' },
  pickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 999 },
  pickerSheet: { borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 20, paddingBottom: 32 },
  pickerTitle: { fontSize: 17, fontWeight: '400', marginBottom: 14 },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 12, borderRadius: 6, marginBottom: 4 },
  pickerItemText: { fontSize: 15 },
  pickerClose: { marginTop: 8, padding: 14, alignItems: 'center' },
  pickerCloseText: { fontSize: 15, fontWeight: '400' },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
});

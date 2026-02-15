// app/vendor/add-product.tsx — AddProductScreen

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { Colors, CATEGORIES, CITIES } from '../../constants';
import { useColorTheme } from '../../hooks/useColorTheme';
import { Category, City, AddProductForm } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Field + PickerModal MUST live outside AddProductScreen.
// Defining them inside causes re-creation on every keystroke → TextInput
// unmounts → focus lost after 1 character.
// ─────────────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: any;
  multiline?: boolean;
  maxLength?: number;
  error?: string;
  borderColor: string;
  surfaceColor: string;
  textColor: string;
  secondaryColor: string;
}

function Field({
  label, value, onChangeText, placeholder,
  keyboardType = 'default', multiline = false, maxLength,
  error, borderColor, surfaceColor, textColor, secondaryColor,
}: FieldProps) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={[styles.fieldLabel, { color: textColor }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.textArea,
          {
            borderColor: error ? '#D32F2F' : borderColor,
            backgroundColor: surfaceColor,
            color: textColor,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={secondaryColor}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        maxLength={maxLength}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

interface PickerModalProps {
  visible: boolean;
  title: string;
  items: string[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
  cardColor: string;
  textColor: string;
  secondaryColor: string;
}

function PickerModal({
  visible, title, items, selected,
  onSelect, onClose, cardColor, textColor, secondaryColor,
}: PickerModalProps) {
  if (!visible) return null;
  return (
    <View style={styles.pickerOverlay}>
      <View style={[styles.pickerSheet, { backgroundColor: cardColor }]}>
        <Text style={[styles.pickerTitle, { color: textColor }]}>{title}</Text>
        {items.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.pickerItem,
              selected === item && { backgroundColor: Colors.primary + '22' },
            ]}
            onPress={() => { onSelect(item); onClose(); }}
          >
            <Text style={[
              styles.pickerItemText,
              { color: selected === item ? Colors.primary : textColor },
              selected === item && { fontWeight: '800' },
            ]}>
              {item}
            </Text>
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

const initialForm: AddProductForm = {
  name: '',
  price: '',
  category: 'Alimentation',
  description: '',
  phone: '',
  city: 'Ouagadougou',
  imageUri: null,
};

export default function AddProductScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, isDark } = useColorTheme();

  const [form, setForm] = useState<AddProductForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<keyof AddProductForm, string>>>({});
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  useEffect(() => {
    if (!user) router.replace('/auth');
  }, [user]);

  const setField = (key: keyof AddProductForm, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "Veuillez autoriser l'accès à votre galerie.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setForm((f) => ({ ...f, imageUri: result.assets[0].uri }));
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "Veuillez autoriser l'accès à la caméra.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setForm((f) => ({ ...f, imageUri: result.assets[0].uri }));
    }
  };

  const handleImageSelect = () => {
    Alert.alert('Ajouter une image', 'Choisissez une source', [
      { text: '📷 Prendre une photo', onPress: takePhoto },
      { text: '🖼️ Choisir depuis la galerie', onPress: pickImage },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof AddProductForm, string>> = {};
    if (!form.name.trim()) e.name = "Nom de l'entreprise requis";
    if (!form.price.trim() || isNaN(Number(form.price)) || Number(form.price) <= 0)
      e.price = 'Prix valide requis (en FCFA)';
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 8)
      e.phone = 'Numéro WhatsApp valide requis';
    if (!form.description.trim()) e.description = 'Description requise';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const uploadImage = async (uri: string): Promise<string> => {
    const blob: Blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response);
      xhr.onerror = () => reject(new Error('Network request failed'));
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });

    const filename = `products/${user!.uid}/${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    return new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, blob);
      task.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        }
      );
    });
  };

  const handleSubmit = async () => {
    if (!validate() || !user) return;
    setLoading(true);
    setUploadProgress(0);
    try {
      // Try to upload image — if Storage isn't configured yet, skip and save without
      let imageUrl = '';
      if (form.imageUri) {
        try {
          imageUrl = await uploadImage(form.imageUri);
        } catch (uploadErr: any) {
          console.warn('Image upload failed, saving without image:', uploadErr?.code || uploadErr);
          // Don't block the product save — image is optional
        }
      }

      await addDoc(collection(db, 'products'), {
        name: form.name.trim(),
        price: Number(form.price),
        category: form.category,
        description: form.description.trim(),
        imageUrl,
        vendorId: user.uid,
        phone: form.phone.trim(),
        city: form.city,
        createdAt: serverTimestamp(),
      });

      const msg = imageUrl
        ? 'Votre entreprise est maintenant visible sur le marché.'
        : 'Votre entreprise a été publiée (sans image — vérifiez Firebase Storage).';

      Alert.alert('✅ Entreprise publiée!', msg, [
        { text: 'Super!', onPress: () => router.replace('/vendor/dashboard') },
      ]);
    } catch (e: any) {
      console.error('Submit error:', e?.code, e?.message);
      const msg = e?.code === 'permission-denied'
        ? 'Permission refusée. Vérifiez que votre compte est approuvé.'
        : e?.code === 'unavailable'
        ? 'Pas de connexion internet.'
        : "Impossible de publier. Réessayez.";
      Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  // Shared theme props passed to Field components
  const fp = {
    borderColor: theme.border,
    surfaceColor: theme.surface,
    textColor: theme.text,
    secondaryColor: theme.textSecondary,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* IMAGE PICKER */}
        <TouchableOpacity
          style={[styles.imagePicker, { borderColor: Colors.primary }]}
          onPress={handleImageSelect}
          activeOpacity={0.8}
        >
          {form.imageUri ? (
            <>
              <Image
                source={{ uri: form.imageUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <View style={styles.changeImageOverlay}>
                <Text style={styles.changeImageText}>Changer l'image</Text>
              </View>
            </>
          ) : (
            <View style={styles.imagePickerPlaceholder}>
              <Text style={{ fontSize: 36 }}>📷</Text>
              <Text style={[styles.imagePickerText, { color: Colors.primary }]}>
                Ajouter une photo de l'entreprise
              </Text>
              <Text style={[styles.imagePickerSub, { color: theme.textSecondary }]}>
                Recommandé: photo claire, fond neutre
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>

          <Field
            label="Nom de l'entreprise *"
            value={form.name}
            onChangeText={(t) => setField('name', t)}
            placeholder="Ex: Restaurant Chez Fatou, Boutique Wax..."
            maxLength={80}
            error={errors.name}
            {...fp}
          />

          <Field
            label="Prix moyen (FCFA) *"
            value={form.price}
            onChangeText={(t) => setField('price', t)}
            placeholder="Ex: 5000"
            keyboardType="numeric"
            error={errors.price}
            {...fp}
          />

          {/* CATEGORY SELECTOR */}
          <View style={styles.fieldWrapper}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Catégorie *</Text>
            <TouchableOpacity
              style={[styles.selector, { borderColor: theme.border, backgroundColor: theme.surface }]}
              onPress={() => setShowCategoryPicker(true)}
            >
              <Text style={{ color: theme.text, fontSize: 15 }}>
                {CATEGORIES.find((c) => c.label === form.category)?.icon} {form.category}
              </Text>
              <Text style={{ color: theme.textSecondary }}>▾</Text>
            </TouchableOpacity>
          </View>

          {/* CITY SELECTOR */}
          <View style={styles.fieldWrapper}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Ville *</Text>
            <TouchableOpacity
              style={[styles.selector, { borderColor: theme.border, backgroundColor: theme.surface }]}
              onPress={() => setShowCityPicker(true)}
            >
              <Text style={{ color: theme.text, fontSize: 15 }}>📍 {form.city}</Text>
              <Text style={{ color: theme.textSecondary }}>▾</Text>
            </TouchableOpacity>
          </View>

          <Field
            label="Description *"
            value={form.description}
            onChangeText={(t) => setField('description', t)}
            placeholder="Décrivez votre entreprise: services, horaires, conditions..."
            multiline
            maxLength={500}
            error={errors.description}
            {...fp}
          />

          <Field
            label="Numéro WhatsApp *"
            value={form.phone}
            onChangeText={(t) => setField('phone', t)}
            placeholder="Ex: +22670000000"
            keyboardType="phone-pad"
            error={errors.phone}
            {...fp}
          />

          <View style={[styles.helpBox, { backgroundColor: isDark ? '#1a2e1a' : '#E8F5E9' }]}>
            <Text style={styles.helpIcon}>💡</Text>
            <Text style={[styles.helpText, { color: theme.textSecondary }]}>
              Votre numéro WhatsApp sera visible pour les clients. Assurez-vous qu'il est actif.
            </Text>
          </View>
        </View>

        {/* UPLOAD PROGRESS */}
        {loading && uploadProgress > 0 && uploadProgress < 100 && (
          <View style={styles.progressBox}>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
              Upload de l'image: {uploadProgress}%
            </Text>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` as any }]} />
            </View>
          </View>
        )}

        {/* SUBMIT */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <ActivityIndicator color="#1A1A1A" />
              <Text style={styles.submitText}>Publication en cours...</Text>
            </View>
          ) : (
            <Text style={styles.submitText}>🚀  Publier l'entreprise</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* PICKERS — rendered outside ScrollView so they overlay correctly */}
      <PickerModal
        visible={showCategoryPicker}
        title="Choisir une catégorie"
        items={CATEGORIES.map((c) => c.label)}
        selected={form.category}
        onSelect={(v) => setForm((f) => ({ ...f, category: v as Category }))}
        onClose={() => setShowCategoryPicker(false)}
        cardColor={theme.card}
        textColor={theme.text}
        secondaryColor={theme.textSecondary}
      />
      <PickerModal
        visible={showCityPicker}
        title="Choisir une ville"
        items={CITIES}
        selected={form.city}
        onSelect={(v) => setForm((f) => ({ ...f, city: v as City }))}
        onClose={() => setShowCityPicker(false)}
        cardColor={theme.card}
        textColor={theme.text}
        secondaryColor={theme.textSecondary}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },

  imagePicker: {
    height: 200, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed',
    overflow: 'hidden', marginBottom: 16,
  },
  imagePickerPlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  imagePickerText: { fontSize: 14, fontWeight: '700' },
  imagePickerSub: { fontSize: 11 },
  previewImage: { width: '100%', height: '100%' },
  changeImageOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', padding: 8, alignItems: 'center',
  },
  changeImageText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  formCard: {
    borderRadius: 16, padding: 16, borderWidth: 1,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6,
    marginBottom: 16,
  },
  fieldWrapper: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12,
    fontSize: 15,
  },
  textArea: { textAlignVertical: 'top', minHeight: 90 },
  errorText: { color: '#D32F2F', fontSize: 12, marginTop: 4 },

  selector: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 13,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },

  helpBox: {
    flexDirection: 'row', borderRadius: 10, padding: 12, gap: 8,
    alignItems: 'flex-start', marginTop: 4,
  },
  helpIcon: { fontSize: 16 },
  helpText: { flex: 1, fontSize: 12, lineHeight: 18 },

  progressBox: { marginBottom: 16, paddingHorizontal: 4 },
  progressText: { fontSize: 12, marginBottom: 6 },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },

  submitBtn: {
    backgroundColor: Colors.cta, paddingVertical: 16,
    borderRadius: 14, alignItems: 'center',
    elevation: 3, shadowColor: Colors.cta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8,
  },
  submitText: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },

  pickerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  pickerSheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 32,
  },
  pickerTitle: { fontSize: 17, fontWeight: '800', marginBottom: 14 },
  pickerItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 12,
    borderRadius: 10, marginBottom: 4,
  },
  pickerItemText: { fontSize: 15 },
  pickerClose: { marginTop: 8, padding: 14, alignItems: 'center' },
  pickerCloseText: { fontSize: 15, fontWeight: '600' },
});

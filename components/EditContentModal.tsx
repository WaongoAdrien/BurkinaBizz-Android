// components/EditContentModal.tsx — Add/edit form for events & tourist attractions
//
// Shared by the admin panel's "Événements" and "Sites touristiques" tabs. Owns its
// own form state and writes straight to Firestore; the caller only tracks which
// item (if any) is being edited and passes it in via `item`.

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Colors } from '../constants';
import { useTranslation, registerTranslations } from '../lib/LanguageContext';
import { formatEventDate } from '../lib/eventDate';
import LocationPicker from './Locationpicker';
import DatePickerModal from './DatePickerModal';

registerTranslations({
  'Position GPS (pour la carte)': 'GPS position (for the map)',
  'Optionnel — choisir sur la carte': 'Optional — pick on the map',
  'Erreur': 'Error',
  'Le nom, la catégorie et le lieu sont requis.': 'Name, category and location are required.',
  "Impossible d'enregistrer.": 'Unable to save.',
  'Doublon avec :': 'Duplicate with:',
  'Modifier': 'Edit',
  'Ajouter': 'Add',
  'un événement': 'an event',
  'un site touristique': 'a tourist site',
  'Nom *': 'Name *',
  'Catégorie *': 'Category *',
  'Lieu *': 'Location *',
  'Date': 'Date',
  'Date de fin (optionnel)': 'End date (optional)',
  'Sélectionner une date': 'Select a date',
  'Téléphone': 'Phone',
  'Lien carte (Google Maps)': 'Map link (Google Maps)',
  'Page Facebook': 'Facebook page',
  'Site web': 'Website',
  'Image (URL)': 'Image (URL)',
  'Description': 'Description',
  'Nom': 'Name',
  'Ex : Culture, Musique, Nature...': 'E.g.: Culture, Music, Nature...',
  'Ex : Ouagadougou': 'E.g.: Ouagadougou',
  'Optionnel': 'Optional',
  'Optionnel — https://maps.app.goo.gl/...': 'Optional — https://maps.app.goo.gl/...',
  'Optionnel — https://facebook.com/...': 'Optional — https://facebook.com/...',
  'Optionnel — https://...': 'Optional — https://...',
  'Enregistrer': 'Save',
  'Horaires': 'Hours',
  'Ex : Tous les jours, 8h-18h': 'E.g.: Every day, 8am-6pm',
  'Photos supplémentaires': 'Additional photos',
  'Optionnel — URLs séparées par des virgules': 'Optional — comma-separated URLs',
  'Hôtels recommandés': 'Recommended hotels',
  'Ajouter un hôtel': 'Add a hotel',
  "Nom de l'hôtel": 'Hotel name',
  'Lien de réservation': 'Booking link',
  'Optionnel — https://... ou https://booking.com/...': 'Optional — https://... or https://booking.com/...',
  "Chaque hôtel doit avoir un nom et un lien. Complétez ou supprimez la ligne incomplète.": 'Each hotel needs both a name and a link. Complete or remove the incomplete row.',
  'Annuler': 'Cancel',
});

export type ContentKind = 'events' | 'attractions';

export const CONTENT_COLLECTION: Record<ContentKind, string> = {
  events: 'events',
  attractions: 'touristSites',
};

interface HotelRow { name: string; link: string; }

interface FormState {
  name: string;
  category: string;
  location: string;
  phone: string;
  image: string;
  date: string;
  endDate: string;
  description: string;
  mapLink: string;
  facebook: string;
  website: string;
  photos: string;
  schedule: string;
  latitude: number | null;
  longitude: number | null;
  hotels: HotelRow[];
}

const emptyForm = (): FormState => ({
  name: '', category: '', location: '', phone: '', image: '', date: '', endDate: '', description: '',
  mapLink: '', facebook: '', website: '', photos: '', schedule: '',
  latitude: null, longitude: null, hotels: [],
});

const formFromItem = (item: any): FormState => ({
  name: item.name || '', category: item.category || '', location: item.location || '',
  phone: item.phone || '', image: item.image || '', date: item.date || '', endDate: item.endDate || '',
  description: item.description || '',
  mapLink: item.mapLink || '', facebook: item.facebook || '', website: item.website || '',
  photos: Array.isArray(item.photos) ? item.photos.join(', ') : '', schedule: item.schedule || '',
  latitude: typeof item.latitude === 'number' ? item.latitude : null,
  longitude: typeof item.longitude === 'number' ? item.longitude : null,
  hotels: Array.isArray(item.hotels) ? item.hotels.map((h: any) => ({ name: h.name || '', link: h.link || '' })) : [],
});

interface Props {
  visible: boolean;
  kind: ContentKind;
  item: any | null; // null = creating a new item
  onClose: () => void;
  theme: any;
  showAlert: (title: string, message?: string) => void;
}

export default function EditContentModal({ visible, kind, item, onClose, theme, showAlert }: Props) {
  const { t, language } = useTranslation();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [datePickerFor, setDatePickerFor] = useState<'date' | 'endDate' | null>(null);

  useEffect(() => {
    if (!visible) return;
    setForm(item ? formFromItem(item) : emptyForm());
  }, [visible, item]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const addHotelRow = () => setForm(prev => ({ ...prev, hotels: [...prev.hotels, { name: '', link: '' }] }));
  const removeHotelRow = (index: number) => setForm(prev => ({ ...prev, hotels: prev.hotels.filter((_, i) => i !== index) }));
  const updateHotelRow = (index: number, field: 'name' | 'link', value: string) =>
    setForm(prev => ({ ...prev, hotels: prev.hotels.map((h, i) => (i === index ? { ...h, [field]: value } : h)) }));

  const save = async () => {
    const { name, category, location, phone, image, date, endDate, description, mapLink, facebook, website, photos, schedule, latitude, longitude, hotels } = form;
    if (!name.trim() || !category.trim() || !location.trim()) {
      showAlert(t('Erreur'), t('Le nom, la catégorie et le lieu sont requis.'));
      return;
    }
    if (kind === 'attractions' && hotels.some(h => !!h.name.trim() !== !!h.link.trim())) {
      showAlert(t('Erreur'), t('Chaque hôtel doit avoir un nom et un lien. Complétez ou supprimez la ligne incomplète.'));
      return;
    }
    const collectionName = CONTENT_COLLECTION[kind];
    const payload: any = { name: name.trim(), category: category.trim(), location: location.trim(), description: description.trim() };
    if (phone.trim()) payload.phone = phone.trim();
    if (image.trim()) payload.image = image.trim();
    if (kind === 'events') {
      // Always written (even when blank) so clearing a date via the picker's clear button
      // actually clears it on save, instead of leaving the old Firestore value in place.
      payload.date = date.trim() || null;
      payload.endDate = endDate.trim() || null;
    }
    if (mapLink.trim()) payload.mapLink = mapLink.trim();
    if (facebook.trim()) payload.facebook = facebook.trim();
    if (website.trim()) payload.website = website.trim();
    if (kind === 'attractions' && schedule.trim()) payload.schedule = schedule.trim();
    if (kind === 'attractions' && photos.trim()) {
      payload.photos = photos.split(',').map(p => p.trim()).filter(Boolean);
    }
    if (kind === 'attractions') {
      payload.hotels = hotels
        .filter(h => h.name.trim() && h.link.trim())
        .map(h => ({ name: h.name.trim(), link: h.link.trim() }));
    }
    if (latitude !== null && longitude !== null) {
      payload.latitude = latitude;
      payload.longitude = longitude;
    }

    setSaving(true);
    try {
      if (item?.id) {
        await updateDoc(doc(db, collectionName, item.id), payload);
      } else {
        await addDoc(collection(db, collectionName), { ...payload, createdAt: serverTimestamp() });
      }
      onClose();
    } catch (e: any) {
      showAlert(t('Erreur'), e?.message || t("Impossible d'enregistrer."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={[styles.modalOverlay, { padding: 16 }]}>
            <View style={[styles.modalBox, { backgroundColor: theme.card, maxHeight: '85%', maxWidth: 640 }]}>
              <View style={styles.modalTitleRow}>
                <MaterialIcons name={kind === 'events' ? 'event' : 'photo-camera'} size={18} color={Colors.primary} />
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {item ? t('Modifier') : t('Ajouter')} {kind === 'events' ? t('un événement') : t('un site touristique')}
                </Text>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Nom *')}</Text>
                <TextInput
                  style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
                  value={form.name}
                  onChangeText={v => set('name', v)}
                  placeholder={t('Nom')}
                  placeholderTextColor={theme.textSecondary}
                />
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Catégorie *')}</Text>
                <TextInput
                  style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
                  value={form.category}
                  onChangeText={v => set('category', v)}
                  placeholder={t('Ex : Culture, Musique, Nature...')}
                  placeholderTextColor={theme.textSecondary}
                />
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Lieu *')}</Text>
                <TextInput
                  style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
                  value={form.location}
                  onChangeText={v => set('location', v)}
                  placeholder={t('Ex : Ouagadougou')}
                  placeholderTextColor={theme.textSecondary}
                />
                {kind === 'events' && (
                  <>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Date')}</Text>
                    <TouchableOpacity
                      style={[styles.datePickBtn, { borderColor: theme.border }]}
                      onPress={() => setDatePickerFor('date')}
                    >
                      <MaterialIcons name="event" size={16} color={form.date ? Colors.primary : theme.textSecondary} />
                      <Text style={[styles.datePickBtnText, { color: form.date ? theme.text : theme.textSecondary }]}>
                        {form.date ? formatEventDate(form.date, language) : t('Sélectionner une date')}
                      </Text>
                      {form.date && (
                        <TouchableOpacity onPress={() => set('date', '')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <MaterialIcons name="close" size={16} color={theme.textSecondary} />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>

                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Date de fin (optionnel)')}</Text>
                    <TouchableOpacity
                      style={[styles.datePickBtn, { borderColor: theme.border }]}
                      onPress={() => setDatePickerFor('endDate')}
                    >
                      <MaterialIcons name="event" size={16} color={form.endDate ? Colors.primary : theme.textSecondary} />
                      <Text style={[styles.datePickBtnText, { color: form.endDate ? theme.text : theme.textSecondary }]}>
                        {form.endDate ? formatEventDate(form.endDate, language) : t('Optionnel')}
                      </Text>
                      {form.endDate && (
                        <TouchableOpacity onPress={() => set('endDate', '')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <MaterialIcons name="close" size={16} color={theme.textSecondary} />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  </>
                )}
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Téléphone')}</Text>
                <TextInput
                  style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
                  value={form.phone}
                  onChangeText={v => set('phone', v)}
                  placeholder={t('Optionnel')}
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="phone-pad"
                />
                {kind === 'attractions' && (
                  <>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Horaires')}</Text>
                    <TextInput
                      style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
                      value={form.schedule}
                      onChangeText={v => set('schedule', v)}
                      placeholder={t('Ex : Tous les jours, 8h-18h')}
                      placeholderTextColor={theme.textSecondary}
                    />
                  </>
                )}
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Lien carte (Google Maps)')}</Text>
                <TextInput
                  style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
                  value={form.mapLink}
                  onChangeText={v => set('mapLink', v)}
                  placeholder={t('Optionnel — https://maps.app.goo.gl/...')}
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Position GPS (pour la carte)')}</Text>
                <TouchableOpacity
                  style={[styles.gpsPickBtn, { borderColor: theme.border }]}
                  onPress={() => setLocationPickerVisible(true)}
                >
                  <MaterialIcons name="place" size={16} color={form.latitude !== null ? Colors.primary : theme.textSecondary} />
                  <Text style={[styles.gpsPickBtnText, { color: form.latitude !== null ? theme.text : theme.textSecondary }]}>
                    {form.latitude !== null
                      ? `${form.latitude.toFixed(5)}, ${form.longitude!.toFixed(5)}`
                      : t('Optionnel — choisir sur la carte')}
                  </Text>
                  {form.latitude !== null && (
                    <TouchableOpacity
                      onPress={() => { set('latitude', null); set('longitude', null); }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialIcons name="close" size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Page Facebook')}</Text>
                <TextInput
                  style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
                  value={form.facebook}
                  onChangeText={v => set('facebook', v)}
                  placeholder={t('Optionnel — https://facebook.com/...')}
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Site web')}</Text>
                <TextInput
                  style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
                  value={form.website}
                  onChangeText={v => set('website', v)}
                  placeholder={t('Optionnel — https://...')}
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Image (URL)')}</Text>
                <TextInput
                  style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
                  value={form.image}
                  onChangeText={v => set('image', v)}
                  placeholder="https://..."
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                />
                {kind === 'attractions' && (
                  <>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Photos supplémentaires')}</Text>
                    <TextInput
                      style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
                      value={form.photos}
                      onChangeText={v => set('photos', v)}
                      placeholder={t('Optionnel — URLs séparées par des virgules')}
                      placeholderTextColor={theme.textSecondary}
                      autoCapitalize="none"
                    />
                  </>
                )}
                {kind === 'attractions' && (
                  <>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Hôtels recommandés')}</Text>
                    {form.hotels.map((hotel, index) => (
                      <View key={index} style={styles.hotelRow}>
                        <MaterialIcons name="hotel" size={18} color={theme.textSecondary} />
                        <View style={{ flex: 1, gap: 6 }}>
                          <TextInput
                            style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
                            value={hotel.name}
                            onChangeText={v => updateHotelRow(index, 'name', v)}
                            placeholder={t("Nom de l'hôtel")}
                            placeholderTextColor={theme.textSecondary}
                          />
                          <TextInput
                            style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
                            value={hotel.link}
                            onChangeText={v => updateHotelRow(index, 'link', v)}
                            placeholder={t('Optionnel — https://... ou https://booking.com/...')}
                            placeholderTextColor={theme.textSecondary}
                            autoCapitalize="none"
                            keyboardType="url"
                          />
                        </View>
                        <TouchableOpacity
                          onPress={() => removeHotelRow(index)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={{ paddingTop: 10 }}
                        >
                          <MaterialIcons name="close" size={18} color={theme.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity style={[styles.addHotelBtn, { borderColor: theme.border }]} onPress={addHotelRow}>
                      <MaterialIcons name="add" size={16} color={Colors.primary} />
                      <Text style={[styles.addHotelBtnText, { color: Colors.primary }]}>{t('Ajouter un hôtel')}</Text>
                    </TouchableOpacity>
                  </>
                )}
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Description')}</Text>
                <TextInput
                  style={[styles.fieldInput, styles.fieldInputMultiline, { borderColor: theme.border, color: theme.text }]}
                  value={form.description}
                  onChangeText={v => set('description', v)}
                  placeholder={t('Description')}
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              </ScrollView>
              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={[styles.modalBtn, { borderColor: theme.border }]}
                  onPress={onClose}
                  disabled={saving}
                >
                  <Text style={[styles.modalBtnText, { color: theme.textSecondary }]}>{t('Annuler')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                  onPress={save}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={[styles.modalBtnText, { color: '#fff', fontWeight: '400' }]}>{t('Enregistrer')}</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <LocationPicker
        visible={locationPickerVisible}
        current={form.latitude !== null ? { latitude: form.latitude, longitude: form.longitude! } : undefined}
        onConfirm={(loc) => {
          set('latitude', loc.latitude ?? null);
          set('longitude', loc.longitude ?? null);
          setLocationPickerVisible(false);
        }}
        onClose={() => setLocationPickerVisible(false)}
        theme={theme}
      />

      <DatePickerModal
        visible={datePickerFor !== null}
        value={datePickerFor ? form[datePickerFor] : undefined}
        theme={theme}
        onClose={() => setDatePickerFor(null)}
        onConfirm={v => {
          if (datePickerFor) set(datePickerFor, v);
          setDatePickerFor(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalBox: { width: '100%', borderRadius: 10, padding: 24, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  modalTitle: { fontSize: 18, fontWeight: '400' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 13, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { fontSize: 15, fontWeight: '400' },
  fieldLabel: { fontSize: 12, fontWeight: '400', marginBottom: 5, marginTop: 10 },
  fieldInput: { borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  fieldInputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  gpsPickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10,
  },
  gpsPickBtnText: { flex: 1, fontSize: 13 },
  datePickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10,
  },
  datePickBtnText: { flex: 1, fontSize: 13 },
  hotelRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 },
  addHotelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 6, paddingVertical: 10, marginTop: 8,
  },
  addHotelBtnText: { fontSize: 13, fontWeight: '400' },
});

// app/admin/index.tsx — Admin Panel

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, Image,
  StyleSheet, ActivityIndicator, Modal,
  RefreshControl, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import {
  collection, query, where, orderBy, onSnapshot,
  doc, addDoc, updateDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { Colors, PRODUCT_CATEGORIES } from '../../constants';
import { useColorTheme } from '../../hooks/useColorTheme';
import { useTranslation, registerTranslations } from '../../lib/LanguageContext';
import { AppHeader } from '../../components/AppHeader';
import EditContentModal, { ContentKind, CONTENT_COLLECTION } from '../../components/EditContentModal';
import { formatEventDateRange } from '../../lib/eventDate';

registerTranslations({
  'Position GPS (pour la carte)': 'GPS position (for the map)',
  'Optionnel — choisir sur la carte': 'Optional — pick on the map',
  'Entreprise liée': 'Related business',
  'Choisissez une entreprise à afficher dans "Voir aussi" sur': 'Choose a business to show in "See also" on',
  'Erreur': 'Error',
  'Le nom, la catégorie et le lieu sont requis.': 'Name, category and location are required.',
  "Impossible d'enregistrer.": 'Unable to save.',
  'Supprimer?': 'Delete?',
  ' sera supprimé définitivement.': ' will be permanently deleted.',
  'Annuler': 'Cancel',
  'Supprimer': 'Delete',
  'Impossible de supprimer.': 'Unable to delete.',
  'Doublon avec :': 'Duplicate with:',
  ' (identique)': ' (identical)',
  ' (très similaire)': ' (very similar)',
  ' (faute probable)': ' (likely typo)',
  'Doublon détecté': 'Duplicate detected',
  'Approuver cette entreprise?': 'Approve this business?',
  " apparaîtra dans l'annuaire.": ' will appear in the directory.',
  'Approuver': 'Approve',
  "Impossible d'approuver.": 'Unable to approve.',
  'Rejeter cette entreprise?': 'Reject this business?',
  ' sera supprimée définitivement.': ' will be permanently deleted.',
  'Rejeter': 'Reject',
  'Impossible de rejeter.': 'Unable to reject.',
  "Retirer de l'annuaire?": 'Remove from directory?',
  ' ne sera plus visible.': ' will no longer be visible.',
  'Retirer': 'Remove',
  'Impossible.': 'Unable to complete this action.',
  'Approuver ce vendeur?': 'Approve this vendor?',
  ' pourra soumettre des entreprises.': ' will be able to submit businesses.',
  'Rejeter ce vendeur?': 'Reject this vendor?',
  'Le compte de': 'The account of',
  ' sera supprimé.': ' will be deleted.',
  'Révoquer ce vendeur?': 'Revoke this vendor?',
  ' repassera en "En attente".': ' will switch back to "Pending".',
  'Révoquer': 'Revoke',
  'Nom quasi-identique': 'Nearly identical name',
  'Doublon possible': 'Possible duplicate',
  'En attente': 'Pending',
  'Publié': 'Published',
  'Succès': 'Success',
  'Badge vérifié retiré': 'Verified badge removed',
  'Entreprise vérifiée': 'Business verified',
  'Impossible de modifier': 'Unable to update',
  'Épinglage retiré': 'Pin removed',
  'Entreprise épinglée': 'Business pinned',
  'Modifier': 'Edit',
  'Vendeur': 'Vendor',
  'Révoquer le vendeur': 'Revoke vendor',
  'Entreprises en attente': 'Businesses pending',
  'Vendeurs en attente': 'Vendors pending',
  'Produits en attente': 'Products pending',
  'Entreprises': 'Businesses',
  'Vendeurs': 'Vendors',
  'Signalements': 'Reports',
  'Événements': 'Events',
  'Sites touristiques': 'Tourist sites',
  'Chargement...': 'Loading...',
  'Rechercher une entreprise...': 'Search for a business...',
  'Rechercher un vendeur...': 'Search for a vendor...',
  'Publiées': 'Published',
  'Approuvés': 'Approved',
  'Aucun résultat': 'No results',
  'Aucune entreprise en attente': 'No pending businesses',
  'Aucune entreprise publiée': 'No published businesses',
  'Aucun vendeur en attente': 'No pending vendors',
  'Aucun vendeur approuvé': 'No approved vendors',
  'Motif:': 'Reason:',
  'Par:': 'By:',
  'Ignorer?': 'Dismiss?',
  'Ignorer': 'Dismiss',
  "Retirer l'annonce?": 'Remove the listing?',
  ' sera remise en attente.': ' will be put back to pending.',
  'Aucun signalement en attente': 'No pending reports',
  'Ajouter un événement': 'Add an event',
  'Aucun événement': 'No events',
  'Ajouter un site touristique': 'Add a tourist site',
  'Aucun site touristique': 'No tourist sites',
  'Priorité': 'Priority',
  'Entrez un nombre entre 0 et 100': 'Enter a number between 0 and 100',
  '(Plus élevé = apparaît en premier)': '(Higher = appears first)',
  'Priorité mise à': 'Priority set to',
  'Ajouter': 'Add',
  'un événement': 'an event',
  'un site touristique': 'a tourist site',
  'Nom *': 'Name *',
  'Catégorie *': 'Category *',
  'Lieu *': 'Location *',
  'Date': 'Date',
  'Téléphone': 'Phone',
  'Lien carte (Google Maps)': 'Map link (Google Maps)',
  'Page Facebook': 'Facebook page',
  'Site web': 'Website',
  'Image (URL)': 'Image (URL)',
  'Description': 'Description',
  'Nom': 'Name',
  'Ex : Culture, Musique, Nature...': 'E.g.: Culture, Music, Nature...',
  'Ex : Ouagadougou': 'E.g.: Ouagadougou',
  'Ex : 12 septembre 2026': 'E.g.: September 12, 2026',
  'Optionnel': 'Optional',
  'Optionnel — https://maps.app.goo.gl/...': 'Optional — https://maps.app.goo.gl/...',
  'Optionnel — https://facebook.com/...': 'Optional — https://facebook.com/...',
  'Optionnel — https://...': 'Optional — https://...',
  'Enregistrer': 'Save',
  'Horaires': 'Hours',
  'Ex : Tous les jours, 8h-18h': 'E.g.: Every day, 8am-6pm',
  'Photos supplémentaires': 'Additional photos',
  'Optionnel — URLs séparées par des virgules': 'Optional — comma-separated URLs',
  'Numéros': 'Numbers',
  'Sites officiels': 'Official sites',
  'Ajouter un numéro': 'Add a number',
  'Aucun numéro': 'No numbers',
  'Ajouter un site officiel': 'Add an official site',
  'Aucun site officiel': 'No official sites',
  'un numéro utile': 'a useful number',
  'un site officiel': 'an official site',
  'Groupe *': 'Group *',
  'Ex : Urgences, Hôpitaux et cliniques...': 'E.g.: Emergencies, Hospitals and clinics...',
  'Libellé *': 'Label *',
  'Ex : Police Secours': 'E.g.: Police',
  'Numéro *': 'Number *',
  'Ex : 17': 'E.g.: 17',
  'Le groupe, le libellé et le numéro sont requis.': 'Group, label and number are required.',
  'Ce que fait cette organisation...': 'What this organization does...',
  'Optionnel — https://www.exemple.gov.bf': 'Optional — https://www.exemple.gov.bf',
  'Le nom et la description sont requis.': 'Name and description are required.',
  'Hôtels recommandés': 'Recommended hotels',
  'Ajouter un hôtel': 'Add a hotel',
  "Nom de l'hôtel": 'Hotel name',
  'Lien de réservation': 'Booking link',
  'Optionnel — https://... ou https://booking.com/...': 'Optional — https://... or https://booking.com/...',
  "Chaque hôtel doit avoir un nom et un lien. Complétez ou supprimez la ligne incomplète.": 'Each hotel needs both a name and a link. Complete or remove the incomplete row.',
  'Applications': 'Applications',
  'Ajouter une application': 'Add an application',
  'Aucune application': 'No applications',
  'une application': 'an application',
  'Ex : Orange Money, Wave, Yango...': 'E.g.: Orange Money, Wave, Yango...',
  'Ex : Paiement mobile, Transport, Services publics...': 'E.g.: Mobile payment, Transport, Public services...',
  "Icône / logo (URL)": 'Icon / logo (URL)',
  'Lien Google Play': 'Google Play link',
  'Optionnel — https://play.google.com/...': 'Optional — https://play.google.com/...',
  'Lien App Store': 'App Store link',
  'Optionnel — https://apps.apple.com/...': 'Optional — https://apps.apple.com/...',
  'Ordre (optionnel)': 'Order (optional)',
  'Plus petit = apparaît en premier': 'Smaller = appears first',
  'Le nom et la catégorie sont requis.': 'Name and category are required.',
  'Supprimer cette application?': 'Delete this application?',
  'Produits': 'Products',
  'Rechercher un produit...': 'Search for a product...',
  'Approuver ce produit?': 'Approve this product?',
  ' apparaîtra sur le marché.': ' will appear on the marketplace.',
  'Rejeter ce produit?': 'Reject this product?',
  'Retirer du marché?': 'Remove from marketplace?',
  'Aucun produit en attente': 'No pending products',
  'Aucun produit publié': 'No published products',
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
  'Négociable': 'Negotiable',
});

type Tab = 'businesses' | 'products' | 'users' | 'reports' | 'events' | 'attractions' | 'numbers' | 'sites' | 'applications';
type AdminAlertButton = { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void };

interface NumberFormState {
  visible: boolean;
  editId: string | null;
  group: string;
  label: string;
  number: string;
}
const emptyNumberForm = (): NumberFormState => ({ visible: true, editId: null, group: '', label: '', number: '' });

interface SiteFormState {
  visible: boolean;
  editId: string | null;
  name: string;
  description: string;
  website: string;
  facebook: string;
}
const emptySiteForm = (): SiteFormState => ({ visible: true, editId: null, name: '', description: '', website: '', facebook: '' });

interface AppFormState {
  visible: boolean;
  editId: string | null;
  name: string;
  category: string;
  description: string;
  image: string;
  androidUrl: string;
  iosUrl: string;
  website: string;
  order: string;
}
const emptyAppForm = (): AppFormState => ({
  visible: true, editId: null, name: '', category: '', description: '', image: '',
  androidUrl: '', iosUrl: '', website: '', order: '',
});

// ── Duplicate detection ─────────────────────────────────────────────────────
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
// ───────────────────────────────────────────────────────────────────────────

export default function AdminScreen() {
  const router = useRouter();
  const deepLinkParams = useLocalSearchParams<{ tab?: string; editId?: string }>();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { theme } = useColorTheme();
  const { t, language } = useTranslation();

  const [tab, setTab] = useState<Tab>('businesses');

  // Businesses
  const [pendingBiz, setPendingBiz] = useState<any[]>([]);
  const [approvedBiz, setApprovedBiz] = useState<any[]>([]);

  // Products
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [approvedProducts, setApprovedProducts] = useState<any[]>([]);
  const [productTab, setProductTab] = useState<'pending' | 'approved'>('pending');
  const [productSearch, setProductSearch] = useState('');

  // Users
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<any[]>([]);

  // Reports
  const [reports, setReports] = useState<any[]>([]);

  // Events & Tourist attractions
  const [events, setEvents] = useState<any[]>([]);
  const [attractions, setAttractions] = useState<any[]>([]);
  const [contentModal, setContentModal] = useState<{ visible: boolean; kind: ContentKind; item: any | null }>({ visible: false, kind: 'events', item: null });

  // Useful numbers & Official sites (About Burkina)
  const [usefulNumbers, setUsefulNumbers] = useState<any[]>([]);
  const [officialSites, setOfficialSites] = useState<any[]>([]);
  const [numberForm, setNumberForm] = useState<NumberFormState>({ ...emptyNumberForm(), visible: false });
  const [siteForm, setSiteForm] = useState<SiteFormState>({ ...emptySiteForm(), visible: false });
  const [savingNumber, setSavingNumber] = useState(false);
  const [savingSite, setSavingSite] = useState(false);

  // Useful applications
  const [usefulApps, setUsefulApps] = useState<any[]>([]);
  const [appForm, setAppForm] = useState<AppFormState>({ ...emptyAppForm(), visible: false });
  const [savingApp, setSavingApp] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [bizTab, setBizTab] = useState<'pending' | 'approved'>('pending');
  const [userTab, setUserTab] = useState<'pending' | 'approved'>('pending');

  // Search
  const [bizSearch, setBizSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Priority modal
  const [priorityModal, setPriorityModal] = useState<{ visible: boolean; item: any | null; value: string; collection: string }>({ visible: false, item: null, value: '', collection: 'businesses' });

  // Related business picker
  const [relatedPicker, setRelatedPicker] = useState<{ visible: boolean; item: any | null; search: string }>({ visible: false, item: null, search: '' });

  // Alert modal — Alert.alert() has no implementation on react-native-web (this admin
  // panel runs in a browser), so confirms silently hang there. This is a web-safe stand-in.
  const [adminAlert, setAdminAlert] = useState<{ visible: boolean; title: string; message: string; buttons: AdminAlertButton[] }>({
    visible: false, title: '', message: '', buttons: [],
  });
  const showAlert = (title: string, message?: string, buttons?: AdminAlertButton[]) => {
    setAdminAlert({ visible: true, title, message: message || '', buttons: buttons?.length ? buttons : [{ text: 'OK' }] });
  };
  const closeAdminAlert = () => setAdminAlert(prev => ({ ...prev, visible: false }));

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/auth'); return; }
    if (!isAdmin) { router.replace('/'); }
  }, [user, isAdmin, authLoading]);

  useEffect(() => {
    if (!isAdmin) return;

    const sort = (a: any, b: any) => {
      const at = a.createdAt?.toDate?.() ?? new Date(a.createdAt ?? 0);
      const bt = b.createdAt?.toDate?.() ?? new Date(b.createdAt ?? 0);
      return bt.getTime() - at.getTime();
    };

    // ── Businesses ──────────────────────────────────────────────────────
    const u1 = onSnapshot(
      query(collection(db, 'businesses'), where('status', '==', 'pending')),
      snap => { setPendingBiz(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(sort)); setLoading(false); setRefreshing(false); }
    );
    const u2 = onSnapshot(
      query(collection(db, 'businesses'), where('status', '==', 'approved')),
      snap => { setApprovedBiz(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(sort)); }
    );

    // ── Products ─────────────────────────────────────────────────────────
    const u11 = onSnapshot(
      query(collection(db, 'products'), where('status', '==', 'pending')),
      snap => { setPendingProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(sort)); }
    );
    const u12 = onSnapshot(
      query(collection(db, 'products'), where('status', '==', 'approved')),
      snap => { setApprovedProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(sort)); }
    );

    // ── Users ────────────────────────────────────────────────────────────
    const u3 = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'pending')),
      snap => { setPendingUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(sort)); }
    );
    const u4 = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'vendor')),
      snap => { setApprovedUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(sort)); }
    );

    // ── Reports ──────────────────────────────────────────────────────────
    const u5 = onSnapshot(
      query(collection(db, 'reports'), where('status', '==', 'pending')),
      snap => { setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(sort)); }
    );

    // ── Events & Tourist attractions ────────────────────────────────────
    const u6 = onSnapshot(
      query(collection(db, 'events'), orderBy('createdAt', 'desc')),
      snap => setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const u7 = onSnapshot(
      query(collection(db, 'touristSites'), orderBy('createdAt', 'desc')),
      snap => setAttractions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    // ── Useful numbers & Official sites ─────────────────────────────────
    const u8 = onSnapshot(
      query(collection(db, 'usefulNumbers'), orderBy('createdAt', 'desc')),
      snap => setUsefulNumbers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const u9 = onSnapshot(
      query(collection(db, 'officialSites'), orderBy('createdAt', 'desc')),
      snap => setOfficialSites(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    // ── Useful applications ─────────────────────────────────────────────
    const u10 = onSnapshot(
      query(collection(db, 'usefulApps'), orderBy('order', 'asc')),
      snap => setUsefulApps(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => { u1(); u2(); u3(); u4(); u5(); u6(); u7(); u8(); u9(); u10(); u11(); u12(); };
  }, [isAdmin]);

  // ── Events & attractions actions ────────────────────────────────────────
  const openAddContent = (kind: ContentKind) => setContentModal({ visible: true, kind, item: null });
  const openEditContent = (kind: ContentKind, item: any) => setContentModal({ visible: true, kind, item });
  const closeContentModal = () => setContentModal(prev => ({ ...prev, visible: false }));

  // Deep link from a tourist-site/event detail page's "edit" button (?tab=attractions|events&editId=...):
  // switch to that tab and open the edit modal once the matching item has loaded in from Firestore.
  const deepLinkHandled = useRef(false);
  useEffect(() => {
    if (deepLinkHandled.current) return;
    const kind: ContentKind | null =
      deepLinkParams.tab === 'attractions' ? 'attractions' : deepLinkParams.tab === 'events' ? 'events' : null;
    if (!kind || !deepLinkParams.editId) return;
    const list = kind === 'attractions' ? attractions : events;
    const item = list.find(i => i.id === deepLinkParams.editId);
    if (!item) return;
    setTab(kind);
    openEditContent(kind, item);
    deepLinkHandled.current = true;
  }, [deepLinkParams.tab, deepLinkParams.editId, attractions, events]);

  // Deep link from an application detail page's "edit" button (?tab=applications&editId=...).
  const appDeepLinkHandled = useRef(false);
  useEffect(() => {
    if (appDeepLinkHandled.current) return;
    if (deepLinkParams.tab !== 'applications' || !deepLinkParams.editId) return;
    const item = usefulApps.find(a => a.id === deepLinkParams.editId);
    if (!item) return;
    setTab('applications');
    openEditApp(item);
    appDeepLinkHandled.current = true;
  }, [deepLinkParams.tab, deepLinkParams.editId, usefulApps]);

  const quickAddContent = (kind: ContentKind) => {
    setTab(kind);
    openAddContent(kind);
  };

  const deleteContent = (kind: ContentKind, item: any) => {
    const collectionName = CONTENT_COLLECTION[kind];
    showAlert(t('Supprimer?'), `"${item.name}"${t(' sera supprimé définitivement.')}`, [
      { text: t('Annuler'), style: 'cancel' },
      {
        text: t('Supprimer'), style: 'destructive', onPress: async () => {
          setActionId(item.id);
          try {
            await deleteDoc(doc(db, collectionName, item.id));
          } catch {
            showAlert(t('Erreur'), t('Impossible de supprimer.'));
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  // ── Useful numbers actions ──────────────────────────────────────────────
  const openAddNumber = () => setNumberForm(emptyNumberForm());
  const openEditNumber = (item: any) => setNumberForm({
    visible: true, editId: item.id,
    group: item.group || '', label: item.label || '', number: item.number || '',
  });
  const closeNumberForm = () => setNumberForm(prev => ({ ...prev, visible: false }));

  const saveNumber = async () => {
    const { editId, group, label, number } = numberForm;
    if (!group.trim() || !label.trim() || !number.trim()) {
      showAlert(t('Erreur'), t('Le groupe, le libellé et le numéro sont requis.'));
      return;
    }
    const payload = { group: group.trim(), label: label.trim(), number: number.trim() };
    setSavingNumber(true);
    try {
      if (editId) {
        await updateDoc(doc(db, 'usefulNumbers', editId), payload);
      } else {
        await addDoc(collection(db, 'usefulNumbers'), { ...payload, createdAt: serverTimestamp() });
      }
      closeNumberForm();
    } catch (e: any) {
      showAlert(t('Erreur'), e?.message || t("Impossible d'enregistrer."));
    } finally {
      setSavingNumber(false);
    }
  };

  const deleteNumber = (item: any) => {
    showAlert(t('Supprimer?'), `"${item.label}"${t(' sera supprimé définitivement.')}`, [
      { text: t('Annuler'), style: 'cancel' },
      {
        text: t('Supprimer'), style: 'destructive', onPress: async () => {
          setActionId(item.id);
          try {
            await deleteDoc(doc(db, 'usefulNumbers', item.id));
          } catch {
            showAlert(t('Erreur'), t('Impossible de supprimer.'));
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  // ── Official sites actions ──────────────────────────────────────────────
  const openAddSite = () => setSiteForm(emptySiteForm());
  const openEditSite = (item: any) => setSiteForm({
    visible: true, editId: item.id,
    name: item.name || '', description: item.description || '',
    website: item.website || '', facebook: item.facebook || '',
  });
  const closeSiteForm = () => setSiteForm(prev => ({ ...prev, visible: false }));

  const saveSite = async () => {
    const { editId, name, description, website, facebook } = siteForm;
    if (!name.trim() || !description.trim()) {
      showAlert(t('Erreur'), t('Le nom et la description sont requis.'));
      return;
    }
    const payload: any = { name: name.trim(), description: description.trim() };
    if (website.trim()) payload.website = website.trim();
    if (facebook.trim()) payload.facebook = facebook.trim();
    setSavingSite(true);
    try {
      if (editId) {
        await updateDoc(doc(db, 'officialSites', editId), payload);
      } else {
        await addDoc(collection(db, 'officialSites'), { ...payload, createdAt: serverTimestamp() });
      }
      closeSiteForm();
    } catch (e: any) {
      showAlert(t('Erreur'), e?.message || t("Impossible d'enregistrer."));
    } finally {
      setSavingSite(false);
    }
  };

  const deleteSite = (item: any) => {
    showAlert(t('Supprimer?'), `"${item.name}"${t(' sera supprimé définitivement.')}`, [
      { text: t('Annuler'), style: 'cancel' },
      {
        text: t('Supprimer'), style: 'destructive', onPress: async () => {
          setActionId(item.id);
          try {
            await deleteDoc(doc(db, 'officialSites', item.id));
          } catch {
            showAlert(t('Erreur'), t('Impossible de supprimer.'));
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  // ── Useful applications actions ─────────────────────────────────────────
  const openAddApp = () => setAppForm(emptyAppForm());
  const openEditApp = (item: any) => setAppForm({
    visible: true, editId: item.id,
    name: item.name || '', category: item.category || '', description: item.description || '',
    image: item.image || '', androidUrl: item.androidUrl || '', iosUrl: item.iosUrl || '', website: item.website || '',
    order: typeof item.order === 'number' ? String(item.order) : '',
  });
  const closeAppForm = () => setAppForm(prev => ({ ...prev, visible: false }));

  const saveApp = async () => {
    const { editId, name, category, description, image, androidUrl, iosUrl, website, order } = appForm;
    if (!name.trim() || !category.trim()) {
      showAlert(t('Erreur'), t('Le nom et la catégorie sont requis.'));
      return;
    }
    const payload: any = {
      name: name.trim(), category: category.trim(), description: description.trim(),
      order: parseInt(order) || 0,
    };
    if (image.trim()) payload.image = image.trim();
    if (androidUrl.trim()) payload.androidUrl = androidUrl.trim();
    if (iosUrl.trim()) payload.iosUrl = iosUrl.trim();
    if (website.trim()) payload.website = website.trim();
    setSavingApp(true);
    try {
      if (editId) {
        await updateDoc(doc(db, 'usefulApps', editId), payload);
      } else {
        await addDoc(collection(db, 'usefulApps'), { ...payload, createdAt: serverTimestamp() });
      }
      closeAppForm();
    } catch (e: any) {
      showAlert(t('Erreur'), e?.message || t("Impossible d'enregistrer."));
    } finally {
      setSavingApp(false);
    }
  };

  const deleteApp = (item: any) => {
    showAlert(t('Supprimer cette application?'), `"${item.name}"${t(' sera supprimée définitivement.')}`, [
      { text: t('Annuler'), style: 'cancel' },
      {
        text: t('Supprimer'), style: 'destructive', onPress: async () => {
          setActionId(item.id);
          try {
            await deleteDoc(doc(db, 'usefulApps', item.id));
          } catch {
            showAlert(t('Erreur'), t('Impossible de supprimer.'));
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  // ── Business actions ────────────────────────────────────────────────────
  const approveBusiness = (item: any) => {
    const dupes = approvedBiz
      .filter(b => b.id !== item.id && b.city === item.city)
      .map(b => ({ ...b, _exact: isSameIgnoringSpacesAndPunct(b.name, item.name), _score: diceSimilarity(b.name, item.name), _wordScore: wordOverlapScore(b.name, item.name) }))
      .filter(b => b._exact || b._score >= DUPE_THRESHOLD || b._wordScore >= WORD_OVERLAP_THRESHOLD);
    const dupeNote = dupes.length > 0
      ? `\n\n${t('Doublon avec :')} ${dupes.map(b => `"${b.name}"${b._exact ? t(' (identique)') : b._score >= DUPE_THRESHOLD ? t(' (très similaire)') : t(' (faute probable)')}`).join(', ')}`
      : '';
    showAlert(
      dupes.length > 0 ? t('Doublon détecté') : t('Approuver cette entreprise?'),
      `"${item.name}"${t(" apparaîtra dans l'annuaire.")}${dupeNote}`,
      [
        { text: t('Annuler'), style: 'cancel' },
        {
          text: t('Approuver'), onPress: async () => {
            setActionId(item.id);
            try {
              await updateDoc(doc(db, 'businesses', item.id), { status: 'approved' });
            } catch (e: any) {
              showAlert(t('Erreur'), e?.message || t("Impossible d'approuver."));
            } finally { setActionId(null); }
          },
        },
      ]
    );
  };

  const rejectBusiness = (item: any) => {
    showAlert(t('Rejeter cette entreprise?'), `"${item.name}"${t(' sera supprimée définitivement.')}`, [
      { text: t('Annuler'), style: 'cancel' },
      {
        text: t('Rejeter'), style: 'destructive', onPress: async () => {
          setActionId(item.id);
          try {
            await deleteDoc(doc(db, 'businesses', item.id));
          } catch (e: any) {
            showAlert(t('Erreur'), e?.message || t('Impossible de rejeter.'));
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  const revokeBusiness = (item: any) => {
    showAlert(t('Retirer de l\'annuaire?'), `"${item.name}"${t(' ne sera plus visible.')}`, [
      { text: t('Annuler'), style: 'cancel' },
      {
        text: t('Retirer'), style: 'destructive', onPress: async () => {
          setActionId(item.id);
          try {
            await updateDoc(doc(db, 'businesses', item.id), { status: 'pending' });
          } catch (e: any) {
            showAlert(t('Erreur'), e?.message || t('Impossible.'));
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  // ── Product actions ─────────────────────────────────────────────────────
  const approveProduct = (item: any) => {
    showAlert(t('Approuver ce produit?'), `"${item.name}"${t(' apparaîtra sur le marché.')}`, [
      { text: t('Annuler'), style: 'cancel' },
      {
        text: t('Approuver'), onPress: async () => {
          setActionId(item.id);
          try {
            await updateDoc(doc(db, 'products', item.id), { status: 'approved' });
          } catch (e: any) {
            showAlert(t('Erreur'), e?.message || t("Impossible d'approuver."));
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  const rejectProduct = (item: any) => {
    showAlert(t('Rejeter ce produit?'), `"${item.name}"${t(' sera supprimée définitivement.')}`, [
      { text: t('Annuler'), style: 'cancel' },
      {
        text: t('Rejeter'), style: 'destructive', onPress: async () => {
          setActionId(item.id);
          try {
            await deleteDoc(doc(db, 'products', item.id));
          } catch (e: any) {
            showAlert(t('Erreur'), e?.message || t('Impossible de rejeter.'));
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  const revokeProduct = (item: any) => {
    showAlert(t('Retirer du marché?'), `"${item.name}"${t(' ne sera plus visible.')}`, [
      { text: t('Annuler'), style: 'cancel' },
      {
        text: t('Retirer'), style: 'destructive', onPress: async () => {
          setActionId(item.id);
          try {
            await updateDoc(doc(db, 'products', item.id), { status: 'pending' });
          } catch (e: any) {
            showAlert(t('Erreur'), e?.message || t('Impossible.'));
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  const deleteProduct = (item: any) => {
    showAlert(t('Supprimer?'), `"${item.name}"${t(' sera supprimé définitivement.')}`, [
      { text: t('Annuler'), style: 'cancel' },
      {
        text: t('Supprimer'), style: 'destructive', onPress: async () => {
          setActionId(item.id);
          try {
            await deleteDoc(doc(db, 'products', item.id));
          } catch (e: any) {
            showAlert(t('Erreur'), e?.message || t('Impossible de supprimer.'));
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  // ── User actions ────────────────────────────────────────────────────────
  const approveUser = (item: any) => {
    showAlert(t('Approuver ce vendeur?'), `${item.name}${t(' pourra soumettre des entreprises.')}`, [
      { text: t('Annuler'), style: 'cancel' },
      {
        text: t('Approuver'), onPress: async () => {
          setActionId(item.id);
          try {
            await updateDoc(doc(db, 'users', item.id), { role: 'vendor' });
          } catch (e: any) {
            showAlert(t('Erreur'), e?.message || t("Impossible d'approuver."));
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  const rejectUser = (item: any) => {
    showAlert(t('Rejeter ce vendeur?'), `${t('Le compte de')} ${item.name}${t(' sera supprimé.')}`, [
      { text: t('Annuler'), style: 'cancel' },
      {
        text: t('Rejeter'), style: 'destructive', onPress: async () => {
          setActionId(item.id);
          try {
            await deleteDoc(doc(db, 'users', item.id));
          } catch (e: any) {
            showAlert(t('Erreur'), e?.message || t('Impossible de rejeter.'));
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  const revokeUser = (item: any) => {
    showAlert(t('Révoquer ce vendeur?'), `${item.name}${t(' repassera en "En attente".')}`, [
      { text: t('Annuler'), style: 'cancel' },
      {
        text: t('Révoquer'), style: 'destructive', onPress: async () => {
          setActionId(item.id);
          try {
            await updateDoc(doc(db, 'users', item.id), { role: 'pending' });
          } catch (e: any) {
            showAlert(t('Erreur'), e?.message || t('Impossible.'));
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  // ── RENDER CARDS ────────────────────────────────────────────────────────
  const renderPendingBusiness = ({ item }: { item: any }) => {
    const dupes = approvedBiz
      .filter(b => b.city === item.city)
      .map(b => ({ ...b, _exact: isSameIgnoringSpacesAndPunct(b.name, item.name), _score: diceSimilarity(b.name, item.name), _wordScore: wordOverlapScore(b.name, item.name) }))
      .filter(b => b._exact || b._score >= DUPE_THRESHOLD || b._wordScore >= WORD_OVERLAP_THRESHOLD);
    return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: dupes.length > 0 ? '#FFB300' : theme.border, borderWidth: dupes.length > 0 ? 2 : 1 }]}>
      {dupes.length > 0 && (
        <View style={styles.dupeBanner}>
          <MaterialIcons name="warning" size={14} color="#E65100" />
          <Text style={styles.dupeBannerText}>
            {dupes.some(b => b._exact) ? t('Nom quasi-identique') : t('Doublon possible')}{' — '}
            {dupes.map(b => `"${b.name}"${b._exact ? t(' (identique)') : b._score >= DUPE_THRESHOLD ? t(' (très similaire)') : t(' (faute probable)')}`).join(', ')}
          </Text>
        </View>
      )}
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: Colors.cta + '33' }]}>
          <Text style={styles.avatarText}>{(item.name || '?')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.category}</Text>
            <MaterialIcons name="place" size={12} color={theme.textSecondary} />
            <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.city}</Text>
          </View>
          <View style={styles.metaRow}>
            <MaterialIcons name="person" size={12} color={theme.textSecondary} />
            <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.ownerName}</Text>
          </View>
          <View style={styles.metaRow}>
            <MaterialIcons name="phone" size={12} color={theme.textSecondary} />
            <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.phone}</Text>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.cta + '22' }]}>
          <Text style={[styles.badgeText, { color: Colors.cta }]}>{t('En attente')}</Text>
        </View>
      </View>
      {item.description ? (
        <Text style={[styles.desc, { color: theme.textSecondary }]} numberOfLines={2}>{item.description}</Text>
      ) : null}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.rejectBtn]}
          onPress={() => rejectBusiness(item)}
          disabled={actionId === item.id}
        >
          {actionId === item.id
            ? <ActivityIndicator size="small" color="#D32F2F" />
            : <><MaterialIcons name="close" size={14} color="#D32F2F" /><Text style={styles.rejectText}>{t('Rejeter')}</Text></>
          }
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.approveBtn}
          onPress={() => approveBusiness(item)}
          disabled={actionId === item.id}
        >
          {actionId === item.id
            ? <ActivityIndicator size="small" color="#fff" />
            : <><MaterialIcons name="check" size={14} color="#fff" /><Text style={styles.approveText}>{t('Approuver')}</Text></>
          }
        </TouchableOpacity>
      </View>
    </View>
    );
  };

  const renderApprovedBusiness = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: Colors.primary + '33' }]}>
          <Text style={styles.avatarText}>{(item.name || '?')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.name, { color: theme.text, flex: 1 }]} numberOfLines={1}>{item.name}</Text>
            {item.verified && <MaterialIcons name="verified" size={16} color={Colors.primary} />}
            {item.pinned && <MaterialIcons name="push-pin" size={16} color={Colors.primary} />}
            {item.priority > 0 && (
              <View style={[styles.priorityBadge, { backgroundColor: Colors.cta + '22' }]}>
                <MaterialIcons name="star" size={11} color={Colors.cta} />
                <Text style={[styles.priorityText, { color: Colors.cta }]}>{item.priority}</Text>
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.category}</Text>
            <MaterialIcons name="place" size={12} color={theme.textSecondary} />
            <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.city}</Text>
          </View>
          <View style={styles.metaRow}>
            <MaterialIcons name="person" size={12} color={theme.textSecondary} />
            <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.ownerName}</Text>
          </View>
        </View>
        <View style={[styles.badge, { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '22' }]}>
          <MaterialIcons name="check-circle" size={12} color={Colors.primary} />
          <Text style={[styles.badgeText, { color: Colors.primary }]}>{t('Publié')}</Text>
        </View>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: item.verified ? '#4CAF50' : 'transparent', borderColor: '#4CAF50' }]}
          onPress={async () => {
            try {
              await updateDoc(doc(db, 'businesses', item.id), { verified: !item.verified });
              showAlert(t('Succès'), item.verified ? t('Badge vérifié retiré') : t('Entreprise vérifiée'));
            } catch {
              showAlert(t('Erreur'), t('Impossible de modifier'));
            }
          }}
        >
          <MaterialIcons name="check" size={18} color={item.verified ? '#fff' : '#4CAF50'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: item.pinned ? Colors.primary : 'transparent', borderColor: Colors.primary }]}
          onPress={async () => {
            try {
              await updateDoc(doc(db, 'businesses', item.id), { pinned: !item.pinned });
              showAlert(t('Succès'), item.pinned ? t('Épinglage retiré') : t('Entreprise épinglée'));
            } catch {
              showAlert(t('Erreur'), t('Impossible de modifier'));
            }
          }}
        >
          <MaterialIcons name="push-pin" size={16} color={item.pinned ? '#fff' : Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickActionBtn, { borderColor: Colors.cta }]}
          onPress={() => setPriorityModal({ visible: true, item, value: String(item.priority || 0), collection: 'businesses' })}
        >
          <MaterialIcons name="star" size={16} color={Colors.cta} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: item.relatedBusinessId ? '#1565C0' : 'transparent', borderColor: '#1565C0' }]}
          onPress={() => setRelatedPicker({ visible: true, item, search: '' })}
        >
          <MaterialIcons name="link" size={16} color={item.relatedBusinessId ? '#fff' : '#1565C0'} />
        </TouchableOpacity>
        {item.relatedBusinessId && (
          <TouchableOpacity
            style={[styles.quickActionBtn, { borderColor: theme.border }]}
            onPress={async () => {
              try {
                await updateDoc(doc(db, 'businesses', item.id), { relatedBusinessId: null });
              } catch {
                showAlert(t('Erreur'), t('Impossible de modifier'));
              }
            }}
          >
            <MaterialIcons name="close" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.editAdminBtn, { borderColor: Colors.cta, backgroundColor: Colors.cta + '22' }]}
          onPress={() => router.push(`/vendor/edit-business?id=${item.id}`)}
        >
          <MaterialIcons name="edit" size={14} color={Colors.cta} />
          <Text style={[styles.editAdminText, { color: Colors.cta }]}>{t('Modifier')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.revokeBtn, { borderColor: theme.border }]}
          onPress={() => revokeBusiness(item)}
          disabled={actionId === item.id}
        >
          {actionId === item.id
            ? <ActivityIndicator size="small" color={theme.textSecondary} />
            : <><MaterialIcons name="block" size={13} color={theme.textSecondary} /><Text style={[styles.revokeText, { color: theme.textSecondary }]}>{t('Retirer')}</Text></>
          }
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPendingProduct = ({ item }: { item: any }) => {
    const cat = PRODUCT_CATEGORIES.find(c => c.label === item.category);
    const cover = item.photos?.[0] || item.imageUrl;
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.cardTop}>
          {cover ? (
            <Image source={{ uri: cover }} style={[styles.avatar, { backgroundColor: theme.border }]} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: Colors.cta + '33' }]}>
              <MaterialIcons name={(cat?.icon as any) || 'sell'} size={20} color={Colors.cta} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
            <View style={styles.metaRow}>
              <Text style={[styles.meta, { color: theme.textSecondary }]}>{t(item.category)}</Text>
              <MaterialIcons name="place" size={12} color={theme.textSecondary} />
              <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.city}</Text>
            </View>
            <View style={styles.metaRow}>
              <MaterialIcons name="sell" size={12} color={theme.textSecondary} />
              <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.price?.toLocaleString('fr-FR')} FCFA{item.negotiable ? ` · ${t('Négociable')}` : ''}</Text>
            </View>
            <View style={styles.metaRow}>
              <MaterialIcons name="person" size={12} color={theme.textSecondary} />
              <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.ownerName}</Text>
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: Colors.cta + '22' }]}>
            <Text style={[styles.badgeText, { color: Colors.cta }]}>{t('En attente')}</Text>
          </View>
        </View>
        {item.description ? (
          <Text style={[styles.desc, { color: theme.textSecondary }]} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => rejectProduct(item)}
            disabled={actionId === item.id}
          >
            {actionId === item.id
              ? <ActivityIndicator size="small" color="#D32F2F" />
              : <><MaterialIcons name="close" size={14} color="#D32F2F" /><Text style={styles.rejectText}>{t('Rejeter')}</Text></>
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.approveBtn}
            onPress={() => approveProduct(item)}
            disabled={actionId === item.id}
          >
            {actionId === item.id
              ? <ActivityIndicator size="small" color="#fff" />
              : <><MaterialIcons name="check" size={14} color="#fff" /><Text style={styles.approveText}>{t('Approuver')}</Text></>
            }
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderApprovedProduct = ({ item }: { item: any }) => {
    const cat = PRODUCT_CATEGORIES.find(c => c.label === item.category);
    const cover = item.photos?.[0] || item.imageUrl;
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.cardTop}>
          {cover ? (
            <Image source={{ uri: cover }} style={[styles.avatar, { backgroundColor: theme.border }]} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: Colors.primary + '33' }]}>
              <MaterialIcons name={(cat?.icon as any) || 'sell'} size={20} color={Colors.primary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
            <View style={styles.metaRow}>
              <Text style={[styles.meta, { color: theme.textSecondary }]}>{t(item.category)}</Text>
              <MaterialIcons name="place" size={12} color={theme.textSecondary} />
              <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.city}</Text>
            </View>
            <View style={styles.metaRow}>
              <MaterialIcons name="sell" size={12} color={theme.textSecondary} />
              <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.price?.toLocaleString('fr-FR')} FCFA{item.negotiable ? ` · ${t('Négociable')}` : ''}</Text>
            </View>
            <View style={styles.metaRow}>
              <MaterialIcons name="person" size={12} color={theme.textSecondary} />
              <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.ownerName}</Text>
            </View>
          </View>
          <View style={[styles.badge, { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '22' }]}>
            <MaterialIcons name="check-circle" size={12} color={Colors.primary} />
            <Text style={[styles.badgeText, { color: Colors.primary }]}>{t('Publié')}</Text>
          </View>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.editAdminBtn, { borderColor: Colors.cta, backgroundColor: Colors.cta + '22' }]}
            onPress={() => router.push(`/vendor/edit-product?id=${item.id}`)}
          >
            <MaterialIcons name="edit" size={14} color={Colors.cta} />
            <Text style={[styles.editAdminText, { color: Colors.cta }]}>{t('Modifier')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.revokeBtn, { borderColor: theme.border }]}
            onPress={() => revokeProduct(item)}
            disabled={actionId === item.id}
          >
            {actionId === item.id
              ? <ActivityIndicator size="small" color={theme.textSecondary} />
              : <><MaterialIcons name="block" size={13} color={theme.textSecondary} /><Text style={[styles.revokeText, { color: theme.textSecondary }]}>{t('Retirer')}</Text></>
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => deleteProduct(item)}
            disabled={actionId === item.id}
          >
            {actionId === item.id
              ? <ActivityIndicator size="small" color="#D32F2F" />
              : <MaterialIcons name="delete-outline" size={16} color="#D32F2F" />
            }
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPendingUser = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: Colors.cta + '33' }]}>
          <Text style={styles.avatarText}>{(item.name || '?')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
          <View style={styles.metaRow}>
            <MaterialIcons name="email" size={12} color={theme.textSecondary} />
            <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.email}</Text>
          </View>
          {item.phone && (
            <View style={styles.metaRow}>
              <MaterialIcons name="phone" size={12} color={theme.textSecondary} />
              <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.phone}</Text>
            </View>
          )}
          {item.createdAt && (
            <View style={styles.metaRow}>
              <MaterialIcons name="event" size={12} color={theme.textSecondary} />
              <Text style={[styles.meta, { color: theme.textSecondary }]}>
                {(item.createdAt?.toDate?.() ?? new Date(item.createdAt)).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          )}
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.cta + '22' }]}>
          <Text style={[styles.badgeText, { color: Colors.cta }]}>{t('En attente')}</Text>
        </View>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={() => rejectUser(item)}
          disabled={actionId === item.id}
        >
          {actionId === item.id
            ? <ActivityIndicator size="small" color="#D32F2F" />
            : <><MaterialIcons name="close" size={14} color="#D32F2F" /><Text style={styles.rejectText}>{t('Rejeter')}</Text></>
          }
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.approveBtn}
          onPress={() => approveUser(item)}
          disabled={actionId === item.id}
        >
          {actionId === item.id
            ? <ActivityIndicator size="small" color="#fff" />
            : <><MaterialIcons name="check" size={14} color="#fff" /><Text style={styles.approveText}>{t('Approuver')}</Text></>
          }
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderApprovedUser = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: Colors.primary + '33' }]}>
          <Text style={styles.avatarText}>{(item.name || '?')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
          <View style={styles.metaRow}>
            <MaterialIcons name="email" size={12} color={theme.textSecondary} />
            <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.email}</Text>
          </View>
          {item.phone && (
            <View style={styles.metaRow}>
              <MaterialIcons name="phone" size={12} color={theme.textSecondary} />
              <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.phone}</Text>
            </View>
          )}
        </View>
        <View style={[styles.badge, { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '22' }]}>
          <MaterialIcons name="check-circle" size={12} color={Colors.primary} />
          <Text style={[styles.badgeText, { color: Colors.primary }]}>{t('Vendeur')}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.revokeBtn, { borderColor: theme.border }]}
        onPress={() => revokeUser(item)}
        disabled={actionId === item.id}
      >
        {actionId === item.id
          ? <ActivityIndicator size="small" color={theme.textSecondary} />
          : <><MaterialIcons name="block" size={13} color={theme.textSecondary} /><Text style={[styles.revokeText, { color: theme.textSecondary }]}>{t('Révoquer le vendeur')}</Text></>
        }
      </TouchableOpacity>
    </View>
  );

  const renderContentItem = (kind: ContentKind) => ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: Colors.primary + '33' }]}>
          <MaterialIcons name={kind === 'events' ? 'event' : 'photo-camera'} size={20} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.name, { color: theme.text, flex: 1 }]} numberOfLines={1}>{item.name}</Text>
            {item.priority > 0 && (
              <View style={[styles.priorityBadge, { backgroundColor: Colors.cta + '22' }]}>
                <MaterialIcons name="star" size={11} color={Colors.cta} />
                <Text style={[styles.priorityText, { color: Colors.cta }]}>{item.priority}</Text>
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.category}</Text>
            <MaterialIcons name="place" size={12} color={theme.textSecondary} />
            <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.location}</Text>
          </View>
          {kind === 'events' && item.date ? (
            <View style={styles.metaRow}>
              <MaterialIcons name="event" size={12} color={theme.textSecondary} />
              <Text style={[styles.meta, { color: theme.textSecondary }]}>
                {formatEventDateRange(item.date, item.endDate, language) || item.date}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      {item.description ? (
        <Text style={[styles.desc, { color: theme.textSecondary }]} numberOfLines={2}>{item.description}</Text>
      ) : null}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.quickActionBtn, { borderColor: Colors.cta }]}
          onPress={() => setPriorityModal({ visible: true, item, value: String(item.priority || 0), collection: CONTENT_COLLECTION[kind] })}
        >
          <MaterialIcons name="star" size={16} color={Colors.cta} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.editAdminBtn, { borderColor: Colors.cta, backgroundColor: Colors.cta + '22' }]}
          onPress={() => openEditContent(kind, item)}
        >
          <MaterialIcons name="edit" size={14} color={Colors.cta} />
          <Text style={[styles.editAdminText, { color: Colors.cta }]}>{t('Modifier')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={() => deleteContent(kind, item)}
          disabled={actionId === item.id}
        >
          {actionId === item.id
            ? <ActivityIndicator size="small" color="#D32F2F" />
            : <><MaterialIcons name="delete-outline" size={14} color="#D32F2F" /><Text style={styles.rejectText}>{t('Supprimer')}</Text></>
          }
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNumberItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: Colors.primary + '33' }]}>
          <MaterialIcons name="call" size={20} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{item.label}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.group}</Text>
            <MaterialIcons name="phone" size={12} color={theme.textSecondary} />
            <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.number}</Text>
          </View>
        </View>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.editAdminBtn, { borderColor: Colors.cta, backgroundColor: Colors.cta + '22' }]}
          onPress={() => openEditNumber(item)}
        >
          <MaterialIcons name="edit" size={14} color={Colors.cta} />
          <Text style={[styles.editAdminText, { color: Colors.cta }]}>{t('Modifier')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={() => deleteNumber(item)}
          disabled={actionId === item.id}
        >
          {actionId === item.id
            ? <ActivityIndicator size="small" color="#D32F2F" />
            : <><MaterialIcons name="delete-outline" size={14} color="#D32F2F" /><Text style={styles.rejectText}>{t('Supprimer')}</Text></>
          }
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSiteItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: Colors.primary + '33' }]}>
          <MaterialIcons name="account-balance" size={20} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
          {item.website ? (
            <View style={styles.metaRow}>
              <MaterialIcons name="language" size={12} color={theme.textSecondary} />
              <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>{item.website}</Text>
            </View>
          ) : null}
          {item.facebook ? (
            <View style={styles.metaRow}>
              <MaterialIcons name="facebook" size={12} color={theme.textSecondary} />
              <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>{item.facebook}</Text>
            </View>
          ) : null}
        </View>
      </View>
      {item.description ? (
        <Text style={[styles.desc, { color: theme.textSecondary }]} numberOfLines={2}>{item.description}</Text>
      ) : null}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.editAdminBtn, { borderColor: Colors.cta, backgroundColor: Colors.cta + '22' }]}
          onPress={() => openEditSite(item)}
        >
          <MaterialIcons name="edit" size={14} color={Colors.cta} />
          <Text style={[styles.editAdminText, { color: Colors.cta }]}>{t('Modifier')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={() => deleteSite(item)}
          disabled={actionId === item.id}
        >
          {actionId === item.id
            ? <ActivityIndicator size="small" color="#D32F2F" />
            : <><MaterialIcons name="delete-outline" size={14} color="#D32F2F" /><Text style={styles.rejectText}>{t('Supprimer')}</Text></>
          }
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAppItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: Colors.primary + '33', overflow: 'hidden' }]}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <Ionicons name="apps" size={20} color={Colors.primary} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
          <View style={styles.metaRow}>
            <MaterialIcons name="category" size={12} color={theme.textSecondary} />
            <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>{item.category}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
            {item.androidUrl ? <Ionicons name="logo-google-playstore" size={13} color={theme.textSecondary} /> : null}
            {item.iosUrl ? <Ionicons name="logo-apple-appstore" size={13} color={theme.textSecondary} /> : null}
          </View>
        </View>
      </View>
      {item.description ? (
        <Text style={[styles.desc, { color: theme.textSecondary }]} numberOfLines={2}>{item.description}</Text>
      ) : null}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.editAdminBtn, { borderColor: Colors.cta, backgroundColor: Colors.cta + '22' }]}
          onPress={() => openEditApp(item)}
        >
          <MaterialIcons name="edit" size={14} color={Colors.cta} />
          <Text style={[styles.editAdminText, { color: Colors.cta }]}>{t('Modifier')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={() => deleteApp(item)}
          disabled={actionId === item.id}
        >
          {actionId === item.id
            ? <ActivityIndicator size="small" color="#D32F2F" />
            : <><MaterialIcons name="delete-outline" size={14} color="#D32F2F" /><Text style={styles.rejectText}>{t('Supprimer')}</Text></>
          }
        </TouchableOpacity>
      </View>
    </View>
  );

  if (authLoading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />;
  if (!isAdmin) return null;

  const totalPending = pendingBiz.length + pendingUsers.length;

  return (
    <View style={styles.safe}>
      <LinearGradient
        colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
        style={{ flex: 1 }}
      >

      <AppHeader title="Admin Panel" />

      {/* STATS */}
      <LinearGradient
        colors={Colors.headerGradient}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{pendingBiz.length}</Text>
            <Text style={styles.statLbl} numberOfLines={2}>{t('Entreprises en attente')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{pendingProducts.length}</Text>
            <Text style={styles.statLbl} numberOfLines={2}>{t('Produits en attente')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{pendingUsers.length}</Text>
            <Text style={styles.statLbl} numberOfLines={2}>{t('Vendeurs en attente')}</Text>
          </View>
        </View>
      </LinearGradient>


      {/* MAIN TABS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.mainTabRow, { borderColor: theme.border }]}
        contentContainerStyle={styles.mainTabRowContent}
      >
        <TouchableOpacity
          style={[styles.mainTabBtn, tab === 'businesses' && { borderBottomColor: Colors.primary, borderBottomWidth: 2.5 }]}
          onPress={() => setTab('businesses')}
        >
          <View style={styles.tabInner}>
            <MaterialIcons name="storefront" size={16} color={tab === 'businesses' ? Colors.primary : theme.textSecondary} />
            <Text style={[styles.mainTabText, { color: tab === 'businesses' ? Colors.primary : theme.textSecondary }]}>
              {t('Entreprises')} {pendingBiz.length > 0 ? `(${pendingBiz.length})` : ''}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTabBtn, tab === 'products' && { borderBottomColor: Colors.cta, borderBottomWidth: 2.5 }]}
          onPress={() => setTab('products')}
        >
          <View style={styles.tabInner}>
            <MaterialIcons name="sell" size={16} color={tab === 'products' ? Colors.cta : theme.textSecondary} />
            <Text style={[styles.mainTabText, { color: tab === 'products' ? Colors.cta : theme.textSecondary }]}>
              {t('Produits')} {pendingProducts.length > 0 ? `(${pendingProducts.length})` : ''}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTabBtn, tab === 'users' && { borderBottomColor: Colors.cta, borderBottomWidth: 2.5 }]}
          onPress={() => setTab('users')}
        >
          <View style={styles.tabInner}>
            <MaterialIcons name="people" size={16} color={tab === 'users' ? Colors.cta : theme.textSecondary} />
            <Text style={[styles.mainTabText, { color: tab === 'users' ? Colors.cta : theme.textSecondary }]}>
              {t('Vendeurs')} {pendingUsers.length > 0 ? `(${pendingUsers.length})` : ''}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTabBtn, tab === 'reports' && { borderBottomColor: '#D32F2F', borderBottomWidth: 2.5 }]}
          onPress={() => setTab('reports')}
        >
          <View style={styles.tabInner}>
            <MaterialIcons name="flag" size={16} color={tab === 'reports' ? '#D32F2F' : theme.textSecondary} />
            <Text style={[styles.mainTabText, { color: tab === 'reports' ? '#D32F2F' : theme.textSecondary }]}>
              {t('Signalements')} {reports.length > 0 ? `(${reports.length})` : ''}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTabBtn, tab === 'events' && { borderBottomColor: '#8A6D1F', borderBottomWidth: 2.5 }]}
          onPress={() => setTab('events')}
        >
          <View style={styles.tabInner}>
            <MaterialIcons name="event" size={16} color={tab === 'events' ? '#8A6D1F' : theme.textSecondary} />
            <Text style={[styles.mainTabText, { color: tab === 'events' ? '#8A6D1F' : theme.textSecondary }]}>
              {t('Événements')} {events.length > 0 ? `(${events.length})` : ''}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTabBtn, tab === 'attractions' && { borderBottomColor: '#B3492F', borderBottomWidth: 2.5 }]}
          onPress={() => setTab('attractions')}
        >
          <View style={styles.tabInner}>
            <MaterialIcons name="photo-camera" size={16} color={tab === 'attractions' ? '#B3492F' : theme.textSecondary} />
            <Text style={[styles.mainTabText, { color: tab === 'attractions' ? '#B3492F' : theme.textSecondary }]}>
              {t('Sites touristiques')} {attractions.length > 0 ? `(${attractions.length})` : ''}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTabBtn, tab === 'numbers' && { borderBottomColor: '#1565C0', borderBottomWidth: 2.5 }]}
          onPress={() => setTab('numbers')}
        >
          <View style={styles.tabInner}>
            <MaterialIcons name="call" size={16} color={tab === 'numbers' ? '#1565C0' : theme.textSecondary} />
            <Text style={[styles.mainTabText, { color: tab === 'numbers' ? '#1565C0' : theme.textSecondary }]}>
              {t('Numéros')} {usefulNumbers.length > 0 ? `(${usefulNumbers.length})` : ''}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTabBtn, tab === 'sites' && { borderBottomColor: '#2E7D32', borderBottomWidth: 2.5 }]}
          onPress={() => setTab('sites')}
        >
          <View style={styles.tabInner}>
            <MaterialIcons name="account-balance" size={16} color={tab === 'sites' ? '#2E7D32' : theme.textSecondary} />
            <Text style={[styles.mainTabText, { color: tab === 'sites' ? '#2E7D32' : theme.textSecondary }]}>
              {t('Sites officiels')} {officialSites.length > 0 ? `(${officialSites.length})` : ''}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTabBtn, tab === 'applications' && { borderBottomColor: '#6A1B9A', borderBottomWidth: 2.5 }]}
          onPress={() => setTab('applications')}
        >
          <View style={styles.tabInner}>
            <MaterialIcons name="apps" size={16} color={tab === 'applications' ? '#6A1B9A' : theme.textSecondary} />
            <Text style={[styles.mainTabText, { color: tab === 'applications' ? '#6A1B9A' : theme.textSecondary }]}>
              {t('Applications')} {usefulApps.length > 0 ? `(${usefulApps.length})` : ''}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={[{ color: theme.textSecondary, marginTop: 8 }]}>{t('Chargement...')}</Text>
        </View>
      ) : null}

      {!loading && tab === 'businesses' && (
        <>
          {/* SEARCH BAR */}
          <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <MaterialIcons name="search" size={16} color={theme.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder={t('Rechercher une entreprise...')}
              placeholderTextColor={theme.textSecondary}
              value={bizSearch}
              onChangeText={setBizSearch}
              autoCorrect={false}
            />
            {bizSearch.length > 0 && (
              <TouchableOpacity onPress={() => setBizSearch('')}>
                <MaterialIcons name="close" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.subTabRow, { backgroundColor: theme.surface }]}>
            {(['pending', 'approved'] as const).map(st => (
              <TouchableOpacity key={st}
                style={[styles.subTabBtn, bizTab === st && { backgroundColor: Colors.primary }]}
                onPress={() => setBizTab(st)}>
                <Text style={[styles.subTabText, { color: bizTab === st ? '#fff' : theme.textSecondary }]}>
                  {st === 'pending' ? `${t('En attente')} (${pendingBiz.length})` : `${t('Publiées')} (${approvedBiz.length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
            data={(bizTab === 'pending' ? pendingBiz : approvedBiz).filter(b => {
              if (!bizSearch.trim()) return true;
              const s = bizSearch.toLowerCase();
              return b.name.toLowerCase().includes(s) || 
                     b.ownerName?.toLowerCase().includes(s) ||
                     b.city?.toLowerCase().includes(s);
            })}
            keyExtractor={item => item.id}
            renderItem={bizTab === 'pending' ? renderPendingBusiness : renderApprovedBusiness}
            style={{ flex: 1 }}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={Colors.primary} colors={[Colors.primary]} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialIcons name={bizSearch ? 'search-off' : bizTab === 'pending' ? 'celebration' : 'storefront'} size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>
                  {bizSearch ? t('Aucun résultat') : bizTab === 'pending' ? t('Aucune entreprise en attente') : t('Aucune entreprise publiée')}
                </Text>
              </View>
            }
          />
        </>
      )}

      {!loading && tab === 'products' && (
        <>
          {/* SEARCH BAR */}
          <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <MaterialIcons name="search" size={16} color={theme.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder={t('Rechercher un produit...')}
              placeholderTextColor={theme.textSecondary}
              value={productSearch}
              onChangeText={setProductSearch}
              autoCorrect={false}
            />
            {productSearch.length > 0 && (
              <TouchableOpacity onPress={() => setProductSearch('')}>
                <MaterialIcons name="close" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.subTabRow, { backgroundColor: theme.surface }]}>
            {(['pending', 'approved'] as const).map(st => (
              <TouchableOpacity key={st}
                style={[styles.subTabBtn, productTab === st && { backgroundColor: Colors.primary }]}
                onPress={() => setProductTab(st)}>
                <Text style={[styles.subTabText, { color: productTab === st ? '#fff' : theme.textSecondary }]}>
                  {st === 'pending' ? `${t('En attente')} (${pendingProducts.length})` : `${t('Publiées')} (${approvedProducts.length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
            data={(productTab === 'pending' ? pendingProducts : approvedProducts).filter(p => {
              if (!productSearch.trim()) return true;
              const s = productSearch.toLowerCase();
              return p.name?.toLowerCase().includes(s) ||
                     p.ownerName?.toLowerCase().includes(s) ||
                     p.city?.toLowerCase().includes(s);
            })}
            keyExtractor={item => item.id}
            renderItem={productTab === 'pending' ? renderPendingProduct : renderApprovedProduct}
            style={{ flex: 1 }}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={Colors.primary} colors={[Colors.primary]} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialIcons name={productSearch ? 'search-off' : productTab === 'pending' ? 'celebration' : 'sell'} size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>
                  {productSearch ? t('Aucun résultat') : productTab === 'pending' ? t('Aucun produit en attente') : t('Aucun produit publié')}
                </Text>
              </View>
            }
          />
        </>
      )}

      {!loading && tab === 'users' && (
        <>
          {/* SEARCH BAR */}
          <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <MaterialIcons name="search" size={16} color={theme.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder={t('Rechercher un vendeur...')}
              placeholderTextColor={theme.textSecondary}
              value={userSearch}
              onChangeText={setUserSearch}
              autoCorrect={false}
            />
            {userSearch.length > 0 && (
              <TouchableOpacity onPress={() => setUserSearch('')}>
                <MaterialIcons name="close" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.subTabRow, { backgroundColor: theme.surface }]}>
            {(['pending', 'approved'] as const).map(st => (
              <TouchableOpacity key={st}
                style={[styles.subTabBtn, userTab === st && { backgroundColor: Colors.primary }]}
                onPress={() => setUserTab(st)}>
                <Text style={[styles.subTabText, { color: userTab === st ? '#fff' : theme.textSecondary }]}>
                  {st === 'pending' ? `${t('En attente')} (${pendingUsers.length})` : `${t('Approuvés')} (${approvedUsers.length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
            data={(userTab === 'pending' ? pendingUsers : approvedUsers).filter(u => {
              if (!userSearch.trim()) return true;
              const s = userSearch.toLowerCase();
              return u.name?.toLowerCase().includes(s) || 
                     u.email?.toLowerCase().includes(s) ||
                     u.phone?.toLowerCase().includes(s);
            })}
            keyExtractor={item => item.id}
            renderItem={userTab === 'pending' ? renderPendingUser : renderApprovedUser}
            style={{ flex: 1 }}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={Colors.primary} colors={[Colors.primary]} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialIcons name={userSearch ? 'search-off' : userTab === 'pending' ? 'celebration' : 'people'} size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>
                  {userSearch ? t('Aucun résultat') : userTab === 'pending' ? t('Aucun vendeur en attente') : t('Aucun vendeur approuvé')}
                </Text>
              </View>
            }
          />
        </>
      )}

      {!loading && tab === 'reports' && (
        <FlatList
          data={reports}
          keyExtractor={item => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={Colors.primary} colors={[Colors.primary]} />}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: '#D32F2F33' }]}>
              <View style={styles.cardTop}>
                <MaterialIcons name="flag" size={26} color="#D32F2F" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: theme.text }]}>{item.businessName}</Text>
                  <Text style={[styles.meta, { color: theme.textSecondary }]}>{t('Motif:')} {item.reason}</Text>
                  <Text style={[styles.meta, { color: theme.textSecondary }]}>{t('Par:')} {item.reporterName}</Text>
                </View>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.rejectBtn}
                  onPress={() => showAlert(t('Ignorer?'), '', [
                    { text: t('Annuler'), style: 'cancel' },
                    { text: t('Ignorer'), onPress: async () => { try { await deleteDoc(doc(db, 'reports', item.id)); } catch {} } },
                  ])}>
                  <MaterialIcons name="close" size={14} color="#D32F2F" />
                  <Text style={styles.rejectText}>{t('Ignorer')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.approveBtn, { backgroundColor: '#D32F2F' }]}
                  onPress={() => showAlert(t("Retirer l'annonce?"), `"${item.businessName}"${t(' sera remise en attente.')}`, [
                    { text: t('Annuler'), style: 'cancel' },
                    { text: t('Retirer'), style: 'destructive', onPress: async () => {
                      try {
                        await updateDoc(doc(db, 'businesses', item.businessId), { status: 'pending' });
                        await deleteDoc(doc(db, 'reports', item.id));
                      } catch {}
                    }},
                  ])}>
                  <MaterialIcons name="block" size={14} color="#fff" />
                  <Text style={styles.approveText}>{t('Retirer')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="check-circle" size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.text }]}>{t('Aucun signalement en attente')}</Text>
            </View>
          }
        />
      )}

      {!loading && tab === 'events' && (
        <>
          <TouchableOpacity style={styles.addContentBtn} onPress={() => openAddContent('events')} activeOpacity={0.85}>
            <MaterialIcons name="add" size={18} color="#1A1A1A" />
            <Text style={styles.addContentBtnText}>{t('Ajouter un événement')}</Text>
          </TouchableOpacity>
          <FlatList
            data={events}
            keyExtractor={item => item.id}
            renderItem={renderContentItem('events')}
            style={{ flex: 1 }}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={Colors.primary} colors={[Colors.primary]} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialIcons name="event-busy" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>{t('Aucun événement')}</Text>
              </View>
            }
          />
        </>
      )}

      {!loading && tab === 'attractions' && (
        <>
          <TouchableOpacity style={styles.addContentBtn} onPress={() => openAddContent('attractions')} activeOpacity={0.85}>
            <MaterialIcons name="add" size={18} color="#1A1A1A" />
            <Text style={styles.addContentBtnText}>{t('Ajouter un site touristique')}</Text>
          </TouchableOpacity>
          <FlatList
            data={attractions}
            keyExtractor={item => item.id}
            renderItem={renderContentItem('attractions')}
            style={{ flex: 1 }}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={Colors.primary} colors={[Colors.primary]} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialIcons name="photo-camera" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>{t('Aucun site touristique')}</Text>
              </View>
            }
          />
        </>
      )}

      {!loading && tab === 'numbers' && (
        <>
          <TouchableOpacity style={styles.addContentBtn} onPress={openAddNumber} activeOpacity={0.85}>
            <MaterialIcons name="add" size={18} color="#1A1A1A" />
            <Text style={styles.addContentBtnText}>{t('Ajouter un numéro')}</Text>
          </TouchableOpacity>
          <FlatList
            data={usefulNumbers}
            keyExtractor={item => item.id}
            renderItem={renderNumberItem}
            style={{ flex: 1 }}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={Colors.primary} colors={[Colors.primary]} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialIcons name="call" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>{t('Aucun numéro')}</Text>
              </View>
            }
          />
        </>
      )}

      {!loading && tab === 'sites' && (
        <>
          <TouchableOpacity style={styles.addContentBtn} onPress={openAddSite} activeOpacity={0.85}>
            <MaterialIcons name="add" size={18} color="#1A1A1A" />
            <Text style={styles.addContentBtnText}>{t('Ajouter un site officiel')}</Text>
          </TouchableOpacity>
          <FlatList
            data={officialSites}
            keyExtractor={item => item.id}
            renderItem={renderSiteItem}
            style={{ flex: 1 }}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={Colors.primary} colors={[Colors.primary]} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialIcons name="account-balance" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>{t('Aucun site officiel')}</Text>
              </View>
            }
          />
        </>
      )}

      {!loading && tab === 'applications' && (
        <>
          <TouchableOpacity style={styles.addContentBtn} onPress={openAddApp} activeOpacity={0.85}>
            <MaterialIcons name="add" size={18} color="#1A1A1A" />
            <Text style={styles.addContentBtnText}>{t('Ajouter une application')}</Text>
          </TouchableOpacity>
          <FlatList
            data={usefulApps}
            keyExtractor={item => item.id}
            renderItem={renderAppItem}
            style={{ flex: 1 }}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={Colors.primary} colors={[Colors.primary]} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialIcons name="apps" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>{t('Aucune application')}</Text>
              </View>
            }
          />
        </>
      )}

      {/* ALERT MODAL — web-safe replacement for Alert.alert(), used everywhere in this file */}
      <Modal
        visible={adminAlert.visible}
        transparent
        animationType="fade"
        onRequestClose={closeAdminAlert}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text, marginBottom: adminAlert.message ? 0 : 20 }]}>{adminAlert.title}</Text>
            {!!adminAlert.message && (
              <Text style={[styles.modalSub, { color: theme.textSecondary }]}>{adminAlert.message}</Text>
            )}
            <View style={styles.modalBtns}>
              {adminAlert.buttons.map((btn, i) => {
                const isCancel = btn.style === 'cancel';
                const isDestructive = btn.style === 'destructive';
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.modalBtn,
                      isCancel
                        ? { borderColor: theme.border }
                        : { backgroundColor: isDestructive ? '#D32F2F' : Colors.primary, borderColor: isDestructive ? '#D32F2F' : Colors.primary },
                    ]}
                    onPress={() => { closeAdminAlert(); btn.onPress?.(); }}
                  >
                    <Text style={[styles.modalBtnText, { color: isCancel ? theme.textSecondary : '#fff' }]}>{btn.text}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* PRIORITY MODAL */}
      <Modal
        visible={priorityModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setPriorityModal({ visible: false, item: null, value: '', collection: priorityModal.collection })}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
            <View style={styles.modalTitleRow}>
              <MaterialIcons name="star" size={18} color={Colors.cta} />
              <Text style={[styles.modalTitle, { color: theme.text }]}>{t('Priorité')}</Text>
            </View>
            <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
              {t('Entrez un nombre entre 0 et 100')}{'\n'}{t('(Plus élevé = apparaît en premier)')}
            </Text>
            <TextInput
              style={[styles.modalInput, { borderColor: '#9CA3AF', color: theme.text, backgroundColor: '#fff' }]}
              value={priorityModal.value}
              onChangeText={v => setPriorityModal(prev => ({ ...prev, value: v }))}
              keyboardType="number-pad"
              maxLength={3}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: theme.border }]}
                onPress={() => setPriorityModal({ visible: false, item: null, value: '', collection: priorityModal.collection })}
              >
                <Text style={[styles.modalBtnText, { color: theme.textSecondary }]}>{t('Annuler')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colors.cta, borderColor: Colors.cta }]}
                onPress={async () => {
                  const num = parseInt(priorityModal.value || '0');
                  if (isNaN(num) || num < 0 || num > 100) {
                    showAlert(t('Erreur'), t('Entrez un nombre entre 0 et 100'));
                    return;
                  }
                  try {
                    await updateDoc(doc(db, priorityModal.collection, priorityModal.item.id), { priority: num });
                    setPriorityModal({ visible: false, item: null, value: '', collection: priorityModal.collection });
                    showAlert(t('Succès'), `${t('Priorité mise à')} ${num}`);
                  } catch {
                    showAlert(t('Erreur'), t('Impossible de modifier'));
                  }
                }}
              >
                <Text style={[styles.modalBtnText, { color: '#1A1A1A', fontWeight: '400' }]}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* RELATED BUSINESS PICKER */}
      <Modal
        visible={relatedPicker.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setRelatedPicker({ visible: false, item: null, search: '' })}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card, maxHeight: '75%' }]}>
            <View style={styles.modalTitleRow}>
              <MaterialIcons name="link" size={18} color="#1565C0" />
              <Text style={[styles.modalTitle, { color: theme.text }]}>{t('Entreprise liée')}</Text>
            </View>
            <Text style={[styles.modalSub, { color: theme.textSecondary }]} numberOfLines={2}>
              {t('Choisissez une entreprise à afficher dans "Voir aussi" sur')} {relatedPicker.item?.name}
            </Text>
            <TextInput
              style={[styles.fieldInput, { borderColor: theme.border, color: theme.text, marginBottom: 10 }]}
              value={relatedPicker.search}
              onChangeText={v => setRelatedPicker(prev => ({ ...prev, search: v }))}
              placeholder={t('Rechercher une entreprise...')}
              placeholderTextColor={theme.textSecondary}
              autoFocus
            />
            <ScrollView showsVerticalScrollIndicator={false}>
              {(() => {
                const results = approvedBiz
                  .filter(b => b.id !== relatedPicker.item?.id)
                  .filter(b => !relatedPicker.search.trim() || (b.name || '').toLowerCase().includes(relatedPicker.search.trim().toLowerCase()));
                if (results.length === 0) {
                  return <Text style={[styles.modalSub, { color: theme.textSecondary, marginTop: 8 }]}>{t('Aucun résultat')}</Text>;
                }
                return results.map(b => (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.relatedRow, { borderColor: theme.border }]}
                    onPress={async () => {
                      try {
                        await updateDoc(doc(db, 'businesses', relatedPicker.item.id), { relatedBusinessId: b.id });
                        setRelatedPicker({ visible: false, item: null, search: '' });
                      } catch {
                        showAlert(t('Erreur'), t('Impossible de modifier'));
                      }
                    }}
                  >
                    <Text style={[styles.relatedRowText, { color: theme.text }]} numberOfLines={1}>{b.name}</Text>
                    <Text style={[styles.meta, { color: theme.textSecondary }]}>{b.city}</Text>
                  </TouchableOpacity>
                ));
              })()}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalBtn, { borderColor: theme.border, marginTop: 12 }]}
              onPress={() => setRelatedPicker({ visible: false, item: null, search: '' })}
            >
              <Text style={[styles.modalBtnText, { color: theme.textSecondary }]}>{t('Annuler')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ADD/EDIT EVENT OR ATTRACTION MODAL */}
      <EditContentModal
        visible={contentModal.visible}
        kind={contentModal.kind}
        item={contentModal.item}
        onClose={closeContentModal}
        theme={theme}
        showAlert={(title, message) => showAlert(title, message)}
      />

      {/* ADD/EDIT USEFUL NUMBER MODAL */}
      <Modal
        visible={numberForm.visible}
        transparent
        animationType="fade"
        onRequestClose={closeNumberForm}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
            <View style={styles.modalTitleRow}>
              <MaterialIcons name="call" size={18} color="#1565C0" />
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {numberForm.editId ? t('Modifier') : t('Ajouter')} {t('un numéro utile')}
              </Text>
            </View>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Groupe *')}</Text>
            <TextInput
              style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
              value={numberForm.group}
              onChangeText={v => setNumberForm(prev => ({ ...prev, group: v }))}
              placeholder={t('Ex : Urgences, Hôpitaux et cliniques...')}
              placeholderTextColor={theme.textSecondary}
            />
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Libellé *')}</Text>
            <TextInput
              style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
              value={numberForm.label}
              onChangeText={v => setNumberForm(prev => ({ ...prev, label: v }))}
              placeholder={t('Ex : Police Secours')}
              placeholderTextColor={theme.textSecondary}
            />
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Numéro *')}</Text>
            <TextInput
              style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
              value={numberForm.number}
              onChangeText={v => setNumberForm(prev => ({ ...prev, number: v }))}
              placeholder={t('Ex : 17')}
              placeholderTextColor={theme.textSecondary}
              keyboardType="phone-pad"
            />
            <View style={[styles.modalBtns, { marginTop: 16 }]}>
              <TouchableOpacity style={[styles.modalBtn, { borderColor: theme.border }]} onPress={closeNumberForm}>
                <Text style={[styles.modalBtnText, { color: theme.textSecondary }]}>{t('Annuler')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                onPress={saveNumber}
                disabled={savingNumber}
              >
                {savingNumber
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={[styles.modalBtnText, { color: '#fff' }]}>{t('Enregistrer')}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ADD/EDIT OFFICIAL SITE MODAL */}
      <Modal
        visible={siteForm.visible}
        transparent
        animationType="fade"
        onRequestClose={closeSiteForm}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card, maxHeight: '85%' }]}>
            <View style={styles.modalTitleRow}>
              <MaterialIcons name="account-balance" size={18} color="#2E7D32" />
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {siteForm.editId ? t('Modifier') : t('Ajouter')} {t('un site officiel')}
              </Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Nom *')}</Text>
              <TextInput
                style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
                value={siteForm.name}
                onChangeText={v => setSiteForm(prev => ({ ...prev, name: v }))}
                placeholder={t('Nom')}
                placeholderTextColor={theme.textSecondary}
              />
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Description')} *</Text>
              <TextInput
                style={[styles.fieldInput, { borderColor: theme.border, color: theme.text, minHeight: 70, textAlignVertical: 'top' }]}
                value={siteForm.description}
                onChangeText={v => setSiteForm(prev => ({ ...prev, description: v }))}
                placeholder={t('Ce que fait cette organisation...')}
                placeholderTextColor={theme.textSecondary}
                multiline
              />
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Site web')}</Text>
              <TextInput
                style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
                value={siteForm.website}
                onChangeText={v => setSiteForm(prev => ({ ...prev, website: v }))}
                placeholder={t('Optionnel — https://www.exemple.gov.bf')}
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
              />
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Page Facebook')}</Text>
              <TextInput
                style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
                value={siteForm.facebook}
                onChangeText={v => setSiteForm(prev => ({ ...prev, facebook: v }))}
                placeholder={t('Optionnel — https://facebook.com/...')}
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
              />
              <View style={[styles.modalBtns, { marginTop: 16, marginBottom: 4 }]}>
                <TouchableOpacity style={[styles.modalBtn, { borderColor: theme.border }]} onPress={closeSiteForm}>
                  <Text style={[styles.modalBtnText, { color: theme.textSecondary }]}>{t('Annuler')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                  onPress={saveSite}
                  disabled={savingSite}
                >
                  {savingSite
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={[styles.modalBtnText, { color: '#fff' }]}>{t('Enregistrer')}</Text>
                  }
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ADD/EDIT USEFUL APPLICATION MODAL */}
      <Modal
        visible={appForm.visible}
        transparent
        animationType="fade"
        onRequestClose={closeAppForm}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[styles.modalOverlay, { padding: 16 }]}>
          <View style={[styles.modalBox, { backgroundColor: theme.card, maxHeight: '85%', maxWidth: 640 }]}>
            <View style={styles.modalTitleRow}>
              <Ionicons name="apps" size={18} color={Colors.primary} />
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {appForm.editId ? t('Modifier') : t('Ajouter')} {t('une application')}
              </Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Nom *')}</Text>
              <TextInput
                style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
                value={appForm.name}
                onChangeText={v => setAppForm(prev => ({ ...prev, name: v }))}
                placeholder={t('Ex : Orange Money, Wave, Yango...')}
                placeholderTextColor={theme.textSecondary}
              />
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Catégorie *')}</Text>
              <TextInput
                style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
                value={appForm.category}
                onChangeText={v => setAppForm(prev => ({ ...prev, category: v }))}
                placeholder={t('Ex : Paiement mobile, Transport, Services publics...')}
                placeholderTextColor={theme.textSecondary}
              />
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t("Icône / logo (URL)")}</Text>
              <TextInput
                style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
                value={appForm.image}
                onChangeText={v => setAppForm(prev => ({ ...prev, image: v }))}
                placeholder="https://..."
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
              />
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Lien Google Play')}</Text>
              <TextInput
                style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
                value={appForm.androidUrl}
                onChangeText={v => setAppForm(prev => ({ ...prev, androidUrl: v }))}
                placeholder={t('Optionnel — https://play.google.com/...')}
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                keyboardType="url"
              />
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Lien App Store')}</Text>
              <TextInput
                style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
                value={appForm.iosUrl}
                onChangeText={v => setAppForm(prev => ({ ...prev, iosUrl: v }))}
                placeholder={t('Optionnel — https://apps.apple.com/...')}
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                keyboardType="url"
              />
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Site web')}</Text>
              <TextInput
                style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
                value={appForm.website}
                onChangeText={v => setAppForm(prev => ({ ...prev, website: v }))}
                placeholder={t('Optionnel — https://...')}
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                keyboardType="url"
              />
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Ordre (optionnel)')}</Text>
              <TextInput
                style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
                value={appForm.order}
                onChangeText={v => setAppForm(prev => ({ ...prev, order: v.replace(/[^0-9]/g, '') }))}
                placeholder={t('Plus petit = apparaît en premier')}
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
              />
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('Description')}</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputMultiline, { borderColor: theme.border, color: theme.text }]}
                value={appForm.description}
                onChangeText={v => setAppForm(prev => ({ ...prev, description: v }))}
                placeholder={t('Description')}
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={4}
              />
              <View style={[styles.modalBtns, { marginTop: 16, marginBottom: 4 }]}>
                <TouchableOpacity style={[styles.modalBtn, { borderColor: theme.border }]} onPress={closeAppForm}>
                  <Text style={[styles.modalBtnText, { color: theme.textSecondary }]}>{t('Annuler')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                  onPress={saveApp}
                  disabled={savingApp}
                >
                  {savingApp
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={[styles.modalBtnText, { color: '#fff' }]}>{t('Enregistrer')}</Text>
                  }
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalBox: { width: '100%', borderRadius: 10, padding: 24, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  modalTitle: { fontSize: 18, fontWeight: '400' },
  modalSub: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
  modalInput: { borderWidth: 2, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 12, fontSize: 22, fontWeight: '400', textAlign: 'center', marginBottom: 20 },
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
  hotelRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 },
  addHotelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 6, paddingVertical: 10, marginTop: 8,
  },
  addHotelBtnText: { fontSize: 13, fontWeight: '400' },
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: '400', color: '#fff' },
  headerSub: { fontSize: 12, color: '#A5D6A7', marginTop: 1 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  statItem: { flex: 1, alignItems: 'center', minWidth: 0, paddingHorizontal: 4 },
  statNum: { fontSize: 24, fontWeight: '400', color: '#fff' },
  statLbl: { fontSize: 10, color: '#A5D6A7', marginTop: 1, textAlign: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.3)', flexShrink: 0 },
  quickLinksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  quickLinkBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  quickLinkText: { fontSize: 12, fontWeight: '400', textDecorationLine: 'underline' },
  mainTabRow: { borderBottomWidth: 1, flexGrow: 0, flexShrink: 0 },
  mainTabRowContent: { flexDirection: 'row', alignItems: 'flex-start' },
  mainTabBtn: { alignItems: 'center', paddingTop: 13, paddingBottom: 6, paddingHorizontal: 16 },
  mainTabText: { fontSize: 14, fontWeight: '400' },
  tabInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, flexWrap: 'wrap' },
  addContentBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: Colors.cta, marginHorizontal: 16, marginTop: 12, paddingVertical: 13, borderRadius: 7 },
  addContentBtnText: { fontSize: 15, fontWeight: '400', color: '#1A1A1A' },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginTop: 12, marginBottom: 8, borderRadius: 6, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10 },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 2 },
  subTabRow: { flexDirection: 'row', margin: 12, borderRadius: 6, padding: 4, gap: 4 },
  subTabBtn: { flex: 1, paddingVertical: 8, borderRadius: 4, alignItems: 'center' },
  subTabText: { fontSize: 13, fontWeight: '400' },
  listContent: { padding: 16 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 8, borderWidth: 1, padding: 14, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  dupeBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#FFF3E0', borderRadius: 5, padding: 8, marginBottom: 10 },
  dupeBannerText: { flex: 1, fontSize: 12, color: '#BF360C', fontWeight: '400', lineHeight: 17 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 18, fontWeight: '400' },
  name: { fontSize: 15, fontWeight: '400' },
  meta: { fontSize: 12, marginTop: 2 },
  desc: { fontSize: 12, lineHeight: 17, marginBottom: 10 },
  badge: { borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '400' },
  actionRow: { flexDirection: 'row', gap: 10 },
  editAdminBtn: { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 10, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  editAdminText: { fontWeight: '400', fontSize: 14 },
  rejectBtn: { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 10, borderRadius: 6, borderWidth: 1.5, borderColor: '#D32F2F', alignItems: 'center', justifyContent: 'center' },
  rejectText: { color: '#D32F2F', fontWeight: '400', fontSize: 14 },
  approveBtn: { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 10, borderRadius: 6, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  approveText: { color: '#fff', fontWeight: '400', fontSize: 14 },
  revokeBtn: { flexDirection: 'row', gap: 6, paddingVertical: 10, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  revokeText: { fontWeight: '400', fontSize: 13 },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  priorityText: { fontSize: 10, fontWeight: '400' },
  quickActionBtn: { width: 40, height: 40, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  relatedRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    paddingVertical: 12, borderBottomWidth: 1,
  },
  relatedRowText: { flex: 1, fontSize: 14, fontWeight: '400' },
  empty: { alignItems: 'center', paddingTop: 28, gap: 10 },
  emptyText: { fontSize: 16, fontWeight: '400' },
});
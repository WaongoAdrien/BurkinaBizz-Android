// app/settings.tsx — Settings & Support Screen

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal,
  StyleSheet, Linking, Alert, StatusBar,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../lib/AuthContext';
import { Colors } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';
import { TabBar } from '../components/TabBar';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, userProfile, signOut, isAdmin, deleteAccount } = useAuth();
  const { theme } = useColorTheme();
  
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/');
        },
      },
    ]);
  };

  const handleContactSupport = () => {
    const message = encodeURIComponent('Bonjour, j\'ai besoin d\'aide avec BurkinaBizz');
    Linking.openURL(`https://wa.me/6464786515?text=${message}`);
  };

  const handleBecomePartner = () => {
    const message = encodeURIComponent('Bonjour, je souhaite devenir partenaire de BurkinaBizz');
    Linking.openURL(`https://wa.me/6464786515?text=${message}`);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Votre compte et toutes vos données seront définitivement supprimés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer définitivement',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              router.replace('/');
            } catch (e: any) {
              if (e.code === 'auth/requires-recent-login') {
                Alert.alert(
                  'Reconnexion requise',
                  'Pour des raisons de sécurité, veuillez vous déconnecter et vous reconnecter avant de supprimer votre compte.'
                );
              } else {
                Alert.alert('Erreur', 'Impossible de supprimer le compte. Réessayez.');
              }
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <Stack.Screen options={{ title: 'Paramètres ⚙️', headerBackVisible: false }} />
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* USER INFO — logged in */}
        {user && (
          <LinearGradient
            colors={['#5C6BC0', '#283593']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.userCard}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(userProfile?.name || user.email || 'U')[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{userProfile?.name || 'Utilisateur'}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              {userProfile?.phone && (
                <Text style={styles.userPhone}>📞 {userProfile.phone}</Text>
              )}
            </View>
            {isAdmin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>🛡️ Admin</Text>
              </View>
            )}
          </LinearGradient>
        )}

        {/* GUEST HERO CARD — not logged in */}
        {!user && (
          <View style={styles.guestCard}>
            {/* Top branding */}
            <View style={styles.guestBrandRow}>
              <Text style={styles.guestFlag}>🇧🇫</Text>
              <View>
                <Text style={styles.guestAppName}>BurkinaBizz</Text>
                <Text style={styles.guestTagline}>L'annuaire des entreprises viables</Text>
              </View>
            </View>

            {/* Benefits */}
            <View style={styles.guestBenefits}>
              {[
                { icon: 'favorite',   text: 'Sauvegardez vos entreprises favorites' },
                { icon: 'storefront', text: 'Référencez votre entreprise gratuitement' },
                //{ icon: 'notifications', text: 'Suivez vos activités en temps réel' },
              ].map(b => (
                <View key={b.icon} style={styles.guestBenefitRow}>
                  <View style={styles.guestBenefitIcon}>
                    <MaterialIcons name={b.icon as any} size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.guestBenefitText}>{b.text}</Text>
                </View>
              ))}
            </View>

            {/* CTAs */}
            <TouchableOpacity
              style={styles.guestSignupBtn}
              onPress={() => router.push('/auth')}
              activeOpacity={0.85}
            >
              <MaterialIcons name="person-add" size={20} color="#1A1A1A" />
              <Text style={styles.guestSignupText}>Créer un compte gratuit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestLoginBtn}
              onPress={() => router.push('/auth')}
              activeOpacity={0.85}
            >
              <MaterialIcons name="login" size={20} color={Colors.primary} />
              <Text style={styles.guestLoginText}>J'ai déjà un compte</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ADMIN PANEL */}
        {isAdmin && (
          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/admin')}
            >
              <MaterialIcons name="admin-panel-settings" size={24} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuTitle, { color: theme.text }]}>Panel Admin</Text>
                <Text style={[styles.menuSub, { color: theme.textSecondary }]}>
                  Gérer les entreprises et utilisateurs
                </Text>
              </View>
              <Text style={{ color: theme.textSecondary }}>→</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SUPPORT & INFO */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleBecomePartner}
          >
            <MaterialIcons name="handshake" size={24} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>Devenir partenaire</Text>
              <Text style={[styles.menuSub, { color: theme.textSecondary }]}>
                Rejoignez notre réseau de partenaires
              </Text>
            </View>
            <Text style={{ color: theme.textSecondary }}>→</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowAbout(true)}
          >
            <MaterialIcons name="info" size={24} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>À propos</Text>
              <Text style={[styles.menuSub, { color: theme.textSecondary }]}>
                Découvrez BurkinaBizz
              </Text>
            </View>
            <Text style={{ color: theme.textSecondary }}>→</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Linking.openURL('https://www.facebook.com/waongoadrien')}
          >
            <MaterialIcons name="facebook" size={24} color="#1877F2" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>Facebook</Text>
              <Text style={[styles.menuSub, { color: theme.textSecondary }]}>
                Suivez-nous sur Facebook
              </Text>
            </View>
            <Text style={{ color: theme.textSecondary }}>→</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Linking.openURL('https://www.instagram.com/waongoadrien')}
          >
            <MaterialIcons name="photo-camera" size={24} color="#E4405F" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>Instagram</Text>
              <Text style={[styles.menuSub, { color: theme.textSecondary }]}>
                Suivez-nous sur Instagram
              </Text>
            </View>
            <Text style={{ color: theme.textSecondary }}>→</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowPrivacy(true)}
          >
            <MaterialIcons name="lock" size={24} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>
                Politique de confidentialité
              </Text>
            </View>
            <Text style={{ color: theme.textSecondary }}>→</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowTerms(true)}
          >
            <MaterialIcons name="description" size={24} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>
                Conditions d'utilisation
              </Text>
            </View>
            <Text style={{ color: theme.textSecondary }}>→</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleContactSupport}
          >
            <MaterialIcons name="support-agent" size={24} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>Support</Text>
              <Text style={[styles.menuSub, { color: theme.textSecondary }]}>
                Contactez-nous sur WhatsApp
              </Text>
            </View>
            <Text style={{ color: theme.textSecondary }}>→</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.menuItem}>
            <MaterialIcons name="phone-iphone" size={24} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>Version</Text>
              <Text style={[styles.menuSub, { color: theme.textSecondary }]}>
                BurkinaBizz v1.0.0
              </Text>
            </View>
          </View>
        </View>



        {/* LOGOUT + DELETE */}
        {user && (
          <>
            <TouchableOpacity
              style={[styles.logoutBtn, { borderColor: '#D32F2F' }]}
              onPress={handleSignOut}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="logout" size={18} color="#D32F2F" />
                <Text style={styles.logoutText}>Déconnexion</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDeleteAccount}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="delete-forever" size={18} color="#fff" />
                <Text style={styles.deleteText}>Supprimer mon compte</Text>
              </View>
              <Text style={styles.deleteWarning}>Action irréversible — toutes vos données seront perdues</Text>
            </TouchableOpacity>
          </>
        )}

        

      </ScrollView>

      {/* PRIVACY POLICY MODAL */}
      <Modal
        visible={showPrivacy}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPrivacy(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
          <View style={[styles.modalHeader, { backgroundColor: Colors.primary }]}>
            <Text style={styles.modalTitle}>Politique de confidentialité</Text>
            <TouchableOpacity onPress={() => setShowPrivacy(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={[styles.policyText, { color: theme.text }]}>
              <Text style={{ fontWeight: '700' }}>BurkinaBizz</Text> respecte votre vie privée.
              {'\n\n'}
              <Text style={{ fontWeight: '700' }}>Données collectées:</Text>
              {'\n'}• Nom, email, numéro de téléphone (lors de l'inscription)
              {'\n'}• Informations des entreprises que vous référencez
              {'\n'}• Vos entreprises favorites
              {'\n\n'}
              <Text style={{ fontWeight: '700' }}>Utilisation:</Text>
              {'\n'}• Gestion de votre compte
              {'\n'}• Publication de votre entreprise dans l'annuaire
              {'\n'}• Communication avec vous
              {'\n\n'}
              <Text style={{ fontWeight: '700' }}>Partage:</Text>
              {'\n'}• Vos informations ne sont jamais vendues
              {'\n'}• Les informations publiques des entreprises sont visibles par tous
              {'\n\n'}
              Pour toute question, contactez-nous sur WhatsApp.
            </Text>
          </ScrollView>
        </View>
      </Modal>

      {/* ABOUT MODAL */}
      <Modal
        visible={showAbout}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAbout(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
          <View style={[styles.modalHeader, { backgroundColor: Colors.primary }]}>
            <Text style={styles.modalTitle}>À propos de BurkinaBizz</Text>
            <TouchableOpacity onPress={() => setShowAbout(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* App title */}
            <Text style={[styles.aboutTitle, { color: Colors.primary }]}>BurkinaBizz</Text>
            <Text style={[styles.aboutTagline, { color: theme.textSecondary }]}>
              L'annuaire de référence des entreprises au Burkina Faso
            </Text>

            {/* Mission */}
            <View style={styles.aboutSection}>
              <View style={styles.aboutSectionHeader}>
                <MaterialIcons name="track-changes" size={20} color={Colors.primary} />
                <Text style={[styles.aboutSectionTitle, { color: theme.text }]}>Notre Mission</Text>
              </View>
              <Text style={[styles.aboutBody, { color: theme.textSecondary }]}>
                Connecter les consommateurs burkinabè avec les meilleurs services et produits locaux. Nous facilitons la découverte d'entreprises de qualité et aidons les entrepreneurs à développer leur visibilité.
              </Text>
            </View>

            {/* Pour les utilisateurs */}
            <View style={styles.aboutSection}>
              <View style={styles.aboutSectionHeader}>
                <MaterialIcons name="people" size={20} color={Colors.primary} />
                <Text style={[styles.aboutSectionTitle, { color: theme.text }]}>Pour les Utilisateurs</Text>
              </View>
              {[
                { icon: 'search',           label: 'Recherche par catégorie et ville' },
                { icon: 'place',            label: 'Localisation GPS des entreprises' },
                { icon: 'chat',             label: 'Contact direct via WhatsApp' },
                { icon: 'phone-iphone',     label: 'Application mobile gratuite' },
                { icon: 'favorite',         label: 'Favoris pour vos entreprises préférées' },
              ].map(item => (
                <View key={item.icon} style={styles.aboutRow}>
                  <MaterialIcons name={item.icon as any} size={18} color={Colors.primary} />
                  <Text style={[styles.aboutRowText, { color: theme.textSecondary }]}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* Pour les entreprises */}
            <View style={styles.aboutSection}>
              <View style={styles.aboutSectionHeader}>
                <MaterialIcons name="storefront" size={20} color={Colors.primary} />
                <Text style={[styles.aboutSectionTitle, { color: theme.text }]}>Pour les Entreprises</Text>
              </View>
              {[
                { icon: 'trending-up',      label: 'Visibilité accrue auprès des clients' },
                { icon: 'photo-library',    label: 'Galerie photos de vos produits/services' },
                { icon: 'contacts',         label: 'Informations de contact complètes' },
                { icon: 'language',         label: 'Liens vers vos réseaux sociaux' },
                { icon: 'verified',         label: 'Badge de vérification disponible' },
              ].map(item => (
                <View key={item.icon} style={styles.aboutRow}>
                  <MaterialIcons name={item.icon as any} size={18} color={Colors.primary} />
                  <Text style={[styles.aboutRowText, { color: theme.textSecondary }]}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* Couverture */}
            <View style={styles.aboutSection}>
              <View style={styles.aboutSectionHeader}>
                <MaterialIcons name="public" size={20} color={Colors.primary} />
                <Text style={[styles.aboutSectionTitle, { color: theme.text }]}>Couverture</Text>
              </View>
              {['Ouagadougou', 'Bobo-Dioulasso', 'Extension prévue dans d\'autres villes'].map(city => (
                <View key={city} style={styles.aboutRow}>
                  <MaterialIcons name="location-on" size={18} color={Colors.primary} />
                  <Text style={[styles.aboutRowText, { color: theme.textSecondary }]}>{city}</Text>
                </View>
              ))}
            </View>

            {/* Version */}
            <View style={styles.aboutSection}>
              <View style={styles.aboutSectionHeader}>
                <MaterialIcons name="info" size={20} color={Colors.primary} />
                <Text style={[styles.aboutSectionTitle, { color: theme.text }]}>Version</Text>
              </View>
              <View style={styles.aboutRow}>
                <MaterialIcons name="phone-iphone" size={18} color={Colors.primary} />
                <Text style={[styles.aboutRowText, { color: theme.textSecondary }]}>BurkinaBizz v1.0.0</Text>
              </View>
            </View>

            <Text style={[styles.aboutCopyright, { color: theme.textSecondary }]}>
              © 2026 BurkinaBizz — Tous droits réservés
            </Text>
          </ScrollView>
        </View>
      </Modal>

      {/* TERMS OF USE MODAL */}
      <Modal
        visible={showTerms}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTerms(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
          <View style={[styles.modalHeader, { backgroundColor: Colors.primary }]}>
            <Text style={styles.modalTitle}>Conditions d'utilisation</Text>
            <TouchableOpacity onPress={() => setShowTerms(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={[styles.policyText, { color: theme.text }]}>
              <Text style={{ fontWeight: '700' }}>Conditions d'utilisation de BurkinaBizz</Text>
              {'\n\n'}
              <Text style={{ fontWeight: '700' }}>1. Acceptation des conditions</Text>
              {'\n'}
              En utilisant BurkinaBizz, vous acceptez les présentes conditions d'utilisation.
              {'\n\n'}
              <Text style={{ fontWeight: '700' }}>2. Inscription et compte</Text>
              {'\n'}• Vous devez fournir des informations exactes lors de l'inscription
              {'\n'}• Vous êtes responsable de la sécurité de votre compte
              {'\n'}• Un seul compte par utilisateur est autorisé
              {'\n\n'}
              <Text style={{ fontWeight: '700' }}>3. Utilisation du service</Text>
              {'\n'}• Vous vous engagez à utiliser BurkinaBizz de manière légale
              {'\n'}• Les contenus offensants ou illégaux sont interdits
              {'\n'}• Nous nous réservons le droit de supprimer tout contenu inapproprié
              {'\n\n'}
              <Text style={{ fontWeight: '700' }}>4. Pour les vendeurs</Text>
              {'\n'}• Les informations d'entreprise doivent être exactes
              {'\n'}• Vous êtes responsable du contenu publié
              {'\n'}• Nous pouvons modérer ou retirer les fiches non conformes
              {'\n\n'}
              <Text style={{ fontWeight: '700' }}>5. Avis et évaluations</Text>
              {'\n'}• Les avis doivent être honnêtes et basés sur votre expérience réelle
              {'\n'}• Les faux avis sont interdits
              {'\n'}• Nous nous réservons le droit de supprimer les avis inappropriés
              {'\n\n'}
              <Text style={{ fontWeight: '700' }}>6. Propriété intellectuelle</Text>
              {'\n'}• Tout le contenu de BurkinaBizz est protégé par les droits d'auteur
              {'\n'}• Vous conservez les droits sur le contenu que vous publiez
              {'\n\n'}
              <Text style={{ fontWeight: '700' }}>7. Limitation de responsabilité</Text>
              {'\n'}• BurkinaBizz est fourni "tel quel"
              {'\n'}• Nous ne garantissons pas l'exactitude des informations publiées
              {'\n'}• Nous ne sommes pas responsables des transactions entre utilisateurs
              {'\n\n'}
              <Text style={{ fontWeight: '700' }}>8. Modifications</Text>
              {'\n'}
              Nous nous réservons le droit de modifier ces conditions à tout moment.
              {'\n\n'}
              <Text style={{ fontWeight: '700' }}>9. Résiliation</Text>
              {'\n'}
              Nous pouvons suspendre ou résilier votre compte en cas de violation 
              des présentes conditions.
              {'\n\n'}
              <Text style={{ fontWeight: '700' }}>10. Contact</Text>
              {'\n'}
              Pour toute question, contactez-nous via WhatsApp.
              {'\n\n'}
              <Text style={{ fontStyle: 'italic', fontSize: 12 }}>
                Dernière mise à jour: Mars 2026
              </Text>
            </Text>
          </ScrollView>
        </View>
      </Modal>

      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 , maxWidth: 900, alignSelf: 'center', width: '100%'},
  content: { padding: 16, paddingBottom: 24 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  userName: { fontSize: 16, fontWeight: '800', color: '#fff' },
  userEmail: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  userPhone: { fontSize: 11, color: '#fff', marginTop: 2, opacity: 0.8 },
  adminBadge: {
    backgroundColor: 'rgba(249,168,37,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
  adminBadgeText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuTitle: { fontSize: 15, fontWeight: '700' },
  menuSub: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginHorizontal: 16 },
  logoutBtn: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '800', color: '#D32F2F' },
  deleteBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#B71C1C',
  },
  deleteText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  deleteWarning: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  guestCard: {
    borderRadius: 20,
    backgroundColor: Colors.primary,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  guestBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  guestFlag: { fontSize: 40 },
  guestAppName: { fontSize: 22, fontWeight: '900', color: '#fff' },
  guestTagline: { fontSize: 12, color: '#A5D6A7', marginTop: 2 },
  guestBenefits: { gap: 12, marginBottom: 24 },
  guestBenefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  guestBenefitIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  guestBenefitText: { flex: 1, fontSize: 14, color: '#fff', fontWeight: '500' },
  guestSignupBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.cta,
    paddingVertical: 15, borderRadius: 12, marginBottom: 10,
    elevation: 2, shadowColor: Colors.cta,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6,
  },
  guestSignupText: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  guestLoginBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 14, borderRadius: 12,
  },
  guestLoginText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  modalContainer: { flex: 1 , maxWidth: 600, alignSelf: 'center', width: '100%'},
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  modalClose: { fontSize: 24, color: '#fff', fontWeight: '700', padding: 4 },
  modalContent: { padding: 20 },
  policyText: { fontSize: 14, lineHeight: 22 },
  aboutTitle: { fontSize: 26, fontWeight: '900', marginBottom: 4 },
  aboutTagline: { fontSize: 13, fontStyle: 'italic', marginBottom: 20, lineHeight: 18 },
  aboutSection: { marginBottom: 20 },
  aboutSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  aboutSectionTitle: { fontSize: 15, fontWeight: '800' },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  aboutRowText: { fontSize: 13, flex: 1, lineHeight: 18 },
  aboutBody: { fontSize: 13, lineHeight: 20 },
  aboutCopyright: { fontSize: 11, textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
});

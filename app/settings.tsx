// app/settings.tsx — Settings & Support Screen

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal,
  StyleSheet, Linking, Alert, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../lib/AuthContext';
import { Colors } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';
import { useTranslation, registerTranslations } from '../lib/LanguageContext';
import { AppHeader } from '../components/AppHeader';

registerTranslations({
  'Paramètres': 'Settings',
  'Déconnexion': 'Log out',
  'Voulez-vous vraiment vous déconnecter?': 'Are you sure you want to log out?',
  'Annuler': 'Cancel',
  'Déconnecter': 'Log out',
  'Supprimer le compte': 'Delete account',
  'Cette action est irréversible. Votre compte et toutes vos données seront définitivement supprimés.':
    'This action is irreversible. Your account and all your data will be permanently deleted.',
  'Supprimer définitivement': 'Delete permanently',
  'Reconnexion requise': 'Reconnection required',
  'Pour des raisons de sécurité, veuillez vous déconnecter et vous reconnecter avant de supprimer votre compte.':
    'For security reasons, please log out and log back in before deleting your account.',
  'Erreur': 'Error',
  'Impossible de supprimer le compte. Réessayez.': 'Unable to delete the account. Please try again.',
  "Bonjour, j'ai besoin d'aide avec BurkinaBizz": 'Hello, I need help with BurkinaBizz',
  'Bonjour, je souhaite devenir partenaire de BurkinaBizz': 'Hello, I would like to become a BurkinaBizz partner',
  'Utilisateur': 'User',
  "L'annuaire des entreprises viables": 'The directory of viable businesses',
  'Sauvegardez vos entreprises favorites': 'Save your favorite businesses',
  'Référencez votre entreprise gratuitement': 'List your business for free',
  'Créer un compte gratuit': 'Create a free account',
  "J'ai déjà un compte": 'I already have an account',
  'Panel Admin': 'Admin Panel',
  'Gérer les entreprises et utilisateurs': 'Manage businesses and users',
  'Devenir partenaire': 'Become a partner',
  'Rejoignez notre réseau de partenaires': 'Join our network of partners',
  'À propos': 'About',
  'Découvrez BurkinaBizz': 'Discover BurkinaBizz',
  'Facebook': 'Facebook',
  'Suivez-nous sur Facebook': 'Follow us on Facebook',
  'Instagram': 'Instagram',
  'Suivez-nous sur Instagram': 'Follow us on Instagram',
  'Politique de confidentialité': 'Privacy Policy',
  "Conditions d'utilisation": 'Terms of Use',
  'Support': 'Support',
  'Contactez-nous sur WhatsApp': 'Contact us on WhatsApp',
  'Version': 'Version',
  'BurkinaBizz v1.0.0': 'BurkinaBizz v1.0.0',
  'Supprimer mon compte': 'Delete my account',
  'Action irréversible — toutes vos données seront perdues': 'Irreversible action — all your data will be lost',
  'À propos de BurkinaBizz': 'About BurkinaBizz',
  'BurkinaBizz': 'BurkinaBizz',
  "L'annuaire de référence des entreprises au Burkina Faso": 'The go-to business directory in Burkina Faso',
  'Notre Mission': 'Our Mission',
  "Connecter les consommateurs burkinabè avec les meilleurs services et produits locaux. Nous facilitons la découverte d'entreprises de qualité et aidons les entrepreneurs à développer leur visibilité.":
    'Connecting Burkinabe consumers with the best local services and products. We make it easy to discover quality businesses and help entrepreneurs grow their visibility.',
  'Pour les Utilisateurs': 'For Users',
  'Recherche par catégorie et ville': 'Search by category and city',
  'Localisation GPS des entreprises': 'GPS location of businesses',
  'Contact direct via WhatsApp': 'Direct contact via WhatsApp',
  'Application mobile gratuite': 'Free mobile app',
  'Favoris pour vos entreprises préférées': 'Favorites for your preferred businesses',
  'Pour les Entreprises': 'For Businesses',
  'Visibilité accrue auprès des clients': 'Increased visibility with customers',
  'Galerie photos de vos produits/services': 'Photo gallery of your products/services',
  'Informations de contact complètes': 'Complete contact information',
  'Liens vers vos réseaux sociaux': 'Links to your social networks',
  'Badge de vérification disponible': 'Verification badge available',
  'Couverture': 'Coverage',
  'Ouagadougou': 'Ouagadougou',
  'Bobo-Dioulasso': 'Bobo-Dioulasso',
  "Extension prévue dans d'autres villes": 'Expansion planned in other cities',
  '© 2026 BurkinaBizz — Tous droits réservés': '© 2026 BurkinaBizz — All rights reserved',
  'respecte votre vie privée.': 'respects your privacy.',
  'Données collectées:': 'Data collected:',
  "Nom, email, numéro de téléphone (lors de l'inscription)": 'Name, email, phone number (during registration)',
  'Informations des entreprises que vous référencez': 'Information about the businesses you list',
  'Vos entreprises favorites': 'Your favorite businesses',
  'Utilisation:': 'Usage:',
  'Gestion de votre compte': 'Managing your account',
  "Publication de votre entreprise dans l'annuaire": 'Publishing your business in the directory',
  'Communication avec vous': 'Communicating with you',
  'Partage:': 'Sharing:',
  'Vos informations ne sont jamais vendues': 'Your information is never sold',
  'Les informations publiques des entreprises sont visibles par tous': "Businesses' public information is visible to everyone",
  'Pour toute question, contactez-nous sur WhatsApp.': 'For any questions, contact us on WhatsApp.',
  "Conditions d'utilisation de BurkinaBizz": 'BurkinaBizz Terms of Use',
  '1. Acceptation des conditions': '1. Acceptance of terms',
  "En utilisant BurkinaBizz, vous acceptez les présentes conditions d'utilisation.":
    'By using BurkinaBizz, you agree to these terms of use.',
  '2. Inscription et compte': '2. Registration and account',
  "Vous devez fournir des informations exactes lors de l'inscription": 'You must provide accurate information when registering',
  'Vous êtes responsable de la sécurité de votre compte': 'You are responsible for the security of your account',
  'Un seul compte par utilisateur est autorisé': 'Only one account per user is allowed',
  '3. Utilisation du service': '3. Use of the service',
  'Vous vous engagez à utiliser BurkinaBizz de manière légale': 'You agree to use BurkinaBizz in a lawful manner',
  'Les contenus offensants ou illégaux sont interdits': 'Offensive or illegal content is prohibited',
  'Nous nous réservons le droit de supprimer tout contenu inapproprié': 'We reserve the right to remove any inappropriate content',
  '4. Pour les vendeurs': '4. For sellers',
  "Les informations d'entreprise doivent être exactes": 'Business information must be accurate',
  'Vous êtes responsable du contenu publié': 'You are responsible for the content published',
  'Nous pouvons modérer ou retirer les fiches non conformes': 'We may moderate or remove listings that do not comply',
  '5. Avis et évaluations': '5. Reviews and ratings',
  'Les avis doivent être honnêtes et basés sur votre expérience réelle': 'Reviews must be honest and based on your genuine experience',
  'Les faux avis sont interdits': 'Fake reviews are prohibited',
  'Nous nous réservons le droit de supprimer les avis inappropriés': 'We reserve the right to remove inappropriate reviews',
  '6. Propriété intellectuelle': '6. Intellectual property',
  "Tout le contenu de BurkinaBizz est protégé par les droits d'auteur": "All content on BurkinaBizz is protected by copyright",
  'Vous conservez les droits sur le contenu que vous publiez': 'You retain the rights to the content you publish',
  '7. Limitation de responsabilité': '7. Limitation of liability',
  'BurkinaBizz est fourni "tel quel"': 'BurkinaBizz is provided "as is"',
  "Nous ne garantissons pas l'exactitude des informations publiées": 'We do not guarantee the accuracy of the information published',
  'Nous ne sommes pas responsables des transactions entre utilisateurs': 'We are not responsible for transactions between users',
  '8. Modifications': '8. Modifications',
  'Nous nous réservons le droit de modifier ces conditions à tout moment.': 'We reserve the right to modify these terms at any time.',
  '9. Résiliation': '9. Termination',
  'Nous pouvons suspendre ou résilier votre compte en cas de violation des présentes conditions.':
    'We may suspend or terminate your account in the event of a violation of these terms.',
  '10. Contact': '10. Contact',
  'Pour toute question, contactez-nous via WhatsApp.': 'For any questions, contact us via WhatsApp.',
  'Dernière mise à jour: Mars 2026': 'Last updated: March 2026',
});

export default function SettingsScreen() {
  const router = useRouter();
  const { user, userProfile, signOut, isAdmin, deleteAccount } = useAuth();
  const { theme } = useColorTheme();
  const { t } = useTranslation();

  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleSignOut = () => {
    Alert.alert(t('Déconnexion'), t('Voulez-vous vraiment vous déconnecter?'), [
      { text: t('Annuler'), style: 'cancel' },
      {
        text: t('Déconnecter'),
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/');
        },
      },
    ]);
  };

  const handleContactSupport = () => {
    const message = encodeURIComponent(t('Bonjour, j\'ai besoin d\'aide avec BurkinaBizz'));
    Linking.openURL(`https://wa.me/6464786515?text=${message}`);
  };

  const handleBecomePartner = () => {
    const message = encodeURIComponent(t('Bonjour, je souhaite devenir partenaire de BurkinaBizz'));
    Linking.openURL(`https://wa.me/6464786515?text=${message}`);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('Supprimer le compte'),
      t('Cette action est irréversible. Votre compte et toutes vos données seront définitivement supprimés.'),
      [
        { text: t('Annuler'), style: 'cancel' },
        {
          text: t('Supprimer définitivement'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              router.replace('/');
            } catch (e: any) {
              if (e.code === 'auth/requires-recent-login') {
                Alert.alert(
                  t('Reconnexion requise'),
                  t('Pour des raisons de sécurité, veuillez vous déconnecter et vous reconnecter avant de supprimer votre compte.')
                );
              } else {
                Alert.alert(t('Erreur'), t('Impossible de supprimer le compte. Réessayez.'));
              }
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <AppHeader title={t('Paramètres')} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* USER INFO — logged in */}
        {user && (
          <LinearGradient
            colors={Colors.headerGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.userCard}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(userProfile?.name || user.email || 'U')[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{userProfile?.name || t('Utilisateur')}</Text>
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
          <LinearGradient
            colors={Colors.headerGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.guestCard}
          >
            {/* Top branding */}
            <View style={styles.guestBrandRow}>
              <Text style={styles.guestFlag}>🇧🇫</Text>
              <View>
                <Text style={styles.guestAppName}>BurkinaBizz</Text>
                <Text style={styles.guestTagline}>{t("L'annuaire des entreprises viables")}</Text>
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
                  <Text style={styles.guestBenefitText}>{t(b.text)}</Text>
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
              <Text style={styles.guestSignupText}>{t('Créer un compte gratuit')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestLoginBtn}
              onPress={() => router.push('/auth')}
              activeOpacity={0.85}
            >
              <MaterialIcons name="login" size={20} color={Colors.primary} />
              <Text style={styles.guestLoginText}>{t("J'ai déjà un compte")}</Text>
            </TouchableOpacity>
          </LinearGradient>
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
                <Text style={[styles.menuTitle, { color: theme.text }]}>{t('Panel Admin')}</Text>
                <Text style={[styles.menuSub, { color: theme.textSecondary }]}>
                  {t('Gérer les entreprises et utilisateurs')}
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
              <Text style={[styles.menuTitle, { color: theme.text }]}>{t('Devenir partenaire')}</Text>
              <Text style={[styles.menuSub, { color: theme.textSecondary }]}>
                {t('Rejoignez notre réseau de partenaires')}
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
              <Text style={[styles.menuTitle, { color: theme.text }]}>{t('À propos')}</Text>
              <Text style={[styles.menuSub, { color: theme.textSecondary }]}>
                {t('Découvrez BurkinaBizz')}
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
              <Text style={[styles.menuTitle, { color: theme.text }]}>{t('Facebook')}</Text>
              <Text style={[styles.menuSub, { color: theme.textSecondary }]}>
                {t('Suivez-nous sur Facebook')}
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
              <Text style={[styles.menuTitle, { color: theme.text }]}>{t('Instagram')}</Text>
              <Text style={[styles.menuSub, { color: theme.textSecondary }]}>
                {t('Suivez-nous sur Instagram')}
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
                {t('Politique de confidentialité')}
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
                {t("Conditions d'utilisation")}
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
              <Text style={[styles.menuTitle, { color: theme.text }]}>{t('Support')}</Text>
              <Text style={[styles.menuSub, { color: theme.textSecondary }]}>
                {t('Contactez-nous sur WhatsApp')}
              </Text>
            </View>
            <Text style={{ color: theme.textSecondary }}>→</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.menuItem}>
            <MaterialIcons name="phone-iphone" size={24} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>{t('Version')}</Text>
              <Text style={[styles.menuSub, { color: theme.textSecondary }]}>
                {t('BurkinaBizz v1.0.0')}
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
                <Text style={styles.logoutText}>{t('Déconnexion')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDeleteAccount}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="delete-forever" size={18} color="#fff" />
                <Text style={styles.deleteText}>{t('Supprimer mon compte')}</Text>
              </View>
              <Text style={styles.deleteWarning}>{t('Action irréversible — toutes vos données seront perdues')}</Text>
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
        <LinearGradient
          colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
          style={styles.modalContainer}
        >
          <StatusBar barStyle="light-content" backgroundColor={Colors.headerGradient[0]} />
          <LinearGradient colors={Colors.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('Politique de confidentialité')}</Text>
            <TouchableOpacity onPress={() => setShowPrivacy(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </LinearGradient>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={[styles.policyText, { color: theme.text }]}>
              <Text style={{ fontWeight: '400' }}>BurkinaBizz</Text> {t('respecte votre vie privée.')}
              {'\n\n'}
              <Text style={{ fontWeight: '400' }}>{t('Données collectées:')}</Text>
              {'\n'}{`• ${t("Nom, email, numéro de téléphone (lors de l'inscription)")}`}
              {'\n'}{`• ${t('Informations des entreprises que vous référencez')}`}
              {'\n'}{`• ${t('Vos entreprises favorites')}`}
              {'\n\n'}
              <Text style={{ fontWeight: '400' }}>{t('Utilisation:')}</Text>
              {'\n'}{`• ${t('Gestion de votre compte')}`}
              {'\n'}{`• ${t("Publication de votre entreprise dans l'annuaire")}`}
              {'\n'}{`• ${t('Communication avec vous')}`}
              {'\n\n'}
              <Text style={{ fontWeight: '400' }}>{t('Partage:')}</Text>
              {'\n'}{`• ${t('Vos informations ne sont jamais vendues')}`}
              {'\n'}{`• ${t('Les informations publiques des entreprises sont visibles par tous')}`}
              {'\n\n'}
              {t('Pour toute question, contactez-nous sur WhatsApp.')}
            </Text>
          </ScrollView>
        </LinearGradient>
      </Modal>

      {/* ABOUT MODAL */}
      <Modal
        visible={showAbout}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAbout(false)}
      >
        <LinearGradient
          colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
          style={styles.modalContainer}
        >
          <StatusBar barStyle="light-content" backgroundColor={Colors.headerGradient[0]} />
          <LinearGradient colors={Colors.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('À propos de BurkinaBizz')}</Text>
            <TouchableOpacity onPress={() => setShowAbout(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </LinearGradient>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* App title */}
            <Text style={[styles.aboutTitle, { color: Colors.primary }]}>BurkinaBizz</Text>
            <Text style={[styles.aboutTagline, { color: theme.textSecondary }]}>
              {t("L'annuaire de référence des entreprises au Burkina Faso")}
            </Text>

            {/* Mission */}
            <View style={styles.aboutSection}>
              <View style={styles.aboutSectionHeader}>
                <MaterialIcons name="track-changes" size={20} color={Colors.primary} />
                <Text style={[styles.aboutSectionTitle, { color: theme.text }]}>{t('Notre Mission')}</Text>
              </View>
              <Text style={[styles.aboutBody, { color: theme.textSecondary }]}>
                {t("Connecter les consommateurs burkinabè avec les meilleurs services et produits locaux. Nous facilitons la découverte d'entreprises de qualité et aidons les entrepreneurs à développer leur visibilité.")}
              </Text>
            </View>

            {/* Pour les utilisateurs */}
            <View style={styles.aboutSection}>
              <View style={styles.aboutSectionHeader}>
                <MaterialIcons name="people" size={20} color={Colors.primary} />
                <Text style={[styles.aboutSectionTitle, { color: theme.text }]}>{t('Pour les Utilisateurs')}</Text>
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
                  <Text style={[styles.aboutRowText, { color: theme.textSecondary }]}>{t(item.label)}</Text>
                </View>
              ))}
            </View>

            {/* Pour les entreprises */}
            <View style={styles.aboutSection}>
              <View style={styles.aboutSectionHeader}>
                <MaterialIcons name="storefront" size={20} color={Colors.primary} />
                <Text style={[styles.aboutSectionTitle, { color: theme.text }]}>{t('Pour les Entreprises')}</Text>
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
                  <Text style={[styles.aboutRowText, { color: theme.textSecondary }]}>{t(item.label)}</Text>
                </View>
              ))}
            </View>

            {/* Couverture */}
            <View style={styles.aboutSection}>
              <View style={styles.aboutSectionHeader}>
                <MaterialIcons name="public" size={20} color={Colors.primary} />
                <Text style={[styles.aboutSectionTitle, { color: theme.text }]}>{t('Couverture')}</Text>
              </View>
              {['Ouagadougou', 'Bobo-Dioulasso', 'Extension prévue dans d\'autres villes'].map(city => (
                <View key={city} style={styles.aboutRow}>
                  <MaterialIcons name="location-on" size={18} color={Colors.primary} />
                  <Text style={[styles.aboutRowText, { color: theme.textSecondary }]}>{t(city)}</Text>
                </View>
              ))}
            </View>

            {/* Version */}
            <View style={styles.aboutSection}>
              <View style={styles.aboutSectionHeader}>
                <MaterialIcons name="info" size={20} color={Colors.primary} />
                <Text style={[styles.aboutSectionTitle, { color: theme.text }]}>{t('Version')}</Text>
              </View>
              <View style={styles.aboutRow}>
                <MaterialIcons name="phone-iphone" size={18} color={Colors.primary} />
                <Text style={[styles.aboutRowText, { color: theme.textSecondary }]}>{t('BurkinaBizz v1.0.0')}</Text>
              </View>
            </View>

            <Text style={[styles.aboutCopyright, { color: theme.textSecondary }]}>
              {t('© 2026 BurkinaBizz — Tous droits réservés')}
            </Text>
          </ScrollView>
        </LinearGradient>
      </Modal>

      {/* TERMS OF USE MODAL */}
      <Modal
        visible={showTerms}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTerms(false)}
      >
        <LinearGradient
          colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
          style={styles.modalContainer}
        >
          <StatusBar barStyle="light-content" backgroundColor={Colors.headerGradient[0]} />
          <LinearGradient colors={Colors.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("Conditions d'utilisation")}</Text>
            <TouchableOpacity onPress={() => setShowTerms(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </LinearGradient>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={[styles.policyText, { color: theme.text }]}>
              <Text style={{ fontWeight: '400' }}>{t("Conditions d'utilisation de BurkinaBizz")}</Text>
              {'\n\n'}
              <Text style={{ fontWeight: '400' }}>{t('1. Acceptation des conditions')}</Text>
              {'\n'}
              {t("En utilisant BurkinaBizz, vous acceptez les présentes conditions d'utilisation.")}
              {'\n\n'}
              <Text style={{ fontWeight: '400' }}>{t('2. Inscription et compte')}</Text>
              {'\n'}{`• ${t("Vous devez fournir des informations exactes lors de l'inscription")}`}
              {'\n'}{`• ${t('Vous êtes responsable de la sécurité de votre compte')}`}
              {'\n'}{`• ${t('Un seul compte par utilisateur est autorisé')}`}
              {'\n\n'}
              <Text style={{ fontWeight: '400' }}>{t('3. Utilisation du service')}</Text>
              {'\n'}{`• ${t('Vous vous engagez à utiliser BurkinaBizz de manière légale')}`}
              {'\n'}{`• ${t('Les contenus offensants ou illégaux sont interdits')}`}
              {'\n'}{`• ${t('Nous nous réservons le droit de supprimer tout contenu inapproprié')}`}
              {'\n\n'}
              <Text style={{ fontWeight: '400' }}>{t('4. Pour les vendeurs')}</Text>
              {'\n'}{`• ${t("Les informations d'entreprise doivent être exactes")}`}
              {'\n'}{`• ${t('Vous êtes responsable du contenu publié')}`}
              {'\n'}{`• ${t('Nous pouvons modérer ou retirer les fiches non conformes')}`}
              {'\n\n'}
              <Text style={{ fontWeight: '400' }}>{t('5. Avis et évaluations')}</Text>
              {'\n'}{`• ${t('Les avis doivent être honnêtes et basés sur votre expérience réelle')}`}
              {'\n'}{`• ${t('Les faux avis sont interdits')}`}
              {'\n'}{`• ${t('Nous nous réservons le droit de supprimer les avis inappropriés')}`}
              {'\n\n'}
              <Text style={{ fontWeight: '400' }}>{t('6. Propriété intellectuelle')}</Text>
              {'\n'}{`• ${t("Tout le contenu de BurkinaBizz est protégé par les droits d'auteur")}`}
              {'\n'}{`• ${t('Vous conservez les droits sur le contenu que vous publiez')}`}
              {'\n\n'}
              <Text style={{ fontWeight: '400' }}>{t('7. Limitation de responsabilité')}</Text>
              {'\n'}{`• ${t('BurkinaBizz est fourni "tel quel"')}`}
              {'\n'}{`• ${t("Nous ne garantissons pas l'exactitude des informations publiées")}`}
              {'\n'}{`• ${t('Nous ne sommes pas responsables des transactions entre utilisateurs')}`}
              {'\n\n'}
              <Text style={{ fontWeight: '400' }}>{t('8. Modifications')}</Text>
              {'\n'}
              {t('Nous nous réservons le droit de modifier ces conditions à tout moment.')}
              {'\n\n'}
              <Text style={{ fontWeight: '400' }}>{t('9. Résiliation')}</Text>
              {'\n'}
              {t('Nous pouvons suspendre ou résilier votre compte en cas de violation des présentes conditions.')}
              {'\n\n'}
              <Text style={{ fontWeight: '400' }}>{t('10. Contact')}</Text>
              {'\n'}
              {t('Pour toute question, contactez-nous via WhatsApp.')}
              {'\n\n'}
              <Text style={{ fontStyle: 'italic', fontSize: 12 }}>
                {t('Dernière mise à jour: Mars 2026')}
              </Text>
            </Text>
          </ScrollView>
        </LinearGradient>
      </Modal>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 , maxWidth: 900, alignSelf: 'center', width: '100%'},
  content: { paddingHorizontal: 8, paddingTop: 16, paddingBottom: 24 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: 22, fontWeight: '400', color: '#fff' },
  userName: { fontSize: 16, fontWeight: '400', color: '#fff' },
  userEmail: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  userPhone: { fontSize: 11, color: '#fff', marginTop: 2, opacity: 0.8 },
  adminBadge: {
    backgroundColor: 'rgba(249,168,37,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  adminBadgeText: { color: '#fff', fontWeight: '400', fontSize: 11 },
  section: {
    borderRadius: 8,
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
  menuTitle: { fontSize: 15, fontWeight: '400' },
  menuSub: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginHorizontal: 16 },
  logoutBtn: {
    borderWidth: 2,
    borderRadius: 7,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '400', color: '#D32F2F' },
  deleteBtn: {
    borderRadius: 7,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#B71C1C',
  },
  deleteText: { fontSize: 15, fontWeight: '400', color: '#fff' },
  deleteWarning: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  guestCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: Colors.headerGradient[0],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  guestBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  guestFlag: { fontSize: 40 },
  guestAppName: { fontSize: 22, fontWeight: '400', color: '#fff' },
  guestTagline: { fontSize: 12, color: '#A5D6A7', marginTop: 2 },
  guestBenefits: { gap: 12, marginBottom: 24 },
  guestBenefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  guestBenefitIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  guestBenefitText: { flex: 1, fontSize: 14, color: '#fff', fontWeight: '400' },
  guestSignupBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.cta,
    paddingVertical: 15, borderRadius: 7, marginBottom: 10,
    elevation: 2, shadowColor: Colors.cta,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6,
  },
  guestSignupText: { fontSize: 16, fontWeight: '400', color: '#1A1A1A' },
  guestLoginBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 14, borderRadius: 7,
  },
  guestLoginText: { fontSize: 15, fontWeight: '400', color: Colors.primary },
  modalContainer: { flex: 1 , maxWidth: 600, alignSelf: 'center', width: '100%'},
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '400', color: '#fff' },
  modalClose: { fontSize: 24, color: '#fff', fontWeight: '400', padding: 4 },
  modalContent: { padding: 20 },
  policyText: { fontSize: 14, lineHeight: 22 },
  aboutTitle: { fontSize: 26, fontWeight: '400', marginBottom: 4 },
  aboutTagline: { fontSize: 13, fontStyle: 'italic', marginBottom: 20, lineHeight: 18 },
  aboutSection: { marginBottom: 20 },
  aboutSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  aboutSectionTitle: { fontSize: 15, fontWeight: '400' },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  aboutRowText: { fontSize: 13, flex: 1, lineHeight: 18 },
  aboutBody: { fontSize: 13, lineHeight: 20 },
  aboutCopyright: { fontSize: 11, textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
});

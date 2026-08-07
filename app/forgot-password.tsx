// app/forgot-password.tsx — Password Reset Screen

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Colors } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';
import { useTranslation, registerTranslations } from '../lib/LanguageContext';
import { AppHeader } from '../components/AppHeader';

registerTranslations({
  'Email requis': 'Email required',
  'Veuillez entrer votre adresse email.': 'Please enter your email address.',
  'Email invalide': 'Invalid email',
  'Veuillez entrer une adresse email valide.': 'Please enter a valid email address.',
  '✅ Email envoyé!': '✅ Email sent!',
  'Un lien de réinitialisation a été envoyé à': 'A reset link has been sent to',
  'Vérifiez votre boîte de réception (et spam).': 'Check your inbox (and spam folder).',
  'OK': 'OK',
  'Une erreur est survenue. Veuillez réessayer.': 'An error occurred. Please try again.',
  'Aucun compte trouvé avec cet email.': 'No account found with this email.',
  'Adresse email invalide.': 'Invalid email address.',
  'Trop de tentatives. Réessayez plus tard.': 'Too many attempts. Please try again later.',
  'Erreur': 'Error',
  'Mot de passe oublié?': 'Forgot password?',
  'Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.':
    'Enter your email and we will send you a link to reset your password.',
  'Email': 'Email',
  'votre@email.com': 'your@email.com',
  '✅ Email envoyé': '✅ Email sent',
  '📧 Envoyer le lien': '📧 Send the link',
  '← Retour à la connexion': '← Back to login',
  'Astuce:': 'Tip:',
  "Vérifiez votre dossier spam si vous ne recevez pas l'email dans quelques minutes.":
    "Check your spam folder if you don't receive the email within a few minutes.",
});

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme } = useColorTheme();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert(t('Email requis'), t('Veuillez entrer votre adresse email.'));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert(t('Email invalide'), t('Veuillez entrer une adresse email valide.'));
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setEmailSent(true);
      Alert.alert(
        t('✅ Email envoyé!'),
        `${t('Un lien de réinitialisation a été envoyé à')} ${email.trim()}. ${t('Vérifiez votre boîte de réception (et spam).')}`,
        [{ text: t('OK'), onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error(error);
      let message = t('Une erreur est survenue. Veuillez réessayer.');

      if (error.code === 'auth/user-not-found') {
        message = t('Aucun compte trouvé avec cet email.');
      } else if (error.code === 'auth/invalid-email') {
        message = t('Adresse email invalide.');
      } else if (error.code === 'auth/too-many-requests') {
        message = t('Trop de tentatives. Réessayez plus tard.');
      }

      Alert.alert(t('Erreur'), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.safe}>
      <LinearGradient
        colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
        style={{ flex: 1 }}
      >
      <AppHeader title={t('Mot de passe oublié?')} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          {/* ICON */}
          <View style={[styles.iconCircle, { backgroundColor: Colors.primary + '22' }]}>
            <Text style={styles.icon}>🔑</Text>
          </View>

          {/* TITLE */}
          <Text style={[styles.title, { color: theme.text }]}>
            {t('Mot de passe oublié?')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t('Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.')}
          </Text>

          {/* EMAIL INPUT */}
          <View style={styles.formCard}>
            <Text style={[styles.label, { color: theme.text }]}>{t('Email')}</Text>
            <TextInput
              style={[styles.input, {
                borderColor: '#9CA3AF',
                backgroundColor: '#FFFFFF',
                color: theme.text
              }]}
              placeholder={t('votre@email.com')}
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!emailSent}
            />
          </View>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: Colors.primary }, (loading || emailSent) && { opacity: 0.6 }]}
            onPress={handleResetPassword}
            disabled={loading || emailSent}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                {emailSent ? t('✅ Email envoyé') : t('📧 Envoyer le lien')}
              </Text>
            )}
          </TouchableOpacity>

          {/* BACK TO LOGIN */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={[styles.backText, { color: theme.textSecondary }]}>
              {t('← Retour à la connexion')}
            </Text>
          </TouchableOpacity>

          {/* INFO BOX */}
          <View style={[styles.infoBox, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '40' }]}>
            <Text style={[styles.infoText, { color: theme.text }]}>
              💡 <Text style={{ fontWeight: '400' }}>{t('Astuce:')}</Text> {t("Vérifiez votre dossier spam si vous ne recevez pas l'email dans quelques minutes.")}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: { fontSize: 40 },
  title: {
    fontSize: 24,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  formCard: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
  },
  submitBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 7,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
  },
  backBtn: {
    paddingVertical: 12,
    marginBottom: 24,
  },
  backText: {
    fontSize: 14,
    fontWeight: '400',
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 7,
    padding: 14,
    width: '100%',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 19,
  },
});
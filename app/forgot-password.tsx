// app/forgot-password.tsx — Password Reset Screen

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Colors } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme } = useColorTheme();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Email requis', 'Veuillez entrer votre adresse email.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Email invalide', 'Veuillez entrer une adresse email valide.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setEmailSent(true);
      Alert.alert(
        '✅ Email envoyé!',
        `Un lien de réinitialisation a été envoyé à ${email.trim()}. Vérifiez votre boîte de réception (et spam).`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error(error);
      let message = 'Une erreur est survenue. Veuillez réessayer.';
      
      if (error.code === 'auth/user-not-found') {
        message = 'Aucun compte trouvé avec cet email.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Adresse email invalide.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Trop de tentatives. Réessayez plus tard.';
      }
      
      Alert.alert('Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* ICON */}
          <View style={[styles.iconCircle, { backgroundColor: Colors.primary + '22' }]}>
            <Text style={styles.icon}>🔑</Text>
          </View>

          {/* TITLE */}
          <Text style={[styles.title, { color: theme.text }]}>
            Mot de passe oublié?
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </Text>

          {/* EMAIL INPUT */}
          <View style={styles.formCard}>
            <Text style={[styles.label, { color: theme.text }]}>Email</Text>
            <TextInput
              style={[styles.input, {
                borderColor: '#9CA3AF',
                backgroundColor: '#FFFFFF',
                color: theme.text
              }]}
              placeholder="votre@email.com"
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
                {emailSent ? '✅ Email envoyé' : '📧 Envoyer le lien'}
              </Text>
            )}
          </TouchableOpacity>

          {/* BACK TO LOGIN */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={[styles.backText, { color: theme.textSecondary }]}>
              ← Retour à la connexion
            </Text>
          </TouchableOpacity>

          {/* INFO BOX */}
          <View style={[styles.infoBox, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '40' }]}>
            <Text style={[styles.infoText, { color: theme.text }]}>
              💡 <Text style={{ fontWeight: '700' }}>Astuce:</Text> Vérifiez votre dossier spam si vous ne recevez pas l'email dans quelques minutes.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: { fontSize: 40 },
  title: {
    fontSize: 24,
    fontWeight: '800',
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
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
  },
  submitBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
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
    fontWeight: '800',
  },
  backBtn: {
    paddingVertical: 12,
    marginBottom: 24,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    width: '100%',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 19,
  },
});
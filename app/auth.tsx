// app/auth.tsx — AuthScreen

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../lib/AuthContext';
import { Colors } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';

// Field MUST be outside AuthScreen — if defined inside, every keystroke
// re-creates it, unmounting the TextInput and dropping focus after 1 char.
interface FieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  iconName: string;
  keyboardType?: any;
  secureTextEntry?: boolean;
  error?: string;
  rightComponent?: React.ReactNode;
  borderColor: string;
  surfaceColor: string;
  textColor: string;
}

function Field({
  label, value, onChangeText, placeholder, iconName,
  keyboardType = 'default', secureTextEntry = false,
  error, rightComponent, borderColor, surfaceColor, textColor,
}: FieldProps) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={[styles.fieldLabel, { color: textColor }]}>{label}</Text>
      <View style={[
        styles.inputWrapper,
        { borderColor: error ? '#D32F2F' : borderColor, backgroundColor: surfaceColor },
      ]}>
        <MaterialIcons name={iconName as any} size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.input, { color: textColor }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {rightComponent}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const { theme } = useColorTheme();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string; phone?: string; email?: string; password?: string;
  }>({});

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!isLogin && !name.trim()) e.name = 'Nom requis';
    if (!isLogin && (!phone.trim() || phone.replace(/\D/g, '').length < 8))
      e.phone = 'Numéro WhatsApp valide requis';
    if (!email.trim() || !email.includes('@')) e.email = 'Email invalide';
    if (password.length < 6) e.password = 'Minimum 6 caractères';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (isLogin) {
        const role = await signIn(email.trim(), password);
        if (role === 'pending') {
          router.replace('/vendor/pending');
        } else {
          router.replace('/vendor/dashboard');
        }
      } else {
        await signUp(email.trim(), password, name.trim(), phone.trim());
        // Don't go to dashboard — show pending screen
        router.replace('/vendor/pending');
      }
    } catch (e: any) {
      const msg =
        e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password'
          ? 'Email ou mot de passe incorrect'
          : e.code === 'auth/email-already-in-use'
          ? 'Cet email est déjà utilisé'
          : e.code === 'auth/network-request-failed'
          ? 'Vérifiez votre connexion internet'
          : 'Une erreur est survenue. Réessayez.';
      Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  const fp = { borderColor: '#9CA3AF', surfaceColor: '#FFFFFF', textColor: theme.text };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: Colors.primary }]}>
          <Text style={styles.headerEmoji}>🇧🇫</Text>
          <Text style={styles.headerTitle}>BurkinaBizz</Text>
          <Text style={styles.headerSub}>
            {isLogin ? 'Connectez-vous à votre espace vendeur' : 'Créez votre espace vendeur'}
          </Text>
        </View>

        {/* FORM */}
        <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>

          {/* TOGGLE */}
          <View style={[styles.toggleRow, { backgroundColor: theme.surface }]}>
            <TouchableOpacity
              style={[styles.toggleBtn, isLogin && { backgroundColor: Colors.primary }]}
              onPress={() => { setIsLogin(true); setErrors({}); }}
            >
              <Text style={[styles.toggleText, { color: isLogin ? '#fff' : theme.textSecondary }]}>
                Connexion
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, !isLogin && { backgroundColor: Colors.primary }]}
              onPress={() => { setIsLogin(false); setErrors({}); }}
            >
              <Text style={[styles.toggleText, { color: !isLogin ? '#fff' : theme.textSecondary }]}>
                Inscription
              </Text>
            </TouchableOpacity>
          </View>

          {!isLogin && (
            <>
              <Field label="Nom complet" value={name} onChangeText={setName}
                placeholder="Votre nom" iconName="person" error={errors.name} {...fp} />
              <Field label="Numéro WhatsApp" value={phone} onChangeText={setPhone}
                placeholder="+22670000000" keyboardType="phone-pad" iconName="phone"
                error={errors.phone} {...fp} />
            </>
          )}

          <Field label="Email" value={email} onChangeText={setEmail}
            placeholder="vous@email.com" keyboardType="email-address" iconName="email"
            error={errors.email} {...fp} />

          <Field
            label="Mot de passe" value={password} onChangeText={setPassword}
            placeholder="••••••••" secureTextEntry={!showPassword} iconName="lock"
            error={errors.password} {...fp}
            rightComponent={
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={20} color="#9CA3AF" />
              </TouchableOpacity>
            }
          />


          {/* Signup note */}
          {!isLogin && (
            <View style={[styles.approvalNote, { backgroundColor: Colors.cta + '22', borderColor: Colors.cta }]}>
              <Text style={styles.approvalNoteIcon}>⏳</Text>
              <Text style={[styles.approvalNoteText, { color: theme.text }]}>
                Votre compte sera examiné par notre équipe avant activation. Vous recevrez une confirmation.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#1A1A1A" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons
                  name={isLogin ? 'login' : 'how-to-reg'}
                  size={20}
                  color="#1A1A1A"
                />
                <Text style={styles.submitText}>
                  {isLogin ? 'Se connecter' : 'Soumettre ma demande'}
                </Text>
              </View>
            )}
          </TouchableOpacity>


          {/* Forgot password link (login only) */}
          {isLogin && (
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => router.push('/forgot-password')}
            >
              <Text style={[styles.forgotText, { color: Colors.primary }]}>
                Mot de passe oublié →
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.footer, { color: theme.textSecondary }]}>
          En continuant, vous acceptez les conditions d'utilisation de BurkinaBizz.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingBottom: 32 },
  header: {
    paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24, alignItems: 'center',
  },
  headerEmoji: { fontSize: 36 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#fff', marginTop: 6 },
  headerSub: { fontSize: 13, color: '#A5D6A7', marginTop: 6, textAlign: 'center' },
  formCard: {
    marginHorizontal: 16, marginTop: 0, marginBottom: 16,
    borderRadius: 18, borderTopLeftRadius: 0, borderTopRightRadius: 0,
    padding: 20, borderWidth: 1,
    elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8,
  },
  toggleRow: {
    flexDirection: 'row', borderRadius: 10, padding: 3, marginBottom: 20, overflow: 'hidden',
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  toggleText: { fontSize: 14, fontWeight: '700' },
  fieldWrapper: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderRadius: 10, paddingHorizontal: 12,
  },
  input: { flex: 1, paddingVertical: 13, fontSize: 15 },
  eyeBtn: { padding: 4 },
  errorText: { color: '#D32F2F', fontSize: 12, marginTop: 4 },
  forgotBtn: { alignSelf: 'flex-end', paddingVertical: 6, marginBottom: 8 },
  forgotText: { fontSize: 13, fontWeight: '700', margin: 'auto', textDecorationLine: 'underline' },
  approvalNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderWidth: 1.5, borderRadius: 10, padding: 12, marginBottom: 14,
  },
  approvalNoteIcon: { fontSize: 16 },
  approvalNoteText: { flex: 1, fontSize: 12, lineHeight: 18 },
  submitBtn: {
    backgroundColor: Colors.cta, paddingVertical: 15, borderRadius: 12,
    alignItems: 'center', marginTop: 4,
    elevation: 2, shadowColor: Colors.cta,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6,
  },
  submitText: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  footer: {
    textAlign: 'center', fontSize: 11, paddingHorizontal: 32, marginTop: 8, lineHeight: 16,
  },
});

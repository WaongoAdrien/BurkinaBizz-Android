// components/AppHeader.tsx — Shared top bar (same look as the home page header)

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ContentContainer } from './ContentContainer';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

export function AppHeader({ title, showBack = true, rightElement }: AppHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={Colors.headerGradient}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + 10 }]}
    >
      <ContentContainer maxWidth={600} style={{ paddingHorizontal: 10 }}>
        <View style={styles.row}>
          <View style={styles.left}>
            {showBack && (
              <TouchableOpacity
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.backBtn}
              >
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
          </View>
          <View style={styles.right}>
            {rightElement}
            <LanguageSwitcher />
          </View>
        </View>
      </ContentContainer>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 6, paddingBottom: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backBtn: { paddingRight: 6, paddingVertical: 4 },
  title: { fontSize: 20, fontWeight: '600', color: '#fff', letterSpacing: -0.3, flexShrink: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});

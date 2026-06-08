import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.bgBody }]}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  );
}

export function LoadingIndicator({ message }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.indicator}>
      <ActivityIndicator size="small" color={colors.accent} />
      {message && (
        <Text style={[styles.indicatorText, { color: colors.textSecondary }]}>{message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    fontSize: 16,
    marginTop: 8,
  },
  indicator: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  indicatorText: {
    fontSize: 14,
    marginTop: 4,
  },
});

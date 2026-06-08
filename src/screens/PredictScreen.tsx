import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { getRemainingFixtures } from '../api/client';
import { LoadingIndicator } from '../components/LoadingScreen';
import { ErrorBanner } from '../components/ErrorBanner';
import { OddsBar } from '../components/OddsBar';
import type { FixtureSummary } from '../api/types';
import type { PredictStackParams } from '../../App';

type Nav = NativeStackNavigationProp<PredictStackParams, 'PredictList'>;

export function PredictScreen() {
  const { colors, mode, toggle } = useTheme();
  const navigation = useNavigation<Nav>();
  const [fixtures, setFixtures] = useState<FixtureSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    getRemainingFixtures()
      .then(data => setFixtures(data.fixtures))
      .catch(e => setError('Failed to load fixtures'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search) return fixtures;
    const q = search.toLowerCase();
    return fixtures.filter(f => `${f.home} ${f.away}`.toLowerCase().includes(q));
  }, [fixtures, search]);

  const renderItem = ({ item }: { item: FixtureSummary }) => (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      onPress={() => navigation.navigate('PredictionDetail', { home: item.home, away: item.away })}
      activeOpacity={0.7}
    >
      <View style={styles.rowTop}>
        <Text style={[styles.teams, { color: colors.textHeading }]}>
          {item.home} vs {item.away}
        </Text>
        <Text style={[styles.xg, { color: colors.accent }]}>
          {item.xg.home} – {item.xg.away} xG
        </Text>
      </View>
      <OddsBar homeWin={item.odds.home_win} draw={item.odds.draw} awayWin={item.odds.away_win} height={28} />
      <View style={styles.oddsLabels}>
        <Text style={[styles.oddsLabel, { color: colors.textSecondary }]}>Home</Text>
        <Text style={[styles.oddsLabel, { color: colors.textSecondary }]}>Draw</Text>
        <Text style={[styles.oddsLabel, { color: colors.textSecondary }]}>Away</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bgBody }]}>
      <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.textHeading }]}>⚽ Match Prediction</Text>
          <Text onPress={toggle} style={{ fontSize: 20 }}>
            {mode === 'dark' ? '☀️' : '🌙'}
          </Text>
        </View>
        <TextInput
          style={[styles.search, { backgroundColor: colors.bgInput, color: colors.textPrimary, borderColor: colors.border }]}
          placeholder="Search teams..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {loading && <LoadingIndicator message="Loading fixtures..." />}
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}
      <FlatList
        data={filtered}
        keyExtractor={item => `${item.home}-${item.away}`}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? <Text style={[styles.empty, { color: colors.textSecondary }]}>No fixtures found</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  search: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  list: { padding: 12 },
  row: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  teams: { fontSize: 15, fontWeight: '700', flex: 1 },
  xg: { fontSize: 13, fontWeight: '600' },
  oddsLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  oddsLabel: { fontSize: 11 },
  empty: { textAlign: 'center', padding: 40, fontSize: 14 },
});

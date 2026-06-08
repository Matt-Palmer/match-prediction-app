import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getValueBets } from '../api/client';
import { LoadingIndicator } from '../components/LoadingScreen';
import { ErrorBanner } from '../components/ErrorBanner';
import { Card } from '../components/Card';
import type { ValueBet, ValueBetEdge } from '../api/types';

export function ValueBetsScreen() {
  const { colors } = useTheme();
  const [bets, setBets] = useState<ValueBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [hitFilter, setHitFilter] = useState<'' | 'hit' | 'miss'>('');

  const load = () => {
    setLoading(true);
    setError('');
    getValueBets()
      .then(r => setBets(r.value_bets))
      .catch(() => setError('Failed to load value bets'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Compute summary stats from full data
  const summary = useMemo(() => {
    const totalEdges = bets.reduce((s, vb) => s + vb.edges.length, 0);
    const hits = bets.reduce((s, vb) => s + vb.edges.filter(e => e.hit).length, 0);
    const hitRate = totalEdges > 0 ? Math.round(hits / totalEdges * 100) : 0;
    const avgEdge = totalEdges > 0 ? (bets.reduce((s, vb) => s + vb.edges.reduce((a, e) => a + Math.abs(e.edge), 0), 0) / totalEdges).toFixed(1) : '0';
    return { matches: bets.length, totalEdges, hits, hitRate, avgEdge };
  }, [bets]);

  // Filtered bets
  const filtered = useMemo(() => {
    let f = bets.map(vb => {
      let edges = vb.edges;
      if (outcomeFilter) edges = edges.filter(e => e.outcome === outcomeFilter);
      if (hitFilter === 'hit') edges = edges.filter(e => e.hit);
      if (hitFilter === 'miss') edges = edges.filter(e => !e.hit);
      return { ...vb, edges };
    }).filter(vb => vb.edges.length > 0);
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(vb => `${vb.home} ${vb.away}`.toLowerCase().includes(q));
    }
    return f;
  }, [bets, search, outcomeFilter, hitFilter]);

  // Distinct outcomes for filter
  const outcomes = useMemo(() => {
    const set = new Set<string>();
    bets.forEach(vb => vb.edges.forEach(e => set.add(e.outcome)));
    return [...set].sort();
  }, [bets]);

  if (loading) return <LoadingIndicator message="Loading value bets..." />;
  if (error) return <ErrorBanner message={error} onRetry={load} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.bgBody }]}>
      {/* Summary */}
      <View style={[styles.summaryRow, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <SummaryItem label="Matches" value={`${summary.matches}`} colors={colors} />
        <SummaryItem label="Total Bets" value={`${summary.totalEdges}`} colors={colors} />
        <SummaryItem label="Hits" value={`${summary.hits}/${summary.totalEdges}`} colors={colors} />
        <SummaryItem label="Hit Rate" value={`${summary.hitRate}%`} colors={colors} />
        <SummaryItem label="Avg Edge" value={`${summary.avgEdge}%`} colors={colors} />
      </View>

      {/* Search */}
      <TextInput
        style={[styles.search, { backgroundColor: colors.bgInput, color: colors.textHeading, borderColor: colors.border }]}
        placeholder="Search matches..."
        placeholderTextColor={colors.textSecondary}
        value={search}
        onChangeText={setSearch}
      />

      {/* Filter Chips */}
      <View style={styles.filters}>
        {/* Outcome filter */}
        <ScrollChips label="Outcome">
          <Chip active={outcomeFilter === ''} label="All" onPress={() => setOutcomeFilter('')} colors={colors} />
          {outcomes.map(o => (
            <Chip key={o} active={outcomeFilter === o} label={o} onPress={() => setOutcomeFilter(outcomeFilter === o ? '' : o)} colors={colors} />
          ))}
        </ScrollChips>
        {/* Hit filter */}
        <ScrollChips label="Result">
          <Chip active={hitFilter === ''} label="All" onPress={() => setHitFilter('')} colors={colors} />
          <Chip active={hitFilter === 'hit'} label="Hits" onPress={() => setHitFilter(hitFilter === 'hit' ? '' : 'hit')} colors={colors} />
          <Chip active={hitFilter === 'miss'} label="Misses" onPress={() => setHitFilter(hitFilter === 'miss' ? '' : 'miss')} colors={colors} />
        </ScrollChips>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item, i) => `${item.home}-${item.away}-${i}`}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.cardHeader}>
              <Text style={[styles.match, { color: colors.textHeading }]}>{item.home} vs {item.away}</Text>
              <Text style={[styles.date, { color: colors.textSecondary }]}>{item.date}</Text>
            </View>
            <Text style={[styles.result, { color: colors.textSecondary }]}>
              Result: {item.home} {item.actual_home_goals} – {item.actual_away_goals} {item.away}
            </Text>
            {item.edges.map((e, i) => (
              <EdgeRow key={i} edge={e} colors={colors} />
            ))}
          </Card>
        )}
        ListEmptyComponent={<Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 32 }}>No value bets match your filters.</Text>}
      />
    </View>
  );
}

function SummaryItem({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryValue, { color: colors.accent }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function EdgeRow({ edge, colors }: { edge: ValueBetEdge; colors: any }) {
  const isPos = edge.edge > 0;
  return (
    <View style={[styles.edge, { backgroundColor: isPos ? colors.greenBg : colors.redBg, borderColor: isPos ? colors.green : colors.red }]}>
      <View style={styles.edgeTop}>
        <Text style={[styles.edgeLabel, { color: colors.textHeading }]}>{edge.label}</Text>
        <Text style={[styles.edgeVal, { color: isPos ? colors.greenText : colors.redText }]}>
          {isPos ? '+' : ''}{edge.edge}%
        </Text>
      </View>
      <Text style={[styles.edgeDetail, { color: colors.textSecondary }]}>
        Model {edge.model_prob}% vs Book {edge.bookmaker_prob}%
      </Text>
      <View style={[styles.hitBadge, { backgroundColor: edge.hit ? colors.green : colors.red }]}>
        <Text style={styles.hitBadgeText}>{edge.hit ? '✓ Hit' : '✗ Miss'}</Text>
      </View>
    </View>
  );
}

function ScrollChips({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.chipSection}>
      <Text style={styles.chipSectionLabel}>{label}:</Text>
      <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>{children}</View>
    </View>
  );
}

function Chip({ active, label, onPress, colors }: { active: boolean; label: string; onPress: () => void; colors: any }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, {
        backgroundColor: active ? colors.accent : colors.bgInput,
        borderColor: active ? colors.accent : colors.border,
      }]}
    >
      <Text style={[styles.chipText, { color: active ? '#fff' : colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    margin: 12,
    marginBottom: 0,
    borderRadius: 8,
    borderWidth: 1,
  },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 16, fontWeight: '800' },
  summaryLabel: { fontSize: 9, textTransform: 'uppercase', marginTop: 2 },
  search: {
    margin: 12,
    marginBottom: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  filters: { paddingHorizontal: 12, paddingTop: 8, gap: 6 },
  chipSection: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipSectionLabel: { fontSize: 11, fontWeight: '600', color: '#8b949e' },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  chipText: { fontSize: 11, fontWeight: '600' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  match: { fontSize: 14, fontWeight: '700' },
  date: { fontSize: 11 },
  result: { fontSize: 12, marginBottom: 8 },
  edge: {
    borderRadius: 6,
    borderWidth: 1,
    padding: 8,
    marginBottom: 6,
  },
  edgeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  edgeLabel: { fontSize: 13, fontWeight: '600' },
  edgeVal: { fontSize: 14, fontWeight: '800' },
  edgeDetail: { fontSize: 11, marginTop: 2 },
  hitBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 6,
  },
  hitBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});

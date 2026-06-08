import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getLeagueTable } from '../api/client';
import { LoadingIndicator } from '../components/LoadingScreen';
import { ErrorBanner } from '../components/ErrorBanner';
import { Card } from '../components/Card';
import type { LeagueTableRow } from '../api/types';

type SortCol = keyof LeagueTableRow;

const COLUMNS: { key: SortCol; label: string; width: number; tip?: string }[] = [
  { key: 'position', label: 'Pos', width: 32 },
  { key: 'team', label: 'Team', width: 110 },
  { key: 'played', label: 'P', width: 30, tip: 'Played' },
  { key: 'won', label: 'W', width: 30, tip: 'Won' },
  { key: 'drawn', label: 'D', width: 30, tip: 'Drawn' },
  { key: 'lost', label: 'L', width: 30, tip: 'Lost' },
  { key: 'gf', label: 'GF', width: 34, tip: 'Goals For' },
  { key: 'ga', label: 'GA', width: 34, tip: 'Goals Against' },
  { key: 'gd', label: 'GD', width: 36, tip: 'Goal Difference' },
  { key: 'npxg', label: 'NPxG', width: 50, tip: 'Non-Penalty xG' },
  { key: 'npxga', label: 'NPxGA', width: 50, tip: 'Non-Penalty xGA' },
  { key: 'npxgd', label: 'NPxGD', width: 50, tip: 'NP xG Difference' },
  { key: 'ppda', label: 'PPDA', width: 50, tip: 'Passes Per Defensive Action' },
  { key: 'dc', label: 'DC', width: 36, tip: 'Deep Completions' },
  { key: 'points', label: 'Pts', width: 34, tip: 'Points' },
  { key: 'xpts', label: 'xPts', width: 42, tip: 'Expected Points' },
  { key: 'xpts_diff', label: '±', width: 42, tip: 'Points minus xPts' },
];

export function LeagueTableScreen() {
  const { colors } = useTheme();
  const [data, setData] = useState<LeagueTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortCol, setSortCol] = useState<SortCol>('position');
  const [sortAsc, setSortAsc] = useState(true);

  const load = () => {
    setLoading(true);
    setError('');
    getLeagueTable()
      .then(r => setData(r.table))
      .catch(() => setError('Failed to load table'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSort = useCallback((col: SortCol) => {
    if (sortCol === col) {
      setSortAsc(prev => !prev);
    } else {
      setSortCol(col);
      setSortAsc(col === 'team');
    }
  }, [sortCol]);

  if (loading) return <LoadingIndicator message="Loading table..." />;
  if (error) return <ErrorBanner message={error} onRetry={load} />;

  const sorted = [...data].sort((a, b) => {
    let va: any = a[sortCol] ?? 0;
    let vb: any = b[sortCol] ?? 0;
    if (typeof va === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortAsc ? va - vb : vb - va;
  });

  const gdColor = (v: number) => v > 0 ? colors.greenText : v < 0 ? colors.redText : colors.textSecondary;
  const fmtGd = (v: number) => v > 0 ? `+${v}` : `${v}`;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgBody }]} contentContainerStyle={styles.content}>
      <Card>
        <View style={styles.tableWrapper}>
          {/* Frozen left columns */}
          <View style={styles.frozenCol}>
            {/* Frozen header */}
            <View style={[styles.headerRow, { backgroundColor: colors.bgInput }]}>
              <Pressable onPress={() => handleSort('position')} style={[styles.headerCell, { width: 32 }]}>
                <Text style={[styles.headerText, { color: colors.textSecondary }]}>Pos{sortCol === 'position' ? (sortAsc ? ' ▲' : ' ▼') : ''}</Text>
              </Pressable>
              <Pressable onPress={() => handleSort('team')} style={[styles.headerCell, { width: 110 }]}>
                <Text style={[styles.headerText, { color: colors.textSecondary }]}>Team{sortCol === 'team' ? (sortAsc ? ' ▲' : ' ▼') : ''}</Text>
              </Pressable>
            </View>
            {/* Frozen rows */}
            {sorted.map(r => (
              <View key={r.team} style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                <Text style={[styles.cell, { width: 32, color: colors.textSecondary, fontWeight: '700' }]}>{r.position}</Text>
                <Text style={[styles.cell, { width: 110, color: colors.textHeading, fontWeight: '600', textAlign: 'left' }]} numberOfLines={1}>{r.team}</Text>
              </View>
            ))}
          </View>

          {/* Scrollable data columns */}
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              {/* Scrollable header */}
              <View style={[styles.headerRow, { backgroundColor: colors.bgInput }]}>
                {COLUMNS.filter(c => c.key !== 'position' && c.key !== 'team').map(c => (
                  <Pressable key={c.key} onPress={() => handleSort(c.key)} style={[styles.headerCell, { width: c.width }]}>
                    <Text style={[styles.headerText, { color: colors.textSecondary }]}>
                      {c.label}
                      {sortCol === c.key ? (sortAsc ? ' ▲' : ' ▼') : ''}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {/* Scrollable rows */}
              {sorted.map(r => (
                <View key={r.team} style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                  <Text style={[styles.cell, { width: 30, color: colors.textHeading }]}>{r.played}</Text>
                  <Text style={[styles.cell, { width: 30, color: colors.textHeading }]}>{r.won}</Text>
                  <Text style={[styles.cell, { width: 30, color: colors.textHeading }]}>{r.drawn}</Text>
                  <Text style={[styles.cell, { width: 30, color: colors.textHeading }]}>{r.lost}</Text>
                  <Text style={[styles.cell, { width: 34, color: colors.textHeading }]}>{r.gf}</Text>
                  <Text style={[styles.cell, { width: 34, color: colors.textHeading }]}>{r.ga}</Text>
                  <Text style={[styles.cell, { width: 36, color: gdColor(r.gd), fontWeight: '700' }]}>{fmtGd(r.gd)}</Text>
                  <Text style={[styles.cell, { width: 50, color: colors.textHeading }]}>{r.npxg?.toFixed(2) ?? '0.00'}</Text>
                  <Text style={[styles.cell, { width: 50, color: colors.textHeading }]}>{r.npxga?.toFixed(2) ?? '0.00'}</Text>
                  <Text style={[styles.cell, { width: 50, color: gdColor(r.npxgd ?? 0), fontWeight: '700' }]}>
                    {(r.npxgd ?? 0) > 0 ? '+' : ''}{r.npxgd?.toFixed(2) ?? '0.00'}
                  </Text>
                  <Text style={[styles.cell, { width: 50, color: colors.textHeading }]}>{r.ppda?.toFixed(2) ?? '0.00'}</Text>
                  <Text style={[styles.cell, { width: 36, color: colors.textHeading }]}>{r.dc ?? 0}</Text>
                  <Text style={[styles.cell, { width: 34, color: colors.accent, fontWeight: '800' }]}>{r.points}</Text>
                  <Text style={[styles.cell, { width: 42, color: colors.textHeading }]}>{r.xpts}</Text>
                  <Text style={[styles.cell, { width: 42, color: gdColor(r.xpts_diff), fontWeight: '700' }]}>
                    {r.xpts_diff > 0 ? '+' : ''}{r.xpts_diff}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 12 },
  tableWrapper: { flexDirection: 'row' },
  frozenCol: { zIndex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', height: 36, paddingHorizontal: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', height: 32, paddingHorizontal: 2 },
  headerCell: { },
  headerText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  cell: { fontSize: 12, textAlign: 'center' },
});

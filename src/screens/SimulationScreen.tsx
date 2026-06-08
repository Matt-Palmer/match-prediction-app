import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getSimulation, getGoalDistributions, getTeams } from '../api/client';
import { LoadingIndicator } from '../components/LoadingScreen';
import { ErrorBanner } from '../components/ErrorBanner';
import { Card } from '../components/Card';
import type { SimulationTeam, GoalDistribution } from '../api/types';

export function SimulationScreen() {
  const { colors } = useTheme();
  const [simulation, setSimulation] = useState<SimulationTeam[]>([]);
  const [distributions, setDistributions] = useState<Record<string, GoalDistribution>>({});
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([getSimulation(), getGoalDistributions(), getTeams()])
      .then(([simResp, distResp, teamsResp]) => {
        setSimulation(simResp.simulation);
        setDistributions(distResp.distributions);
        setTeams(teamsResp.teams);
      })
      .catch(() => setError('Failed to load simulation'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingIndicator message="Running simulations..." />;
  if (error) return <ErrorBanner message={error} onRetry={load} />;

  const fmtPct = (v: number) => {
    if (v === 0) return '0%';
    if (v === 100) return '100%';
    if (v > 0 && v < 0.1) return '<0.1%';
    if (v > 99.9 && v < 100) return '>99.9%';
    return `${v}%`;
  };

  const dist = selectedTeam ? distributions[selectedTeam] : null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgBody }]} contentContainerStyle={styles.content}>
      <Card title="Season Simulation">
        <View style={styles.tableWrapper}>
          {/* Frozen left columns */}
          <View style={styles.frozenCol}>
            <View style={[styles.headerRow, { backgroundColor: colors.bgInput }]}>
              <Text style={[styles.cell, styles.rankCol, { color: colors.textSecondary }]}>#</Text>
              <Text style={[styles.cell, styles.teamCol, { color: colors.textSecondary }]}>Team</Text>
            </View>
            {simulation.map((r, i) => (
              <View key={r.team} style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                <Text style={[styles.cell, styles.rankCol, { color: colors.textSecondary, fontWeight: '700' }]}>{i + 1}</Text>
                <Text style={[styles.cell, styles.teamCol, { color: colors.textHeading, fontWeight: '600' }]} numberOfLines={1}>{r.team}</Text>
              </View>
            ))}
          </View>

          {/* Scrollable data columns */}
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              <View style={[styles.headerRow, { backgroundColor: colors.bgInput }]}>
                <Text style={[styles.cell, styles.numCol, { color: colors.textSecondary }]}>Pts</Text>
                <Text style={[styles.cell, styles.numCol, { color: colors.textSecondary }]}>Avg</Text>
                <Text style={[styles.cell, styles.numCol, { color: colors.textSecondary }]}>Range</Text>
                <Text style={[styles.cell, styles.numCol, { color: colors.textSecondary }]}>Win</Text>
                <Text style={[styles.cell, styles.numCol, { color: colors.textSecondary }]}>Top 4</Text>
                <Text style={[styles.cell, styles.numCol, { color: colors.textSecondary }]}>Rel</Text>
              </View>
              {simulation.map((r, i) => {
                const winColor = r.win_league_pct > 50 ? colors.greenText : r.win_league_pct > 10 ? colors.accent : colors.textSecondary;
                const t4Color = r.top4_pct > 50 ? colors.greenText : r.top4_pct > 10 ? colors.accent : colors.textSecondary;
                const relColor = r.relegated_pct > 30 ? colors.redText : r.relegated_pct > 10 ? '#d29922' : colors.textSecondary;
                return (
                  <View key={r.team} style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                    <Text style={[styles.cell, styles.numCol, { color: colors.textHeading }]}>{r.current_points}</Text>
                    <Text style={[styles.cell, styles.numCol, { color: colors.accent, fontWeight: '700' }]}>{r.avg_final_points}</Text>
                    <Text style={[styles.cell, styles.numCol, { color: colors.textSecondary }]}>{r.min_points}–{r.max_points}</Text>
                    <Text style={[styles.cell, styles.numCol, { color: winColor, fontWeight: '700' }]}>{fmtPct(r.win_league_pct)}</Text>
                    <Text style={[styles.cell, styles.numCol, { color: t4Color, fontWeight: '700' }]}>{fmtPct(r.top4_pct)}</Text>
                    <Text style={[styles.cell, styles.numCol, { color: relColor, fontWeight: '700' }]}>{fmtPct(r.relegated_pct)}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </Card>

      {/* Goal Distribution Picker */}
      <Card title="Goal Distributions">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {teams.map(t => (
              <Pressable
                key={t}
                onPress={() => setSelectedTeam(selectedTeam === t ? '' : t)}
                style={[styles.chip, {
                  backgroundColor: selectedTeam === t ? colors.accent : colors.bgInput,
                  borderColor: selectedTeam === t ? colors.accent : colors.border,
                }]}
              >
                <Text style={[styles.chipText, { color: selectedTeam === t ? '#fff' : colors.textSecondary }]}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {dist && (
          <View style={styles.distGrid}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.distTitle, { color: colors.textSecondary }]}>Goals Scored (avg {dist.avg_goals_scored})</Text>
              <View style={styles.distBars}>
                {dist.scoring_distribution.map((v, i) => {
                  const maxVal = Math.max(...dist.scoring_distribution);
                  const pct = maxVal > 0 ? (v / maxVal) * 100 : 0;
                  return (
                    <View key={i} style={styles.distBarCol}>
                      <View style={[styles.distBar, { height: `${Math.max(pct, 3)}%`, backgroundColor: colors.green }]} />
                      <Text style={[styles.distLabel, { color: colors.textSecondary }]}>{i}</Text>
                      <Text style={[styles.distPct, { color: colors.textSecondary }]}>{v}%</Text>
                    </View>
                  );
                })}
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.distTitle, { color: colors.textSecondary }]}>Goals Conceded (avg {dist.avg_goals_conceded})</Text>
              <View style={styles.distBars}>
                {dist.conceding_distribution.map((v, i) => {
                  const maxVal = Math.max(...dist.conceding_distribution);
                  const pct = maxVal > 0 ? (v / maxVal) * 100 : 0;
                  return (
                    <View key={i} style={styles.distBarCol}>
                      <View style={[styles.distBar, { height: `${Math.max(pct, 3)}%`, backgroundColor: colors.red }]} />
                      <Text style={[styles.distLabel, { color: colors.textSecondary }]}>{i}</Text>
                      <Text style={[styles.distPct, { color: colors.textSecondary }]}>{v}%</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 12 },
  tableWrapper: { flexDirection: 'row' },
  frozenCol: { zIndex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', height: 36, paddingHorizontal: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', height: 32, paddingHorizontal: 4 },
  cell: { fontSize: 12 },
  rankCol: { width: 28, textAlign: 'center' },
  teamCol: { width: 110 },
  numCol: { width: 55, textAlign: 'right' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '600' },
  distGrid: { flexDirection: 'row', gap: 16 },
  distTitle: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  distBars: { flexDirection: 'row', height: 100, alignItems: 'flex-end', gap: 3 },
  distBarCol: { alignItems: 'center', flex: 1 },
  distBar: { width: '100%', borderRadius: 2, minHeight: 3 },
  distLabel: { fontSize: 9, marginTop: 2 },
  distPct: { fontSize: 8 },
});

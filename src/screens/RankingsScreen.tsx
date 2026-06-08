import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getRankings } from '../api/client';
import { LoadingIndicator } from '../components/LoadingScreen';
import { ErrorBanner } from '../components/ErrorBanner';
import { Card } from '../components/Card';
import type { RankingsResponse, RankingTeam } from '../api/types';

export function RankingsScreen() {
  const { colors } = useTheme();
  const [data, setData] = useState<RankingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    getRankings()
      .then(setData)
      .catch(() => setError('Failed to load rankings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingIndicator message="Loading rankings..." />;
  if (error) return <ErrorBanner message={error} onRetry={load} />;
  if (!data) return null;

  const xgBlendLabel = data.xg_blend === 0 ? 'Goals' : `xG×${data.xg_blend}`;
  const maxAtk = Math.max(...data.rankings.map(r => r.attack));
  const maxDef = Math.max(...data.rankings.map(r => r.defense));

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgBody }]} contentContainerStyle={styles.content}>
      {/* Model Diagnostics */}
      <Card title="Model Diagnostics">
        <View style={styles.diagGrid}>
          <DiagStat label="Avg Home Advantage (γ)" value={`${data.gamma}`} colors={colors} />
          <DiagStat label="Correlation (ρ)" value={`${data.rho}`} colors={colors} />
          <DiagStat label="Fitted Decay (ξ)" value={data.xi !== undefined ? `${data.xi}` : 'N/A'} colors={colors} />
          <DiagStat label="Fitting Basis" value={xgBlendLabel} colors={colors} />
          <DiagStat label="Model Accuracy" value={`${data.accuracy.accuracy}%`} colors={colors} />
          <DiagStat label="Correct Predictions" value={`${data.accuracy.correct}/${data.accuracy.total}`} colors={colors} />
        </View>
      </Card>

      {/* Calibration Chart */}
      {data.calibration.length > 0 && (
        <Card title="Calibration">
          <View style={styles.calChart}>
            {data.calibration.map((c, i) => {
              const maxVal = Math.max(...data.calibration.map(x => Math.max(x.predicted, x.actual)), 1);
              const pH = Math.max((c.predicted / maxVal) * 100, 3);
              const aH = Math.max((c.actual / maxVal) * 100, 3);
              return (
                <View key={i} style={styles.calGroup}>
                  <View style={styles.calBars}>
                    <View style={[styles.calBar, { height: `${pH}%`, backgroundColor: colors.accent + '66' }]} />
                    <View style={[styles.calBar, { height: `${aH}%`, backgroundColor: colors.greenText }]} />
                  </View>
                  <Text style={[styles.calLabel, { color: colors.textSecondary }]}>{c.predicted}%</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.calLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.accent + '66' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Predicted</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.greenText }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Actual</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Rankings Table */}
      <Card title="Power Rankings">
        <View style={styles.tableWrapper}>
          {/* Frozen left columns */}
          <View style={styles.frozenCol}>
            <View style={[styles.rankHeaderRow, { backgroundColor: colors.bgInput }]}>
              <Text style={[styles.rankCell, styles.rankNum, { color: colors.textSecondary }]}>#</Text>
              <Text style={[styles.rankCell, styles.rankTeam, { color: colors.textSecondary }]}>Team</Text>
            </View>
            {data.rankings.map(r => (
              <View key={r.team} style={[styles.rankRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                <Text style={[styles.rankCell, styles.rankNum, { color: colors.textSecondary, fontWeight: '700' }]}>{r.rank}</Text>
                <Text style={[styles.rankCell, styles.rankTeam, { color: colors.textHeading, fontWeight: '600' }]} numberOfLines={1}>{r.team}</Text>
              </View>
            ))}
          </View>

          {/* Scrollable data columns */}
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              <View style={[styles.rankHeaderRow, { backgroundColor: colors.bgInput }]}>
                <Text style={[styles.rankCell, styles.statCell, { color: colors.textSecondary }]}>Attack</Text>
                <View style={{ width: 80 }} />
                <Text style={[styles.rankCell, styles.statCell, { color: colors.textSecondary }]}>Defence</Text>
                <View style={{ width: 80 }} />
                <Text style={[styles.rankCell, styles.statCell, { color: colors.textSecondary }]}>γ</Text>
                <Text style={[styles.rankCell, styles.statCell, { color: colors.textSecondary }]}>Rating</Text>
              </View>
              {data.rankings.map(r => {
                const tGamma = data.gamma_by_team[r.team];
                const gammaStr = tGamma !== undefined ? tGamma.toFixed(3) : '—';
                const gammaColor = tGamma > 1.05 ? colors.greenText : tGamma < 0.95 ? colors.redText : colors.textSecondary;
                return (
                  <View key={r.team} style={[styles.rankRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                    <Text style={[styles.rankCell, styles.statCell, { color: colors.textHeading }]}>{r.attack}</Text>
                    <View style={[styles.barTrack, { backgroundColor: colors.bgInput, width: 80 }]}>
                      <View style={[styles.barFill, { width: `${(r.attack / maxAtk) * 100}%`, backgroundColor: colors.green }]} />
                    </View>
                    <Text style={[styles.rankCell, styles.statCell, { color: colors.textHeading }]}>{r.defense}</Text>
                    <View style={[styles.barTrack, { backgroundColor: colors.bgInput, width: 80 }]}>
                      <View style={[styles.barFill, { width: `${(r.defense / maxDef) * 100}%`, backgroundColor: colors.red }]} />
                    </View>
                    <Text style={[styles.rankCell, styles.statCell, { color: gammaColor }]}>{gammaStr}</Text>
                    <Text style={[styles.rankCell, styles.statCell, { color: colors.accent, fontWeight: '800' }]}>{r.rating}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </Card>
    </ScrollView>
  );
}

function DiagStat({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.diagItem}>
      <Text style={[styles.diagValue, { color: colors.accent }]}>{value}</Text>
      <Text style={[styles.diagLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 12 },
  diagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  diagItem: {
    width: '30%',
    alignItems: 'center',
    padding: 8,
  },
  diagValue: { fontSize: 16, fontWeight: '800' },
  diagLabel: { fontSize: 9, textTransform: 'uppercase', textAlign: 'center', marginTop: 2, letterSpacing: 0.3 },
  calChart: { flexDirection: 'row', height: 100, gap: 4, alignItems: 'flex-end', marginBottom: 6 },
  calGroup: { flex: 1, alignItems: 'center' },
  calBars: { flexDirection: 'row', flex: 1, gap: 2, alignItems: 'flex-end', width: '100%' },
  calBar: { flex: 1, borderRadius: 2, minHeight: 3 },
  calLabel: { fontSize: 8, marginTop: 2 },
  calLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10 },
  tableWrapper: { flexDirection: 'row' },
  frozenCol: { zIndex: 1 },
  rankRow: { flexDirection: 'row', alignItems: 'center', height: 36, paddingHorizontal: 4 },
  rankHeaderRow: { flexDirection: 'row', alignItems: 'center', height: 32, paddingHorizontal: 4 },
  rankCell: { fontSize: 12 },
  rankNum: { width: 28, textAlign: 'center' },
  rankTeam: { width: 110 },
  statCell: { width: 50, textAlign: 'center' },
  barTrack: { height: 10, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
});

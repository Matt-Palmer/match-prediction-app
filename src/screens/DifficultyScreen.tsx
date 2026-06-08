import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getFixtureDifficulty } from '../api/client';
import { LoadingIndicator } from '../components/LoadingScreen';
import { ErrorBanner } from '../components/ErrorBanner';
import { Card } from '../components/Card';
import type { TeamDifficulty, FixtureDifficultyItem } from '../api/types';

export function DifficultyScreen() {
  const { colors } = useTheme();
  const [difficulty, setDifficulty] = useState<Record<string, TeamDifficulty>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tooltip, setTooltip] = useState<{ team: string; idx: number } | null>(null);

  const load = () => {
    setLoading(true);
    setError('');
    getFixtureDifficulty()
      .then(r => setDifficulty(r.difficulty))
      .catch(() => setError('Failed to load difficulty'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Sort by avg difficulty ascending (easiest first)
  const teams = useMemo(() => {
    return Object.keys(difficulty).sort((a, b) => difficulty[a].avg_difficulty - difficulty[b].avg_difficulty);
  }, [difficulty]);

  // Compute percentile thresholds for avg_difficulty colour
  const avgDiffs = useMemo(() => {
    const sorted = teams.map(t => difficulty[t].avg_difficulty).sort((a, b) => a - b);
    return {
      p33: sorted[Math.floor(sorted.length * 0.33)] || 0,
      p67: sorted[Math.floor(sorted.length * 0.67)] || 1,
    };
  }, [teams, difficulty]);

  if (loading) return <LoadingIndicator message="Loading difficulty..." />;
  if (error) return <ErrorBanner message={error} onRetry={load} />;

  const bandColor = (band: string) =>
    band === 'easy' ? colors.green : band === 'hard' ? colors.red : '#d29922';

  const avgColor = (avg: number) =>
    avg <= avgDiffs.p33 ? colors.greenText : avg >= avgDiffs.p67 ? colors.redText : '#d29922';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgBody }]} contentContainerStyle={styles.content}>
      <Card title="Fixture Difficulty Tracker">
        {teams.map(team => {
          const d = difficulty[team];
          return (
            <View key={team} style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[styles.team, { color: colors.textHeading }]} numberOfLines={1}>{team}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pips}>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {d.fixtures.map((f, idx) => {
                    const isActive = tooltip?.team === team && tooltip.idx === idx;
                    return (
                      <View key={idx}>
                        <Pressable
                          onPress={() => setTooltip(isActive ? null : { team, idx })}
                          style={[styles.pip, { backgroundColor: bandColor(f.band) }]}
                        >
                          <Text style={styles.pipVenue}>{f.venue}</Text>
                        </Pressable>
                        {isActive && (
                          <View style={[styles.tooltip, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                            <Text style={[styles.tooltipText, { color: colors.textHeading }]}>
                              {f.opponent} ({f.venue})
                            </Text>
                            <Text style={[styles.tooltipText, { color: colors.textSecondary }]}>
                              Difficulty: {f.difficulty}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
              <Text style={[styles.avg, { color: avgColor(d.avg_difficulty) }]}>{d.avg_difficulty}</Text>
            </View>
          );
        })}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  team: { width: 100, fontSize: 12, fontWeight: '600' },
  pips: { flex: 1 },
  pip: { width: 24, height: 24, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  pipVenue: { color: '#fff', fontSize: 8, fontWeight: '700' },
  avg: { width: 40, fontSize: 13, fontWeight: '800', textAlign: 'right' },
  tooltip: {
    position: 'absolute',
    top: 28,
    left: -30,
    width: 130,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  tooltipText: { fontSize: 11, fontWeight: '600' },
});

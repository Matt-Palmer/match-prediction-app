import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { getPredict } from '../api/client';
import { LoadingIndicator } from '../components/LoadingScreen';
import { ErrorBanner } from '../components/ErrorBanner';
import { Card } from '../components/Card';
import { OddsBar } from '../components/OddsBar';
import type { Prediction, FormMatch } from '../api/types';
import type { PredictStackParams } from '../../App';

type DetailRoute = RouteProp<PredictStackParams, 'PredictionDetail'>;

export function PredictionDetailScreen() {
  const { colors } = useTheme();
  const route = useRoute<DetailRoute>();
  const { home, away } = route.params;
  const [data, setData] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    getPredict(home, away)
      .then(setData)
      .catch(() => setError('Failed to load prediction'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [home, away]);

  if (loading) return <LoadingIndicator message="Loading prediction..." />;
  if (error) return <ErrorBanner message={error} onRetry={load} />;
  if (!data) return null;

  const hasActuals = data.actuals && data.actuals.actual_home_goals !== null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgBody }]} contentContainerStyle={styles.content}>
      {/* Actual Result Banner */}
      {hasActuals && data.actuals && (
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Actual Result</Text>
          <Text style={[styles.bigScore, { color: colors.textHeading }]}>
            {data.home_team} {data.actuals.actual_home_goals} – {data.actuals.actual_away_goals} {data.away_team}
          </Text>
          {(() => {
            const predicted = Object.entries(data.odds).sort((a, b) => b[1] - a[1])[0][0];
            const isCorrect = predicted === data.actuals!.actual_result;
            return (
              <Text style={[styles.verdict, { color: isCorrect ? colors.greenText : colors.redText }]}>
                Model predicted {predicted.replace('_', ' ')} — {isCorrect ? '✓ Correct' : '✗ Wrong'}
              </Text>
            );
          })()}
        </Card>
      )}

      {/* xG */}
      <Card title="Expected Goals">
        <View style={styles.xgRow}>
          <View style={styles.xgBox}>
            <Text style={[styles.xgValue, { color: colors.accent }]}>{data.xg.home}</Text>
            <Text style={[styles.xgLabel, { color: colors.textSecondary }]}>{data.home_team}</Text>
          </View>
          <Text style={[styles.xgDash, { color: colors.textSecondary }]}>–</Text>
          <View style={styles.xgBox}>
            <Text style={[styles.xgValue, { color: colors.accent }]}>{data.xg.away}</Text>
            <Text style={[styles.xgLabel, { color: colors.textSecondary }]}>{data.away_team}</Text>
          </View>
        </View>
        {data.actual_xg && (
          <View style={[styles.xgRow, { marginTop: 4 }]}>
            <View style={styles.xgBox}>
              <Text style={[styles.xgValueSmall, { color: colors.greenText }]}>{data.actual_xg.home}</Text>
              <Text style={[styles.xgLabel, { color: colors.textSecondary }]}>Actual xG</Text>
            </View>
            <Text style={[styles.xgDash, { color: colors.textSecondary }]}>–</Text>
            <View style={styles.xgBox}>
              <Text style={[styles.xgValueSmall, { color: colors.redText }]}>{data.actual_xg.away}</Text>
              <Text style={[styles.xgLabel, { color: colors.textSecondary }]}>Actual xG</Text>
            </View>
          </View>
        )}
      </Card>

      {/* Match Odds */}
      <Card title="Match Odds">
        <OddsBar homeWin={data.odds.home_win} draw={data.odds.draw} awayWin={data.odds.away_win} />
        <View style={styles.oddsLabels}>
          <Text style={[styles.oddsLabel, { color: colors.textSecondary }]}>Home {data.odds.home_win}%</Text>
          <Text style={[styles.oddsLabel, { color: colors.textSecondary }]}>Draw {data.odds.draw}%</Text>
          <Text style={[styles.oddsLabel, { color: colors.textSecondary }]}>Away {data.odds.away_win}%</Text>
        </View>
      </Card>

      {/* Markets Grid: Clean Sheet + BTTS */}
      <Card title="Markets">
        <View style={styles.marketGrid}>
          <MarketBox label={`${data.home_team} CS`} value={`${data.clean_sheet.home}%`} colors={colors} />
          <MarketBox label={`${data.away_team} CS`} value={`${data.clean_sheet.away}%`} colors={colors} />
          <MarketBox label="BTTS Yes" value={`${data.btts.yes}%`} colors={colors} />
        </View>
        <View style={[styles.marketGrid, { marginTop: 8 }]}>
          <MarketBox label="1X" value={`${data.double_chance.home_or_draw}%`} colors={colors} />
          <MarketBox label="X2" value={`${data.double_chance.away_or_draw}%`} colors={colors} />
          <MarketBox label="12" value={`${data.double_chance.home_or_away}%`} colors={colors} />
        </View>
      </Card>

      {/* Over/Under */}
      <Card title="Over / Under">
        {Object.entries(data.over_under).map(([line, v]) => (
          <View key={line} style={styles.ouRow}>
            <Text style={[styles.ouLine, { color: colors.textHeading }]}>{line}</Text>
            <View style={[styles.ouBar, { backgroundColor: colors.bgInput }]}>
              <View style={[styles.ouFillOver, { width: `${v.over}%`, backgroundColor: colors.green }]} />
            </View>
            <Text style={[styles.ouPct, { color: colors.greenText }]}>{v.over}%</Text>
            <Text style={[styles.ouPct, { color: colors.redText }]}>{v.under}%</Text>
          </View>
        ))}
      </Card>

      {/* Model Comparison */}
      {data.model_comparison && (
        <Card title={`Model Comparison (ρ = ${data.model_comparison.rho})`}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginBottom: 8 }]}>Dixon-Coles</Text>
          <OddsBar
            homeWin={data.model_comparison.dixon_coles.home_win}
            draw={data.model_comparison.dixon_coles.draw}
            awayWin={data.model_comparison.dixon_coles.away_win}
            height={28}
          />
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 12, marginBottom: 8 }]}>Basic Poisson</Text>
          <OddsBar
            homeWin={data.model_comparison.basic_poisson.home_win}
            draw={data.model_comparison.basic_poisson.draw}
            awayWin={data.model_comparison.basic_poisson.away_win}
            height={28}
          />
          <Text style={[styles.rhoEffect, { color: colors.textSecondary }]}>
            ρ effect: H {data.model_comparison.rho_effect.home_win > 0 ? '+' : ''}{data.model_comparison.rho_effect.home_win}%,
            D {data.model_comparison.rho_effect.draw > 0 ? '+' : ''}{data.model_comparison.rho_effect.draw}%,
            A {data.model_comparison.rho_effect.away_win > 0 ? '+' : ''}{data.model_comparison.rho_effect.away_win}%
          </Text>
        </Card>
      )}

      {/* Top Scorelines */}
      <Card title="Most Likely Scorelines">
        {data.top_scorelines.map((s, i) => {
          const isActual = hasActuals && data.actuals &&
            s.home_goals === data.actuals.actual_home_goals &&
            s.away_goals === data.actuals.actual_away_goals;
          return (
            <View key={i} style={[styles.scorelineRow, isActual && { backgroundColor: colors.greenBg, borderRadius: 6 }]}>
              <Text style={[styles.scoreline, { color: colors.textHeading }]}>
                {data.home_team} {s.home_goals} – {s.away_goals} {data.away_team}
                {isActual ? ' ✓' : ''}
              </Text>
              <Text style={[styles.scorelineProb, { color: colors.accent }]}>{s.probability}%</Text>
            </View>
          );
        })}
      </Card>

      {/* Score Groups */}
      <Card title="Score Groups">
        {data.score_groups.map((g, i) => {
          const maxProb = Math.max(...data.score_groups.map(x => x.probability));
          const barWidth = maxProb > 0 ? (g.probability / maxProb) * 100 : 0;
          const barColor = g.group.startsWith('Home') ? colors.green : g.group.startsWith('Away') ? colors.red : colors.grey;
          return (
            <View key={i} style={styles.scoreGroupRow}>
              <Text style={[styles.scoreGroupLabel, { color: colors.textSecondary }]}>{g.group}</Text>
              <View style={[styles.scoreGroupTrack, { backgroundColor: colors.bgInput }]}>
                <View style={[styles.scoreGroupFill, { width: `${barWidth}%`, backgroundColor: barColor }]} />
              </View>
              <Text style={[styles.scoreGroupPct, { color: colors.textHeading }]}>{g.probability}%</Text>
            </View>
          );
        })}
      </Card>

      {/* Form Adjustment */}
      {data.form_adjustment && (
        <Card title="Form Adjustment">
          <View style={styles.formAdjGrid}>
            <View style={styles.formAdjCol}>
              <Text style={[styles.formAdjTeam, { color: colors.textHeading }]}>{data.home_team} (H)</Text>
              <FormAdjValue label="Attack" value={data.form_adjustment.home_attack} colors={colors} />
              <FormAdjValue label="Defence" value={data.form_adjustment.home_defence} colors={colors} />
            </View>
            <View style={styles.formAdjCol}>
              <Text style={[styles.formAdjTeam, { color: colors.textHeading }]}>{data.away_team} (A)</Text>
              <FormAdjValue label="Attack" value={data.form_adjustment.away_attack} colors={colors} />
              <FormAdjValue label="Defence" value={data.form_adjustment.away_defence} colors={colors} />
            </View>
          </View>
        </Card>
      )}

      {/* Recent Form */}
      {data.home_form.length > 0 && (
        <Card title="Recent Form">
          <FormSection team={data.home_team} form={data.home_form} colors={colors} />
          <View style={{ height: 16 }} />
          <FormSection team={data.away_team} form={data.away_form} colors={colors} />
        </Card>
      )}

      {/* Head to Head */}
      <Card title="Head-to-Head (This Season)">
        {data.h2h.length === 0 ? (
          <Text style={[styles.muted, { color: colors.textSecondary }]}>No head-to-head matches this season.</Text>
        ) : (
          data.h2h.map((m, i) => (
            <Text key={i} style={[styles.h2hMatch, { color: colors.textHeading }]}>
              {m.home} {m.home_goals} – {m.away_goals} {m.away}  <Text style={{ color: colors.textSecondary }}>{m.date}</Text>
            </Text>
          ))
        )}
      </Card>

      {/* Probability Matrix */}
      <Card title="Scoreline Probability Matrix">
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View>
            {/* Header row */}
            <View style={styles.matrixRow}>
              <View style={[styles.matrixCell, styles.matrixHeader, { backgroundColor: colors.bgInput }]}>
                <Text style={[styles.matrixText, { color: colors.textSecondary }]}> </Text>
              </View>
              {data.matrix[0].map((_, j) => (
                <View key={j} style={[styles.matrixCell, styles.matrixHeader, { backgroundColor: colors.bgInput }]}>
                  <Text style={[styles.matrixText, { color: colors.red, fontWeight: '700' }]}>{j}</Text>
                </View>
              ))}
            </View>
            {/* Data rows */}
            {data.matrix.map((row, i) => {
              const maxVal = Math.max(...data.matrix.flat());
              return (
                <View key={i} style={styles.matrixRow}>
                  <View style={[styles.matrixCell, styles.matrixHeader, { backgroundColor: colors.bgInput }]}>
                    <Text style={[styles.matrixText, { color: colors.green, fontWeight: '700' }]}>{i}</Text>
                  </View>
                  {row.map((val, j) => {
                    const t = maxVal > 0 ? val / maxVal : 0;
                    const r = Math.round(13 + t * 18);
                    const g = Math.round(27 + t * 84);
                    const b = Math.round(42 + t * 193);
                    const tc = t > 0.45 ? '#fff' : colors.textSecondary;
                    return (
                      <View key={j} style={[styles.matrixCell, { backgroundColor: `rgb(${r},${g},${b})` }]}>
                        <Text style={[styles.matrixText, { color: tc }]}>{val.toFixed(1)}</Text>
                      </View>
                    );
                  })}
                </View>
              );
            })}
            <View style={styles.matrixLabels}>
              <Text style={[styles.matrixAxisLabel, { color: colors.green }]}>↑ {data.home_team} Goals</Text>
              <Text style={[styles.matrixAxisLabel, { color: colors.red }]}>{data.away_team} Goals →</Text>
            </View>
          </View>
        </ScrollView>
      </Card>

      {/* Match Stats (if played) */}
      {hasActuals && data.actuals && data.actuals.shots && data.actuals.shots.home !== null && (
        <Card title="Match Statistics">
          {[
            ['Shots', data.actuals.shots],
            ['On Target', data.actuals.shots_on_target],
            ['Corners', data.actuals.corners],
            ['Fouls', data.actuals.fouls],
            ['Yellows', data.actuals.yellow_cards],
            ['Reds', data.actuals.red_cards],
          ].map(([label, stat]) => {
            const s = stat as { home: number | null; away: number | null };
            if (s.home === null) return null;
            const total = (s.home! + s.away!) || 1;
            const hp = Math.round(s.home! / total * 100);
            return (
              <View key={label as string} style={styles.statRow}>
                <Text style={[styles.statVal, { color: colors.textHeading }]}>{s.home}</Text>
                <View style={[styles.statBar, { backgroundColor: colors.bgInput }]}>
                  <View style={[styles.statFillHome, { width: `${hp}%`, backgroundColor: colors.green }]} />
                </View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label as string}</Text>
                <View style={[styles.statBar, { backgroundColor: colors.bgInput }]}>
                  <View style={[styles.statFillAway, { width: `${100 - hp}%`, backgroundColor: colors.red }]} />
                </View>
                <Text style={[styles.statVal, { color: colors.textHeading }]}>{s.away}</Text>
              </View>
            );
          })}
        </Card>
      )}
    </ScrollView>
  );
}

// Sub-components

function MarketBox({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={[mStyles.box, { backgroundColor: colors.bgInput, borderColor: colors.border }]}>
      <Text style={[mStyles.value, { color: colors.accent }]}>{value}</Text>
      <Text style={[mStyles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function FormAdjValue({ label, value, colors }: { label: string; value: number; colors: any }) {
  const pct = ((value - 1) * 100).toFixed(1);
  const color = Number(pct) > 0 ? colors.greenText : Number(pct) < 0 ? colors.redText : colors.textSecondary;
  return (
    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
      {label}: <Text style={{ color, fontWeight: '700' }}>{Number(pct) > 0 ? '+' : ''}{pct}%</Text>
    </Text>
  );
}

function FormSection({ team, form, colors }: { team: string; form: FormMatch[]; colors: any }) {
  return (
    <View>
      <Text style={{ color: colors.textHeading, fontWeight: '700', fontSize: 13, marginBottom: 6 }}>{team}</Text>
      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 6 }}>
        {form.map((f, i) => (
          <View key={i} style={[fStyles.badge, {
            backgroundColor: f.result === 'W' ? colors.green : f.result === 'L' ? colors.red : colors.grey,
          }]}>
            <Text style={fStyles.badgeText}>{f.result}</Text>
          </View>
        ))}
      </View>
      {form.map((f, i) => (
        <Text key={i} style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
          {f.home} {f.home_goals} – {f.away_goals} {f.away}  {f.date}
        </Text>
      ))}
    </View>
  );
}

const fStyles = StyleSheet.create({
  badge: { width: 24, height: 24, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});

const mStyles = StyleSheet.create({
  box: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  value: { fontSize: 18, fontWeight: '800' },
  label: { fontSize: 10, textTransform: 'uppercase', marginTop: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  bigScore: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginVertical: 6 },
  verdict: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  xgRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24, marginBottom: 8 },
  xgBox: { alignItems: 'center' },
  xgValue: { fontSize: 32, fontWeight: '800' },
  xgValueSmall: { fontSize: 20, fontWeight: '700' },
  xgLabel: { fontSize: 11, textTransform: 'uppercase', marginTop: 2 },
  xgDash: { fontSize: 20 },
  oddsLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  oddsLabel: { fontSize: 11 },
  ouRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  ouLine: { width: 32, fontSize: 13, fontWeight: '700' },
  ouBar: { flex: 1, height: 14, borderRadius: 4, overflow: 'hidden' },
  ouFillOver: { height: '100%', borderRadius: 4 },
  ouPct: { width: 42, fontSize: 12, fontWeight: '600', textAlign: 'right' },
  scorelineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#30363d' },
  scoreline: { fontSize: 14, fontWeight: '600' },
  scorelineProb: { fontSize: 14, fontWeight: '700' },
  scoreGroupRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 },
  scoreGroupLabel: { width: 90, fontSize: 12, fontWeight: '600' },
  scoreGroupTrack: { flex: 1, height: 16, borderRadius: 4, overflow: 'hidden' },
  scoreGroupFill: { height: '100%', borderRadius: 4 },
  scoreGroupPct: { width: 40, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  formAdjGrid: { flexDirection: 'row', gap: 12 },
  formAdjCol: { flex: 1 },
  formAdjTeam: { fontWeight: '700', fontSize: 13, marginBottom: 4 },
  muted: { fontSize: 13 },
  h2hMatch: { fontSize: 13, marginBottom: 4 },
  matrixRow: { flexDirection: 'row' },
  matrixCell: { width: 40, height: 32, alignItems: 'center', justifyContent: 'center' },
  matrixHeader: { width: 40, height: 32 },
  matrixText: { fontSize: 10, fontWeight: '600' },
  matrixLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingHorizontal: 4 },
  matrixAxisLabel: { fontSize: 10, fontWeight: '700' },
  rhoEffect: { fontSize: 12, marginTop: 8 },
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  statVal: { width: 28, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  statBar: { flex: 1, height: 12, borderRadius: 4, overflow: 'hidden' },
  statFillHome: { height: '100%', borderRadius: 4, alignSelf: 'flex-end' },
  statFillAway: { height: '100%', borderRadius: 4 },
  statLabel: { width: 70, fontSize: 11, textAlign: 'center' },
  marketGrid: { flexDirection: 'row', gap: 8 },
});

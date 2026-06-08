import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, SectionList, TextInput, StyleSheet, Pressable,
  Modal, FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { getFixtures } from '../api/client';
import { LoadingIndicator } from '../components/LoadingScreen';
import { ErrorBanner } from '../components/ErrorBanner';
import type { Fixture } from '../api/types';
import type { FixturesStackParams } from '../../App';

type Nav = NativeStackNavigationProp<FixturesStackParams, 'FixturesList'>;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Parse a date string into a "YYYY-MM" key */
function toMonthKey(dateStr: string): string {
  // Try ISO format first (YYYY-MM-DD)
  const iso = dateStr.match(/^(\d{4})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}`;
  // Try DD/MM/YYYY
  const dmy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}`;
  // Fallback: let JS parse the date string
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
  return dateStr;
}

/** Format a "YYYY-MM" key into a readable label */
function formatMonthLabel(key: string): string {
  const parts = key.split('-');
  if (parts.length >= 2) {
    const year = parts[0];
    const idx = parseInt(parts[1], 10) - 1;
    if (idx >= 0 && idx < 12) return `${MONTH_NAMES[idx]} ${year}`;
  }
  return key;
}

export function FixturesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    getFixtures()
      .then(r => setFixtures(r.fixtures))
      .catch(() => setError('Failed to load fixtures'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const months = useMemo(() => {
    const set = new Set(fixtures.map(f => toMonthKey(f.date)));
    return [...set].sort();
  }, [fixtures]);

  const filtered = useMemo(() => {
    let f = fixtures;
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(x => `${x.home} ${x.away}`.toLowerCase().includes(q));
    }
    if (monthFilter) f = f.filter(x => toMonthKey(x.date) === monthFilter);
    return f;
  }, [fixtures, search, monthFilter]);

  const sections = useMemo(() => {
    const byDate: Record<string, Fixture[]> = {};
    filtered.forEach(f => {
      (byDate[f.date] ??= []).push(f);
    });
    return Object.entries(byDate).map(([date, data]) => ({ title: date, data }));
  }, [filtered]);

  if (loading) return <LoadingIndicator message="Loading fixtures..." />;
  if (error) return <ErrorBanner message={error} onRetry={load} />;

  const selectedLabel = monthFilter ? formatMonthLabel(monthFilter) : 'All Months';

  return (
    <View style={[styles.container, { backgroundColor: colors.bgBody }]}>
      {/* Search */}
      <TextInput
        style={[styles.search, { backgroundColor: colors.bgInput, color: colors.textHeading, borderColor: colors.border }]}
        placeholder="Search fixtures..."
        placeholderTextColor={colors.textSecondary}
        value={search}
        onChangeText={setSearch}
      />

      {/* Month Dropdown */}
      <Pressable
        onPress={() => setDropdownOpen(true)}
        style={[styles.dropdown, { backgroundColor: colors.bgInput, borderColor: colors.border }]}
      >
        <Text style={[styles.dropdownText, { color: colors.textHeading }]}>{selectedLabel}</Text>
        <Text style={[styles.dropdownArrow, { color: colors.textSecondary }]}>▼</Text>
      </Pressable>

      <Modal visible={dropdownOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setDropdownOpen(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textHeading }]}>Filter by Month</Text>
            <FlatList
              data={[{ key: '', label: 'All Months' }, ...months.map(m => ({ key: m, label: formatMonthLabel(m) }))]}
              keyExtractor={item => item.key}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { setMonthFilter(item.key); setDropdownOpen(false); }}
                  style={[
                    styles.modalOption,
                    { backgroundColor: monthFilter === item.key ? colors.accent : 'transparent' },
                  ]}
                >
                  <Text style={[
                    styles.modalOptionText,
                    { color: monthFilter === item.key ? '#fff' : colors.textHeading },
                  ]}>
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      <SectionList
        sections={sections}
        keyExtractor={(item, i) => `${item.home}-${item.away}-${i}`}
        stickySectionHeadersEnabled
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.bgBody }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('PredictionDetail', { home: item.home, away: item.away })}
            style={[styles.row, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          >
            <View style={styles.teams}>
              <Text style={[styles.team, { color: colors.textHeading }]}>{item.home}</Text>
              <Text style={[styles.score, { color: colors.accent }]}>{item.home_goals} – {item.away_goals}</Text>
              <Text style={[styles.team, { color: colors.textHeading }]}>{item.away}</Text>
            </View>
            {item.home_xg !== undefined && (
              <Text style={[styles.xg, { color: colors.textSecondary }]}>{item.home_xg} – {item.away_xg} xG</Text>
            )}
          </Pressable>
        )}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={<Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 32 }}>No fixtures match your filters.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: {
    margin: 12,
    marginBottom: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
  },
  dropdownText: { fontSize: 14, fontWeight: '600' },
  dropdownArrow: { fontSize: 10, marginLeft: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '60%',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    paddingBottom: 8,
    marginBottom: 4,
  },
  modalOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    marginHorizontal: 8,
    marginVertical: 2,
  },
  modalOptionText: { fontSize: 14, fontWeight: '500' },
  sectionHeader: { paddingVertical: 6 },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  row: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 6,
  },
  teams: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  team: { fontSize: 14, fontWeight: '600', flex: 1 },
  score: { fontSize: 16, fontWeight: '800', marginHorizontal: 8 },
  xg: { textAlign: 'center', fontSize: 12, marginTop: 4 },
});

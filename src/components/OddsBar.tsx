import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  homeWin: number;
  draw: number;
  awayWin: number;
  height?: number;
}

export function OddsBar({ homeWin, draw, awayWin, height = 36 }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.bar, { height, borderRadius: 8, overflow: 'hidden' }]}>
      <View style={[styles.segment, { flex: homeWin, backgroundColor: colors.green }]}>
        <View style={styles.labelWrap}>
          {homeWin >= 10 && (
            <React.Fragment>
              <View><Text style={styles.label}>{homeWin}%</Text></View>
            </React.Fragment>
          )}
        </View>
      </View>
      <View style={[styles.segment, { flex: draw, backgroundColor: colors.grey }]}>
        <View style={styles.labelWrap}>
          {draw >= 10 && <Text style={styles.label}>{draw}%</Text>}
        </View>
      </View>
      <View style={[styles.segment, { flex: awayWin, backgroundColor: colors.red }]}>
        <View style={styles.labelWrap}>
          {awayWin >= 10 && <Text style={styles.label}>{awayWin}%</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
  },
  segment: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});

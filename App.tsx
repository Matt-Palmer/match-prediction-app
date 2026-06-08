import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { getStatus } from './src/api/client';
import { LoadingScreen } from './src/components/LoadingScreen';

import { PredictScreen } from './src/screens/PredictScreen';
import { PredictionDetailScreen } from './src/screens/PredictionDetailScreen';
import { SimulationScreen } from './src/screens/SimulationScreen';
import { LeagueTableScreen } from './src/screens/LeagueTableScreen';
import { FixturesScreen } from './src/screens/FixturesScreen';
import { DifficultyScreen } from './src/screens/DifficultyScreen';
import { ValueBetsScreen } from './src/screens/ValueBetsScreen';
import { RankingsScreen } from './src/screens/RankingsScreen';

// Stack param types
export type PredictStackParams = {
  PredictList: undefined;
  PredictionDetail: { home: string; away: string };
};

export type FixturesStackParams = {
  FixturesList: undefined;
  PredictionDetail: { home: string; away: string };
};

const Tab = createBottomTabNavigator();
const PredictStack = createNativeStackNavigator<PredictStackParams>();
const FixturesStack = createNativeStackNavigator<FixturesStackParams>();

function PredictStackScreen() {
  const { colors } = useTheme();
  return (
    <PredictStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgCard },
        headerTintColor: colors.textHeading,
        contentStyle: { backgroundColor: colors.bgBody },
      }}
    >
      <PredictStack.Screen name="PredictList" component={PredictScreen} options={{ headerShown: false }} />
      <PredictStack.Screen
        name="PredictionDetail"
        component={PredictionDetailScreen}
        options={({ route }) => ({
          title: `${route.params.home} vs ${route.params.away}`,
          headerTitleStyle: { fontSize: 14, fontWeight: '700' },
        })}
      />
    </PredictStack.Navigator>
  );
}

function FixturesStackScreen() {
  const { colors } = useTheme();
  return (
    <FixturesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgCard },
        headerTintColor: colors.textHeading,
        contentStyle: { backgroundColor: colors.bgBody },
      }}
    >
      <FixturesStack.Screen name="FixturesList" component={FixturesScreen} options={{ title: 'Fixtures' }} />
      <FixturesStack.Screen
        name="PredictionDetail"
        component={PredictionDetailScreen}
        options={({ route }) => ({
          title: `${route.params.home} vs ${route.params.away}`,
          headerTitleStyle: { fontSize: 14, fontWeight: '700' },
        })}
      />
    </FixturesStack.Navigator>
  );
}

function TabIcon({ label, focused, color }: { label: string; focused: boolean; color: string }) {
  const icons: Record<string, string> = {
    Predict: '⚽',
    Simulation: '📊',
    Table: '🏆',
    Fixtures: '📅',
    Difficulty: '🎯',
    'Value Bets': '💰',
    Rankings: '⭐',
  };
  return <Text style={{ fontSize: 18 }}>{icons[label] || '📋'}</Text>;
}

function AppTabs() {
  const { colors, mode, toggle } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => (
          <TabIcon label={route.name} focused={focused} color={color} />
        ),
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        headerStyle: { backgroundColor: colors.bgCard },
        headerTintColor: colors.textHeading,
        headerRight: () => (
          <Text
            onPress={toggle}
            style={{ fontSize: 20, marginRight: 16, color: colors.textPrimary }}
          >
            {mode === 'dark' ? '☀️' : '🌙'}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Predict" component={PredictStackScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Simulation" component={SimulationScreen} />
      <Tab.Screen name="Table" component={LeagueTableScreen} />
      <Tab.Screen name="Fixtures" component={FixturesStackScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Difficulty" component={DifficultyScreen} />
      <Tab.Screen name="Value Bets" component={ValueBetsScreen} />
      <Tab.Screen name="Rankings" component={RankingsScreen} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { colors, mode } = useTheme();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        const status = await getStatus();
        if (mounted && status.ready) {
          setReady(true);
          setChecking(false);
          return;
        }
      } catch {}
      if (mounted) setTimeout(poll, 2000);
    };
    poll();
    return () => { mounted = false; };
  }, []);

  if (!ready) {
    return <LoadingScreen message="Model is loading... This may take a couple of minutes on first boot." />;
  }

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer>
        <AppTabs />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

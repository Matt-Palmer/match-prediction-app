import axios from 'axios';
import type {
  StatusResponse,
  TeamsResponse,
  RemainingFixturesResponse,
  Prediction,
  SimulationResponse,
  GoalDistributionsResponse,
  LeagueTableResponse,
  FixturesResponse,
  FixtureDifficultyResponse,
  ValueBetsResponse,
  RankingsResponse,
} from './types';

// Change this to your deployed Render URL in production
// e.g. "https://match-prediction.onrender.com"
const BASE_URL = __DEV__
	? "http://192.168.0.109:5050" // Update to your local IP for Expo Go dev
	: "https://match-prediction.onrender.com";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

export const getStatus = () =>
  api.get<StatusResponse>('/api/status').then(r => r.data);

export const getTeams = () =>
  api.get<TeamsResponse>('/api/teams').then(r => r.data);

export const getRemainingFixtures = () =>
  api.get<RemainingFixturesResponse>('/api/remaining-fixtures').then(r => r.data);

export const getPredict = (homeTeam: string, awayTeam: string) =>
  api.post<Prediction>('/api/predict', { home_team: homeTeam, away_team: awayTeam }).then(r => r.data);

export const getSimulation = () =>
  api.get<SimulationResponse>('/api/simulate-season').then(r => r.data);

export const getGoalDistributions = () =>
  api.get<GoalDistributionsResponse>('/api/goal-distributions').then(r => r.data);

export const getLeagueTable = () =>
  api.get<LeagueTableResponse>('/api/table').then(r => r.data);

export const getFixtures = () =>
  api.get<FixturesResponse>('/api/fixtures').then(r => r.data);

export const getFixtureDifficulty = () =>
  api.get<FixtureDifficultyResponse>('/api/fixture-difficulty').then(r => r.data);

export const getValueBets = () =>
  api.get<ValueBetsResponse>('/api/value-bets').then(r => r.data);

export const getRankings = () =>
  api.get<RankingsResponse>('/api/rankings').then(r => r.data);

export { BASE_URL };

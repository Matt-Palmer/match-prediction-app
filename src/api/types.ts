// API type definitions matching the Flask backend responses

export interface StatusResponse {
  ready: boolean;
  loading: boolean;
}

export interface TeamsResponse {
  teams: string[];
}

export interface FixtureSummary {
  home: string;
  away: string;
  odds: { home_win: number; draw: number; away_win: number };
  xg: { home: number; away: number };
}

export interface RemainingFixturesResponse {
  fixtures: FixtureSummary[];
}

export interface Actuals {
  actual_home_goals: number | null;
  actual_away_goals: number | null;
  actual_result: string | null;
  actual_total_goals: number | null;
  actual_btts: boolean | null;
  half_time: { home: number | null; away: number | null };
  shots: { home: number | null; away: number | null };
  shots_on_target: { home: number | null; away: number | null };
  corners: { home: number | null; away: number | null };
  fouls: { home: number | null; away: number | null };
  yellow_cards: { home: number | null; away: number | null };
  red_cards: { home: number | null; away: number | null };
  bookmaker_odds: { home_win: number | null; draw: number | null; away_win: number | null } | null;
  bookmaker_ou25: { over: number | null; under: number | null } | null;
}

export interface Prediction {
  home_team: string;
  away_team: string;
  xg: { home: number; away: number };
  actual_xg: { home: number; away: number } | null;
  actuals: Actuals | null;
  odds: { home_win: number; draw: number; away_win: number };
  top_scorelines: { home_goals: number; away_goals: number; probability: number }[];
  over_under: Record<string, { over: number; under: number }>;
  btts: { yes: number; no: number };
  clean_sheet: { home: number; away: number };
  double_chance: { home_or_draw: number; away_or_draw: number; home_or_away: number };
  model_comparison: {
    dixon_coles: { home_win: number; draw: number; away_win: number };
    basic_poisson: { home_win: number; draw: number; away_win: number };
    rho: number;
    rho_effect: { home_win: number; draw: number; away_win: number };
  } | null;
  score_groups: { group: string; probability: number }[];
  h2h: { home: string; away: string; home_goals: number; away_goals: number; date: string }[];
  home_form: FormMatch[];
  away_form: FormMatch[];
  form_adjustment: {
    home_attack: number;
    home_defence: number;
    away_attack: number;
    away_defence: number;
  };
  matrix: number[][];
  home_season_xg: SeasonXG;
  away_season_xg: SeasonXG;
}

export interface FormMatch {
  home: string;
  away: string;
  home_goals: number;
  away_goals: number;
  date: string;
  result: 'W' | 'D' | 'L';
  venue: 'H' | 'A';
}

export interface SeasonXG {
  xgf: number;
  xga: number;
  xgd: number;
  played: number;
}

export interface SimulationTeam {
  team: string;
  current_points: number;
  avg_final_points: number;
  min_points: number;
  max_points: number;
  win_league_pct: number;
  top4_pct: number;
  relegated_pct: number;
}

export interface SimulationResponse {
  simulation: SimulationTeam[];
}

export interface GoalDistribution {
  avg_goals_scored: number;
  avg_goals_conceded: number;
  scoring_distribution: number[];
  conceding_distribution: number[];
}

export interface GoalDistributionsResponse {
  distributions: Record<string, GoalDistribution>;
}

export interface LeagueTableRow {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  xpts: number;
  xpts_diff: number;
  model_xpts: number;
  model_xpts_diff: number;
  npxg: number;
  npxga: number;
  npxgd: number;
  ppda: number;
  dc: number;
  xgf?: number;
  xga?: number;
  xgd?: number;
}

export interface LeagueTableResponse {
  table: LeagueTableRow[];
}

export interface Fixture {
  home: string;
  away: string;
  home_goals: number;
  away_goals: number;
  date: string;
  home_xg?: number;
  away_xg?: number;
}

export interface FixturesResponse {
  fixtures: Fixture[];
}

export interface FixtureDifficultyItem {
  opponent: string;
  venue: 'H' | 'A';
  difficulty: number;
  band: 'easy' | 'medium' | 'hard';
}

export interface TeamDifficulty {
  avg_difficulty: number;
  fixtures: FixtureDifficultyItem[];
}

export interface FixtureDifficultyResponse {
  difficulty: Record<string, TeamDifficulty>;
}

export interface ValueBetEdge {
  label: string;
  outcome: string;
  model_prob: number;
  bookmaker_prob: number;
  edge: number;
  hit: boolean;
}

export interface ValueBet {
  home: string;
  away: string;
  date: string;
  actual_home_goals: number;
  actual_away_goals: number;
  edges: ValueBetEdge[];
}

export interface ValueBetsResponse {
  value_bets: ValueBet[];
}

export interface RankingTeam {
  rank: number;
  team: string;
  attack: number;
  defense: number;
  rating: number;
}

export interface CalibrationBin {
  predicted: number;
  actual: number;
  count: number;
}

export interface AccuracyData {
  accuracy: number;
  correct: number;
  total: number;
}

export interface RankingsResponse {
  rankings: RankingTeam[];
  gamma: number;
  gamma_by_team: Record<string, number>;
  rho: number;
  xi: number;
  xg_blend: number;
  accuracy: AccuracyData;
  calibration: CalibrationBin[];
}

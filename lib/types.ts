export type TournamentStatus =
  | 'Draft'
  | 'Registration Open'
  | 'Player Nominations'
  | 'Auction Preparation'
  | 'Auction Live'
  | 'Squad Finalized'
  | 'League Stage'
  | 'Knockout Stage'
  | 'Completed'
  | 'Archived';

export type TournamentPhase =
  | 'Draft'
  | 'Registration'
  | 'Player Nominations'
  | 'Auction Preparation'
  | 'Auction Live'
  | 'Squad Finalized'
  | 'League Stage'
  | 'Knockout Stage'
  | 'Completed';

export const PHASES: TournamentPhase[] = [
  'Draft',
  'Registration',
  'Player Nominations',
  'Auction Preparation',
  'Auction Live',
  'Squad Finalized',
  'League Stage',
  'Knockout Stage',
  'Completed',
];

export interface Tournament {
  id: string;
  name: string;
  short_name: string | null;
  season: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  organizer: string;
  status: TournamentStatus;
  current_phase: TournamentPhase;
  tournament_code: string | null;
  start_date: string | null;
  end_date: string | null;
  registration_start: string | null;
  registration_end: string | null;
  nomination_start: string | null;
  nomination_end: string | null;
  auction_date: string | null;
  league_start: string | null;
  league_end: string | null;
  knockout_start: string | null;
  knockout_end: string | null;
  theme_color: string | null;
  tie_break_rule: string | null;
  is_active: boolean;
  manager_count: number;
  squad_size: number;
  retained_players: number;
  auction_players: number;
  budget: number;
  currency: string;
  base_price: number;
  auction_timer: number;
  match_format: string;
  tournament_format: string;
  qualification_rule: string;
  points_win: number;
  points_draw: number;
  points_loss: number;
  created_at: string;
}

export interface TeamOwner {
  id: string;
  tournament_id: string;
  name: string;
  phone: string;
  email: string | null;
  employee_id: string | null;
  department: string | null;
  team_name: string | null;
  team_logo_url: string | null;
  team_color: string;
  status: string;
  joined_at: string | null;
  created_at: string;
  budget_spent: number;
}

export interface Player {
  id: string;
  tournament_id: string;
  name: string;
  base_price: number;
 request_count: number;
  status: string;
  auction_number: number | null;
  sold_to: string | null;
  sold_price: number | null;
  nominated_by: string | null;
  is_retained: boolean;
  retained_by: string | null;
  category: string | null;
}

export interface Fixture {
  id: string;
  tournament_id: string;
  round: string;
  home_id: string | null;
  away_id: string | null;
  match_format: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  deadline: string | null;
  status: string;
  is_published: boolean;
}

export interface MatchResult {
  id: string;
  fixture_id: string;
  home_score: number | null;
  away_score: number | null;
  penalty_score: string | null;
  screenshot_url: string | null;
  remarks: string | null;
  submitted_by: string | null;
  verification_status: string;
  verified_at: string | null;
}

export interface Award {
  id: string;
  tournament_id: string;
  name: string;
  description: string | null;
  icon: string;
  prize: string | null;
  winner_team_id: string | null;
  display_order: number;
  is_published: boolean;
}

export interface Announcement {
  id: string;
  tournament_id: string;
  title: string;
  body: string | null;
  category: string;
  priority: string;
  status: string;
  publish_at: string | null;
  created_at: string;
}

export interface AppSettings {
  id: number;
  setup_complete: boolean;
  app_name: string;
  version: string;
}

export interface Notification {
  id: string;
  tournament_id: string | null;
  recipient_role: string;
  recipient_id: string | null;
  title: string;
  body: string | null;
  category: string;
  is_read: boolean;
  created_at: string;
}

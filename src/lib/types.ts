// ============================================================================
//  Modèles TypeScript — DASOLABS DISNEY CHALLENGE
// ============================================================================

export type MissionCategory = 'photo' | 'attraction' | 'exploration' | 'secret' | 'creativity';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';
export type VoteCategory = 'funniest_photo' | 'best_attraction' | 'team_spirit';
export type UserRole = 'participant' | 'admin';

export interface Family {
  id: string;
  name: string;
  avatar: string;
  color: string;
  access_token: string;
  created_at: string;
}

export interface AppUser {
  id: string;
  family_id: string | null;
  display_name: string;
  role: UserRole;
  device_id: string | null;
  created_at: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  category: MissionCategory;
  points: number;
  requires_photo: boolean;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface MissionSubmission {
  id: string;
  mission_id: string;
  family_id: string;
  user_id: string | null;
  photo_id: string | null;
  status: SubmissionStatus;
  points_awarded: number;
  comment: string | null;
  reviewed_at: string | null;
  created_at: string;
  // jointures optionnelles
  mission?: Mission;
  photo?: Photo;
  family?: Family;
}

export interface Photo {
  id: string;
  family_id: string;
  user_id: string | null;
  mission_id: string | null;
  storage_path: string;
  public_url: string;
  caption: string | null;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  difficulty: number;
  is_active: boolean;
  created_at: string;
}

export interface QuizAnswer {
  id: string;
  question_id: string;
  family_id: string;
  user_id: string | null;
  chosen_index: number;
  is_correct: boolean;
  points_awarded: number;
  created_at: string;
}

export interface SecretMission {
  id: string;
  family_id: string;
  title: string;
  description: string;
  points: number;
  status: SubmissionStatus;
  photo_id: string | null;
  created_at: string;
}

export interface CreativeAttraction {
  id: string;
  family_id: string;
  name: string;
  description: string;
  slogan: string;
  created_at: string;
}

export interface Vote {
  id: string;
  category: VoteCategory;
  voter_user_id: string | null;
  target_family_id: string | null;
  target_photo_id: string | null;
  created_at: string;
}

export interface Award {
  id: string;
  category: string;
  family_id: string | null;
  winner_name: string | null;
  description: string | null;
  announced: boolean;
  created_at: string;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  icon: string;
  description: string;
  threshold: number;
}

export interface FamilyScore {
  family_id: string;
  name: string;
  avatar: string;
  color: string;
  mission_points: number;
  secret_points: number;
  quiz_points: number;
  blind_points: number;
  total_points: number;
  missions_completed: number;
}

export interface BlindTrack {
  id: string;
  title: string;
  audio_url: string;
  options: string[];
  correct_index: number;
  points: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// Session locale stockée dans le navigateur (auth anonyme par QR)
export interface Session {
  user_id: string;
  family_id: string;
  family_name: string;
  family_avatar: string;
  family_color: string;
  role: UserRole;
}

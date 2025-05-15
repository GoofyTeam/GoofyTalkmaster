export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  role: UserRole;
}

type UserRole = "public" | "speaker" | "organizer" | "superadmin";

export type User = {
  id: string | number;
  role: UserRole;
  firstname: string;
  lastname: string;
  email: string;
  profile_picture: string;
  description: string;
  created_at: string;
  updated_at: string;
};

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

export interface BecameSpeakerRequest {
  id: string;
  user_id: number;
  phone: string;
  description: string;
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
    first_name: string;
    profile_picture: string | null;
    description: string;
    role: UserRole;
  };
}

import type { AuthState, User } from "@/lib/types";
import { createContext, useContext } from "react";

export interface AuthContextType extends AuthState {
  loading: boolean;
  isLoggingOut: boolean;
  logout: () => Promise<void>;
  fetchUser: () => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

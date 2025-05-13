import type { AuthState, User } from "@/lib/types";
import * as React from "react";

export interface AuthContext extends AuthState {
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContext | null>(null);

const key = "tlkmstr.auth.user";

function getStoredUser() {
  const userString = localStorage.getItem(key);
  if (userString) {
    try {
      return JSON.parse(userString);
    } catch (error) {
      console.error("Failed to parse stored user data:", error);
      return null;
    }
  }
  return null;
}

function setStoredUser(user: User | null = null) {
  if (user) {
    const userString = JSON.stringify(user);
    localStorage.setItem(key, userString);
  } else {
    localStorage.removeItem(key);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(getStoredUser());
  const [role, setRole] = React.useState(user ? user.role : "public");
  const isAuthenticated = !!user;

  const logout = React.useCallback(async () => {
    setStoredUser(null);
    setUser(null);
    setRole("public");
  }, []);

  const login = React.useCallback(async (user: User) => {
    setStoredUser(user);
    setUser(user);
    setRole(user.role);
  }, []);

  React.useEffect(() => {
    setUser(getStoredUser());
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, role, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

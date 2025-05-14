import type { User } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./useAuth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async (): Promise<User | null> => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user`, {
        credentials: "include",
      });
      if (!res.ok) {
        setUser(null);
        return null;
      }
      const data = await res.json();
      setUser({
        id: data.id,
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        role: data.role,
        description: data.description,
        profile_picture: data.profile_picture,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });
      return data;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    await fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        role: user?.role || "public",
        loading,
        logout,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

import type { User } from "@/lib/types";
import { API_BASE_URL } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./useAuth";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async (): Promise<User | null> => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user`, {
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        setUser(null);
        return null;
      }
      const data = await res.json();

      if (import.meta.env.DEV) {
        console.log("Données utilisateur reçues:", data);
      }

      setUser({
        id: data.id,
        firstname: data.first_name,
        lastname: data.name,
        email: data.email,
        role: data.role,
        description: data.description,
        profile_picture: data.profile_picture,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });
      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    try {
      // Récupération du CSRF token avant la requête
      const response = await fetch(`${API_BASE_URL}/api/sanctum/csrf-cookie`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur de déconnexion");
      }

      const csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="))
        ?.split("=")[1];

      if (!csrfToken) {
        throw new Error("CSRF token not found");
      }

      const logoutResponse = await fetch(`${API_BASE_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-XSRF-TOKEN": decodeURIComponent(csrfToken),
        },
      });

      if (!logoutResponse.ok) {
        const errorData = await logoutResponse.json();
        throw new Error(errorData.message || "Erreur de déconnexion");
      }

      // En cas de succès, on vide l'utilisateur
      setUser(null);
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      // On vide quand même l'utilisateur en cas d'erreur côté client
      setUser(null);
    }
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

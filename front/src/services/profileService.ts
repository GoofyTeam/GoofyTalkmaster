export interface ProfileData {
  firstname: string;
  lastname: string;
  description: string;
  profile_picture?: string | null;
}

// API Response type
export interface ApiResponse {
  message?: string;
  status?: string;
  [key: string]: unknown;
}

// URL de base de l'API
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Service pour la gestion du profil utilisateur avec fetch
const profileService = {
  // Mettre à jour les informations du profil
  updateProfile: async (profileData: ProfileData): Promise<ApiResponse> => {
    // Laravel Fortify utilise 'name' par défaut, donc nous l'adaptons
    const data = {
      name: profileData.lastname, // Utilisé comme nom dans le système Fortify
      first_name: profileData.firstname, // Adapté au champ de la base de données
      description: profileData.description,
      profile_picture: profileData.profile_picture,
    };

    const response = await fetch(`${API_URL}/user/profile-information`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include", // Pour inclure les cookies dans la requête
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message ||
          "Une erreur est survenue lors de la mise à jour du profil",
      );
    }

    return response.json();
  },
};

export default profileService;

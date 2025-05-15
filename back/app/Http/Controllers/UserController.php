<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * Lister les utilisateurs
     *
     * Récupère la liste paginée des utilisateurs du système.
     * Cette fonctionnalité est réservée aux organisateurs et superadmins.
     * Les utilisateurs publics et présentateurs n'ont pas accès à cette ressource.
     *
     * @param  Request  $request  La requête HTTP
     * @return \Illuminate\Http\JsonResponse
     *
     * @queryParam per_page integer Nombre d'éléments par page (entre 1 et 100). Example: 15
     * @queryParam page integer Numéro de la page à afficher. Example: 1
     * @queryParam name string Filtre par nom de famille. Example: Dupont
     * @queryParam first_name string Filtre par prénom. Example: Marie
     * @queryParam email string Filtre par adresse email. Example: marie.dupont@example.com
     * @queryParam role string Filtre par rôle (superadmin, organizer, speaker, public). Example: speaker
     * @queryParam search string Recherche globale dans nom, prénom, email et description. Example: consultant
     * @queryParam sort_by string Champ de tri (name, first_name, email, role, created_at). Example: created_at
     * @queryParam sort_direction string Direction du tri (asc, desc). Example: desc
     *
     * @response {
     *   "users": {
     *     "current_page": 1,
     *     "data": [
     *       {
     *         "id": 1,
     *         "name": "Dupont",
     *         "first_name": "Marie",
     *         "email": "marie.dupont@example.com",
     *         "description": "Consultante en développement web",
     *         "role": "speaker",
     *         "created_at": "2025-05-15T10:00:00.000000Z",
     *         "updated_at": "2025-05-15T10:00:00.000000Z"
     *       }
     *     ],
     *     "first_page_url": "http://localhost:8000/api/users?page=1",
     *     "from": 1,
     *     "last_page": 1,
     *     "last_page_url": "http://localhost:8000/api/users?page=1",
     *     "links": [],
     *     "next_page_url": null,
     *     "path": "http://localhost:8000/api/users",
     *     "per_page": 15,
     *     "prev_page_url": null,
     *     "to": 1,
     *     "total": 1
     *   }
     * }
     */
    public function index(Request $request)
    {
        $authUser = $request->user();

        if ($authUser->isPublic() || $authUser->isSpeaker()) {
            /**
             * Accès non autorisé - L'utilisateur n'a pas les droits requis
             *
             * @status 403
             *
             * @body {"message": "Unauthorized"}
             */
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        Validator::make($request->all(), [
            // Nombre d'éléments par page (exemple : 20)
            'per_page' => 'integer|min:1|max:100',

            // Numéro de la page à afficher (exemple : 2)
            'page' => 'integer|min:1',

            /**
             * Filtre par nom de famille
             *
             * @var string
             *
             * @example "Dubois"
             */
            'name' => 'sometimes|string',

            /**
             * Filtre par prénom
             *
             * @var string
             *
             * @example "Jean"
             */
            'first_name' => 'sometimes|string',

            /**
             * Filtre par adresse email
             *
             * @var string
             *
             * @example "jean.dubois@example.com"
             */
            'email' => 'sometimes|string|email',

            /**
             * Filtre par rôle d'utilisateur
             *
             * @var string
             *
             * @example "organizer"
             */
            'role' => 'sometimes|in:superadmin,organizer,speaker,public',

            /**
             * Recherche globale dans les champs textuels
             *
             * @var string
             *
             * @example "développeur"
             */
            'search' => 'sometimes|string',

            /**
             * Champ utilisé pour le tri des résultats
             *
             * @var string
             *
             * @example "name"
             */
            'sort_by' => 'sometimes|in:name,first_name,email,role,created_at',

            /**
             * Direction du tri (ascendant ou descendant)
             *
             * @var string
             *
             * @example "asc"
             */
            'sort_direction' => 'sometimes|in:asc,desc',
        ])->validate();

        $query = User::query();

        // Filtres
        if ($request->has('name')) {
            $query->where('name', 'like', '%'.$request->input('name').'%');
        }

        if ($request->has('first_name')) {
            $query->where('first_name', 'like', '%'.$request->input('first_name').'%');
        }

        if ($request->has('email')) {
            $query->where('email', 'like', '%'.$request->input('email').'%');
        }

        if ($request->has('role')) {
            $query->where('role', $request->input('role'));
        }

        // Recherche globale
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('first_name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%')
                    ->orWhere('description', 'like', '%'.$search.'%');
            });
        }

        // Tri
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        $query->orderBy($sortBy, $sortDirection);

        /**
         * Liste paginée des utilisateurs
         *
         * @status 200
         */
        return response()->json([
            'users' => $query->paginate($request->input('per_page', 15)),
        ]);
    }

    /**
     * Créer un nouvel utilisateur
     *
     * Permet aux organisateurs et superadmins de créer un nouvel utilisateur dans le système.
     * Les utilisateurs publics et présentateurs n'ont pas accès à cette fonctionnalité.
     *
     * @param  Request  $request  La requête HTTP
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Validation\ValidationException Si les données sont invalides
     */
    public function store(Request $request)
    {
        $authUser = $request->user();
        if ($authUser->isPublic() || $authUser->isSpeaker()) {
            /**
             * Accès non autorisé - L'utilisateur n'a pas les droits requis
             *
             * @status 403
             *
             * @body {"message": "Unauthorized"}
             */
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        Validator::make($request->all(), [
            /**
             * Nom de famille de l'utilisateur
             *
             * @var string
             *
             * @example "Martin"
             */
            'name' => 'required|string|max:255',

            /**
             * Prénom de l'utilisateur
             *
             * @var string
             *
             * @example "Sophie"
             */
            'first_name' => 'required|string|max:255',

            /**
             * Description ou biographie de l'utilisateur (optionnel)
             *
             * @var string|nullable
             *
             * @example "Développeuse fullstack avec 5 ans d'expérience"
             */
            'description' => 'nullable|string|max:255',

            /**
             * Adresse email unique de l'utilisateur
             *
             * @var string
             *
             * @example "sophie.martin@example.com"
             */
            'email' => 'required|string|email|max:255|unique:users',

            /**
             * Rôle attribué à l'utilisateur
             *
             * @var string
             *
             * @example "speaker"
             */
            'role' => 'required|in:superadmin,organizer,speaker,public',

            /**
             * Mot de passe de l'utilisateur (min. 8 caractères)
             *
             * @var string
             *
             * @example "MotDePasse123!"
             */
            'password' => 'required|string|min:8|confirmed',
        ])->validate();

        $user = User::create([
            'name' => $request->input('name'),
            'first_name' => $request->input('first_name'),
            'description' => $request->input('description'),
            'email' => $request->input('email'),
            'role' => $request->input('role'),
            'password' => bcrypt($request->input('password')),
        ]);

        /**
         * Utilisateur créé avec succès
         *
         * @status 201
         *
         * @body {"message": "User created successfully", "user": {"id": 2, "name": "Martin", "first_name": "Sophie", "email": "sophie.martin@example.com", "description": "Développeuse fullstack avec 5 ans d'expérience", "role": "speaker", "created_at": "2025-05-15T10:30:00.000000Z", "updated_at": "2025-05-15T10:30:00.000000Z"}}
         */
        return response()->json([
            'message' => 'User created successfully',
            'user' => $user,
        ], 201);
    }

    /**
     * Afficher un utilisateur spécifique
     *
     * Récupère les détails d'un utilisateur identifié par son ID.
     *
     * @param  User  $user  L'utilisateur à afficher
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(User $user)
    {
        /**
         * Détails de l'utilisateur demandé
         *
         * @status 200
         *
         * @body {"message": "User retrieved successfully", "user": {"id": 1, "name": "Dupont", "first_name": "Marie", "email": "marie.dupont@example.com", "description": "Consultante en développement web", "role": "speaker", "profile_picture": "profiles/marie_profile.jpg", "created_at": "2025-05-15T10:00:00.000000Z", "updated_at": "2025-05-15T10:00:00.000000Z"}}
         */
        return response()->json([
            'message' => 'User retrieved successfully',
            'user' => $user,
        ], 200);
    }

    /**
     * Mettre à jour un utilisateur
     *
     * Met à jour les informations d'un utilisateur existant.
     * Les restrictions d'accès suivantes s'appliquent :
     * - Un utilisateur peut modifier son propre profil
     * - Les superadmins peuvent modifier tous les profils
     * - Les organisateurs peuvent modifier tous les profils sauf les superadmins
     * - Seuls les superadmins et organisateurs peuvent modifier les rôles
     *
     * @param  Request  $request  La requête HTTP
     * @param  User  $user  L'utilisateur à mettre à jour
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Validation\ValidationException Si les données sont invalides
     *зишкинг
     */
    public function update(Request $request, User $user)
    {
        $authUser = $request->user();

        // Vérifier si l'utilisateur peut mettre à jour ce profil
        if (! ($authUser->id === $user->id || $authUser->isSuperadmin() || $authUser->isOrganizer())) {
            /**
             * Accès non autorisé - L'utilisateur n'a pas les droits requis
             *
             * @status 403
             *
             * @body {"message": "Unauthorized"}
             */
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Règles de validation différentes selon le rôle
        $rules = [
            /**
             * Nom de famille de l'utilisateur
             *
             * @var string
             *
             * @example "Leroy"
             */
            'name' => 'sometimes|string|max:255',

            /**
             * Prénom de l'utilisateur
             *
             * @var string
             *
             * @example "Thomas"
             */
            'first_name' => 'sometimes|string|max:255',

            /**
             * Description ou biographie de l'utilisateur
             *
             * @var string|nullable
             *
             * @example "Expert en cybersécurité et DevOps"
             */
            'description' => 'nullable|string|max:255',

            /**
             * Adresse email unique de l'utilisateur
             *
             * @var string
             *
             * @example "thomas.leroy@example.com"
             */
            'email' => 'sometimes|string|email|max:255|unique:users,email,'.$user->id,

            /**
             * Photo de profil de l'utilisateur (fichier image)
             *
             * @var string|nullable
             */
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ];

        // Seuls les superadmin et organizer peuvent modifier les rôles
        if ($authUser->isSuperadmin() || $authUser->isOrganizer()) {
            /**
             * Rôle attribué à l'utilisateur
             *
             * @example "organizer"
             */
            $rules['role'] = 'sometimes|in:superadmin,organizer,speaker,public';
        }

        // Si un mot de passe est fourni
        if ($request->filled('password')) {
            /**
             * Nouveau mot de passe de l'utilisateur (min. 8 caractères)
             *
             * @example "NouveauMotDePasse456!"
             */
            $rules['password'] = 'string|min:8|confirmed';
        }

        Validator::make($request->all(), $rules)->validate();

        // Mettre à jour les données de base
        $userData = $request->only(['name', 'first_name', 'description', 'email']);

        // Traitement de la photo de profil
        if ($request->hasFile('profile_picture')) {
            // Supprimer l'ancienne photo si elle existe
            if ($user->profile_picture && file_exists(storage_path('app/public/'.$user->profile_picture))) {
                unlink(storage_path('app/public/'.$user->profile_picture));
            }

            // Enregistrer la nouvelle photo
            $file = $request->file('profile_picture');
            $fileName = time().'_'.$file->getClientOriginalName();
            $filePath = $file->storeAs('profiles', $fileName, 'public');
            $userData['profile_picture'] = $filePath;
        }

        // Mettre à jour le rôle si autorisé
        if (($authUser->isSuperadmin() || $authUser->isOrganizer()) && $request->filled('role')) {
            $userData['role'] = $request->input('role');
        }

        // Mettre à jour le mot de passe si fourni
        if ($request->filled('password')) {
            $userData['password'] = bcrypt($request->input('password'));
        }

        $user->update($userData);

        /**
         * Utilisateur mis à jour avec succès
         *
         * @status 200
         *
         * @body {"message": "User updated successfully", "user": {"id": 3, "name": "Leroy", "first_name": "Thomas", "email": "thomas.leroy@example.com", "description": "Expert en cybersécurité et DevOps", "role": "organizer", "profile_picture": "profiles/1621234567_thomas_profile.jpg", "created_at": "2025-05-15T09:00:00.000000Z", "updated_at": "2025-05-15T11:30:00.000000Z"}}
         */
        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user,
        ]);
    }

    /**
     * Supprimer un utilisateur
     *
     * Supprime définitivement un utilisateur du système.
     * Les restrictions suivantes s'appliquent :
     * - Seuls les superadmins et organisateurs peuvent supprimer des utilisateurs
     * - Un organisateur ne peut pas supprimer un superadmin
     * - Un utilisateur ne peut pas supprimer son propre compte
     * Cette action est irréversible.
     *
     * @param  Request  $request  La requête HTTP
     * @param  User  $user  L'utilisateur à supprimer
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Request $request, User $user)
    {
        $authUser = $request->user();

        // Seuls les superadmin et organizer peuvent supprimer des utilisateurs
        if (! ($authUser->isSuperadmin() || $authUser->isOrganizer())) {
            /**
             * Accès non autorisé - L'utilisateur n'a pas les droits requis
             *
             * @status 403
             *
             * @body {"message": "Unauthorized"}
             */
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Un organizer ne peut pas supprimer un superadmin
        if ($authUser->isOrganizer() && $user->isSuperadmin()) {
            /**
             * Accès non autorisé - Un organisateur ne peut pas supprimer un superadmin
             *
             * @status 403
             *
             * @body {"message": "Unauthorized"}
             */
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Empêcher la suppression de soi-même
        if ($authUser->id === $user->id) {
            /**
             * Opération interdite - Impossible de supprimer son propre compte
             *
             * @status 400
             *
             * @body {"message": "You cannot delete your own account"}
             */
            return response()->json([
                'message' => 'You cannot delete your own account',
            ], 400);
        }

        $user->delete();

        /**
         * Utilisateur supprimé avec succès
         *
         * @status 200
         *
         * @body {"message": "User deleted successfully"}
         */
        return response()->json([
            'message' => 'User deleted successfully',
        ]);
    }

    /**
     * Promouvoir un utilisateur public au rôle de présentateur
     *
     * Change le rôle d'un utilisateur de "public" à "speaker".
     * Seuls les superadmins et organisateurs peuvent effectuer cette action.
     * L'utilisateur à promouvoir doit avoir actuellement le rôle "public".
     *
     * @param  Request  $request  La requête HTTP
     * @param  User  $user  L'utilisateur à promouvoir
     * @return \Illuminate\Http\JsonResponse
     */
    public function promoteToSpeaker(Request $request, User $user)
    {
        $authUser = $request->user();

        // Vérifier les permissions
        if (! ($authUser->isSuperadmin() || $authUser->isOrganizer())) {
            /**
             * Accès non autorisé - L'utilisateur n'a pas les droits requis
             *
             * @status 403
             *
             * @body {"message": "Unauthorized"}
             */
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Vérifier que l'utilisateur est bien au rôle "public"
        if (! $user->isPublic()) {
            /**
             * Opération interdite - L'utilisateur n'a pas le rôle requis
             *
             * @status 400
             *
             * @body {"message": "Only public users can be promoted to speaker"}
             */
            return response()->json([
                'message' => 'Only public users can be promoted to speaker',
            ], 400);
        }

        // Promouvoir l'utilisateur
        $user->role = 'speaker';
        $user->save();

        /**
         * Utilisateur promu avec succès
         *
         * @status 200
         *
         *---@body {"message": "User promoted to speaker successfully", "user": {"id": 4, "name": "Petit", "first_name": "Julie", "email": "julie.petit@example.com", "description": "Développeuse front-end passionnée", "role": "speaker", "created_at": "2025-05-15T08:00:00.000000Z", "updated_at": "2025-05-15T12:00:00.000000Z"}}
         */
        return response()->json([
            'message' => 'User promoted to speaker successfully',
            'user' => $user,
        ]);
    }

    /**
     * Rétrograder un présentateur au rôle d'utilisateur public
     *
     * Change le rôle d'un utilisateur de "speaker" à "public".
     * Seuls les superadmins et organisateurs peuvent effectuer cette action.
     * L'utilisateur à rétrograder doit avoir actuellement le rôle "speaker".
     *
     * @param  Request  $request  La requête HTTP
     * @param  User  $user  L'utilisateur à rétrograder
     * @return \Illuminate\Http\JsonResponse
     */
    public function demoteToPublic(Request $request, User $user)
    {
        $authUser = $request->user();

        // Vérifier les permissions
        if (! ($authUser->isSuperadmin() || $authUser->isOrganizer())) {
            /**
             * Accès non autorisé - L'utilisateur n'a pas les droits requis
             *
             * @status 403
             *
             * @body {"message": "Unauthorized"}
             */
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Vérifier que l'utilisateur est bien au rôle "speaker"
        if (! $user->isSpeaker()) {
            /**
             * Opération interdite - L'utilisateur n'a pas le rôle requis
             *
             * @status 400
             *
             * @body {"message": "Only speakers can be demoted to public"}
             */
            return response()->json([
                'message' => 'Only speakers can be demoted to public',
            ], 400);
        }

        // Rétrograder l'utilisateur
        $user->role = 'public';
        $user->save();

        /**
         * Utilisateur rétrogradé avec succès
         *
         * @status 200
         *
         *---@body {"message": "User demoted to public successfully", "user": {"id": 5, "name": "Bernard", "first_name": "Pierre", "email": "pierre.bernard@example.com", "description": "Amateur de technologie", "role": "public", "created_at": "2025-05-15T07:00:00.000000Z", "updated_at": "2025-05-15T13:00:00.000000Z"}}
         */
        return response()->json([
            'message' => 'User demoted to public successfully',
            'user' => $user,
        ]);
    }

    /**
     * Récupérer l'utilisateur authentifié
     *
     * Retourne les informations de l'utilisateur actuellement authentifié.
     * Cette route nécessite une authentification valide.
     * Méthode HTTP: GET
     * URL: /api/user
     *
     * @param  Request  $request  La requête HTTP
     * @return \Illuminate\Http\JsonResponse
     *
     * @response {
     *   "id": 1,
     *   "name": "Dupont",
     *   "first_name": "Marie",
     *   "email": "marie.dupont@example.com",
     *   "description": "Consultante en développement web",
     *   "role": "speaker",
     *   "created_at": "2025-05-15T10:00:00.000000Z",
     *   "updated_at": "2025-05-15T10:00:00.000000Z"
     * }
     */
    public function getCurrentUser(Request $request)
    {
        return response()->json($request->user());
    }
}

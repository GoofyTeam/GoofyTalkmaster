<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $authUser = $request->user();

        if ($authUser->isPublic() || $authUser->isSpeaker()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        Validator::make($request->all(), [
            'per_page' => 'integer|min:1|max:100',
            'page' => 'integer|min:1',
            'name' => 'sometimes|string',
            'first_name' => 'sometimes|string',
            'email' => 'sometimes|string|email',
            'role' => 'sometimes|in:superadmin,organizer,speaker,public',
            'search' => 'sometimes|string',
            'sort_by' => 'sometimes|in:name,first_name,email,role,created_at',
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

        return response()->json([
            'users' => $query->paginate($request->input('per_page', 15)),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $authUser = $request->user();
        if ($authUser->isPublic() || $authUser->isSpeaker()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'first_name' => 'required|string|max:255',
            'description' => 'nullable|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'role' => 'required|in:superadmin,organizer,speaker,public',
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

        // $user->sendPasswordResetNotification(
        //     Str::random(10)
        // );
        return response()->json([
            'message' => 'User created successfully',
            'user' => $user,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        return response()->json([
            'message' => 'User created successfully',
            'user' => $user,
        ], 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        $authUser = $request->user();

        // Vérifier si l'utilisateur peut mettre à jour ce profil
        if (! ($authUser->id === $user->id || $authUser->isSuperadmin() || $authUser->isOrganizer())) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Règles de validation différentes selon le rôle
        $rules = [
            'name' => 'sometimes|string|max:255',
            'first_name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,'.$user->id,
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ];

        // Seuls les superadmin et organizer peuvent modifier les rôles
        if ($authUser->isSuperadmin() || $authUser->isOrganizer()) {
            $rules['role'] = 'sometimes|in:superadmin,organizer,speaker,public';
        }

        // Si un mot de passe est fourni
        if ($request->filled('password')) {
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

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, User $user)
    {
        $authUser = $request->user();

        // Seuls les superadmin et organizer peuvent supprimer des utilisateurs
        if (! ($authUser->isSuperadmin() || $authUser->isOrganizer())) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Un organizer ne peut pas supprimer un superadmin
        if ($authUser->isOrganizer() && $user->isSuperadmin()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Empêcher la suppression de soi-même
        if ($authUser->id === $user->id) {
            return response()->json([
                'message' => 'You cannot delete your own account',
            ], 400);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully',
        ]);
    }

    /**
     * Promote a user from public to speaker role.
     */
    public function promoteToSpeaker(Request $request, User $user)
    {
        $authUser = $request->user();

        // Vérifier les permissions
        if (! ($authUser->isSuperadmin() || $authUser->isOrganizer())) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Vérifier que l'utilisateur est bien au rôle "public"
        if (! $user->isPublic()) {
            return response()->json([
                'message' => 'Only public users can be promoted to speaker',
            ], 400);
        }

        // Promouvoir l'utilisateur
        $user->role = 'speaker';
        $user->save();

        return response()->json([
            'message' => 'User promoted to speaker successfully',
            'user' => $user,
        ]);
    }

    /**
     * Demote a user from speaker to public role.
     */
    public function demoteToPublic(Request $request, User $user)
    {
        $authUser = $request->user();

        // Vérifier les permissions
        if (! ($authUser->isSuperadmin() || $authUser->isOrganizer())) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Vérifier que l'utilisateur est bien au rôle "speaker"
        if (! $user->isSpeaker()) {
            return response()->json([
                'message' => 'Only speakers can be demoted to public',
            ], 400);
        }

        // Rétrograder l'utilisateur
        $user->role = 'public';
        $user->save();

        return response()->json([
            'message' => 'User demoted to public successfully',
            'user' => $user,
        ]);
    }
}

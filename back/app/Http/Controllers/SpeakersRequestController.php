<?php

namespace App\Http\Controllers;

use App\Models\SpeakersRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SpeakersRequestController extends Controller
{
    /**
     * Lister les demandes de présentateurs
     *
     * Récupère la liste des demandes de présentateurs disponibles dans le système.
     * Le comportement varie selon le rôle de l'utilisateur authentifié :
     *   - Les utilisateurs publics et présentateurs ne peuvent voir que leurs propres demandes
     *   - Les administrateurs peuvent voir toutes les demandes avec filtrage et tri avancés
     *
     * @param  Request  $request  La requête HTTP
     * @return \Illuminate\Http\JsonResponse
     *
     * @queryParam per_page integer Nombre d'éléments par page (entre 1 et 100). Example: 15
     * @queryParam page integer Numéro de la page à afficher. Example: 1
     * @queryParam status string Filtre par statut (open, closed). Example: open
     * @queryParam search string Recherche textuelle dans la description et le téléphone. Example: workshop
     * @queryParam sort_by string Champ de tri (created_at, updated_at). Example: created_at
     * @queryParam sort_direction string Direction du tri (asc, desc). Example: desc
     *
     * @response LengthAwarePaginator<SpeakersRequest>
     */
    public function index(Request $request)
    {
        $authUser = $request->user();
        if ($authUser->isPublic() || $authUser->isSpeaker()) {
            $speakersRequests = SpeakersRequest::where('user_id', $authUser->id)->paginate(15);

            /**
             * Liste des demandes de l'utilisateur authentifié
             *
             * @status 200
             */
            return response()->json($speakersRequests);
        }

        Validator::make($request->all(), [
            /**
             * Nombre d'éléments par page
             *
             * @var int
             *
             * @example 20
             */
            'per_page' => 'integer|min:1|max:100',

            /**
             * Numéro de la page à afficher
             *
             * @var int
             *
             * @example 2
             */
            'page' => 'integer|min:1',

            /**
             * Filtre par statut des demandes
             *
             * @var string
             *
             * @example "open"
             */
            'status' => 'sometimes|in:open,closed',

            /**
             * Recherche textuelle dans la description et téléphone
             *
             * @var string
             *
             * @example "conference"
             */
            'search' => 'sometimes|string',

            /**
             * Champ utilisé pour le tri des résultats
             *
             * @var string
             *
             * @example "created_at"
             */
            'sort_by' => 'sometimes|in:created_at,updated_at',

            /**
             * Direction du tri (ascendant ou descendant)
             *
             * @var string
             *
             * @example "desc"
             */
            'sort_direction' => 'sometimes|in:asc,desc',
        ])->validate();

        $query = SpeakersRequest::query();

        // Filtres
        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', '%'.$search.'%')
                    ->orWhere('phone', 'like', '%'.$search.'%');
            });
        }
        // Tri
        if ($request->has('sort_by')) {
            $sortBy = $request->input('sort_by');
            $sortDirection = $request->input('sort_direction', 'asc');
            $query->orderBy($sortBy, $sortDirection);
        } else {
            $query->orderBy('created_at', 'desc');
        }
        // Pagination
        $perPage = $request->input('per_page', 15);
        $page = $request->input('page', 1);
        $speakersRequests = $query->paginate($perPage, ['*'], 'page', $page);

        /**
         * Liste paginée des demandes de présentateurs
         *
         * @status 200
         */
        return response()->json($speakersRequests);
    }

    /**
     * Créer une nouvelle demande de présentateur
     *
     * Soumet une nouvelle demande pour devenir présentateur.
     * L'utilisateur doit être authentifié et le statut de la demande est automatiquement défini sur "open".
     *
     * @param  Request  $request  La requête HTTP
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Validation\ValidationException Si les données sont invalides
     */
    public function store(Request $request)
    {
        Validator::make($request->all(), [
            /**
             * Numéro de téléphone du demandeur (optionnel)
             *
             * @var string|null
             *
             * @example "+33123456789"
             */
            'phone' => 'nullable|string|max:255',

            /**
             * Description de la demande et motivation pour devenir présentateur
             *
             * @var string
             *
             * @example "Je souhaite présenter une conférence sur le DevOps et j'ai 5 années d'expérience dans ce domaine."
             */
            'description' => 'required|string|max:1000',
        ])->validate();

        $speakersRequest = new SpeakersRequest;
        $speakersRequest->user_id = $request->user()->id;
        $speakersRequest->phone = $request->input('phone');
        $speakersRequest->description = $request->input('description');
        $speakersRequest->status = 'open';
        $speakersRequest->save();

        /**
         * Demande de présentateur créée avec succès
         *
         * @status 201
         *
         * @body {"message": "Speakers request created successfully", "speakers_request": {"id": 1, "user_id": 1, "phone": "+33123456789", "description": "Je souhaite présenter une conférence sur le DevOps...", "status": "open", "created_at": "2025-05-15T10:00:00.000000Z", "updated_at": "2025-05-15T10:00:00.000000Z"}}
         */
        return response()->json([
            'message' => 'Speakers request created successfully',
            'speakers_request' => $speakersRequest,
        ], 201);
    }

    /**
     * Afficher une demande de présentateur spécifique
     *
     * Récupère les détails d'une demande de présentateur identifiée par son ID.
     *
     * @param  string  $id  L'identifiant de la demande à afficher
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(string $id)
    {
        $speakersRequest = SpeakersRequest::find($id);
        if (! $speakersRequest) {
            /**
             * La demande spécifiée n'existe pas
             *
             * @status 404
             *
             * @body {"message": "Speakers request not found"}
             */
            return response()->json([
                'message' => 'Speakers request not found',
            ], 404);
        }

        /**
         * Détails de la demande de présentateur
         *
         * @status 200
         *
         * @body {"id": 1, "user_id": 1, "phone": "+33123456789", "description": "Je souhaite présenter une conférence...", "status": "open", "created_at": "2025-05-15T10:00:00.000000Z", "updated_at": "2025-05-15T10:00:00.000000Z"}
         */
        return response()->json($speakersRequest);
    }

    /**
     * Mettre à jour une demande de présentateur
     *
     * Modifie les informations d'une demande existante.
     * L'action est restreinte aux utilisateurs ayant un rôle administrateur.
     * Les utilisateurs publics et présentateurs ne peuvent pas modifier les demandes.
     *
     * @param  Request  $request  La requête HTTP
     * @param  string  $id  L'identifiant de la demande à mettre à jour
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Validation\ValidationException Si les données sont invalides
     */
    public function update(Request $request, string $id)
    {
        $authUser = request()->user();
        if ($authUser->isPublic() || $authUser->isSpeaker()) {
            /**
             * L'utilisateur n'est pas autorisé à modifier les demandes
             *
             * @status 403
             *
             * @body {"message": "Unauthorized"}
             */
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $speakersRequest = SpeakersRequest::find($id);
        if (! $speakersRequest) {
            /**
             * La demande spécifiée n'existe pas
             *
             * @status 404
             *
             * @body {"message": "Speakers request not found"}
             */
            return response()->json([
                'message' => 'Speakers request not found',
            ], 404);
        }

        Validator::make($request->all(), [
            /**
             * Numéro de téléphone du demandeur (optionnel)
             *
             * @var string|null
             *
             * @example "+33198765432"
             */
            'phone' => 'nullable|string|max:255',

            /**
             * Description de la demande et motivation pour devenir présentateur
             *
             * @var string
             *
             * @example "Demande mise à jour avec plus de détails sur mon expérience..."
             */
            'description' => 'required|string|max:1000',

            /**
             * Statut de la demande (open ou closed)
             *
             * @var string
             *
             * @example "closed"
             */
            'status' => 'sometimes|in:open,closed',
        ])->validate();

        $speakersRequest->phone = $request->input('phone', $speakersRequest->phone);
        $speakersRequest->description = $request->input('description', $speakersRequest->description);
        $speakersRequest->status = $request->input('status', $speakersRequest->status);
        $speakersRequest->save();

        /**
         * Demande de présentateur mise à jour avec succès
         *
         * @status 200
         *
         * @body {"message": "Speakers request updated successfully", "speakers_request": {"id": 1, "user_id": 1, "phone": "+33198765432", "description": "Demande mise à jour...", "status": "closed", "created_at": "2025-05-15T10:00:00.000000Z", "updated_at": "2025-05-15T11:30:00.000000Z"}}
         */
        return response()->json([
            'message' => 'Speakers request updated successfully',
            'speakers_request' => $speakersRequest,
        ], 200);
    }

    /**
     * Supprimer une demande de présentateur
     *
     * Supprime définitivement une demande de présentateur du système.
     * L'action est restreinte aux utilisateurs ayant un rôle administrateur.
     * Les utilisateurs publics et présentateurs ne peuvent pas supprimer les demandes.
     * Cette action est irréversible.
     *
     * @param  string  $id  L'identifiant de la demande à supprimer
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(string $id)
    {
        $authUser = request()->user();
        if ($authUser->isPublic() || $authUser->isSpeaker()) {
            /**
             * L'utilisateur n'est pas autorisé à supprimer les demandes
             *
             * @status 403
             *
             * @body {"message": "Unauthorized"}
             */
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }
        $speakersRequest = SpeakersRequest::find($id);
        if (! $speakersRequest) {
            /**
             * La demande spécifiée n'existe pas
             *
             * @status 404
             *
             * @body {"message": "Speakers request not found"}
             */
            return response()->json([
                'message' => 'Speakers request not found',
            ], 404);
        }
        $speakersRequest->delete();

        /**
         * Demande de présentateur supprimée avec succès
         *
         * @status 200
         *
         * @body {"message": "Speakers request deleted successfully"}
         */
        return response()->json([
            'message' => 'Speakers request deleted successfully',
        ], 200);
    }
}

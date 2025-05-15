<?php

namespace App\Http\Controllers;

use App\Models\Favorite;
use App\Models\Talk;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    /**
     * Ajouter une conférence aux favoris de l'utilisateur
     *
     * Ajoute une conférence spécifique à la liste des favoris de l'utilisateur authentifié.
     * Vérifie d'abord si la conférence existe et si elle n'est pas déjà dans les favoris.
     *
     * @param  Request  $request  La requête HTTP
     * @param  int  $talkId  L'identifiant de la conférence à ajouter aux favoris
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws QueryException Si une erreur de base de données survient
     */
    public function store(Request $request, $talkId)
    {
        $user = $request->user();

        $talk = Talk::find($talkId);
        if (! $talk) {
            /**
             * La conférence demandée n'existe pas
             *
             * @status 404
             *
             * @body {"message": "Talk not found"}
             */
            return response()->json(['message' => 'Talk not found'], 404);
        }

        // Vérifier si le favori existe déjà avant d'essayer de l'insérer
        $existingFavorite = Favorite::where('user_id', $user->id)
            ->where('talk_id', $talkId)
            ->first();

        if ($existingFavorite) {
            /**
             * La conférence est déjà dans les favoris de l'utilisateur
             *
             * @status 409
             *
             * @body {"message": "Talk already in favorites"}
             */
            return response()->json(['message' => 'Talk already in favorites'], 409);
        }

        try {
            $favorite = new Favorite;
            $favorite->user_id = $user->id;
            $favorite->talk_id = $talkId;
            $favorite->save();

            /**
             * Conférence ajoutée aux favoris avec succès
             *
             * @status 201
             *
             * @body {"message": "Talk added to favorites", "favorite": {"id": 1, "user_id": 1, "talk_id": 1, "created_at": "2025-05-15T10:00:00.000000Z", "updated_at": "2025-05-15T10:00:00.000000Z"}}
             */
            return response()->json([
                'message' => 'Talk added to favorites',
                'favorite' => $favorite,
            ], 201);
        } catch (QueryException $e) {
            // Pour capturer à la fois les erreurs MySQL et SQLite
            if (
                str_contains($e->getMessage(), 'Integrity constraint violation') ||
                str_contains($e->getMessage(), 'UNIQUE constraint failed') ||
                ($e->errorInfo[1] ?? null) === 1062
            ) {
                /**
                 * La conférence est déjà dans les favoris de l'utilisateur (détecté par contrainte de base de données)
                 *
                 * @status 409
                 *
                 * @body {"message": "Talk already in favorites"}
                 */
                return response()->json(['message' => 'Talk already in favorites'], 409);
            }
            throw $e;
        }
    }

    /**
     * Supprimer une conférence des favoris de l'utilisateur
     *
     * Retire une conférence spécifique de la liste des favoris de l'utilisateur authentifié.
     * Vérifie d'abord si la conférence est bien dans les favoris de l'utilisateur.
     *
     * @param  Request  $request  La requête HTTP
     * @param  int  $talkId  L'identifiant de la conférence à retirer des favoris
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Request $request, $talkId)
    {
        $user = $request->user();

        $favorite = Favorite::where('user_id', $user->id)
            ->where('talk_id', $talkId)
            ->first();

        if (! $favorite) {
            /**
             * Aucun favori trouvé pour cette conférence et cet utilisateur
             *
             * @status 404
             *
             * @body {"message": "Favorite not found"}
             */
            return response()->json(['message' => 'Favorite not found'], 404);
        }

        $favorite->delete();

        /**
         * Conférence retirée des favoris avec succès
         *
         * @status 200
         *
         * @body {"message": "Talk removed from favorites"}
         */
        return response()->json(['message' => 'Talk removed from favorites']);
    }

    /**
     * Lister les conférences favorites de l'utilisateur
     *
     * Récupère la liste paginée des conférences ajoutées en favoris par l'utilisateur authentifié.
     * Inclut les détails des conférences et de leurs présentateurs.
     *
     * @param  Request  $request  La requête HTTP
     * @return \Illuminate\Http\JsonResponse
     *
     * @queryParam per_page int Nombre d'éléments par page. Example: 20
     *
     * @response LengthAwarePaginator<Favorite>
     */
    public function index(Request $request)
    {
        $authUser = $request->user();

        /**
         * Liste paginée des favoris avec les relations (conférences et présentateurs)
         *
         * @status 200
         */
        $favorites = Favorite::where('user_id', $authUser->id)
            ->with('talk', 'talk.speaker')
            ->paginate($request->input('per_page', 15));

        return response()->json($favorites);
    }
}

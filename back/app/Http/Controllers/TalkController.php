<?php

namespace App\Http\Controllers;

use App\Models\Talk;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TalkController extends Controller
{
    /**
     * Lister les conférences de l'utilisateur
     *
     * Récupère la liste des conférences filtrées selon le rôle de l'utilisateur :
     *   - Les présentateurs ne peuvent voir que leurs propres conférences
     *   - Les organisateurs et superadmins peuvent voir toutes les conférences
     *   - Les utilisateurs publics n'ont pas accès à cette route
     *
     * @param  Request  $request  La requête HTTP
     * @return \Illuminate\Http\JsonResponse
     *
     * @queryParam subject string Filtre par sujet de la conférence. Example: JavaScript
     * @queryParam status string Filtre par statut (pending, accepted, rejected, scheduled). Example: scheduled
     * @queryParam level string Filtre par niveau (beginner, intermediate, advanced). Example: intermediate
     * @queryParam sort_by string Champ de tri (created_at, scheduled_date, title). Default: created_at. Example: scheduled_date
     * @queryParam sort_direction string Direction du tri (asc, desc). Default: desc. Example: asc
     * @queryParam per_page integer Nombre d'éléments par page. Default: 15. Example: 20
     *
     * @response LengthAwarePaginator<Talk>
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Seuls les speakers peuvent voir leurs talks
        if (! $user->isSpeaker() && ! $user->isOrganizer() && ! $user->isSuperadmin()) {
            /**
             * Accès non autorisé - L'utilisateur n'a pas les droits requis
             *
             * @status 403
             *
             * @body {"message": "Unauthorized"}
             */
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Filtrer les talks en fonction du rôle
        $query = Talk::query();

        if ($user->isSpeaker()) {
            // Speaker voit uniquement ses propres talks
            $query->where('speaker_id', $user->id);
        }

        // Filtres optionnels
        if ($request->has('subject')) {
            $query->where('subject', $request->input('subject'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('level')) {
            $query->where('level', $request->input('level'));
        }

        // Tri
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        $query->orderBy($sortBy, $sortDirection);

        /**
         * Liste paginée des conférences
         *
         * @status 200
         */
        return response()->json($query->with('speaker')->paginate($request->input('per_page', 15)));
    }

    /**
     * Créer une nouvelle conférence
     *
     * Permet à un présentateur de soumettre une nouvelle proposition de conférence.
     * Les utilisateurs publics ne peuvent pas créer de conférence.
     * Le statut initial est automatiquement défini sur "pending".
     *
     * @param  Request  $request  La requête HTTP
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Validation\ValidationException Si les données sont invalides
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->isPublic()) {
            /**
             * Accès non autorisé - Les utilisateurs publics ne peuvent pas créer de conférence
             *
             * @status 403
             *
             * @body {"message": "Unauthorized"}
             */
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        Validator::make($request->all(), [
            /**
             * Titre de la conférence
             *
             * @var string
             *
             * @example "Introduction à Vue.js 3"
             */
            'title' => 'required|string|max:255',

            /**
             * Sujet principal de la conférence
             *
             * @var string
             *
             * @example "JavaScript"
             */
            'subject' => 'required|string|max:100',

            /**
             * Description détaillée de la conférence
             *
             * @var string
             *
             * @example "Cette présentation abordera les nouveautés de Vue.js 3 et comment migrer une application existante."
             */
            'description' => 'required|string',

            /**
             * Niveau de difficulté de la conférence
             *
             * @var string
             *
             * @example "intermediate"
             */
            'level' => 'required|in:beginner,intermediate,advanced',
        ])->validate();

        $talk = new Talk;
        $talk->title = $request->input('title');
        $talk->subject = $request->input('subject');
        $talk->description = $request->input('description');
        $talk->level = $request->input('level');
        $talk->status = 'pending';
        $talk->speaker_id = $user->id;
        $talk->save();

        /**
         * Conférence créée avec succès
         *
         * @status 201
         *
         * @body {"message": "Talk created successfully", "talk": {"id": 1, "title": "Introduction à Vue.js 3", "subject": "JavaScript", "description": "Cette présentation abordera les nouveautés de Vue.js 3...", "level": "intermediate", "status": "pending", "speaker_id": 1, "created_at": "2025-05-15T10:00:00.000000Z", "updated_at": "2025-05-15T10:00:00.000000Z"}}
         */
        return response()->json([
            'message' => 'Talk created successfully',
            'talk' => $talk,
        ], 201);
    }

    /**
     * Afficher une conférence spécifique
     *
     * Récupère les détails d'une conférence par son ID.
     * Seuls le présentateur associé à la conférence ou les administrateurs peuvent y accéder.
     *
     * @param  Request  $request  La requête HTTP
     * @param  string  $id  L'identifiant de la conférence
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Request $request, string $id)
    {
        $talk = Talk::find($id);

        if (! $talk) {
            /**
             * Conférence non trouvée
             *
             * @status 404
             *
             * @body {"message": "Talk not found"}
             */
            return response()->json(['message' => 'Talk not found'], 404);
        }

        $talk->load('speaker');

        $user = $request->user();

        // Seul le speaker propriétaire ou un admin peut voir le talk
        if ($talk->speaker_id !== $user->id && ! $user->isOrganizer() && ! $user->isSuperadmin()) {
            /**
             * Accès non autorisé - L'utilisateur n'est pas le présentateur ou un administrateur
             *
             * @status 403
             *
             * @body {"message": "Unauthorized"}
             */
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        /**
         * Détails de la conférence demandée
         *
         * @status 200
         */
        return response()->json($talk);
    }

    /**
     * Mettre à jour ou programmer une conférence
     *
     * Cette méthode permet deux types de mises à jour:
     * 1. Programmation d'une conférence (par un organisateur ou superadmin)
     * 2. Modification des détails d'une conférence (par le présentateur propriétaire)
     *
     * Pour la programmation, des règles supplémentaires s'appliquent:
     * - Les conférences doivent être programmées entre 9h00 et 19h00
     * - Pas de chevauchement possible dans la même salle
     *
     * Pour la mise à jour des détails, seules les conférences en statut "pending" peuvent être modifiées.
     *
     * @param  Request  $request  La requête HTTP
     * @param  string  $id  L'identifiant de la conférence à mettre à jour
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Validation\ValidationException Si les données sont invalides
     */
    public function update(Request $request, string $id)
    {
        $talk = Talk::find($id);

        if (! $talk) {
            /**
             * Conférence non trouvée
             *
             * @status 404
             *
             * @body {"message": "Talk not found"}
             */
            return response()->json(['message' => 'Talk not found'], 404);
        }

        $user = $request->user();
        $isScheduling = $request->has('scheduled_date') || $request->has('start_time') ||
            $request->has('end_time') || $request->has('room_id');

        // CAS 1: SCHEDULING (par organisateur ou superadmin)
        if ($isScheduling) {
            // Vérification des autorisations pour le scheduling
            if (! $user->isOrganizer() && ! $user->isSuperadmin()) {
                /**
                 * Accès non autorisé - Seul un organisateur peut programmer une conférence
                 *
                 * @status 403
                 *
                 * @body {"message": "Unauthorized"}
                 */
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Validation pour le scheduling
            Validator::make($request->all(), [
                /**
                 * Date prévue pour la conférence
                 *
                 * @var string
                 *
                 * @example "2025-06-15"
                 */
                'scheduled_date' => 'required|date|date_format:Y-m-d',

                /**
                 * Heure de début (format 24h)
                 *
                 * @var string
                 *
                 * @example "14:30"
                 */
                'start_time' => 'required|date_format:H:i',

                /**
                 * Heure de fin (format 24h)
                 *
                 * @var string
                 *
                 * @example "16:00"
                 */
                'end_time' => 'required|date_format:H:i|after:start_time',

                /**
                 * ID de la salle attribuée
                 *
                 * @var int
                 *
                 * @example 3
                 */
                'room_id' => 'required|exists:rooms,id',
            ])->validate();

            $scheduledDate = $request->input('scheduled_date');
            $startTime = $request->input('start_time');
            $endTime = $request->input('end_time');
            $roomId = $request->input('room_id');

            // Vérifier que les heures sont entre 9h et 19h
            $startTimeObj = Carbon::createFromFormat('H:i', $startTime);
            $endTimeObj = Carbon::createFromFormat('H:i', $endTime);

            if ($startTimeObj->hour < 9 || $endTimeObj->hour >= 19) {
                /**
                 * Heures de programmation invalides
                 *
                 * @status 400
                 *
                 * @body {"message": "Talk must be scheduled between 09:00 and 19:00"}
                 */
                return response()->json(['message' => 'Talk must be scheduled between 09:00 and 19:00'], 400);
            }

            // Récupérer tous les talks qui pourraient être en conflit
            $potentialConflicts = Talk::where('room_id', $roomId)
                ->where('scheduled_date', $scheduledDate)
                ->where('status', 'scheduled')
                ->where('id', '!=', $id) // Exclure le talk actuel pour permettre sa mise à jour
                ->get();

            // Vérifier les conflits
            foreach ($potentialConflicts as $otherTalk) {
                $otherStart = Carbon::createFromFormat('H:i', $otherTalk->start_time);
                $otherEnd = Carbon::createFromFormat('H:i', $otherTalk->end_time);

                if ($startTimeObj < $otherEnd && $endTimeObj > $otherStart) {
                    /**
                     * Conflit de programmation avec une autre conférence
                     *
                     * @status 400
                     *
                     * @body {"message": "Room scheduling conflict detected"}
                     */
                    return response()->json(['message' => 'Room scheduling conflict detected'], 400);
                }
            }

            $talk->scheduled_date = $scheduledDate;
            $talk->start_time = $startTime;
            $talk->end_time = $endTime;
            $talk->room_id = $roomId;
            $talk->status = 'scheduled';
            $talk->save();

            /**
             * Conférence programmée avec succès
             *
             * @status 200
             *
             * @body {"message": "Talk scheduled successfully", "talk": {"id": 1, "title": "Introduction à Vue.js 3", "subject": "JavaScript", "description": "Cette présentation...", "level": "intermediate", "status": "scheduled", "scheduled_date": "2025-06-15", "start_time": "14:30", "end_time": "16:00", "room_id": 3, "speaker_id": 1, "created_at": "2025-05-15T10:00:00.000000Z", "updated_at": "2025-05-15T11:30:00.000000Z"}}
             */
            return response()->json([
                'message' => 'Talk scheduled successfully',
                'talk' => $talk,
            ]);
        }

        // CAS 2: UPDATE NORMAL (par le speaker propriétaire)
        if ($talk->speaker_id !== $user->id) {
            /**
             * Accès non autorisé - Seul le présentateur peut modifier sa propre conférence
             *
             * @status 403
             *
             * @body {"message": "Unauthorized"}
             */
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($talk->status !== 'pending') {
            /**
             * Modification non autorisée - La conférence n'est plus en statut "pending"
             *
             * @status 400
             *
             * @body {"message": "Only pending talks can be updated"}
             */
            return response()->json(['message' => 'Only pending talks can be updated'], 400);
        }

        Validator::make($request->all(), [
            /**
             * Titre de la conférence
             *
             * @var string
             *
             * @example "Vue.js 3 - Les nouveautés et bonnes pratiques"
             */
            'title' => 'sometimes|string|max:255',

            /**
             * Sujet principal de la conférence
             *
             * @var string
             *
             * @example "JavaScript"
             */
            'subject' => 'sometimes|string|max:100',

            /**
             * Description détaillée de la conférence
             *
             * @var string
             *
             * @example "Cette présentation a été mise à jour pour inclure des exemples concrets..."
             */
            'description' => 'sometimes|string',

            /**
             * Niveau de difficulté de la conférence
             *
             * @var string
             *
             * @example "advanced"
             */
            'level' => 'sometimes|in:beginner,intermediate,advanced',
        ])->validate();

        $talk->title = $request->input('title', $talk->title);
        $talk->subject = $request->input('subject', $talk->subject);
        $talk->description = $request->input('description', $talk->description);
        $talk->level = $request->input('level', $talk->level);
        $talk->save();

        /**
         * Conférence mise à jour avec succès
         *
         * @status 200
         *
         * @body {"message": "Talk updated successfully", "talk": {"id": 1, "title": "Vue.js 3 - Les nouveautés et bonnes pratiques", "subject": "JavaScript", "description": "Cette présentation a été mise à jour...", "level": "advanced", "status": "pending", "speaker_id": 1, "created_at": "2025-05-15T10:00:00.000000Z", "updated_at": "2025-05-15T11:30:00.000000Z"}}
         */
        return response()->json([
            'message' => 'Talk updated successfully',
            'talk' => $talk,
        ]);
    }

    /**
     * Supprimer une conférence
     *
     * Supprime définitivement une conférence du système.
     * Seul le présentateur propriétaire peut supprimer sa propre conférence et uniquement si elle est en statut "pending".
     * Cette action est irréversible.
     *
     * @param  Request  $request  La requête HTTP
     * @param  string  $id  L'identifiant de la conférence à supprimer
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Request $request, string $id)
    {
        $talk = Talk::find($id);

        if (! $talk) {
            /**
             * Conférence non trouvée
             *
             * @status 404
             *
             * @body {"message": "Talk not found"}
             */
            return response()->json(['message' => 'Talk not found'], 404);
        }

        $user = $request->user();

        // Seul le speaker propriétaire peut supprimer son talk et uniquement si status = pending
        if ($talk->speaker_id !== $user->id) {
            /**
             * Accès non autorisé - Seul le présentateur peut supprimer sa propre conférence
             *
             * @status 403
             *
             * @body {"message": "Unauthorized"}
             */
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($talk->status !== 'pending') {
            /**
             * Suppression non autorisée - La conférence n'est plus en statut "pending"
             *
             * @status 400
             *
             * @body {"message": "Only pending talks can be deleted"}
             */
            return response()->json(['message' => 'Only pending talks can be deleted'], 400);
        }

        $talk->delete();

        /**
         * Conférence supprimée avec succès
         *
         * @status 200
         *
         * @body {"message": "Talk deleted successfully"}
         */
        return response()->json(['message' => 'Talk deleted successfully']);
    }

    /**
     * Mettre à jour le statut d'une conférence
     *
     * Permet aux organisateurs d'accepter ou de rejeter une proposition de conférence.
     * Seules les conférences en statut "pending" peuvent être acceptées ou rejetées.
     * Cette action est réservée aux utilisateurs ayant le rôle d'organisateur ou de superadmin.
     *
     * @param  Request  $request  La requête HTTP
     * @param  string  $id  L'identifiant de la conférence
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Validation\ValidationException Si le statut est invalide
     */
    public function updateStatus(Request $request, string $id)
    {
        $talk = Talk::find($id);

        if (! $talk) {
            /**
             * Conférence non trouvée
             *
             * @status 404
             *
             * @body {"message": "Talk not found"}
             */
            return response()->json(['message' => 'Talk not found'], 404);
        }

        $user = $request->user();

        // Seul un organizer ou superadmin peut changer le statut
        if (! $user->isOrganizer() && ! $user->isSuperadmin()) {
            /**
             * Accès non autorisé - Seuls les organisateurs peuvent modifier le statut
             *
             * @status 403
             *
             * @body {"message": "Unauthorized"}
             */
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        Validator::make($request->all(), [
            /**
             * Nouveau statut de la conférence
             *
             * @var string
             *
             * @example "accepted"
             */
            'status' => 'required|in:accepted,rejected',
        ])->validate();

        $newStatus = $request->input('status');

        // Vérification des transitions autorisées
        if ($talk->status !== 'pending') {
            /**
             * Changement de statut non autorisé - La conférence n'est pas en statut "pending"
             *
             * @status 400
             *
             * @body {"message": "Only pending talks can be accepted or rejected"}
             */
            return response()->json(['message' => 'Only pending talks can be accepted or rejected'], 400);
        }

        $talk->status = $newStatus;
        $talk->save();

        /**
         * Statut de la conférence mis à jour avec succès
         *
         * @status 200
         *
         * @body {"message": "Talk status updated successfully", "talk": {"id": 1, "title": "Introduction à Vue.js 3", "subject": "JavaScript", "description": "Cette présentation...", "level": "intermediate", "status": "accepted", "speaker_id": 1, "created_at": "2025-05-15T10:00:00.000000Z", "updated_at": "2025-05-15T11:30:00.000000Z"}}
         */
        return response()->json([
            'message' => 'Talk status updated successfully',
            'talk' => $talk,
        ]);
    }

    /**
     * Lister les conférences publiques
     *
     * Récupère la liste des conférences programmées et accessibles au public.
     * Cette route est accessible à tous les utilisateurs, même non authentifiés.
     * Seules les conférences en statut "scheduled" sont retournées.
     *
     * @param  Request  $request  La requête HTTP
     * @return \Illuminate\Http\JsonResponse
     *
     * @queryParam date string Filtre par date de programmation (format YYYY-MM-DD). Example: 2025-06-15
     * @queryParam room_id integer Filtre par identifiant de salle. Example: 2
     * @queryParam subject string Filtre par sujet de la conférence. Example: Python
     * @queryParam level string Filtre par niveau (beginner, intermediate, advanced). Example: beginner
     * @queryParam speaker_id integer Filtre par identifiant du présentateur. Example: 5
     * @queryParam sort_by string Champ de tri (scheduled_date, start_time, title). Default: scheduled_date. Example: title
     * @queryParam sort_direction string Direction du tri (asc, desc). Default: asc. Example: desc
     * @queryParam per_page integer Nombre d'éléments par page. Default: 15. Example: 10
     *
     * @response LengthAwarePaginator<Talk>
     */
    public function publicIndex(Request $request)
    {
        $query = Talk::where('status', 'scheduled');

        // Filtres pour affichage public
        if ($request->has('date')) {
            $query->where('scheduled_date', $request->input('date'));
        }

        if ($request->has('room_id')) {
            $query->where('room_id', $request->input('room_id'));
        }

        if ($request->has('subject')) {
            $query->where('subject', $request->input('subject'));
        }

        if ($request->has('level')) {
            $query->where('level', $request->input('level'));
        }

        if ($request->has('speaker_id')) {
            $query->where('speaker_id', $request->input('speaker_id'));
        }

        // Tri par date/heure par défaut
        $sortBy = $request->input('sort_by', 'scheduled_date');
        $sortDirection = $request->input('sort_direction', 'asc');
        $query->orderBy($sortBy, $sortDirection);

        if ($sortBy === 'scheduled_date') {
            $query->orderBy('start_time', 'asc');
        }

        /**
         * Liste paginée des conférences publiques
         *
         * @status 200
         */
        return response()->json($query->with('speaker')->paginate($request->input('per_page', 15)));
    }
}

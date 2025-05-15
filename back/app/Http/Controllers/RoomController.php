<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    /**
     * Lister toutes les salles
     *
     * Récupère la liste complète des salles de conférence disponibles dans le système.
     * Les salles sont retournées sans pagination.
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @response array<Room>
     */
    public function index()
    {
        $rooms = Room::all();

        /**
         * Liste des salles disponibles
         *
         * @status 200
         */
        return response()->json($rooms);
    }

    /**
     * Créer une nouvelle salle
     *
     * Ajoute une nouvelle salle de conférence dans le système.
     * Requiert un nom et une capacité minimale de places.
     *
     * @param  Request  $request  La requête HTTP
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Validation\ValidationException Si les données sont invalides
     */
    public function store(Request $request)
    {
        $request->validate([
            /**
             * Nom de la salle
             *
             * @var string
             *
             * @example "Amphithéâtre A"
             */
            'name' => 'required|string|max:255',

            /**
             * Capacité d'accueil de la salle (nombre de places)
             *
             * @var int
             *
             * @example 150
             */
            'capacity' => 'required|integer|min:1',
        ]);

        $room = Room::create($request->all());

        /**
         * Salle créée avec succès
         *
         * @status 201
         *
         * @body {"id": 1, "name": "Amphithéâtre A", "capacity": 150, "created_at": "2025-05-15T10:00:00.000000Z", "updated_at": "2025-05-15T10:00:00.000000Z"}
         */
        return response()->json($room, 201);
    }

    /**
     * Afficher une salle spécifique
     *
     * Récupère les détails d'une salle de conférence identifiée par son ID.
     * Utilise la résolution de modèle implicite de Laravel.
     *
     * @param  Room  $room  La salle à afficher
     * @return \Illuminate\Http\JsonResponse
     *
     * @response Room
     */
    public function show(Room $room)
    {
        /**
         * Détails de la salle demandée
         *
         * @status 200
         *
         * @body {"id": 1, "name": "Amphithéâtre A", "capacity": 150, "created_at": "2025-05-15T10:00:00.000000Z", "updated_at": "2025-05-15T10:00:00.000000Z"}
         */
        return response()->json($room);
    }

    /**
     * Mettre à jour une salle
     *
     * Modifie les informations d'une salle existante.
     * Permet de modifier le nom et/ou la capacité de la salle.
     *
     * @param  Request  $request  La requête HTTP
     * @param  Room  $room  La salle à mettre à jour
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Validation\ValidationException Si les données sont invalides
     */
    public function update(Request $request, Room $room)
    {
        $request->validate([
            /**
             * Nom de la salle
             *
             * @var string
             *
             * @example "Salle de conférence B"
             */
            'name' => 'sometimes|required|string|max:255',

            /**
             * Capacité d'accueil de la salle (nombre de places)
             *
             * @var int
             *
             * @example 80
             */
            'capacity' => 'sometimes|required|integer|min:1',
        ]);

        $room->update($request->all());

        /**
         * Salle mise à jour avec succès
         *
         * @status 200
         *
         * @body {"id": 1, "name": "Salle de conférence B", "capacity": 80, "created_at": "2025-05-15T10:00:00.000000Z", "updated_at": "2025-05-15T10:30:00.000000Z"}
         */
        return response()->json($room);
    }

    /**
     * Supprimer une salle
     *
     * Supprime définitivement une salle de conférence du système.
     * Cette action est irréversible.
     *
     * @param  Room  $room  La salle à supprimer
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Room $room)
    {
        $room->delete();

        /**
         * Salle supprimée avec succès
         *
         * @status 204
         */
        return response()->json(null, 204);
    }
}

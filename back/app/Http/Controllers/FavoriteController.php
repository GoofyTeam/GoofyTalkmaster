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
     * Add a talk to favorites
     */
    public function store(Request $request, $talkId)
    {
        $user = $request->user();

        $talk = Talk::find($talkId);
        if (! $talk) {
            return response()->json(['message' => 'Talk not found'], 404);
        }

        // Vérifier si le favori existe déjà avant d'essayer de l'insérer
        $existingFavorite = Favorite::where('user_id', $user->id)
            ->where('talk_id', $talkId)
            ->first();

        if ($existingFavorite) {
            return response()->json(['message' => 'Talk already in favorites'], 409);
        }

        try {
            $favorite = new Favorite;
            $favorite->user_id = $user->id;
            $favorite->talk_id = $talkId;
            $favorite->save();

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
                return response()->json(['message' => 'Talk already in favorites'], 409);
            }
            throw $e;
        }
    }

    /**
     * Remove a talk from favorites
     */
    public function destroy(Request $request, $talkId)
    {
        $user = $request->user();

        $favorite = Favorite::where('user_id', $user->id)
            ->where('talk_id', $talkId)
            ->first();

        if (! $favorite) {
            return response()->json(['message' => 'Favorite not found'], 404);
        }

        $favorite->delete();

        return response()->json(['message' => 'Talk removed from favorites']);
    }

    /**
     * List user's favorites
     */
    public function index(Request $request)
    {
        $authUser = $request->user();

        $favorites = Favorite::where('user_id', $authUser->id)
            ->with('talk', 'talk.speaker')
            ->paginate($request->input('per_page', 15));

        return response()->json($favorites);
    }
}

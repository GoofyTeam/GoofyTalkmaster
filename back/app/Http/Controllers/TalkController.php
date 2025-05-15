<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\Talk;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TalkController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Seuls les speakers peuvent voir leurs talks
        if (! $user->isSpeaker() && ! $user->isOrganizer() && ! $user->isSuperadmin()) {
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

        return response()->json($query->paginate($request->input('per_page', 15)));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->isPublic()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'subject' => 'required|string|max:100',
            'description' => 'required|string',
            'duration_minutes' => 'required|integer|min:15|max:180',
            'level' => 'required|in:beginner,intermediate,advanced',
        ])->validate();

        $talk = new Talk;
        $talk->title = $request->input('title');
        $talk->subject = $request->input('subject');
        $talk->description = $request->input('description');
        $talk->duration_minutes = $request->input('duration_minutes');
        $talk->level = $request->input('level');
        $talk->status = 'pending';
        $talk->speaker_id = $user->id;
        $talk->save();

        return response()->json([
            'message' => 'Talk created successfully',
            'talk' => $talk,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id)
    {
        $talk = Talk::find($id);

        if (! $talk) {
            return response()->json(['message' => 'Talk not found'], 404);
        }

        $user = $request->user();

        // Seul le speaker propriétaire ou un admin peut voir le talk
        if ($talk->speaker_id !== $user->id && ! $user->isOrganizer() && ! $user->isSuperadmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($talk);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $talk = Talk::find($id);

        if (! $talk) {
            return response()->json(['message' => 'Talk not found'], 404);
        }

        $user = $request->user();

        // Seul le speaker propriétaire peut modifier son talk et uniquement si status = pending
        if ($talk->speaker_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($talk->status !== 'pending') {
            return response()->json(['message' => 'Only pending talks can be updated'], 400);
        }

        Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'subject' => 'sometimes|string|max:100',
            'description' => 'sometimes|string',
            'duration_minutes' => 'sometimes|integer|min:15|max:180',
            'level' => 'sometimes|in:beginner,intermediate,advanced',
        ])->validate();

        $talk->title = $request->input('title', $talk->title);
        $talk->subject = $request->input('subject', $talk->subject);
        $talk->description = $request->input('description', $talk->description);
        $talk->duration_minutes = $request->input('duration_minutes', $talk->duration_minutes);
        $talk->level = $request->input('level', $talk->level);
        $talk->save();

        return response()->json([
            'message' => 'Talk updated successfully',
            'talk' => $talk,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id)
    {
        $talk = Talk::find($id);

        if (! $talk) {
            return response()->json(['message' => 'Talk not found'], 404);
        }

        $user = $request->user();

        // Seul le speaker propriétaire peut supprimer son talk et uniquement si status = pending
        if ($talk->speaker_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($talk->status !== 'pending') {
            return response()->json(['message' => 'Only pending talks can be deleted'], 400);
        }

        $talk->delete();

        return response()->json(['message' => 'Talk deleted successfully']);
    }

    /**
     * Update talk status.
     */
    public function updateStatus(Request $request, string $id)
    {
        $talk = Talk::find($id);

        if (! $talk) {
            return response()->json(['message' => 'Talk not found'], 404);
        }

        $user = $request->user();

        // Seul un organizer ou superadmin peut changer le statut
        if (! $user->isOrganizer() && ! $user->isSuperadmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        Validator::make($request->all(), [
            'status' => 'required|in:accepted,rejected',
        ])->validate();

        $newStatus = $request->input('status');

        // Vérification des transitions autorisées
        if ($talk->status !== 'pending') {
            return response()->json(['message' => 'Only pending talks can be accepted or rejected'], 400);
        }

        $talk->status = $newStatus;
        $talk->save();

        return response()->json([
            'message' => 'Talk status updated successfully',
            'talk' => $talk,
        ]);
    }

    /**
     * Schedule talk (date, time, room).
     */
    public function schedule(Request $request, string $id)
    {
        $talk = Talk::find($id);

        if (! $talk) {
            return response()->json(['message' => 'Talk not found'], 404);
        }

        $user = $request->user();

        // Seul un organizer ou superadmin peut programmer un talk
        if (! $user->isOrganizer() && ! $user->isSuperadmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Vérification que le talk est accepté
        if ($talk->status !== 'accepted') {
            return response()->json(['message' => 'Only accepted talks can be scheduled'], 400);
        }

        Validator::make($request->all(), [
            'scheduled_date' => 'required|date|date_format:Y-m-d',
            'start_time' => 'required|date_format:H:i',
            'room_id' => 'required|exists:rooms,id',
        ])->validate();

        $scheduledDate = $request->input('scheduled_date');
        $startTime = $request->input('start_time');
        $roomId = $request->input('room_id');

        // Vérifier que l'heure est entre 9h et 19h
        $timeObj = Carbon::createFromFormat('H:i', $startTime);
        if ($timeObj->hour < 9 || $timeObj->hour >= 19) {
            return response()->json(['message' => 'Talk must be scheduled between 09:00 and 19:00'], 400);
        }

        // Calculer l'heure de fin
        $endTime = (clone $timeObj)->addMinutes($talk->duration_minutes)->format('H:i');

        // Récupérer tous les talks qui pourraient être en conflit
        $potentialConflicts = Talk::where('room_id', $roomId)
            ->where('scheduled_date', $scheduledDate)
            ->where('status', 'scheduled')
            ->get();

        // Vérifier les conflits en PHP plutôt qu'avec des fonctions SQL spécifiques
        foreach ($potentialConflicts as $otherTalk) {
            $otherStart = Carbon::createFromFormat('H:i', $otherTalk->start_time);
            $otherEnd = (clone $otherStart)->addMinutes($otherTalk->duration_minutes);

            $newStart = $timeObj;
            $newEnd = Carbon::createFromFormat('H:i', $endTime);

            // Vérifier si les horaires se chevauchent
            if ($newStart < $otherEnd && $newEnd > $otherStart) {
                return response()->json(['message' => 'Room scheduling conflict detected'], 400);
            }
        }

        $talk->scheduled_date = $scheduledDate;
        $talk->start_time = $startTime;
        $talk->room_id = $roomId;
        $talk->status = 'scheduled';
        $talk->save();

        return response()->json([
            'message' => 'Talk scheduled successfully',
            'talk' => $talk,
        ]);
    }

    /**
     * List public talks for everyone.
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

        return response()->json($query->with('speaker')->paginate($request->input('per_page', 15)));
    }
}

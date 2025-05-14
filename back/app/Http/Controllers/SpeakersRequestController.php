<?php

namespace App\Http\Controllers;

use App\Models\SpeakersRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SpeakersRequestController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $authUser = request()->user();
        if ($authUser->isPublic() || $authUser->isSpeaker()) {
            $speakersRequests = SpeakersRequest::where('user_id', $authUser->id)->paginate(15);

            return response()->json($speakersRequests);
        }

        Validator::make(request()->all(), [
            'per_page' => 'integer|min:1|max:100',
            'page' => 'integer|min:1',
            'status' => 'sometimes|in:open,closed',
            'search' => 'sometimes|string',
            'sort_by' => 'sometimes|in:created_at,updated_at',
            'sort_direction' => 'sometimes|in:asc,desc',
        ])->validate();

        $query = SpeakersRequest::query();

        // Filtres
        if (request()->has('status')) {
            $query->where('status', request()->input('status'));
        }
        if (request()->has('search')) {
            $search = request()->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', '%'.$search.'%')
                    ->orWhere('phone', 'like', '%'.$search.'%');
            });
        }
        // Tri
        if (request()->has('sort_by')) {
            $sortBy = request()->input('sort_by');
            $sortDirection = request()->input('sort_direction', 'asc');
            $query->orderBy($sortBy, $sortDirection);
        } else {
            $query->orderBy('created_at', 'desc');
        }
        // Pagination
        $perPage = request()->input('per_page', 15);
        $page = request()->input('page', 1);
        $speakersRequests = $query->paginate($perPage, ['*'], 'page', $page);

        return response()->json($speakersRequests);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Validator::make($request->all(), [
            'phone' => 'nullable|string|max:255',
            'description' => 'required|string|max:1000',
        ])->validate();

        $speakersRequest = new SpeakersRequest;
        $speakersRequest->user_id = $request->user()->id;
        $speakersRequest->phone = $request->input('phone');
        $speakersRequest->description = $request->input('description');
        $speakersRequest->status = 'open';
        $speakersRequest->save();

        return response()->json([
            'message' => 'Speakers request created successfully',
            'speakers_request' => $speakersRequest,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $speakersRequest = SpeakersRequest::find($id);
        if (! $speakersRequest) {
            return response()->json([
                'message' => 'Speakers request not found',
            ], 404);
        }

        return response()->json($speakersRequest);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $authUser = request()->user();
        if ($authUser->isPublic() || $authUser->isSpeaker()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $speakersRequest = SpeakersRequest::find($id);
        if (! $speakersRequest) {
            return response()->json([
                'message' => 'Speakers request not found',
            ], 404);
        }

        Validator::make($request->all(), [
            'phone' => 'nullable|string|max:255',
            'description' => 'required|string|max:1000',
            'status' => 'sometimes|in:open,closed',
        ])->validate();

        $speakersRequest->phone = $request->input('phone', $speakersRequest->phone);
        $speakersRequest->description = $request->input('description', $speakersRequest->description);
        $speakersRequest->status = $request->input('status', $speakersRequest->status);
        $speakersRequest->save();

        return response()->json([
            'message' => 'Speakers request updated successfully',
            'speakers_request' => $speakersRequest,
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $authUser = request()->user();
        if ($authUser->isPublic() || $authUser->isSpeaker()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }
        $speakersRequest = SpeakersRequest::find($id);
        if (! $speakersRequest) {
            return response()->json([
                'message' => 'Speakers request not found',
            ], 404);
        }
        $speakersRequest->delete();

        return response()->json([
            'message' => 'Speakers request deleted successfully',
        ], 200);
    }
}

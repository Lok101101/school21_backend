<?php

namespace App\Http\Controllers;

use App\Models\PracticeGroup;
use Illuminate\Http\Request;

class PracticeGroupController extends Controller
{
    public function getUserGroups(Request $request)
    {
        $practiceGroups = $request->user()->practiceGroups;
        foreach ($practiceGroups as $practiceGroup) {
            $practiceGroup->is_active = $practiceGroup->end_date->gt(now());
        }

        $practiceGroups->makeHidden('pivot');
        return response()->json(['user_groups' => $practiceGroups], 200);
    }

    public function getAllGroups(Request $request)
    {
        $practiceGroups = PracticeGroup::where('city', $request->user()->city)->get();

        foreach ($practiceGroups as $practiceGroup) {
            $practiceGroup->is_active = $practiceGroup->end_date->gt(now());
        }
        return response()->json(['groups' => $practiceGroups], 200);
    }
}

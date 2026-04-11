import mongoose from "mongoose";

import { ITrack } from "../interfaces/ITrack.ts";

const schemaTrack = new mongoose.Schema<ITrack>({
    user_id: Number,
    group_id: Number,
    poll_id: String,
    positions: Array<{ lat: number, long: number, date: Date }>,
    totalKm: { type: Number, default: 0},
    totalTime: { type: Number, default: 0},
    terminate: { type: Boolean, default: false },
    created: { type: Date, default: () => new Date() },
    updated: { type: Date, default: null }
});

schemaTrack.index({user_id: 1, group_id: 1, poll_id: 1}, {unique: true});

export const modelTrack = mongoose.model("track", schemaTrack, "tracks");
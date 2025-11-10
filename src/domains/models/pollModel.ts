import mongoose from "mongoose";

import { IPoll } from "../interfaces/IPoll";

const schemaPoll = new mongoose.Schema<IPoll>({
    id: String,
    message_id: Number,
    group_id: Number,
    expire: Date,
    type: String,
    answered: [Number],
    stop: { type: Boolean, default: false },
    created: { type: Date, default: () => new Date() },
    updated: { type: Date, default: null },
    target_impostor: {type: Number, default: null}
});

export const modelPoll = mongoose.model("poll", schemaPoll, "polls");
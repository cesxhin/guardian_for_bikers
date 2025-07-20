import mongoose from "mongoose";

import { IPoll } from "../interfaces/IPoll";

const schemaGroup = new mongoose.Schema<IPoll>({
    id: String,
    message_id: Number,
    group_id: Number,
    expire: Date,
    type: String,
    answered: Array<string>,
    stop: { type: Boolean, default: false }
});

export const modelPoll = mongoose.model("poll", schemaGroup, "polls");
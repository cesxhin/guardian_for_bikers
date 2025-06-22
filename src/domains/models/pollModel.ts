import mongoose from "mongoose";
import { DateTime } from "luxon";

import { IPoll } from "../interfaces/IPoll";
import { POLLS_DURATION_SECONDS } from "../../env";

const schemaGroup = new mongoose.Schema<IPoll>({
    id: String,
    message_id: Number,
    group_id: Number,
    expire: { type: Date, default: DateTime.now().plus({ seconds: POLLS_DURATION_SECONDS }).toJSDate() },
    type: String,
    answered: Array<string>,
    stop: { type: Boolean, default: false }
});

export const modelPoll = mongoose.model("poll", schemaGroup, "polls");
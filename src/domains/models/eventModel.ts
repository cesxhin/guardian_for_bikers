import mongoose from "mongoose";

import { IEvent } from "../interfaces/IEvent.ts";

const schemaEvent = new mongoose.Schema<IEvent>({
    group_id: Number,
    expire: Date,
    expire_poll: Date,
    poll_id: String,
    stop: {type: Boolean, default: false},
    type: String,
    answered: [Number],
    created: { type: Date, default: () => new Date() },
    updated: { type: Date, default: null },
    target_impostor: Number
});

//todo creare indici
schemaEvent.index({ ["poll_id" satisfies keyof IEvent]: 1, ["group_id" satisfies keyof IEvent]: 1 }, {unique: true});
schemaEvent.index({ ["poll_id" satisfies keyof IEvent]: 1, ["stop" satisfies keyof IEvent]: 1 });
schemaEvent.index({ ["group_id" satisfies keyof IEvent]: 1 });
schemaEvent.index({ ["expire_poll" satisfies keyof IEvent]: 1, ["stop" satisfies keyof IEvent]: 1 });

export const modelEvent = mongoose.model<IEvent>("event", schemaEvent, "events");
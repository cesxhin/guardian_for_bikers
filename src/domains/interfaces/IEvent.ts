import z from "zod";
import mongoose from "mongoose";

const schemaBaseEvent = z.object({
    _id: z.custom<mongoose.Types.ObjectId>(),
    group_id: z.number(),
    answered: z.array(z.number().nonnegative()),
    created: z.date(),
    updated: z.date().nullable(),
    stop: z.boolean()
});

const schemaEventOut = schemaBaseEvent.extend({
    type: z.literal("out"),
    poll_id: z.string().nullable(),
    expire: z.date(),
    expire_poll: z.date().nullable()
});
const schemaEventOutX2 = schemaBaseEvent.extend({
    type: z.literal("out_x2"),
    poll_id: z.string().nullable(),
    expire: z.date(),
    expire_poll: z.date().nullable()
});
const schemaEventQuestion = schemaBaseEvent.extend({
    type: z.literal("question"),
    poll_id: z.string(),
    expire_poll: z.date()
});
const schemaEventImpostor = schemaBaseEvent.extend({
    type: z.literal("impostor"),
    target_impostor: z.number(),
    expire_poll: z.date(),
    poll_id: z.string()
});

export const schemaEvent = z.discriminatedUnion("type", [
    schemaEventOut,
    schemaEventQuestion,
    schemaEventImpostor,
    schemaEventOutX2
]);

export type IEvent = z.infer<typeof schemaEvent>;
export type EventOf<T extends IEvent["type"]> = Extract<IEvent, { type: T }>;
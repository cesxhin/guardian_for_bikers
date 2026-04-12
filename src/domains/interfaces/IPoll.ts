import z from "zod";

export const schemaPoll = z.object({
    id: z.string().nonempty(),
    message_id: z.number(),
    group_id: z.number(),
    type: z.literal(["out", "out_x2", "question", "impostor"]),
    expire: z.date(),
    answered: z.array(z.number().nonnegative()),
    stop: z.boolean(),
    created: z.date(),
    updated: z.date().nullable(),
    target_impostor: z.number().nullable()
});

export type IPoll = z.infer<typeof schemaPoll>;
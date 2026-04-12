import z from "zod";

export const schemaTrack = z.object({
    poll_id: z.string().nonempty(),
    group_id: z.number(),
    user_id: z.number(),
    positions: z.array(
        z.object({
            lat: z.number(),
            long: z.number(),
            date: z.date()
        })
    ),
    totalKm: z.number().nonnegative(),
    totalTime: z.number().nonnegative(),
    terminate: z.boolean(),
    created: z.date(),
    updated: z.date().nullable()
});

export type ITrack = z.infer<typeof schemaTrack>;
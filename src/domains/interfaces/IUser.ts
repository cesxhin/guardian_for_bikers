import z from "zod";

export const schemaUser = z.object({
    id: z.number(),
    chat_id: z.number(),
    username: z.string().nonempty(),
    outWithBike: z.number().nonnegative(),
    skipOutWithBike: z.number().nonnegative(),
    currentYear: z.number().nonnegative(),
    created: z.date(),
    updated: z.date().nullable(),
    points: z.number().nonnegative(),
    scoreMultiplier: z.number().nonnegative(),
    totalKm: z.number().nonnegative(),
    totalImpostor: z.number().nonnegative()
});

export type IUser = z.infer<typeof schemaUser>;
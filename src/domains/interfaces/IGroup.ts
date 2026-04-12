import z from "zod";

export const schemaGroup = z.object({
    id: z.number(),
    name: z.string().nonempty(),
    enabled: z.boolean(),
    latitude: z.number(),
    longitude: z.number(),
    location: z.string().nonempty(),
    timezone: z.string().nonempty(),
    start_time_guardian: z.string().nonempty(),
    end_time_guardian: z.string().nonempty(),
    days_trigger: z.tuple([z.boolean(), z.boolean(), z.boolean(), z.boolean(), z.boolean(), z.boolean(), z.boolean()]),
    created: z.date(),
    updated: z.date().nullable()
});

export type IGroup = z.infer<typeof schemaGroup>;
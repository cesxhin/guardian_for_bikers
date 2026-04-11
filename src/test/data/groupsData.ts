import { IGroup } from "../../domains/interfaces/IGroup.ts";

export default [
    {
        id: 1,
        name: "test-1",
        latitude: 0,
        longitude: 0,
        location: "italy",
        timezone: "rome",
        days_trigger: [true, true, true, true, true, true, true],
        enabled: true,
        start_time_guardian: "10:00",
        end_time_guardian: "12:00",
        created: new Date(),
        updated: new Date()
    },
    {
        id: 2,
        name: "test-2",
        latitude: 0,
        longitude: 0,
        location: "italy",
        timezone: "rome",
        days_trigger: [true, true, true, true, true, true, true],
        enabled: false,
        start_time_guardian: "10:00",
        end_time_guardian: "12:00",
        created: new Date(),
        updated: new Date()
    }
] satisfies IGroup[];
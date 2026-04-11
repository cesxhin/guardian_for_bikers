import { ITrack } from "../../domains/interfaces/ITrack.ts";

export default [
    {
        group_id: 1,
        created: new Date(),
        updated: new Date(),
        poll_id: "poll-1",
        positions: [],
        terminate: false,
        totalKm: 0,
        totalTime: 0,
        user_id: 1
    },
    {
        group_id: 1,
        created: new Date(),
        updated: new Date(),
        poll_id: "poll-1",
        positions: [],
        terminate: true,
        totalKm: 0,
        totalTime: 0,
        user_id: 2
    }
] satisfies ITrack[];
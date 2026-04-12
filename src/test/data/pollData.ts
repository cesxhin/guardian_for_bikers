import { DateTime } from "luxon";
import { IPoll } from "../../domains/interfaces/IPoll.ts";

export default [
    {
        id: "poll-1",
        answered: [],
        created: new Date(),
        updated: new Date(),
        expire: DateTime.now().plus({minutes: 5}).toJSDate(),
        group_id: 1,
        message_id: 1,
        stop: false,
        target_impostor: 1,
        type: "impostor"
    },
    {
        id: "poll-2",
        answered: [],
        created: new Date(),
        updated: new Date(),
        expire: DateTime.now().plus({minutes: 5}).toJSDate(),
        group_id: 2,
        message_id: 1,
        stop: true,
        target_impostor: 2,
        type: "impostor"
    },
    {
        id: "poll-3",
        answered: [],
        created: new Date(),
        updated: new Date(),
        expire: DateTime.now().minus({minutes: 1}).toJSDate(),
        group_id: 3,
        message_id: 3,
        stop: false,
        target_impostor: 3,
        type: "impostor"
    },
    {
        id: "poll-4",
        answered: [],
        created: new Date(),
        updated: new Date(),
        expire: DateTime.now().minus({minutes: 1}).toJSDate(),
        group_id: 4,
        message_id: 4,
        stop: true,
        target_impostor: 4,
        type: "impostor"
    },
    {
        id: "poll-5",
        answered: [],
        created: new Date(),
        updated: new Date(),
        expire: DateTime.now().plus({minutes: 5}).toJSDate(),
        group_id: 5,
        message_id: 5,
        stop: true,
        target_impostor: 5,
        type: "impostor"
    }
] satisfies IPoll[];
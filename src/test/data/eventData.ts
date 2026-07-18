import mongoose from "mongoose";
import { DateTime } from "luxon";

import { IEvent } from "../../domains/interfaces/IEvent.ts";

export default [
    {
        _id: new mongoose.Types.ObjectId(),
        answered: [],
        created: new Date(),
        updated: new Date(),
        expire_poll: DateTime.now().plus({minutes: 5}).toJSDate(),
        group_id: 1,
        stop: false,
        poll_id: "poll-1",
        target_impostor: 1,
        type: "impostor"
    },
    {
        _id: new mongoose.Types.ObjectId(),
        answered: [],
        created: new Date(),
        updated: new Date(),
        expire_poll: DateTime.now().plus({minutes: 5}).toJSDate(),
        group_id: 2,
        stop: true,
        poll_id: "poll-2",
        target_impostor: 2,
        type: "impostor"
    },
    {
        _id: new mongoose.Types.ObjectId(),
        answered: [],
        created: new Date(),
        updated: new Date(),
        expire_poll: DateTime.now().minus({minutes: 1}).toJSDate(),
        group_id: 3,
        stop: false,
        poll_id: "poll-3",
        target_impostor: 3,
        type: "impostor"
    },
    {
        _id: new mongoose.Types.ObjectId(),
        answered: [],
        created: new Date(),
        updated: new Date(),
        expire_poll: DateTime.now().minus({minutes: 1}).toJSDate(),
        group_id: 4,
        stop: true,
        poll_id: "poll-4",
        target_impostor: 4,
        type: "impostor"
    },
    {
        _id: new mongoose.Types.ObjectId(),
        answered: [],
        created: new Date(),
        updated: new Date(),
        expire_poll: DateTime.now().plus({minutes: 5}).toJSDate(),
        group_id: 5,
        stop: true,
        target_impostor: 5,
        poll_id: "poll-5",
        type: "impostor"
    }
] satisfies IEvent[];
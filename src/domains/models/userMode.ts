import mongoose from "mongoose";

import { IUser } from "../interfaces/IUser.ts";

const schemaUser = new mongoose.Schema<IUser>({
    id: Number,
    chat_id: Number,
    currentYear: Number,
    outWithBike: Number,
    skipOutWithBike: Number,
    username: String,
    points: Number,
    updated: { type: Date, default: null },
    created: { type: Date, default: () => new Date() },
    scoreMultiplier: { type: Number, default: 0 },
    totalKm: Number,
    totalImpostor: Number
});

schemaUser.index({id: 1, chat_id: 1, username: 1}, {unique: true});

export const modelUser = mongoose.model("user", schemaUser, "users");
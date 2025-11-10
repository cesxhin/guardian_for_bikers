import mongoose from "mongoose";
import { IUser } from "../interfaces/IUser";

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

export const modelUser = mongoose.model("user", schemaUser, "users");
import mongoose from "mongoose";
import { IUser } from "../interfaces/IUser";

const schemaUser = new mongoose.Schema<IUser>({
    id: Number,
    chat_id: Number,
    currentYear: Number,
    outWithBike: Number,
    skipOutWithBike: Number,
    totalKm: Number,
    username: String
});

export const modelUser = mongoose.model("user", schemaUser, "users");
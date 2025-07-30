import mongoose from "mongoose";
import { IGroup } from "../interfaces/IGroup";

const schemaGroup = new mongoose.Schema<IGroup>({
    id: Number,
    name: String,
    enabled: Boolean,
    location: String,
    latitude: Number,
    longitude: Number,
    timezone: String,
    start_time_guardian: String,
    end_time_guardian: String,
    time_trigger: String,
    days_trigger: Array<boolean>,
    created: { type: Date, default: () => new Date() },
    updated: { type: Date, default: null }
});

export const modelGroup = mongoose.model("group", schemaGroup, "groups");
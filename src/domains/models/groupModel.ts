import mongoose from "mongoose";
import { IGroup } from "../interfaces/IGroup.ts";

const schemaGroup = new mongoose.Schema<IGroup>({
    id: { type: Number, unique: true},
    name: { type: String },
    enabled: { type: Boolean, default: true },
    location: { type: String, default: "rome" },
    latitude: { type: Number, default: 41.8919 },
    longitude: { type: Number, default: 12.5113 },
    timezone: { type: String, default: "Europe/Rome" },
    start_time_guardian: { type: String, default: "00:00" },
    end_time_guardian: { type: String, default: "23:00" },
    days_trigger: {type: [Boolean], default: [true, true, true, true, true, true, true]},
    created: { type: Date, default: () => new Date() },
    updated: { type: Date, default: null }
});

export const modelGroup = mongoose.model("group", schemaGroup, "groups");
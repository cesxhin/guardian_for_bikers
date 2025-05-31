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
    time_trigger: String,
    monday: Boolean,
    tuesday: Boolean,
    wednesday: Boolean,
    thursday: Boolean,
    friday: Boolean,
    saturday: Boolean,
    sunday: Boolean
});

export const modelGroup = mongoose.model("group", schemaGroup, "groups");
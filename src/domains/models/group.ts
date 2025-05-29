import mongoose from "mongoose";
import { IGroup } from "../interfaces/IGroup";

const schemaGroup = new mongoose.Schema<IGroup>({
    enabled: Boolean,
    id: Number,
    location: String,
    latitude: Number,
    longitude: Number,
    time_trigger: String,
    monday: Boolean,
    tuesday: Boolean,
    wednesday: Boolean,
    thursday: Boolean,
    friday: Boolean,
    saturday: Boolean,
    sunday: Boolean
});

export const modelGroup = mongoose.model('group', schemaGroup, 'groups');
import mongoose from "mongoose";
import { IGroup } from "../interfaces/IGroup";

const schemaGroup = new mongoose.Schema<IGroup>({
    enabled: Boolean,
    id: Number,
    location: String,
    time_trigger: String
});

export const modelGroup = mongoose.model('group', schemaGroup, 'groups');
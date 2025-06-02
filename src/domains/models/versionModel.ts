import mongoose from "mongoose";
import { IVersion } from "../interfaces/IVersion";

const schemaVersion = new mongoose.Schema<IVersion>({
    name: String,
    version: Number
});

export const modelVersion = mongoose.model("version", schemaVersion, "versions");
import _ from "lodash";

import Logger from "../lib/logger";
import { IGroup } from "../domains/interfaces/IGroup";
import { modelGroup } from "../domains/models/groupModel";
import { GroupErrorGeneric, GroupNotFound } from "../utils/exceptionsUtils";
import { StrictOmit } from "../lib/types";

const logger = Logger("group-repository");

export class GroupRepository {
    async find(id: number): Promise<IGroup>{
        let group: IGroup | null;
        try {
            group = await modelGroup.findOne({ id }).lean();
        } catch (err){
            logger.error("Error find, details:", err);
            throw new GroupErrorGeneric(err);
        }

        if (_.isNil(group)){
            throw new GroupNotFound(`Not found group id "${id}"`);
        }

        return group;
    }

    async edit(id: number, data: Omit<Partial<IGroup>, "id">): Promise<IGroup>{
        let group: IGroup | null;
        try {
            group = await modelGroup.findOneAndUpdate({ id }, data, { new: true }).lean();
        } catch (err){
            logger.error("Error edit, details:", err);
            throw new GroupErrorGeneric(err);
        }

        if (_.isNil(group)){
            throw new GroupNotFound(`Not found group id "${id}" for edit`);
        }

        return group;
    }

    async create(data: StrictOmit<IGroup, "created" | "updated">): Promise<IGroup> {
        try {
            return (await modelGroup.create(data)).toObject();
        } catch (err){
            logger.error("Error create, details:", err);
            throw new GroupErrorGeneric(err);
        }
    }

    async delete(id: number): Promise<void>{
        let count = 0;
        try {
            count = (await modelGroup.deleteOne({ id })).deletedCount;
        } catch (err){
            logger.error("Error create, details:", err);
            throw new GroupErrorGeneric(err);
        }

        if (count === 0){
            throw new GroupNotFound(`Not found group id "${id}" for delete`);
        }
    }

    async listActive(): Promise<IGroup[]>{
        try {
            return await modelGroup.find({ enabled: true }).lean();
        } catch (err){
            logger.error("Error list, details:", err);
            throw new GroupErrorGeneric(err);
        }
    }
}
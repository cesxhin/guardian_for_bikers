import _ from "lodash";

import Logger from "../lib/logger";
import { IUser } from "../domains/interfaces/IUser";
import { modelUser } from "../domains/models/userMode";
import { UserErrorGeneric, UserNotFound } from "../utils/exceptionsUtils";
import { StrictOmit } from "../lib/types";

const logger = Logger("user-repository");

export class UserRepository {
    async findById(chat_id: number, id: number): Promise<IUser>{
        let user: IUser | null;
        try {
            user = await modelUser.findOne({ id, chat_id }).lean();
        } catch (err){
            logger.error("Error find, details:", err);
            throw new UserErrorGeneric(err);
        }
            
        if (_.isNil(user)){
            throw new UserNotFound(`Not found user id "${id}"`);
        }
        
        return user;
    }
    
    async findManyByGroupId(chat_id: number): Promise<IUser[]> {
        try {
            return await modelUser.find({ chat_id }).lean();
        } catch (err){
            logger.error("Error find many by group id, details:", err);
            throw new UserErrorGeneric(err);
        }
    }

    async getIdsByChatId(chatId: number): Promise<number[]>{
        try {
            return await modelUser.distinct("id", {chat_id: chatId}).lean();
        } catch (err){
            logger.error("Error find, details:", err);
            throw new UserErrorGeneric(err);
        }
    }
    
    async edit(chat_id: number, id: number, data: StrictOmit<Partial<IUser>, "id">): Promise<IUser>{
        let user: IUser | null;
        try {
            user = await modelUser.findOneAndUpdate({ id, chat_id }, data, { new: true }).lean();
        } catch (err){
            logger.error("Error edit, details:", err);
            throw new UserErrorGeneric(err);
        }
        if (_.isNil(user)){
            throw new UserNotFound(`Not found user id "${id}" for edit`);
        }
        return user;
    }

    async create(data: StrictOmit<IUser, "created" | "updated">): Promise<IUser> {
        try {
            return (await modelUser.create(data)).toObject();
        } catch (err){
            logger.error("Error create, details:", err);
            throw new UserErrorGeneric(err);
        }
    }
    
    async deleteById(chat_id: number, id: number): Promise<void>{
        let count = 0;
        try {
            count = (await modelUser.deleteOne({ id, chat_id })).deletedCount;
        } catch (err){
            logger.error("Error create, details:", err);
            throw new UserErrorGeneric(err);
        }

        if (count === 0){
            throw new UserNotFound(`Not found user id "${id}" for delete`);
        }
    }
    
    async deleteManyByChatId(chatId: number): Promise<void>{
        try {
            await modelUser.deleteMany({ chat_id: chatId });
        } catch (err){
            logger.error("Error create, details:", err);
            throw new UserErrorGeneric(err);
        }
    }
}
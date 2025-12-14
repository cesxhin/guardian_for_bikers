import _ from "lodash";
import { IPoll } from "../domains/interfaces/IPoll";
import { modelPoll } from "../domains/models/pollModel";
import Logger from "../lib/logger";
import { StrictOmit } from "../lib/types";
import { PollErrorGeneric, PollNotFound } from "../utils/exceptionsUtils";

const logger = Logger("poll-repository");

export class PollRepository {
    
    async findById(id: string): Promise<IPoll>{
        let user: IPoll | null;
        try {
            user = await modelPoll.findOne({ id }).lean();
        } catch (err){
            logger.error("Error findById, details:", err);
            throw new PollErrorGeneric(err);
        }
            
        if (_.isNil(user)){
            throw new PollNotFound(`Not found poll id "${id}"`);
        }
        
        return user;
    }
    
    async checkTargetImpostor(group_id: number, user_id: number): Promise<boolean>{
        let user: IPoll | null;
        try {
            user = await modelPoll.findOne({ group_id, target_impostor: user_id, type: "impostor", stop: false }).lean();
        } catch (err){
            logger.error("Error findById, details:", err);
            throw new PollErrorGeneric(err);
        }
        
        return !_.isNil(user);
    }

    async findByGroupId(group_id: number): Promise<IPoll>{
        let poll: IPoll | null;
        try {
            poll = await modelPoll.findOne({ group_id }).sort({ created: -1 }).lean();
        } catch (err){
            logger.error("Error findByGroupId, details:", err);
            throw new PollErrorGeneric(err);
        }

        if (_.isNil(poll)){
            throw new PollNotFound(`Not found poll valid with group id "${group_id}"`);
        }
        
        return poll;
    }

    async create(data: StrictOmit<IPoll, "expire" | "answered" | "stop" | "created" | "updated">): Promise<IPoll>{
        try {
            return (await modelPoll.insertOne(data)).toObject();
        } catch (err){
            logger.error("Error create, details:", err);
            throw new PollErrorGeneric(err);
        }
    }

    async listExpired(): Promise<IPoll[]>{
        try {
            return await modelPoll.find({expire: { $lte: new Date() }, stop: false}).lean();
        } catch (err){
            logger.error("Error listExpired, details:", err);
            throw new PollErrorGeneric(err);
        }
    }

    async listValidWithTypeOutById(id: string): Promise<IPoll>{

        let poll: IPoll | null;
        try {
            poll = await modelPoll.findOne({id, stop: false, type: { $ne: "question" }}).lean();
        } catch (err){
            logger.error("Error listValidWithTypeOut, details:", err);
            throw new PollErrorGeneric(err);
        }

        if (_.isNil(poll)){
            throw new PollNotFound("Not found poll id "+ id);
        }

        return poll;
    }
        
    async deleteByIds(ids: string[]): Promise<void>{
        let count = 0;
        try {
            count = (await modelPoll.deleteMany({ id: ids })).deletedCount;
        } catch (err){
            logger.error("Error deleteByIds, details:", err);
            throw new PollErrorGeneric(err);
        }

        if (count === 0){
            throw new PollNotFound(`Not found polls ids "${ids.join(", ")}" for delete`);
        }
    }
    
    async edit(id: string, data: Partial<IPoll>): Promise<IPoll>{
        let user: IPoll | null;
        try {
            user = await modelPoll.findOneAndUpdate({ id }, data, { new: true }).lean();
        } catch (err){
            logger.error("Error edit, details:", err);
            throw new PollErrorGeneric(err);
        }
            
        if (_.isNil(user)){
            throw new PollNotFound(`Not found poll id "${id}"`);
        }
        
        return user;
    }

    async answered(id: string, userId: number): Promise<IPoll>{

        let poll: IPoll | null;
        try {
            poll = await modelPoll.findOneAndUpdate({ id, stop: false }, { $push: { answered: userId } }, {new: true}).lean();
        } catch (err){
            logger.error("Error answered, details:", err);
            throw new PollErrorGeneric(err);
        }

        if (_.isNil(poll)){
            throw new PollNotFound("Not found poll id "+ id);
        }

        return poll;
    }

    async deleteByChatId(chatId: number): Promise<void>{
        try {
            await modelPoll.deleteMany({ group_id: chatId });
        } catch (err){
            logger.error("Error deleteByChatId, details:", err);
            throw new PollErrorGeneric(err);
        }
    }

}
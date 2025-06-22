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
            logger.error("Error find, details:", err);
            throw new PollErrorGeneric(err);
        }
            
        if (_.isNil(user)){
            throw new PollNotFound(`Not found poll id "${id}"`);
        }
        
        return user;
    }

    async create(data: StrictOmit<IPoll, "expire" | "answered" | "stop">): Promise<IPoll>{
        try {
            return (await modelPoll.insertOne(data)).toObject();
        } catch (err){
            logger.error("Error find, details:", err);
            throw new PollErrorGeneric(err);
        }
    }

    async listExpired(): Promise<IPoll[]>{
        try {
            return await modelPoll.find({expire: { $lte: new Date() }, stop: false}).lean();
        } catch (err){
            logger.error("Error find, details:", err);
            throw new PollErrorGeneric(err);
        }
    }
        
    async deleteByIds(ids: string[]): Promise<void>{
        let count = 0;
        try {
            count = (await modelPoll.deleteMany({ id: ids })).deletedCount;
        } catch (err){
            logger.error("Error create, details:", err);
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
        try {
            return await modelPoll.findOneAndUpdate({ id }, { $push: { answered: userId } }).lean();
        } catch (err){
            logger.error("Error edit, details:", err);
            throw new PollErrorGeneric(err);
        }
    }

}
import _ from "lodash";
import mongoose from "mongoose";

import Logger from "../../lib/logger.ts";
import { IEvent } from "../../domains/interfaces/IEvent.ts";
import { modelEvent } from "../../domains/models/eventModel.ts";
import { PollConflict, PollErrorGeneric, PollNotFound } from "../../utils/exceptionsUtils.ts";

const logger = Logger("event-repository");

export class EventRepository {
    
    async findById(id: string | mongoose.Types.ObjectId): Promise<IEvent>{
        let event: IEvent | null;
        try {
            event = await modelEvent.findOne({ _id: id }).lean();
        } catch (err){
            logger.error("Error findById, details:", err);
            throw new PollErrorGeneric(err);
        }
            
        if (_.isNil(event)){
            throw new PollNotFound(`Not found event id "${id}"`);
        }
        
        return event;
    }
    
    async findByPollId(id: string): Promise<IEvent>{
        let event: IEvent | null;
        try {
            event = await modelEvent.findOne({ poll_id: id, stop: false }).lean();
        } catch (err){
            logger.error("Error findByPollId, details:", err);
            throw new PollErrorGeneric(err);
        }
            
        if (_.isNil(event)){
            throw new PollNotFound(`Not found poll id "${id}"`);
        }
        
        return event;
    }
    
    async checkTargetImpostor(group_id: number, user_id: number): Promise<boolean>{
        let event: IEvent | null;
        try {
            event = await modelEvent.findOne({ group_id, target_impostor: user_id, type: "impostor", stop: false }).lean();
        } catch (err){
            logger.error("Error findById, details:", err);
            throw new PollErrorGeneric(err);
        }
        
        return !_.isNil(event);
    }

    async findByGroupId(group_id: number): Promise<IEvent>{
        let event: IEvent | null;
        try {
            event = await modelEvent.findOne({ group_id }).sort({ created: -1 }).lean();
        } catch (err){
            logger.error("Error findByGroupId, details:", err);
            throw new PollErrorGeneric(err);
        }

        if (_.isNil(event)){
            throw new PollNotFound(`Not found event valid with group id "${group_id}"`);
        }
        
        return event;
    }

    //todo da sistemare interfaccia
    async create(data: Partial<IEvent>): Promise<IEvent>{
        try {
            return (await modelEvent.insertOne(data as IEvent)).toObject(); //todo da verificare
        } catch (err){
            if(_.has(err, "code") && err.code === 11000){
                throw new PollConflict("Duplicate poll id");
            }

            logger.error("Error create, details:", err);
            throw new PollErrorGeneric(err);
        }
    }

    async listExpired(): Promise<IEvent[]>{
        const expire = new Date();
        
        try {
            return await modelEvent.find({
                $or: [
                    {
                        expire: {
                            $exists: false
                        },
                        expire_poll: {
                            $exists: true,
                            $ne: null,
                            $lte: expire
                        }
                    },
                    {
                        expire: {
                            $exists: true,
                            $ne: null,
                            $lte: expire
                        },
                        expire_poll: null
                    },
                    {
                        expire: {
                            $exists: true,
                            $ne: null,
                            $lte: expire
                        },
                        expire_poll: {
                            $exists: true,
                            $ne: null,
                            $lte: expire
                        }
                    }
                ],
                stop: false
            }).lean();
        } catch (err){
            logger.error("Error listExpired, details:", err);
            throw new PollErrorGeneric(err);
        }
    }
        
    async deleteByIds(ids: (string | mongoose.Types.ObjectId)[]): Promise<void>{
        let count = 0;
        try {
            count = (await modelEvent.deleteMany({ _id: ids })).deletedCount;
        } catch (err){
            logger.error("Error deleteByIds, details:", err);
            throw new PollErrorGeneric(err);
        }

        if (count === 0){
            throw new PollNotFound(`Not found polls ids "${ids.join(", ")}" for delete`);
        }
    }
    
    async edit(id: mongoose.Types.ObjectId, data: Partial<IEvent>): Promise<IEvent>{
        let event: IEvent | null;
        try {
            event = await modelEvent.findOneAndUpdate({
                _id: id,
                stop: false
            }, {
                $set: {
                    ...data,
                    updated: new Date()
                }
            }, {
                returnDocument: "after"
            }).lean();
        } catch (err){
            logger.error("Error edit, details:", err);
            throw new PollErrorGeneric(err);
        }
            
        if (_.isNil(event)){
            throw new PollNotFound(`Not found event id "${id}"`);
        }
        
        return event;
    }

    async answered(pollId: string, userId: number): Promise<IEvent>{

        let event: IEvent | null;
        try {
            event = await modelEvent.findOneAndUpdate({
                poll_id: pollId,
                stop: false
            }, {
                $push: { answered: userId },
                $set: { updated: new Date() }
            }, {
                returnDocument: "after"
            }).lean();
        } catch (err){
            logger.error("Error answered, details:", err);
            throw new PollErrorGeneric(err);
        }

        if (_.isNil(event)){
            throw new PollNotFound("Not found poll id "+ pollId);
        }

        return event;
    }

    async deleteByGroupId(groupId: number): Promise<void>{
        try {
            await modelEvent.deleteMany({ group_id: groupId });
        } catch (err){
            logger.error("Error deleteByGroupId, details:", err);
            throw new PollErrorGeneric(err);
        }
    }

}
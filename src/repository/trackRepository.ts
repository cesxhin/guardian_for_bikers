import _ from "lodash";

import Logger from "../lib/logger";
import { StrictOmit } from "../lib/types";
import { ITrack } from "../domains/interfaces/ITrack";
import { modelTrack } from "../domains/models/trackModel";
import { TrackErrorGeneric, TrackNotFound } from "../utils/exceptionsUtils";

const logger = Logger("track-repository");

export class TrackRepository {
    async findByIds(user_id: number, group_id: number, poll_id: string): Promise<ITrack>{
        let track: ITrack | null;
        try {
            track = await modelTrack.findOne({ user_id, group_id, poll_id }).lean();
        } catch (err){
            logger.error("Error findByIds, details:", err);
            throw new TrackErrorGeneric(err);
        }
            
        if (_.isNil(track)){
            throw new TrackNotFound(`Not found track from ids "${user_id}" "${group_id}" "${poll_id}"`);
        }
        
        return track;
    }

    async create(data: StrictOmit<ITrack, "created" | "updated" | "terminate" | "totalKm" | "totalTime">): Promise<ITrack> {
        try {
            return (await modelTrack.create(data)).toObject();
        } catch (err){
            logger.error("Error create, details:", err);
            throw new TrackErrorGeneric(err);
        }
    }

    async edit(user_id: number, group_id: number, poll_id: string, data: StrictOmit<Partial<ITrack>, "group_id" | "poll_id" | "created" | "user_id">): Promise<ITrack>{
        let track: ITrack | null;
        try {
            track = await modelTrack.findOneAndUpdate({ user_id, group_id, poll_id }, data, { new: true }).lean();
        } catch (err){
            logger.error("Error edit, details:", err);
            throw new TrackErrorGeneric(err);
        }

        if (_.isNil(track)){
            throw new TrackNotFound(`Not found track from ids "${user_id}" "${group_id}" "${poll_id}" for edit`);
        }
        
        return track;
    }

    async terminateAllFromPollId(poll_id: string): Promise<void>{
        try {
            await modelTrack.updateMany({ poll_id }, { $set: { terminate: true, updated: new Date() } }, { new: true });
        } catch (err){
            logger.error("Error terminateAllFromPollId, details:", err);
            throw new TrackErrorGeneric(err);
        }
    }

    async findAllTermintedFromPollId(poll_id: string): Promise<ITrack[]>{
        try {
            return await modelTrack.find({ poll_id, terminate: true }).lean();
        } catch (err){
            logger.error("Error findAllTermintedFromPollId, details:", err);
            throw new TrackErrorGeneric(err);
        }

    }

    async addPositions(user_id: number, group_id: number, poll_id: string, data: Pick<ITrack, "positions">): Promise<ITrack>{

        let track: ITrack | null;
        try {
            track = await modelTrack.findOneAndUpdate({ user_id, group_id, poll_id, terminate: false }, { $push: { positions: { $each: data.positions } }, $set: { updated: new Date() } }, { new: true }).lean();
        } catch (err){
            logger.error("Error addPositions, details:", err);
            throw new TrackErrorGeneric(err);
        }

        if (_.isNil(track)){
            throw new TrackNotFound(`Not found track from ids "${user_id}" "${group_id}" "${poll_id}" for update positions`);
        }

        return track;
    }

    async deleteByIds(user_id: number, group_id: number, poll_id: string): Promise<void>{
        let count = 0;
        try {
            count = (await modelTrack.deleteOne({ user_id, group_id, poll_id })).deletedCount;
        } catch (err){
            logger.error("Error deleteByIds, details:", err);
            throw new TrackErrorGeneric(err);
        }
            
        if (count === 0){
            throw new TrackNotFound(`Not found track from ids "${user_id}" "${group_id}" "${poll_id}" for delete`);
        }
    }

}
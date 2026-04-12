import _ from "lodash";

import Logger from "../../lib/logger.ts";
import { StrictOmit } from "../../lib/types.ts";
import { ITrack } from "../../domains/interfaces/ITrack.ts";
import { modelTrack } from "../../domains/models/trackModel.ts";
import { TrackErrorGeneric, TrackNotFound } from "../../utils/exceptionsUtils.ts";

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

    async edit(user_id: number, group_id: number, poll_id: string, data: StrictOmit<Partial<ITrack>, "group_id" | "poll_id" | "created" | "user_id">): Promise<ITrack>{
        let track: ITrack | null;
        try {
            track = await modelTrack.findOneAndUpdate({
                user_id,
                group_id,
                poll_id,
                terminate: false
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
            throw new TrackErrorGeneric(err);
        }

        if (_.isNil(track)){
            throw new TrackNotFound(`Not found track from ids "${user_id}" "${group_id}" "${poll_id}" for edit`);
        }
        
        return track;
    }

    async findByPollId(poll_id: string): Promise<ITrack[]>{
        try {
            return await modelTrack.find({ poll_id, terminate: false }).lean();
        } catch (err){
            logger.error("Error findAllTermintedFromPollId, details:", err);
            throw new TrackErrorGeneric(err);
        }

    }

    async addPositions(data: Pick<ITrack, "positions" | "user_id" | "group_id" | "poll_id">): Promise<ITrack>{

        let track: ITrack | null;
        try {
            track = await modelTrack.findOneAndUpdate(
                {
                    user_id: data.user_id,
                    group_id: data.group_id,
                    poll_id: data.poll_id,
                    terminate: false
                }, {
                    $push: {
                        positions: { $each: data.positions }
                    },
                    $set: { updated: new Date() },
                    $setOnInsert: {
                        user_id: data.user_id,
                        group_id: data.group_id,
                        poll_id: data.poll_id
                    }
                },
                {
                    returnDocument: "after",
                    upsert: true
                }).lean();
        } catch (err){
            logger.error("Error addPositions, details:", err);
            throw new TrackErrorGeneric(err);
        }

        if (_.isNil(track)){
            throw new TrackNotFound(`Not found track from ids "${data.user_id}" "${data.group_id}" "${data.poll_id}" for update positions`);
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

    async deleteByGroupId(group_id: number): Promise<void>{
        try {
            await modelTrack.deleteMany({ group_id });
        } catch (err){
            logger.error("Error deleteByIds, details:", err);
            throw new TrackErrorGeneric(err);
        }
    }

}
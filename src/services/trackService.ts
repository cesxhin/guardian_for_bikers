import { ITrack } from "../domains/interfaces/ITrack";
import { StrictOmit } from "../lib/types";
import { TrackRepository } from "../repository/trackRepository";
import { TrackNotFound } from "../utils/exceptionsUtils";

export class TrackService {
    trackRepository = new TrackRepository();

    async addPositions(user_id: number, group_id: number, poll_id: string, data: Pick<ITrack, "positions">): Promise<ITrack>{
        try {
            await this.trackRepository.findByIds(user_id, group_id, poll_id);
        } catch (err){
            if (!(err instanceof TrackNotFound)){
                throw err;
            } else {
                //not found
                return await this.trackRepository.create({
                    group_id,
                    poll_id,
                    user_id,
                    positions: data.positions
                });
            }
        }

        return await this.trackRepository.addPositions(user_id, group_id, poll_id, data);
    }

    async terminateAllFromPollId(poll_id: string): Promise<void>{
        await this.trackRepository.terminateAllFromPollId(poll_id);
    }

    async findAllTermintedFromPollId(poll_id: string): Promise<ITrack[]>{
        return await this.trackRepository.findAllTermintedFromPollId(poll_id);
    }
    
    async deleteByIds(user_id: number, group_id: number, poll_id: string): Promise<void>{
        return await this.trackRepository.deleteByIds(user_id, group_id, poll_id);
    }
    
    async edit(user_id: number, group_id: number, poll_id: string, data: StrictOmit<Partial<ITrack>, "group_id" | "poll_id" | "created" | "user_id" | "updated">): Promise<ITrack>{
        return await this.trackRepository.edit(user_id, group_id, poll_id, {
            ...data,
            updated: new Date()
        });
    }
}
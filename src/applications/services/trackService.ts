import { StrictOmit } from "../../lib/types.ts";
import { ITrack } from "../../domains/interfaces/ITrack.ts";
import { TrackRepository } from "../repository/trackRepository.ts";

export class TrackService {
    trackRepository = new TrackRepository();

    async addPositions(data: Pick<ITrack, "positions" | "user_id" | "group_id" | "poll_id">): Promise<ITrack>{
        return await this.trackRepository.addPositions(data);
    }

    async findByPollId(poll_id: string): Promise<ITrack[]>{
        return await this.trackRepository.findByPollId(poll_id);
    }
    
    async deleteByIds(user_id: number, group_id: number, poll_id: string): Promise<void>{
        return await this.trackRepository.deleteByIds(user_id, group_id, poll_id);
    }
    
    async deleteByGroupId(group_id: number): Promise<void>{
        return await this.trackRepository.deleteByGroupId(group_id);
    }
    
    async edit(user_id: number, group_id: number, poll_id: string, data: StrictOmit<Partial<ITrack>, "group_id" | "poll_id" | "created" | "user_id" | "updated">): Promise<ITrack>{
        return await this.trackRepository.edit(user_id, group_id, poll_id, data);
    }
}
import { StrictOmit } from "../../lib/types.ts";
import { ITrack } from "../../domains/interfaces/ITrack.ts";
import { TrackRepository } from "../repository/trackRepository.ts";

export class TrackService {
    trackRepository = new TrackRepository();

    async addPositions(data: Pick<ITrack, "positions" | "user_id" | "group_id" | "event_id">): Promise<ITrack>{
        return await this.trackRepository.addPositions(data);
    }

    async findByEventId(eventId: string): Promise<ITrack[]>{
        return await this.trackRepository.findByEventId(eventId);
    }
    
    async deleteByIds(userId: number, groupId: number, pollId: string): Promise<void>{
        return await this.trackRepository.deleteByIds(userId, groupId, pollId);
    }
    
    async deleteByGroupId(groupId: number): Promise<void>{
        return await this.trackRepository.deleteByGroupId(groupId);
    }
    
    async edit(userId: number, groupId: number, pollId: string, data: StrictOmit<Partial<ITrack>, "group_id" | "event_id" | "created" | "user_id" | "updated">): Promise<ITrack>{
        return await this.trackRepository.edit(userId, groupId, pollId, data);
    }
}
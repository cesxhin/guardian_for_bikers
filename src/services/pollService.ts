import _ from "lodash";

import { StrictOmit } from "../lib/types";
import { IPoll } from "../domains/interfaces/IPoll";
import pollCacheUtils from "../utils/pollCacheUtils";
import { PollRepository } from "../repository/pollRepository";
import { PollConflict, PollNotFound } from "../utils/exceptionsUtils";

export class PollService {
    private pollRepository = new PollRepository();

    async listExpired(): Promise<IPoll[]>{
        return await this.pollRepository.listExpired();
    }

    async findById(id: string): Promise<IPoll>{
        return await this.pollRepository.findById(id);
    }

    async create(data: StrictOmit<IPoll, "expire" | "answered" | "stop">): Promise<IPoll>{
        let find: IPoll | null = null;
        try {
            find = await this.pollRepository.findById(data.id);
        } catch (err){
            if (!(err instanceof PollNotFound)){
                throw err;
            }
        }

        if (!_.isNil(find)){
            throw new PollConflict(`Already exist this poll id "${data.id}"`);
        }

        const poll = await this.pollRepository.create(data);

        pollCacheUtils.pollCache.set(data.id, poll);

        return poll;
    }

    async deleteByIds(ids: string[]): Promise<void>{
        await this.pollRepository.deleteByIds(ids);

        for (const id of ids) {
            pollCacheUtils.pollCache.del(id);
        }
    }

    async answered(id: string, userId: number): Promise<IPoll>{
        return this.pollRepository.answered(id, userId);
    }

    async edit(id: string, data: Partial<StrictOmit<IPoll, "id" | "group_id" | "message_id" | "type">>): Promise<IPoll> {
        const poll = await this.pollRepository.edit(id, data);

        pollCacheUtils.pollCache.set(id, poll);

        return poll;
    }
}
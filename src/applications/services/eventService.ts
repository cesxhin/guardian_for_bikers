import _ from "lodash";
import mongoose from "mongoose";

import { StrictOmit } from "../../lib/types.ts";
import eventCacheUtils from "../../utils/eventCacheUtils.ts";
import { EventRepository } from "../repository/eventRepository.ts";
import { EventOf, IEvent } from "../../domains/interfaces/IEvent.ts";
import { PollIsClosed, PollIsExpired } from "../../utils/exceptionsUtils.ts";

export class EventService {
    private eventRepository = new EventRepository();

    async listExpired(): Promise<IEvent[]>{
        return await this.eventRepository.listExpired();
    }

    async checkTargetImpostor(group_id: number, user_id: number): Promise<boolean>{
        return await this.eventRepository.checkTargetImpostor(group_id, user_id);
    }

    async findById(id: string | mongoose.Types.ObjectId): Promise<IEvent>{
        return await this.eventRepository.findById(id);
    }

    async findByPollId(id: string): Promise<IEvent>{
        return await this.eventRepository.findByPollId(id);
    }

    async findValidByGroupId(id: number): Promise<IEvent>{
        const event = await this.eventRepository.findByGroupId(id);

        if (event.type === "out" || event.type === "out_x2"){
            if (new Date() > event.expire){
                throw new PollIsExpired(`Event id "${event._id}" is expired`);
            }
        }

        if (!_.isNil(event.expire_poll) && new Date() > event.expire_poll){
            throw new PollIsExpired(`Poll id "${event.poll_id}" is expired`);
        }

        if (event.stop){
            throw new PollIsClosed(`Event id "${event._id}" is closed`);
        }

        return event;
    }

    async create(
        data: (
            Pick<EventOf<"question">, "expire_poll" | "group_id" | "poll_id" | "type"> |
            Pick<EventOf<"impostor">, "expire_poll" | "group_id" | "poll_id" | "type" | "target_impostor"> |
            Pick<EventOf<"out">, "expire" | "expire_poll" | "group_id" | "poll_id" | "type"> |
            Pick<EventOf<"out_x2">, "expire" | "expire_poll" | "group_id" | "poll_id" | "type">
        )
    ): Promise<IEvent>{
        const event = await this.eventRepository.create(data);

        if (!_.isNil(event.poll_id)){
            eventCacheUtils.pollCache.set(event.poll_id, event);
        }

        return event;
    }

    async deleteByGroupId(groupId: number): Promise<void> {
        await this.eventRepository.deleteByGroupId(groupId);

        for (const key of eventCacheUtils.pollCache.keys()) {
            if (eventCacheUtils.pollCache.get<IEvent>(key)?.group_id === groupId){
                eventCacheUtils.pollCache.del(key);
            }
        }
    }

    async deleteByIds(ids: (string | mongoose.Types.ObjectId)[]): Promise<void>{
        await this.eventRepository.deleteByIds(ids);

        ids = ids.map((id) => _.isString(id)? id : id.toString());
        
        const events = Object.values<IEvent>(eventCacheUtils.pollCache.mget(eventCacheUtils.pollCache.keys())).filter((event) => ids.includes(event._id.toString()));

        for (const event of events) {
            if (!_.isNil(event.poll_id)){
                eventCacheUtils.pollCache.del(event.poll_id);
            }
        }
    }

    async answered(pollId: string, userId: number): Promise<IEvent>{
        return this.eventRepository.answered(pollId, userId);
    }

    async edit(
        id: mongoose.Types.ObjectId,
        data: (
            Partial<
                StrictOmit<EventOf<"question">, "_id" | "group_id" | "type" | "updated" | "created" | "expire_poll" | "poll_id"> |
                StrictOmit<EventOf<"out">, "_id" | "group_id" | "type" | "updated" | "created"> |
                StrictOmit<EventOf<"out_x2">, "_id" | "group_id" | "type" | "updated" | "created"> |
                StrictOmit<EventOf<"impostor">, "_id" | "group_id" | "poll_id" | "type" | "updated" | "created" | "expire_poll" | "target_impostor">
            >
        )
    ): Promise<IEvent> {
        const event = await this.eventRepository.edit(id, data);

        if (!_.isNil(event.poll_id)){
            eventCacheUtils.pollCache.set(event.poll_id, event);
        }

        return event;
    }
}
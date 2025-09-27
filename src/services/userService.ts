import _ from "lodash";
import { DateTime } from "luxon";

import { StrictOmit } from "../lib/types";
import { IUser } from "../domains/interfaces/IUser";
import userCacheUtils from "../utils/userCacheUtils";
import { UserRepository } from "../repository/userRepository";
import { UserConflict, UserNotFound } from "../utils/exceptionsUtils";

export class UserService {
    private userRepository = new UserRepository();


    async create(chat_id: number, id: number, username: string): Promise<IUser>{
        let findUser: IUser | null = null;
        try {
            findUser = await this.userRepository.findById(chat_id, id);
        } catch (err){
            if (!(err instanceof UserNotFound)){
                throw err;
            }
        }

        if (!_.isNil(findUser)){
            throw new UserConflict(`User id "${id}" already exist`);
        }

        return await this.userRepository.create({
            id,
            chat_id,
            currentYear: DateTime.now().year,
            outWithBike: 0,
            skipOutWithBike: 0,
            username,
            points: 0
        });
    }
    
    async edit(chatId: number, id: number, data: StrictOmit<Partial<IUser>, "id" | "created" | "updated" | "chat_id">): Promise<IUser>{
        const user = await this.userRepository.edit(chatId, id, {
            ...data,
            updated: new Date()
        });

        const primaryKeyCache = userCacheUtils.getPrimaryKeyCompose(user.chat_id, user.id);
        if (userCacheUtils.userCache.has(primaryKeyCache)){
            userCacheUtils.userCache.set(primaryKeyCache, user);
        }

        return user;
    }

    async findById(chatId: number, id: number): Promise<IUser>{
        return await this.userRepository.findById(chatId, id);
    }

    async findByUsername(chatId: number, username: string): Promise<IUser>{
        return await this.userRepository.findByUsername(chatId, username);
    }

    async findManyByGroupId(chatId: number): Promise<IUser[]>{
        return await this.userRepository.findManyByGroupId(chatId);
    }

    async deleteById(chatId: number, id: number): Promise<void>{
        await this.userRepository.deleteById(chatId, id);
        userCacheUtils.userCache.del(userCacheUtils.getPrimaryKeyCompose(chatId, id));
    }

    async deleteManyByChatId(chatId: number): Promise<void>{
        await this.userRepository.deleteManyByChatId(chatId);
        userCacheUtils.userCache.del(userCacheUtils.getKeysFromChatId(chatId));
    }

    async getIdsByChatId(chatId: number): Promise<number[]>{
        return await this.userRepository.getIdsByChatId(chatId);
    }

    async resetScoreMultiplerNotAnswered(chatId: number, users: number[]): Promise<void>{
        const listUsers = await this.userRepository.findMissingFromList(chatId, users);

        for (const user of listUsers) {
            await this.edit(user.chat_id, user.id, { scoreMultiplier: 0 });
        };
    }
}
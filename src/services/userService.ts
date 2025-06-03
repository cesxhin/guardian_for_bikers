import _ from "lodash";
import { DateTime } from "luxon";

import { IUser } from "../domains/interfaces/IUser";
import { UserRepository } from "../repository/userRepository";
import { UserConflict, UserNotFound } from "../utils/exceptionsUtils";

export class UserService {
    private userRepository = new UserRepository();


    async create(chat_id: number, id: number, username: string): Promise<IUser>{
        let findUser: IUser | null = null;
        try {
            findUser = await this.userRepository.findById(id);
        } catch (err){
            if (!(err instanceof UserNotFound)){
                throw err;
            }
        }

        if(!_.isNil(findUser)){
            throw new UserConflict(`User id "${id}" already exist`);
        }

        return await this.userRepository.create({
            id,
            chat_id,
            currentYear: DateTime.now().year,
            outWithBike: 0,
            skipOutWithBike: 0,
            totalKm: 0,
            username
        });
    }

    async findById(id: number): Promise<IUser>{
        return await this.userRepository.findById(id);
    }

    async deleteById(id: number): Promise<void>{
        await this.userRepository.deleteById(id);
    }

    async deleteManyByChatId(chatId: number): Promise<void>{
        await this.userRepository.deleteManyByChatId(chatId);
    }

    async getIdsByChatId(chatId: number): Promise<number[]>{
        return await this.userRepository.getIdsByChatId(chatId);
    }
}
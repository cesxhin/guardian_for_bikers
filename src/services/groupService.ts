import _ from "lodash";
import { GroupRepository } from "../repository/groupRepository";
import Logger from "../lib/logger";
import { IGroup } from "../domains/interfaces/IGroup";
import { GroupNotFound } from "../utils/exceptionsUtils";

const logger = Logger("grop-service");

export class GroupService {
    private groupRepository = new GroupRepository();

    async create(id: number): Promise<void>{
        try{
            await this.groupRepository.find(id);
        }catch(err){
            if(!(err instanceof GroupNotFound)){
                throw err;
            }
        }

        await this.groupRepository.create({
            id,
            enabled: true,
            location: "rome",
            time_trigger: "07:00",
            monday: true,
            friday: true,
            saturday: true,
            sunday: true,
            tuesday: true,
            wednesday: true,
            thursday: true
        });
    }

    async edit(id: number, data: Omit<Partial<IGroup>, "id">): Promise<IGroup>{
        return await this.groupRepository.edit(id, data);
    }

    async delete(id: number): Promise<void>{
        await this.groupRepository.delete(id);
    }

    async find(id: number): Promise<IGroup | null> {
        return await this.groupRepository.find(id);
    }
}
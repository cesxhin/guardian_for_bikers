import { IGroup } from "../domains/interfaces/IGroup";
import { GroupConflict, GroupNotFound } from "../utils/exceptionsUtils";
import { GroupRepository } from "../repository/groupRepository";
import _ from "lodash";
import { StrictOmit } from "../lib/types";


export class GroupService {
    private groupRepository = new GroupRepository();

    async create(id: number, name: string): Promise<IGroup>{

        let findGroup: IGroup | null = null;
        try {
            findGroup = await this.groupRepository.find(id);
        } catch (err){
            if (!(err instanceof GroupNotFound)){
                throw err;
            }
        }

        if (!_.isNil(findGroup)){
            throw new GroupConflict(`Group id "${id}" already exist`);
        }

        return await this.groupRepository.create({
            id,
            name,
            enabled: true,
            latitude: 41.8919,
            longitude: 12.5113,
            location: "rome",
            timezone: "Europe/Rome",
            time_trigger: "07:00",
            days_trigger: [true, true, true, true, true, true, true]
        });
    }

    async edit(id: number, data: StrictOmit<Partial<IGroup>, "id" | "created" | "updated">): Promise<IGroup>{
        return await this.groupRepository.edit(id, {
            ...data,
            updated: new Date()
        });
    }

    async delete(id: number): Promise<void>{
        await this.groupRepository.delete(id);
    }

    async find(id: number): Promise<IGroup | null> {
        return await this.groupRepository.find(id);
    }

    async listActive(): Promise<IGroup[]> {
        return await this.groupRepository.listActive();
    }
}
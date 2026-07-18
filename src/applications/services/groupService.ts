import _ from "lodash";

import { StrictOmit } from "../../lib/types.ts";
import { IGroup } from "../../domains/interfaces/IGroup.ts";
import { GroupRepository } from "../repository/groupRepository.ts";
import { GroupConflict, GroupNotFound } from "../../utils/exceptionsUtils.ts";


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
            name
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

    async find(id: number): Promise<IGroup> {
        return await this.groupRepository.find(id);
    }

    async listActive(): Promise<IGroup[]> {
        return await this.groupRepository.listActive();
    }

    async findAll(): Promise<IGroup[]> {
        return await this.groupRepository.findAll();
    }
}
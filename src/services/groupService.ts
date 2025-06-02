import { IGroup } from "../domains/interfaces/IGroup";
import { GroupNotFound } from "../utils/exceptionsUtils";
import { GroupRepository } from "../repository/groupRepository";


export class GroupService {
    private groupRepository = new GroupRepository();

    async create(id: number, name: string): Promise<void>{
        try {
            await this.groupRepository.find(id);
        } catch (err){
            if (!(err instanceof GroupNotFound)){
                throw err;
            }
        }

        await this.groupRepository.create({
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

    async edit(id: number, data: Omit<Partial<IGroup>, "id">): Promise<IGroup>{
        return await this.groupRepository.edit(id, data);
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
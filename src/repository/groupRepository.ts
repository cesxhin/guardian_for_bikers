import { IGroup } from "../domains/interfaces/IGroup";
import { modelGroup } from "../domains/models/group";

export class GroupRepository {
    async find(id: number): Promise<IGroup | null>{
        return await modelGroup.findOne({
            id
        });
    }
    async edit(id: number, data: Omit<Partial<IGroup>, "id">): Promise<IGroup | null>{
        return await modelGroup.findOneAndUpdate({
            id
        }, data);
    }
    async create(data: IGroup): Promise<void> {
        await modelGroup.create(data);
    }
    async delete(id: number): Promise<void>{
        await modelGroup.deleteOne({
            id
        });
    }
}
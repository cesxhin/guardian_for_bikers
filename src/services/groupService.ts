import _ from "lodash";
import { GroupRepository } from "../repository/groupRepository";
import Logger from "../lib/logger";
import { IGroup } from "../domains/interfaces/IGroup";

const logger = Logger("grop-service");

export class GroupService {
    private groupRepository = new GroupRepository();

    async create(id: number){
        const find = await this.groupRepository.find(id);

        //not registred
        if(_.isNil(find)){
            await this.groupRepository.create({
                id,
                enabled: true,
                location: "rome",
                time_trigger: "07:00"
            })
            logger.info(`Created group id: ${id}`);
        }else{
            logger.warn(`This group already exist, maybe problem delete data of group when bot leave group?`);
        }
    }

    async edit(id: number, data: Omit<Partial<IGroup>, "id">): Promise<void>{
        const find = this.groupRepository.find(id);

        if(!_.isNil(find)){
            await this.groupRepository.edit(id, data);
        }
    }

    async delete(id: number): Promise<void>{
        const find = this.groupRepository.find(id);

        if(!_.isNil(find)){
            await this.groupRepository.delete(id);
            logger.info(`Deleted group id: ${id}`);
            //TODO da fare eventualmente relativi dati degli utenti e le classifiche...
        }else{
            logger.warn(`This group not exist id: ${id}`);
        }
    }
}
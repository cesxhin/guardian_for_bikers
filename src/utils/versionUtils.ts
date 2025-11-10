import _ from "lodash";

import Logger from "../lib/logger";
import { VERSION_CURRENT_DB } from "../env";
import { modelUser } from "../domains/models/userMode";
import { modelPoll } from "../domains/models/pollModel";
import { IVersion } from "../domains/interfaces/IVersion";
import { modelVersion } from "../domains/models/versionModel";

const logger = Logger("version-utils");
const NAME_VERSION = "gfb";

async function main(){
    let find: IVersion = await modelVersion.findOne({name: NAME_VERSION}).lean();

    if (_.isNil(find)){
        logger.debug(`Not found version for ${NAME_VERSION}`);
        modelVersion.insertOne({name: NAME_VERSION, version: VERSION_CURRENT_DB});
        logger.info(`Created version for ${NAME_VERSION}`);
    } else {
        switch (find.version){
        case 1:
            logger.info("Start migration v1 to v2...");

            const countUsers = (await modelUser.updateMany({},
                {
                    scoreMultiplier: 0,
                    updated: new Date(),
                    totalKm: 0
                }
            )).modifiedCount;
            logger.info(`Updated total users (${countUsers})`);

            const countPoll = (await modelPoll.updateMany({},
                {
                    updated: new Date(),
                    created: new Date(),
                    target_impostor: null
                }
            )).modifiedCount;
            logger.info(`Updated total polls (${countPoll})`);

            find = await updateVersion(2);
            logger.info("Complete migration v2");
            break;
        }
    }
}

async function updateVersion(currentVersion: number): Promise<IVersion> {
    return await modelVersion.findOneAndUpdate({name: NAME_VERSION }, { version: currentVersion }, {new: true}).lean();
}

export default {
    main
};
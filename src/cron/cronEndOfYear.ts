import { CronJob } from "cron";
import { DateTime } from "luxon";
import TelegramBot from "node-telegram-bot-api";

import Logger from "../lib/logger";
import { GroupService } from "../services/groupService";
import { UserService } from "../services/userService";

const logger = Logger("cron-end-of-year");

const groupService = new GroupService();
const userService = new UserService();

export default (bot: TelegramBot) => {
    new CronJob(
        "*/30 * * * *",
        async () => {
            logger.info("Check...");
            const listGroups = await groupService.findAll();

            for (const group of listGroups) {
                const currentTime = DateTime.now().setZone(group.timezone);
                const yesterday = currentTime.plus({hours: -1});

                if (currentTime.year !== yesterday.year){
                    const listUsers = await userService.findManyByGroupId(group.id);

                    let message = "That moment has arrived now! Here is the annual report:\n";

                    listUsers.sort((a, b) => b.points - a.points).forEach((user, index) => {
                        message += `
--- ${index === 0? "🥇" : index === 1? "🥈" : index === 2? "🥉" : index.toString().padStart(3, " ") + "  "} ---
${user.username}: ${user.points} PT
outside with biker ${user.outWithBike}
Skipped answering the polls ${user.skipOutWithBike}
Total times became Impostor ${user.totalImpostor}
Total km: ${user.totalKm}
`;
                    });

                    message += `\n\n\nHappy New Year ${currentTime.year}🥂🎉`;

                    await bot.sendMessage(group.id, message);

                    await userService.resetAll(group.id);
                }
            }

            logger.info("Done");
        },
        null,
        true
    );
    
    logger.info("Started!");
};
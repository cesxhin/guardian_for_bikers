import { DateTime } from "luxon";
import { intro, isCancel, log, outro, select } from "@clack/prompts";

import backup from "./menu/backup.ts";
import updateNotice from "./menu/updateNotice.ts";
import finishNotice from "./menu/finishNotice.ts";
import connectionsUtils from "./utils/connectionsUtils.ts";

let terminate = false;

intro("Startup");
    
//check timezone
log.info("Current timezone: " + DateTime.local().zoneName);

//connect essentials services
await connectionsUtils.connectDatabase();
const bot = await connectionsUtils.connectBot({
    polling: {
        autoStart: true
    }
});

outro("Completed successfully");

do {
    intro("Panel Control");

    //menu
    const procedure = await select({
        message: "Choose the procedure",
        options: [
            { value: "update-notice", label: "Send a pre-update notification" },
            { value: "backup", label: "Create backup before of the update system" },
            { value: "finish-notice", label: "Send after update notification" },
            { value: "exit", label: "Exit" }
        ],
        initialValue: "update-notice"
    });

    if (procedure === "exit" || isCancel(procedure)){
        log.message("Good bye!", {symbol: "👋"});
        outro();
        terminate = true;
    } else {
        outro();

        switch (procedure){
        case "update-notice":
            await updateNotice(bot);
            break;
        case "finish-notice":
            await finishNotice(bot);
            break;
        case "backup":
            await backup();
            break;

        }
    }
} while (!terminate);

process.exit(0);
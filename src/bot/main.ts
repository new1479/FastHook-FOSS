// BOT
import { Collection, IntentsBitField, Client, REST, Routes } from "discord.js";
import { token, client_id } from "../config.json";
import { join } from "path"
import { readdirSync } from "fs";

interface ccommands extends Client {
    commands: Collection<string, any>
}

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.DirectMessages
    ],
}) as ccommands;

const commands: string[] = [];
client.commands = new Collection();

const commandsPath = join(__dirname, "commands");
const commandFiles = readdirSync(commandsPath).filter((file) => file.endsWith(".ts"));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
}

const rest = new REST({ version: "10" }).setToken(token);

client.on("ready", async () => {
    try {

        await rest.put(Routes.applicationCommands(client_id), { body: commands });

    } catch (error) {
        console.error(error);
    }

    console.log("bot online");
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isCommand()) return;
    if (interaction.inGuild()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    }
    catch (error) {
        console.error(error);
        await interaction.reply({ content: "command error" });
    }
});

client.login(token);

const log = (id: string, reason: string, ip: string, body: string) => {
    client.users.fetch(id).then((user) => {
        user.send({
            "embeds": [
                {
                    "title": "Request Blocked",
                    "description": `reason: ${reason}`,
                    "color": 16711680,
                    "fields": [
                        {
                            "name": "IP:",
                            "value": `\`${ip}\``
                        },
                        {
                            "name": "body:",
                            "value": `\`${body}\``
                        }
                    ],
                    "author": {
                        "name": "FastHook [Logs]",
                        "icon_url": "https://media.discordapp.net/attachments/1149413867953344622/1177353512548585533/QEFrUGS.png?ex=657232e7&is=655fbde7&hm=3d3f94eed66e45384b1533f70b1708b05caebda27fd95b96b75314b2c1da3622&=&format=webp&width=457&height=457"
                    },
                    "footer": {
                        "text": "Provided by Fast-Hook"
                    }
                }
            ],
        });
    });
}

// API

import express, { Express, Request, Response } from "express";
const router: Express = express.Router();

import webhook from "../database/schema";

router.get("/", (req: Request, res: Response) => {
    return res.status(301).redirect("https://fhook.me");
});

router.get("/send", (req: Request, res: Response) => {
    return res.status(301).redirect("https://fhook.me");
});

const check = {};

router.post("/send/:id", async (req: Request, res: Response) => {
    const hook = await webhook.findOne({ uuid: req.params.id }).catch(() => null);
    if (!hook) return res.status(404).json({ status: "404", content: "Unknown Webhook" });

    if (hook.locked) return res.status(403).json({ status: "403", content: "Webhook has been locked" });

    const body = req.body;
    const ip = req.headers['cf-connecting-ip']
    const bodystring = JSON.stringify(body);

    // blacklisted ip check
    if (hook.bl_ip) {
        if (hook.bl_ip.length > 0) {
            if (hook.bl_ip.some((v) => (v === ip))) {
                return res.status(403).json({ status: "403", content: "forbidden" })
            }
        }
    }

    // anti api spam
    const now: number = Date.now();

    if (!check[ip]) {
        check[ip] = [];
    }

    check[ip] = check[ip].filter((current) => now - current <= 60000);
    if (check[ip].length >= hook.spamlimit) {
        if (hook.logs) {
            log(hook.discordID, "Webhook spam", ip, bodystring)
        }
        return res.status(429).json({ status: "429", content: "Too Many Requests" });
    }

    check[ip].push(now);

    // check blacklisted words
    if (hook.blwords) {
        if (hook.blwords.length > 0) {
            if (hook.blwords.some((v) => bodystring.includes(v))) {
                log(hook.discordID, `Blacklisted word was used`, ip, bodystring)
                return res.status(403).json({ status: "403", content: "forbidden | invalid body" })
            }
        }
    }

    // anti ping
    if (hook.blockping) {
        if (bodystring.includes("@everyone") || bodystring.includes("@here")) {
            if (hook.logs) {
                log(hook.discordID, "invalid body", ip, bodystring)
            }
            return res.status(403).json({ status: "403", content: "forbidden | invalid body" })
        }
    }

    // anti mention
    if (hook.blockmention) {
        if (bodystring.search(/<@!*&*[0-9]+>/) != -1) {
            if (hook.logs) {
                log(hook.discordID, "invalid body", ip, bodystring)
            }
            return res.status(403).json({ status: "403", content: "forbidden | invalid body" });
        }
    }

    // send
    await fetch(hook.url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: bodystring
    }).then(() => {
        return res.end("Webhook sent!");
    }).catch(() => {
        return res.status(500).json({ status: "500", content: "webhook origin most likely has been deleted" });
    });

});

router.get("/send/:id", async (req: Request, res: Response) => {
    const hook = await webhook.findOne({ uuid: req.params.id}).catch(() => null);

    if (!hook) return res.status(404).json({ status: "404", content: "Unknown Webhook" });
    if (hook.locked) return res.status(403).json({ status: "403", content: "Webhook has been locked", msg: "This endpoint is provied via FastHook, if you suspect any suspicious activity please contact me @n3wtron (.gg/p5sZpNrtfB)" });
    return res.status(200).json({ owner: hook.discordName, discordID: hook.discordID, msg: "This endpoint is provied via FastHook, if you suspect suspicious activity please contact me @n3wtron (.gg/p5sZpNrtfB)" });
});

// shit
export = router;

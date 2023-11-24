import { Schema, model } from "mongoose";

interface IWebhook {
    uuid: string;
    url: string;
    blockping: boolean;
    blockmention: boolean;
    logs: boolean;
    locked: boolean;
    discordID: string;
    discordName: string;
    spamlimit: number;
    blwords: string[];
    bl_ip: string[]
}

const schema = new Schema<IWebhook>({
    uuid: { type: String, required: true },

    url: { type: String, required: true },

    blockping: { type: Boolean, required: true },
    blockmention: { type: Boolean, required: true },
    logs: { type: Boolean, required: true },
    locked: { type: Boolean, required: true },

    discordID: { type: String, required: true },
    discordName: { type: String, required: true },

    spamlimit: { type: Number, required: true },

    blwords: { type: [String], required: false },
    bl_ip: { type: [String], required: false }

});


export = model<IWebhook>("webhooks", schema);
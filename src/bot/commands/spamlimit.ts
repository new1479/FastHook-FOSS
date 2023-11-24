import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import webhook from "../../database/schema";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("spamlimit")
        .setDescription("Sets the spam limit for the webhook.")
        .addStringOption(option =>
            option
                .setName("id")
                .setDescription("Enter proxy id.")
                .setRequired(true))

        .addIntegerOption(option =>
            option.setName("number")
                .setDescription("Set amount of times someone can send a request to a webhook before they get ratelimited.")
                .setMinValue(3)
                .setMaxValue(9)
                .setRequired(true))
    ,
    async execute(interaction: CommandInteraction) {
        await interaction.reply({ "content": "‎ " });

        const avatar_url = interaction.user.displayAvatarURL();

        const ratelimit = interaction.options.get("number")?.value;
        const id = interaction.options.get("id")?.value;

        const hook = await webhook.findOne({ uuid: id }).catch(() => null);

        if (!hook) return interaction.editReply({ "content": "Invalid Webhook ID." });

        if (interaction.user.id !== hook.discordID) return interaction.editReply({ "content": "You do not have permission to edit this webhook." });

        await webhook.updateOne({ uuid: id }, { spamlimit: ratelimit });

        return interaction.editReply({
            "embeds": [
                {
                    "title": "spamlimit",
                    "description": `Request limit has been set to ${ratelimit}`,
                    "color": 7572187,
                    "author": {
                        "name": `${interaction.user.tag} (${interaction.user.id})`,
                        "icon_url": avatar_url
                    },
                    "footer": {
                        "text": "Powered By Fast-Hook",
                        "icon_url": "https://cdn.discordapp.com/attachments/1149413867953344622/1177353512548585533/QEFrUGS.png?ex=657232e7&is=655fbde7&hm=3d3f94eed66e45384b1533f70b1708b05caebda27fd95b96b75314b2c1da3622&"
                    }
                }
            ]
        });
    }
}
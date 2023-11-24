import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { randomUUID } from "crypto";
import webhook from "../../database/schema";

module.exports = {
   data: new SlashCommandBuilder()
      .setName("create")
      .setDescription("Genorates a proxy")
      .addStringOption(option =>
         option
            .setName("url")
            .setDescription("Enter webhook url.")
            .setRequired(true))

      .addBooleanOption(option =>
         option.setName("blockping")
            .setDescription("Blocks pings from being sent to the webhook.")
            .setRequired(true))

      .addBooleanOption(option =>
         option.setName("blockmention")
            .setDescription("Blocks mentions from being sent to the webhook.")
            .setRequired(true))

      .addBooleanOption(option =>
         option.setName("enablelogs")
            .setDescription("directly notifies you when there are blocked requests. (recomended)")
            .setRequired(true))

      .addIntegerOption(option =>
         option.setName("spamlimit")
            .setDescription("Set amount of times someone can send a request to a webhook before they get ratelimited.")
            .setMinValue(3)
            .setMaxValue(9)
            .setRequired(true)),

   async execute(interaction: CommandInteraction) {
      const url: any = interaction.options.get("url")?.value
      const blockping = interaction.options.get("blockping")?.value
      const blockmention = interaction.options.get("blockmention")?.value
      const logs = interaction.options.get("enablelogs")?.value
      const ratelimit = interaction.options.get("spamlimit")?.value

      const avatar_url = interaction.user.displayAvatarURL();

      if (/^https:\/\/discord.com\/api\/webhooks\/([^\/]+)\/([^\/]+)/.test(url)) {
         await fetch(url).then(async (res) => {
            if (res.status !== 200) return interaction.reply({ "content": "Invalid Webhook URL" });
            const check = await webhook.findOne({ url: url }).catch(() => null);
            if (check) return interaction.reply({ "content": "URL already in use" });

            const userID = await interaction.user.id;

            const hook = await webhook.create({
               url: url,
               uuid: randomUUID(),
               discordID: userID,
               discordName: await interaction.user.tag.toString(),
               spamlimit: ratelimit,
               blockping: blockping,
               blockmention: blockmention,
               logs: logs,
               locked: false,
            });

            return interaction.reply({
               "embeds": [
                  {
                     "title": "Create",
                     "description": `Webhook Created: \`https://fhook.me/api/send/${hook.uuid}\` 
                                   
                                   id: \`${hook.uuid}\`
                                   enablelogs: \`${hook.logs}\`
                                   blockmention: \`${hook.blockmention}\`
                                   blockping: \`${hook.blockping}\`
                                   spamlimit: \`${hook.spamlimit}\`
     
                                   `,
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
            })
         });

      } else {
         return interaction.reply({ "content": "Invalid Webhook URL" })
      }
   }
}
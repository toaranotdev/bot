const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageButton, MessageActionRow, MessageEmbed } = require("discord.js");

const messages = [
    "Tôi sẽ tìm được link Nobihaza Omega Kendin Android",
    "Tôi sẽ giết HOST trong The Nobita Within và lấy Good Ending",
    "Tôi sẽ làm Nobihaza Free Fire",
    "Chỉ cần xóa Game.exe đi là chơi được Nobihaza Omega Kendin trên Android",
    "Tôi sẽ biến thành Tường 2.0",
    "Tôi sẽ làm luật là cấm NSFW nhưng vẫn gửi NSFW lên bởi vì tôi nghĩ cả thế giới này chạy trên taihen logic",
    "Tôi sẽ từ chối nói chuyện với người ta để giải quyết vấn đề",
    "Tôi sẽ bỏ ngoài tai lời của người ta và coi mình là số 1",
    "Game tôi bị chê thì nền game việt mình quá dở",
    "Tôi sẽ xóa hết NSFW trong game"
];

module.exports = {
    data: new SlashCommandBuilder()
            .setName("chuahe")
            .setDescription("Trở thành chúa hề"),
    async execute(interaction) {
        let userName = interaction.user.username;
        let avatarUrl = interaction.user.avatarURL();
        let randomIndex = Math.floor (Math.random() * messages.length);
        let message = messages[randomIndex];
        await interaction.reply("Henge No Jutsu!");
        await interaction.deleteReply();

        await interaction.channel.createWebhook(userName, {
            avatar: avatarUrl
        }).then (async (webhook) => {
            await webhook.send(message).then(() => {
                webhook.delete();
            });
        });
    }
};
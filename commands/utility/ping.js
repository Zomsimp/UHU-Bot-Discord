import { InteractionType } from "discord.js";



module.export.data = {
    name: "ping",
    decription: "Xem ping của bot",
    type: 1,
    options: [],
    interactionType: [0, 1],
    contexts: [0, 1, 2],
}

module.exports.execute = async (client, interaction) => {
    const ping = client.ws.ping;
    try {
        await interaction.reply(ping);
    } catch (error) {
        if (error.code === 10062) {
            console.warn('⚠️ Interaction đã hết hạn, bỏ qua reply');
        } else {
            console.error('❌ Lỗi reply:', error);
        }
    }
    return;
}
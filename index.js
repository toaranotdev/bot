/*
    let { bar } = foo;

    where foo = { bar: 20, fee: 21};
    therefore bar = 20

*/

const { Client, Intents, Collection } = require("discord.js");
const { token } = require("./config.json");
const fs  = require("node:fs");
const path = require("node:path")

const client = new Client ({ intents: [Intents.FLAGS.GUILDS] });

/*
    event listener aka event handler
*/

client.once("ready", () => {
    console.log("Hello! I'm ready!");
});

// Command and button handlers
client.commands = new Collection ();
client.buttons = new Collection ();

const commandPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandPath).filter (name => name.endsWith(".js"));

for (const fileName of commandFiles) {
    const filePath = path.join(commandPath, fileName);
    const command = require(filePath);
    if (command.data) {
        client.commands.set(command.data.name, command);
    }
}

client.on("interactionCreate", async interaction => {
    let toExecute;
    
    if (interaction.isCommand()) {
        toExecute = (client.commands.get(interaction.commandName) != undefined) ? client.commands.get(interaction.commandName).execute : undefined;
    } else if (interaction.isButton()) {
        toExecute = (client.buttons.get(interaction.customId) != undefined) ? client.buttons.get(interaction.customId) : undefined;
    }

    if (toExecute) {
        try {
            toExecute(interaction);
        } catch (error) {
            console.error(error);
            interaction.reply("Thằng đỉ, sửa xong lỗi này coi chừng tao xuất hiện trước cửa nhà mày đấy");
        }
    }
});

client.login(token);
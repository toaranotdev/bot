/*
    this file should only be run once
    run it again if new commands are added
*/

const { SlashCommandBuilder } = require("@discordjs/builders");
const { REST } = require("@discordjs/rest");
const fs = require("node:fs");
const path = require("node:path");

const { Routes } = require("discord-api-types/v9");
const { clientId, guildId, token } = require("./config.json");

/*
    how map works:

    for every command in commands array run function command
    use to reformat the array
    e.g:
        let array = [1, 2, 3];
        let secondArray = array.map(x => x * 2); // for every element in the array represented as x, return x * 2
    
    description:
        map((element, index, array));
        element: the current element,
        index: the current index,
        array: the current array
*/

/*
    about arrow functions:
        it doesn't have a name, anything placed between the => are the arguments
*/

/*
    note:
        it's .toJSON() not toJson() :moyai:
        for some reason you can't have a capital letter in setName();
*/

/*
    COMMAND FILES
*/
const commands = [];
const commandPath = path.join(__dirname, "commands");
const commandFile = fs.readdirSync(commandPath).filter (name => name.endsWith(".js"));

for (let fileName of commandFile) {
    let filePath = path.join(commandPath, fileName);
    let command = require(filePath);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationCommands(clientId, guildId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
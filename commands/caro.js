const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageButton, MessageActionRow, MessageEmbed, Collection, SnowflakeUtil } = require("discord.js");

// Game database <key: gameId, value: gameData>
games = new Collection();
// User database (stores requested game, on going game, etc) <key: {challengerId, opponentId}, value: gameId>
users = new Collection();

const move = {
    empty: 0,
    opponent: 1,
    challenger: 2
};

/*
    this keyword does not reference to "module.exports"
    module.exports is sort of like public members of classes, shit that u don't export still works and think
    of it as private members of classes
*/

module.exports = {
    data: new SlashCommandBuilder()
            .setName("caro")
            .setDescription("Chơi trò caro với các thành viên trong server")
            .addUserOption(option => option
                .setName("user")
                .setDescription("Người mà bạn muốn diệt trừ")
                .setRequired(true)),
    
    /*
                GAME DATA STUFF
    */

    getUserObject(interaction) {
        return users.findKey((undefined, userObj) => {
            return (userObj.challengerId == interaction.user.id || userObj.opponentId == interaction.user.id)});
    },
    
    
    getGameId(interaction) {
        let user = module.exports.getUserObject(interaction);
        return users.get(user);
    },

    isInGame(interaction, userId) {
        let userObj = module.exports.getUserObject(interaction);
        if (!userObj) return false;
        let keys = Object.getOwnPropertyNames(userObj);
        return keys.find(value => userObj[value].challengerId == userId || userObj[value].opponentId == userId);
    },
    
    
    // Get y
    getRank(index) {
        return Math.floor(index / 3);
    },


    // Get x
    getFile(index) {
        return index - 3 * module.exports.getRank(index);
    },


    getButtonData(gameId) {
        return games.get(gameId).buttonIds;
    },

    getAllButtonIds(gameId) {
        let buttonData = module.exports.getButtonData(gameId);
        let keys = Object.getOwnPropertyNames(buttonData);
        return keys.map(value => buttonData[value].customId);
    },

    
    getButtonIndex(interaction, buttonData) {
        let keys = Object.getOwnPropertyNames(buttonData);

        return keys.find(value => {
            let id = buttonData[value].customId;
            return interaction.customId == id;
        }) - 1;
    },


    generateInitialBoard() {
        return new Array(9).fill(0); // Can't use map here because it skips over fucking undefined values
    },


    generateButtonIds() {
        // Return some snowflakes
        return {
            1: {customId: SnowflakeUtil.generate()},
            2: {customId: SnowflakeUtil.generate()},
            3: {customId: SnowflakeUtil.generate()},
            4: {customId: SnowflakeUtil.generate()},
            5: {customId: SnowflakeUtil.generate()},
            6: {customId: SnowflakeUtil.generate()},
            7: {customId: SnowflakeUtil.generate()},
            8: {customId: SnowflakeUtil.generate()},
            9: {customId: SnowflakeUtil.generate()}
        }
    },


    generateButtons(board, gameId) {
        // Holds the button's style, customId, etc...
        let buttonProperties = new Array();
        let buttonIds = module.exports.getAllButtonIds(gameId);

        for (let i = 0; i < board.length; i ++) {
            let currentPosId = board[i]; // See the move object above

            let buttonStyle = (currentPosId == move.empty) ? "SECONDARY" : (currentPosId == move.challenger) ? "SUCCESS" : "DANGER";
            let emoji = (buttonStyle != "SECONDARY") ? (buttonStyle == "SUCCESS") ? "836004296696659989" : "836004296008269844" : "◻️";
            let isDisabled = (currentPosId > 0);
            
            let customId = buttonIds[i];

            buttonProperties.push({style: buttonStyle, emoji: emoji, disabled: isDisabled, customId: customId});
        }

        return [ new MessageActionRow().addComponents(
                    [0, 1, 2].map(pos => {
                        let data = buttonProperties[pos];
                        return new MessageButton()
                            .setStyle(data.style)
                            .setDisabled(data.disabled)
                            .setEmoji(data.emoji)
                            .setCustomId(data.customId);})),

                new MessageActionRow().addComponents(
                    [3, 4, 5].map(pos => {
                        let data = buttonProperties[pos];
                        return new MessageButton()
                            .setStyle(data.style)
                            .setDisabled(data.disabled)
                            .setEmoji(data.emoji)
                            .setCustomId(data.customId);})),

                new MessageActionRow().addComponents(
                    [6, 7, 8].map(pos => {
                        let data = buttonProperties[pos];
                        return new MessageButton()
                            .setStyle(data.style)
                            .setDisabled(data.disabled)
                            .setEmoji(data.emoji)
                            .setCustomId(data.customId);})) ];
    },
    
    /*
            ACTUAL GAME HANDLER
    */

    async execute(interaction) {
        let opponent = interaction.options.getUser("user");
        let opponentId = opponent.id;
        let challengerId = interaction.user.id;

        if (module.exports.isInGame(interaction, opponentId)) {
            await interaction.reply({ content: "Người ấy đang bận", ephemeral: true });
            return;
        } else if (module.exports.isInGame(interaction, challengerId)) {
            await interaction.reply({content: "Bạn đang bận, vui lòng hoàn thành cái game của bạn trước ạ", ephemeral: true});
            return;
        }
        
        if (opponentId == interaction.user.id) {
            await interaction.reply({ content: "Bạn không thể chơi với chính bản thân mình!", ephemeral: true });
            return;
        } else if (opponentId == interaction.client.user.id) {
            await interaction.reply({ content: "Tui không có thời gian chơi với con nít!", ephemeral: true });
            return;
        } else if (opponent.bot) {
            await interaction.reply({ content: "Bot thì làm sao mà bạn chơi?", ephemeral: true });
            return;
        }

        const embed = new MessageEmbed()
                        .setColor("#0099ff")
                        .setTitle("Một dân chơi nguy hiểm đã xuất hiện!")
                        .setDescription("Bạn có 30s để chấp nhận lời thách đấu");
        
        const component = new MessageActionRow().addComponents(
                            new MessageButton()
                                .setLabel("Chấp nhận")
                                .setCustomId("NEWGAME")
                                .setStyle("SUCCESS"));
    
        await interaction.reply({components: [component], embeds: [embed]});
        await module.exports.awaitOpponentResponse(interaction, opponentId).then((i) => {
            // Success, create a new game
            interaction.client.buttons.delete("NEWGAME");
                
            let gameId = SnowflakeUtil.generate();
            
            let gameData = {
                board: module.exports.generateInitialBoard(),
                buttonIds: module.exports.generateButtonIds(),
                moverId: opponentId // Opponent goes first
            };
        
            games.set(gameId, gameData);
            users.set({ challengerId: interaction.user.id, opponentId: opponentId }, gameId);
            
            let keys = Object.getOwnPropertyNames(gameData.buttonIds);
            for (let i = 0; i < keys.length; i ++) {
                let index = keys[i];
                let buttonId = gameData.buttonIds[index].customId;
                interaction.client.buttons.set(buttonId, module.exports.handleMove);
            }

            let component = module.exports.generateButtons(gameData.board, gameId);
            i.update({ content: null, embeds: [], components: component});

        }, () => {
                // Failure, alert the user
                interaction.editReply({ content: "Hết thời gian", embeds: [], components: [] });
        });
    },

    awaitOpponentResponse(interaction, opponentId) {
        return new Promise((resolve, reject) => {
            setTimeout(reject, 30000);

            const handler = (i => { 
                if (i.member.id == opponentId) resolve(i);
            });

            interaction.client.buttons.set("NEWGAME", handler);

        });
    },


    getGameState(interaction, boardData, opponentId, challengerId) {
        // Looping over the board
            // Check if position aligned with a winning position
            // Edit message
        let winningStates = [
            // Straight line
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            // Diagonal
            [0, 4, 8],
            [2, 4, 6]
        ];

        let isFull = boardData.every(value => value > 0);

        for (let i = 0; i < winningStates.length; i ++) {
            winningStates[i] = winningStates[i].map(value => boardData[value]);

            console.log(winningStates[i]);

            let opponentHasWon = winningStates[i].every(value => value == move.opponent);
            let challengerHasWon = winningStates[i].every(value => value == move.challenger);

            console.log(opponentHasWon, challengerHasWon);

            if (opponentHasWon) {
                console.log("Opponent won");
                return opponentId;
            } else if (challengerHasWon) {
                console.log("Challenger won");
                return challengerId;
            }
        }

        if (isFull) {
            return "drawn";
        }

    },


    async handleMove(interaction) {
        let user = module.exports.getUserObject(interaction);
        let gameId = module.exports.getGameId(interaction);
        let gameData = games.get(gameId);

        if ((interaction.member.id == user.opponentId || interaction.member.id == user.challengerId) && 
                    interaction.member.id == gameData.moverId) {

            let buttonData = gameData.buttonIds;
            let id = (interaction.member.id == user.challengerId) ? move.challenger : move.opponent;
            let index = module.exports.getButtonIndex(interaction, buttonData);

            if (index == undefined) {
                // Invalid button!!!!!!!
                return;
            }
            
            gameData.board[index] = id;
            let state = module.exports.getGameState(interaction, gameData.board, user.opponentId, user.challengerId);

            switch (state) {
                case "drawn":
                    await interaction.update({ content: "Hòa!", components: [] });
                    break;
                case user.challengerId:
                    await interaction.update({ content: `<@${user.opponentId}> đã thua <@${user.challengerId}>, ngu loz`, components: [] });
                    await module.exports.deleteGame(interaction, gameId, user);
                    break;
                case user.opponentId:
                    await interaction.update({ content: `<@${user.challengerId}> đã thua <@${user.opponentId}>, ngu loz`, components: [] });
                    await module.exports.deleteGame(interaction, gameId, user);
                    break;
                default:
                    games.delete(gameId);
                    gameData.moverId = (gameData.moverId == user.challengerId) ? user.opponentId : user.challengerId;
                    games.set(gameId, gameData);
        
                    await module.exports.updateMessage(interaction, gameData.moverId, gameData.board, gameId);
                    break;
            }
        } else if (interaction.member.id == user.opponentId || interaction.member.id == user.challengerId) {
            interaction.reply({ content: "Đéo phải lượt của mày!", ephemeral: true });
        }
    },

    async updateMessage(interaction, moverId, board, gameId) {
        let component = module.exports.generateButtons(board, gameId);
        await interaction.update({ content: `Tới lượt của @<${moverId}>`, components: component });
    },

    deleteGame(interaction, gameId, userObj) {
        let allButtonIds = module.exports.getAllButtonIds(gameId);
        users.delete(userObj);
        games.delete(gameId);
        for (let i = 0; i < allButtonIds.length; i ++) {
            let id = allButtonIds[i];
            interaction.client.buttons.delete(id);
        }
    }
};

const { Client, Intents, Message, MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { token } = require('../config.json');
const { TicTacToe } = require('./databaseObjects.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.once('ready', () => {
    console.log('Ready!');
})

client.on('messageCreate', async (message) => {
    if(message.author.id === client.user.id) return;

    if(message.content.toLowerCase().includes("bazinga")) {
        message.reply("pog");
    }

    if(message.content.toLowerCase().includes("sus")) {
        message.reply("Among us!", { files: ['https://cdn.vox-cdn.com/thumbor/mCze0k6_0Bv5YMVQHk80zXi2ciI=/1400x1050/filters:format(jpeg)/cdn.vox-cdn.com/uploads/chorus_asset/file/22136080/ss_a0f2416e11bf5b47788eaa3617e092b73962b145.jpg'] });
    }

    if(message.content.toLowerCase() === 'score') {
        let user = await TicTacToe.findOne({ 
            where: {
                user_id: message.author.id
            }
        });
        if(!user) {
            user = await TicTacToe.create({ user_id: message.author.id })
        }
        message.reply("Your score is " + user.get('score'));
    }

    if(message.content.toLowerCase() === 'morb') {
        var rand = Math.floor(Math.random() * 3);

        switch (rand) {
            case 0:
                message.reply({ files: ['https://pbs.twimg.com/media/FToZcKQXsAEDLGQ.jpg'] });
                break;
            case 1:
                message.reply("I just Morbed!!");
                break;
            case 2:
                message.reply({ files: ['https://preview.redd.it/3ost7y8wr6t81.jpg?width=640&crop=smart&auto=webp&s=799ce5cff63bbed2eabfbf74bcb82c244d938fe4'] });
                break;
        }
    }


})




/* Tic Tac Toe */
let EMPTY = Symbol("empty");
let PLAYER = Symbol("player");
let BOT = Symbol("bot");

let tictactoe_state

function makeGrid() {
    components = []

    for (let row = 0; row < 3; row++) {
        actionRow = new MessageActionRow()

        for(let col = 0; col < 3; col++) {
            messageButton = new MessageButton()
                .setCustomId('tictactoe_' + row + '_' + col)

            switch(tictactoe_state[row][col]) {
                case EMPTY:
                    messageButton
                        .setLabel(' ')
                        .setStyle('SECONDARY')
                    break;
                case PLAYER:
                    messageButton
                        .setLabel('X')
                        .setStyle('PRIMARY')
                    break;
                case BOT:
                    messageButton
                        .setLabel('O')
                        .setStyle('DANGER')
                    break;
            }
            actionRow.addComponents(messageButton)
        }

        components.push(actionRow)
    } 
    return components
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function isDraw() {
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            if (tictactoe_state[row][col] == EMPTY) {
                return false
            }
        }
    }
    return true;
}

function isGameOver() {
    for (let i = 0; i < 3; i++) {
        if (tictactoe_state[i][0] == tictactoe_state[i][1] && tictactoe_state[i][1] == tictactoe_state[i][2] && tictactoe_state[i][2] != EMPTY) {
            return true;
        }

        if (tictactoe_state[0][i] == tictactoe_state[1][i] && tictactoe_state[1][i] == tictactoe_state[2][i] && tictactoe_state[2][i] != EMPTY) {
            return true;
        }
    }

    if (tictactoe_state[1][1] != EMPTY) {
        if (
            (tictactoe_state[0][0] == tictactoe_state[1][1] && tictactoe_state[1][1] == tictactoe_state[2][2]) || 
            (tictactoe_state[2][0] == tictactoe_state[1][1] && tictactoe_state[1][1] == tictactoe_state[0][2])) {
            return true;
        }
    }

    return false;
}

client.on('interactionCreate', async interaction => {
    if(!interaction.isButton()) return;
    if(!interaction.customId.startsWith('tictactoe')) return;

    if (isGameOver()) {
        interaction.update({
            components: makeGrid()
        })
        return;
    }

    let parsedFields = interaction.customId.split("_")
    let row = parsedFields[1]
    let col = parsedFields[2]

    if (tictactoe_state[row][col] != EMPTY) {
        interaction.update({
            content: "You can't select that position!",
            components: makeGrid()
        })
        return;
    }

    tictactoe_state[row][col] = PLAYER;

    if (isGameOver()) {
        let user = await TicTacToe.findOne({ 
            where: {
                user_id: interaction.user.id
            }
        });
        if(!user) {
            user = await TicTacToe.create({ user_id: interaction.user.id });
        }

        await user.increment('score');

        interaction.update({
            content: "You won the game of tic-tac-toe! You have now won " + (user.get('score') + 1) + " time(s).",
            components: []
        })
        return;
    }
    if (isDraw()) {
        interaction.update({
            content: "The game resulted in a draw!",
            components: []
        })
        return;
    }


    /* Bot Functionality */
    let botRow
    let botCol
    do {
        botRow = getRandomInt(3);
        botCol = getRandomInt(3);
    } while(tictactoe_state[botRow][botCol] != EMPTY);

    tictactoe_state[botRow][botCol] = BOT;


    if (isGameOver()) {
        interaction.update({
            content: "You lost the game of tic-tac-toe",
            components: makeGrid()
        })
        return;
    }
    if (isDraw()) {
        interaction.update({
            content: "The game resulted in a draw!",
            components: []
        })
        return;
    }

    interaction.update({
        components: makeGrid()
    })
})

client.on('interactionCreate', async interaction => {
    if(!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'tictactoe') {
        tictactoe_state = [
            [EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY]
        ]

        await interaction.reply({content: 'Playing a game of tic-tac-toe!', components: makeGrid() });
    }
})

client.login(token);
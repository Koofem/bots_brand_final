const telegramBot = require('Class/Marathon/MarathonTelegramBot');
const marathonClass = require('Class/Marathon/Marathon');
const messageHandler = require('Backs/MarathonMessageHandler')
const keyboardsCommands = require('Constants/MarathonKeyboards')
const MarathonBot = new (class MarathonBot {
	constructor() {
	}
	async init({jwtToken, telegramBotToken, authHandler, keyBoardExpander, authActions}) {

		const commands = keyBoardExpander(keyboardsCommands)
		// console.log(commands)
		await marathonClass.init({jwtToken});
		await messageHandler.init({authHandler, commands, authActions})
		await telegramBot.init({token:telegramBotToken, commands, authActions});
	}

})();

module.exports = MarathonBot;


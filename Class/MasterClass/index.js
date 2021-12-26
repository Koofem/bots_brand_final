const telegramBot = require('Class/MasterClass/MasterClassTelegramBot');
const masterClass = require('Class/MasterClass/MasterClass');
const messageHandler = require('Backs/MasterClassMessageHandler')
const keyboardsCommands = require('Constants/MasterClassKeyboards')
const MasterClassBot = new (class MasterClassBot {
	constructor() {
	}
	async init({jwtToken, telegramBotToken, authHandler, keyBoardExpander, authActions}) {
		const commands = keyBoardExpander(keyboardsCommands)
		await masterClass.init({jwtToken});
		await messageHandler.init({authHandler, commands, authActions})
		await telegramBot.init({token:telegramBotToken, commands, authActions});
	}

})();

module.exports = MasterClassBot;


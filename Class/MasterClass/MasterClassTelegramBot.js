const { Telegraf } = require('telegraf')
const debounce = require('lodash/debounce');
const messageHandler = require('Backs/MasterClassMessageHandler')



class MasterClassTelegramBot {
	bot
	debouncedRestartAndStartCommandHandler
	debouncedSimpleMessageHandler
	constructor() {

	}

	async init({token, commands, authActions}) {
		this.bot = new Telegraf(token);
		await this.startListening(commands, authActions);
		this.debouncedRestartAndStartCommandHandler = debounce(messageHandler.restartAndStartCommandHandler, 300)
		this.debouncedSimpleMessageHandler = debounce(messageHandler.simpleMessageHandler, 300);
		global.masterClassBot = this.bot
	}

	startListening(commands, authActions) {
		commands.forEach((command)=> {
			if (command.action) {
				this.bot.hears(command.trigger, (ctx)=> command.action(ctx));
			}
		})

		authActions.forEach((action)=> {
			this.bot.action(action.trigger, (ctx)=> action.set_action(ctx, action.trigger));
		})
		this.bot.start((ctx) => this.debouncedRestartAndStartCommandHandler(ctx));
		this.bot.on('text', (ctx) => this.debouncedSimpleMessageHandler(ctx));
		// this.bot.action('accept', (ctx) => messageHandler.acceptHandler(ctx));
		this.bot.action('refusal', (ctx) => messageHandler.refusalHandler(ctx));


		this.bot.launch().then(()=> {
			console.log('Все заебись, бот мастер классов запущен')
		})
	}
}

const telegramBot = new MasterClassTelegramBot();
module.exports = telegramBot;

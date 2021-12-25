const { Telegraf } = require('telegraf')
const messageHandler = require('Backs/MarathonMessageHandler')


class MarathonTelegramBot {
	bot
	constructor() {}

	async init({token, commands, authActions}) {
		this.bot = new Telegraf(token);
		await this.startListening(commands, authActions);
	}

	startListening(commands, authActions) {
		commands.forEach((command)=> {
			this.bot.hears(command.trigger, (ctx)=> command.action(ctx));
		})

		authActions.forEach((action)=> {
			this.bot.action(action.trigger, (ctx)=> action.set_action(ctx, action.trigger));
		})

		this.bot.start((ctx) => messageHandler.restartAndStartCommandHandler(ctx))
		this.bot.command('restart', (ctx) => messageHandler.restartAndStartCommandHandler(ctx));
		this.bot.on('text', (ctx) => messageHandler.simpleMessageHandler(ctx));
		this.bot.action('refusal', (ctx) => messageHandler.refusalHandler(ctx));


		this.bot.launch().then(()=> {
			console.log('Все заебись, бот марафонов запущен')
		})
	}
}

const telegramBot = new MarathonTelegramBot();
module.exports = telegramBot;

const messages = require('Constants/MessagesFromBot')
const MarathonClass = require('Class/Marathon/Marathon');
class MarathonMessageHandler {
	authHandler
	keyboardsCommands
	authActions
	constructor() {}

	async init({authHandler, commands, authActions}) {
		this.authHandler = authHandler
		this.keyboardsCommands = commands
		this.authActions = authActions
	}

	async restartAndStartCommandHandler(ctx) {
		await this.authHandler.initOrUpdateUser(ctx)
		await this.authHandler.resetUserAction(ctx)
		const timeout = setTimeout(() =>  {
			ctx.telegram.sendMessage(ctx.chat.id, messages.IDLE_MESSAGE);
		}, 500)
		const promises = [new Promise(async (resolve) => {
			return resolve();
		})]

		const keyboardButtons = this.keyboardsCommands.map((keyboard)=> {
				return [keyboard.trigger]
			})



		return Promise.all(promises).then(async ()=> {
			clearInterval(timeout);
			await ctx.telegram.sendMessage(ctx.chat.id, messages.GREETINGS_MESSAGE, {
				reply_markup: {
					keyboard: keyboardButtons,
					resize_keyboard: true
				},
				parse_mode: "HTML",
			})
			await this.sendMarathonMessage(ctx);
		});
	}

	async sendMarathonMessage(ctx) {
		await messageHandler.authHandler.initOrUpdateUser(ctx)
		await messageHandler.authHandler.resetUserAction(ctx)
		const timeout = setTimeout(() =>  {
			ctx.telegram.sendMessage(ctx.chat.id, messages.IDLE_MESSAGE);
		}, 500)
		let marathonMessage = '';
		const promises = [new Promise(async (resolve) => {
			marathonMessage = await MarathonClass.getCurrentMarathon();
			return resolve();
		})]

		return Promise.all(promises).then(async ()=> {
			clearInterval(timeout);
			if (marathonMessage.withPhoto) {
				return ctx.telegram.sendPhoto(ctx.chat.id, `https://admin.braidsandhairmedia.ru${marathonMessage.photo}` , {
					caption: marathonMessage.description,
					reply_markup: {
						inline_keyboard: [[
							{
								text: "Хочу участвовать!",
								callback_data: `accept-marathon_${marathonMessage.id}`
							},
							{
								text: "Нет, спасибо",
								callback_data: "refusal"
							}]
						]
					}
				})
			} else if (!marathonMessage.withPhoto && !marathonMessage.isEmpty) {
				return ctx.telegram.sendMessage(ctx.chat.id, marathonMessage.description, {
					reply_markup: {
						inline_keyboard: [[
							{
								text: "Хочу участвовать!",
								callback_data: `accept-marathon_${marathonMessage.id}`
							},
							{
								text: "Нет, спасибо",
								callback_data: "refusal"
							}]
						],
					}
				})
			} else {
				return ctx.telegram.sendMessage(ctx.chat.id, marathonMessage.description)
			}
		});
	}

	async refusalHandler(ctx) {
		ctx.answerCbQuery();
		ctx.reply('Хорошо, когда передумаете мы Вас ждем!')
	}


	async simpleMessageHandler(ctx) {
		const user_action = await this.authHandler.getUserAction(ctx.from)
		const authActionHandler = this.authActions.find(action => action.trigger === user_action.action);
		if (authActionHandler) {
			return authActionHandler.action(ctx, user_action.actionMessageID)
		}
		return await ctx.telegram.sendMessage(ctx.chat.id, messages.SIMPLE_MESSAGE, {
				parse_mode: "HTML"
			})
		}
}

const messageHandler = new MarathonMessageHandler();
module.exports = messageHandler;

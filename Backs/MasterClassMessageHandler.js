const messages = require('Constants/MessagesFromBot')
const MasterClass = require('Class/MasterClass/MasterClass');
const messageHandlerClass = new (class MessageHandler {
	authHandler
	keyboardsCommands
	authActions
	async init({authHandler, commands, authActions}) {
		this.authHandler = authHandler
		this.keyboardsCommands = commands
		this.authActions = authActions
	}

	async restartAndStartCommandHandler(ctx) {
		const masterClassesArr = await MasterClass.getAllMasterClassesNames();
		const masterClassesNames = masterClassesArr.map(masterClass => {
			return Object.keys(masterClass);
		})
		const keyboardButtons = messageHandlerClass.keyboardsCommands.map((keyboard)=> {
			return [keyboard.trigger]
		})

		const keyboard = masterClassesNames.concat(keyboardButtons)
		const timeout = setTimeout(() => {
			ctx.telegram.sendMessage(ctx.chat.id, messages.IDLE_MESSAGE);
		}, 500)
		const promises = [new Promise(async (resolve) => {
			await messageHandlerClass.authHandler.initOrUpdateUser(ctx)
			await messageHandlerClass.authHandler.resetUserAction(ctx)
			return resolve();
		})]

		return Promise.all(promises).then(async () => {
			clearInterval(timeout);
			await ctx.telegram.sendMessage(ctx.chat.id, messages.GREETINGS_MESSAGE, {
				reply_markup: {
					keyboard: keyboard,
					resize_keyboard: true
				},
				parse_mode: "HTML",

			})
		});
	}

	async sendMasterClassMessage(ctx, masterClassId) {
		const timeout = setTimeout(() => {
			ctx.telegram.sendMessage(ctx.chat.id, messages.IDLE_MESSAGE);
		}, 1000)
		let masterClassMessage = {};
		const promises = [new Promise(async (resolve) => {
			masterClassMessage = await MasterClass.getCurrentMasterClasses(masterClassId);
			if (masterClassMessage.withPhoto) {
				return resolve(ctx.telegram.sendPhoto(ctx.chat.id, `https://admin.braidsandhairmedia.ru${masterClassMessage.photo}`, {
					caption: masterClassMessage.description,
					reply_markup: {
						inline_keyboard: [[
							{
								text: "Хочу участвовать!",
								callback_data: `accept-master-class_${masterClassMessage.id}`
							},
							{
								text: "Нет, спасибо",
								callback_data: "refusal"
							}]
						]
					}
				}))
			} else if (!masterClassMessage.withPhoto && !masterClassMessage.isEmpty) {
				return resolve(ctx.telegram.sendMessage(ctx.chat.id, masterClassMessage.description, {
					reply_markup: {
						inline_keyboard: [[
							{
								text: "Хочу участвовать!",
								callback_data: `accept-master-class_${masterClassMessage.id}`
							},
							{
								text: "Нет, спасибо",
								callback_data: "refusal"
							}]
						],
					}
				}))
			} else {
				return resolve(ctx.telegram.sendMessage(ctx.chat.id, masterClassMessage.description))
			}
		})]
		return Promise.all(promises).then(async () => {
			clearInterval(timeout);
		});
	}

	async refusalHandler(ctx) {
		ctx.answerCbQuery();
		ctx.reply('Хорошо, когда передумаете мы Вас ждем!')
	}


	async simpleMessageHandler(ctx) {
		const timeout = setTimeout(() => {
			ctx.telegram.sendMessage(ctx.chat.id, messages.IDLE_MESSAGE);
		}, 500)
		try {
			const user_action = await messageHandlerClass.authHandler.getUserAction(ctx.from)
			const authActionHandler = messageHandlerClass.authActions.find(action => action.trigger === user_action.action);
			if (authActionHandler) {
				clearInterval(timeout)
				return authActionHandler.action(ctx, user_action.actionMessageID)
			}
			const message = ctx.message.text;
			const masterClasses = await MasterClass.getAllMasterClassesNames();
			const masterClassNames = masterClasses.map((masterClass) => {
				return Object.keys(masterClass);
			})
			const isMasterClass = Boolean(masterClassNames.find((name) => {
				return name[0] === message
			}))
			if (isMasterClass) {
				const masterClassId = masterClasses.find((masterClass) => {
					if (masterClass[message]) {
						return masterClass[message]
					}
				})[message]
				try {
					clearInterval(timeout);
					await messageHandlerClass.sendMasterClassMessage(ctx, masterClassId);
				} catch (e) {
					console.log(e)
				}

			} else {
				clearInterval(timeout);
				return await ctx.telegram.sendMessage(ctx.chat.id, messages.SIMPLE_MESSAGE, {
					parse_mode: "HTML"
				})
			}
		} catch(e) {
			clearInterval(timeout);
			return await ctx.telegram.sendMessage(ctx.chat.id, messages.ERROR_MESSAGE, {
				parse_mode: "HTML"
			})
		}
	}
})()

module.exports = messageHandlerClass;

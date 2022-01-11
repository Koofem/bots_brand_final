const UserBD = require("Models/UsersBD");
const MarathonClass = require('Class/Marathon/Marathon')
const MasterClassClass = require('Class/MasterClass/MasterClass')

const AuthHandlerClass = new (class AuthHandler {
	// marathonCB
	constructor() {

	}

	async init() {
		this.actions = this.authKeyboardsCommandsConstructor();
	}

  getUserInfo = async function(ctx) {
		const user = await UserBD.findUser(ctx.chat.id)
		const keyboards = await AuthHandlerClass.getInlineKeyBoards()
		const message = `Ваши личные данные: \n\nИмя: <b><i>${user.first_name || ''}</i></b>\nФамилия: <b><i>${user.last_name || ''}</i></b>\nОтчество: <b><i>${user.patronymic || ''}</i></b>\nТелефон: <b><i>${user.phone||''}</i></b>\nEmail: <b><i>${user.email ||""}</i></b>\nInstagram: <b><i>${user.instagram || ''}</i></b>`
		return ctx.telegram.sendMessage(ctx.chat.id, message, {
			reply_markup: {
				inline_keyboard: keyboards,
				resize_keyboard: true
			},
			parse_mode: 'HTML'
		})
	}

	editMessage = async function (ctx, chatId, messageId, text, extra = {}) {
		const extraWithParse = {...extra, parse_mode: 'HTML'}
		return ctx.telegram.editMessageText(chatId , messageId, undefined, text, extraWithParse)
	}


	editMessageExtra = async function (ctx, chatId, messageId, extra={}) {
		return ctx.telegram.editMessageReplyMarkup(chatId , messageId, undefined, extra )
	}

	deleteMessage = async function (ctx, chatId, messageId) {
		return ctx.telegram.deleteMessage(chatId, messageId)
	}

	editFirstName = async function(ctx, messageID) {
		const first_name = ctx.message.text
		await UserBD.updateUser(ctx.chat, 'first_name', first_name );
		await UserBD.resetUserAction(ctx.chat)
		return await AuthHandlerClass.editMessage(ctx, ctx.chat.id, messageID, `Имя изменено на <strong>${first_name}</strong>`)

	}

	resetUserAction= async function(ctx, answerCbQuery = false, messageID) {
		await UserBD.resetUserAction(ctx.chat)
		if (answerCbQuery){
			ctx.answerCbQuery('Действие отменено!')
			return await AuthHandlerClass.editMessage(ctx, ctx.chat.id, messageID, `Ваше последнее действие отменено!`)
		}
	}

	  resetUserActionWithCB = async function(ctx) {
		const user = await UserBD.findUser(ctx.chat.id)
		return await AuthHandlerClass.resetUserAction(ctx, true, user.actionMessageID)
	}

	  editLastName= async function(ctx, messageID) {
		const last_name = ctx.message.text
		await UserBD.updateUser(ctx.chat, 'last_name', last_name );
			await UserBD.resetUserAction(ctx.chat)
			return await AuthHandlerClass.editMessage(ctx, ctx.chat.id, messageID, `Фамилия изменена на <strong>${last_name}</strong>`)
	}

	  editPatronymic= async function(ctx, messageID) {
		const patronymic = ctx.message.text
		await UserBD.updateUser(ctx.chat, 'patronymic', patronymic );
			await UserBD.resetUserAction(ctx.chat)
			return await AuthHandlerClass.editMessage(ctx, ctx.chat.id, messageID, `Отчество изменено на <strong>${patronymic}</strong>`)
	}

	_checkRequire = async function(user) {
		const requireFields = ['first_name','last_name', 'phone', 'instagram'];
		const userFields = Object.keys(user)
		let emptyRequire = [];
		requireFields.forEach((field)=> {
			if ( !~userFields.indexOf(field) ) emptyRequire.push(field)
		})

		return emptyRequire
	}

	checkRequiredFields = async function(ctx) {
		ctx.answerCbQuery();
		const user = await UserBD.findUser(ctx.chat.id);
		const emptyRequire = await AuthHandlerClass._checkRequire(user)
		if (emptyRequire.length > 0) {
			const keyboard = AuthHandlerClass.getRequerdInlineKeyboards(emptyRequire);
			await ctx.telegram.sendMessage(ctx.chat.id, 'Нужно заполнить обязательные поля.',{
				reply_markup: {
					inline_keyboard: keyboard,
					resize_keyboard: true
				},
				parse_mode: 'HTML'
			});
		} else {
			const product = ctx.update.callback_query.data.split('_');
			if (product[0] === 'accept-marathon') {
				return MarathonClass.getPaymentLink(ctx, product[1], user);
			}
			if (product[0]=== 'accept-master-class') {
				return MasterClassClass.getPaymentLink(ctx, product[1], user);
			}
		}
	}

	editEmail = async function(ctx, messageID) {
		const email = ctx.message.text
		const regexp = new RegExp('(?:[a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\\])')
		if (regexp.test(email)) {
			await UserBD.updateUser(ctx.chat, 'email', email );
			await UserBD.resetUserAction(ctx.chat)
			return await AuthHandlerClass.editMessage(ctx, ctx.chat.id, messageID, `Email изменен на <strong>${email}</strong>`)
		} else {
			await AuthHandlerClass.deleteMessage(ctx, ctx.chat.id, messageID)

			const message = await ctx.telegram.sendMessage(ctx.chat.id, 'Вы ввели неккоректный email, попробуйте снова!', {
				reply_markup: {
					inline_keyboard: AuthHandlerClass.getResetInlineKeyboards(),
					resize_keyboard: true,
				},
			});

			await UserBD.setActionToUser(ctx.from, 'edit_email', message.message_id);

			return message
		}
	}

	editPhone = async function(ctx, messageID) {
		const phone = ctx.message.text
		const regexp = new RegExp('^(\\+7|7|8)?[\\s\\-]?\\(?[489][0-9]{2}\\)?[\\s\\-]?[0-9]{3}[\\s\\-]?[0-9]{2}[\\s\\-]?[0-9]{2}$')
		if (regexp.test(phone)) {
			await UserBD.updateUser(ctx.chat, 'phone', phone.length === 10 ? '+7'+ phone.replace(/\s+/g, '') : phone.replace(/\s+/g, ''));
			await UserBD.resetUserAction(ctx.chat)
			return await AuthHandlerClass.editMessage(ctx, ctx.chat.id, messageID, `Телефон изменен на <strong>${phone.replace(/\s+/g, '')}</strong>`)
		} else {
			await AuthHandlerClass.deleteMessage(ctx, ctx.chat.id, messageID)
			const message = await ctx.telegram.sendMessage(ctx.chat.id, 'Вы ввели неккоректный номер телефона, попробуйте снова!', {
				reply_markup: {
					inline_keyboard: AuthHandlerClass.getResetInlineKeyboards(),
					resize_keyboard: true,
				},
			});

			await UserBD.setActionToUser(ctx.from, 'edit_phone', message.message_id);

			return message
		}
	}

	editInstagram = async function(ctx, messageID) {
		const instagram = ctx.message.text
		const regexp = new RegExp('@([A-Za-z0-9_](?:(?:[A-Za-z0-9_]|(?:\\\\.(?!\\\\.))){0,28}(?:[A-Za-z0-9_]))?)')
		if (regexp.test(instagram)) {
			await UserBD.updateUser(ctx.chat, 'instagram', instagram );
			await UserBD.resetUserAction(ctx.chat)
			return await AuthHandlerClass.editMessage(ctx, ctx.chat.id, messageID, `Instagram изменен <strong>${instagram}</strong>`)
		} else {
				await AuthHandlerClass.deleteMessage(ctx, ctx.chat.id, messageID)
			const message = await ctx.telegram.sendMessage(ctx.chat.id, `Вы ввели неккоректный ник инстаграмма, нужно указывать с '@' в начале ника, попробуйте снова!`, {
				reply_markup: {
					inline_keyboard: AuthHandlerClass.getResetInlineKeyboards(),
					resize_keyboard: true,
				},
			});

			await UserBD.setActionToUser(ctx.from, 'edit_instagram', message.message_id);

			return message
		}
	}

	 setActionToUser = async function(ctx, action_trigger) {
			ctx.answerCbQuery();
			const current_action = AuthHandlerClass.actions.find((action) => action.trigger === action_trigger)
		 const keyBoard = AuthHandlerClass.getResetInlineKeyboards()
			const message = await ctx.telegram.sendMessage(ctx.chat.id, current_action.message, {
				reply_markup: {
					inline_keyboard:keyBoard ,
					resize_keyboard: true,
				},
			parse_mode: 'HTML'
		})

		 await UserBD.setActionToUser(ctx.from, action_trigger, message.message_id);

		 return message
	}

		 getUserAction= async function(user) {
		return await UserBD.getUserAction(user);
	}


	  initOrUpdateUser= async function(ctx) {
		return UserBD.saveOrUpdateUser(ctx.chat)
	}

	 getInlineKeyBoards = async function() {
		const inline_keyboard = [];
		this.actions.filter((keyboard) => keyboard.isVisible).forEach((keyboard)=> {
			inline_keyboard.push([{
				text: keyboard.name,
				callback_data: keyboard.trigger
			}])
		})
		return inline_keyboard
	}

	 getRequerdInlineKeyboards = function(emptyRequire) {
		const inline_keyboard = [];
			this.actions.filter((keyboard) => keyboard.isVisible && keyboard.isRequired ).forEach((keyboard)=> {
				if (emptyRequire.some((e) => {
					return Object.values(keyboard).includes(e)
				})) {
					inline_keyboard.push([{
						text: keyboard.name,
						callback_data: keyboard.trigger
					}])
				}
			})
		return inline_keyboard
	}

	 getResetInlineKeyboards=  function () {
		const inline_keyboard = [];
		this.actions.filter((keyboard) => keyboard.trigger === 'reset_action').forEach((keyboard)=> {
			inline_keyboard.push([{
				text: keyboard.name,
				callback_data: keyboard.trigger
			}])
		})
		return inline_keyboard
	}

	authKeyboardsCommandsConstructor()  {
		return [
			{
				trigger: 'edit_first_name',
				isRequired: true,
				dataBaseName: 'first_name',
				set_action: this.setActionToUser,
				action: this.editFirstName,
				name: 'Изменить имя',
				message: 'Напишите Ваше имя следующим сообщением!',
				isVisible: true
			},
			{
				trigger: /(^accept-marathon+.+$)/i,
				set_action: this.checkRequiredFields,
				message: 'Нужно заполнить обязательные поля, чтобы продолжить!',
				isVisible: false
			},
			{
				trigger: /(^accept-master-class+.+$)/i,
				set_action: this.checkRequiredFields,
				message: 'Нужно заполнить обязательные поля, чтобы продолжить!',
				isVisible: false
			},
			{
				trigger: 'edit_last_name',
				set_action: this.setActionToUser,
				isRequired: true,
				dataBaseName: 'last_name',
				name: 'Изменить фамилию',
				message: 'Напишите Вашу фамилию следующим сообщением!',
				action: this.editLastName,
				isVisible: true
			},
			{
				trigger: 'edit_patronymic',
				set_action: this.setActionToUser,
				action: this.editPatronymic,
				name: 'Изменить отчество',
				message: 'Напишите Ваше отчество следующим сообщением!',
				isVisible: true

			},
			{
				trigger: 'edit_phone',
				set_action: this.setActionToUser,
				isRequired: true,
				dataBaseName: 'phone',
				action: this.editPhone,
				name: 'Изменить телефон',
				message: 'Напишите Ваш телефон следующим сообщением!',
				isVisible: true
			},
			{
				trigger: 'edit_email',
				set_action: this.setActionToUser,
				action: this.editEmail,
				name: 'Изменить email',
				message: 'Напишите Ваш email следующим сообщением!',
				isVisible: true
			},
			{
				trigger: 'edit_instagram',
				isRequired: true,
				dataBaseName: 'instagram',
				set_action: this.setActionToUser,
				action: this.editInstagram,
				name: 'Изменить instagram',
				message: 'Напишите Ваш ник Instagram c \'@\' в следующем сообщении!',
				isVisible: true
			},
			{
				trigger: 'reset_action',
				set_action: this.resetUserActionWithCB,
				name: 'Отмена',
				isVisible: false,
				isRequired: false,
			}
		]
	}
})();

module.exports = AuthHandlerClass;

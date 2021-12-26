const axios = require('axios');
const masterClassModules = require("Constants/MasterClassModules");
const PaymentBD = require('Models/PaymentBD');
const PaymentHandler = require("Backs/PaymentHandler")
const masterClassClass = new (class MasterClass{
	constructor() {}
	token

	async _getAllMasterClasses() {
		const { data } = await axios.get(masterClassModules.MASTER_CLASS_FIND_ALL, { headers: {"Authorization" : `${this.token}`} });
		return data
	}

	async masterClassCheck(currentMasterClass, ctx) {
		try {
			if (currentMasterClass) {
				if (currentMasterClass.enabled) {
					return true
				} else {
					await ctx.telegram.sendMessage(ctx.chat.id, 'Произошла ошибка, мастер класс не активен')
					return false
				}
			}
		} catch (e) {
			await ctx.telegram.sendMessage(ctx.chat.id, 'Произошла ошибка, мастер класс не активен')
			return false
		}
	}

	async getPaymentLink(ctx, currentMarathon, user) {
		const loadingMessage = await ctx.telegram.sendMessage(ctx.from.id, 'Загрузка, пожалуйста подождите');
		try {
			const masterClassById = await masterClassClass._getCurrentMasterClass(currentMarathon);
			const { masterClassURL } = await readFile('Constants/successURL.json')
			const {productPay} = await readFile('Constants/modules.json')
			const payload = {
				sum: masterClassById.price,
				successURL: masterClassURL,
				targets: masterClassById.name,
				comment: `Оплата мастер класса ${masterClassById.name}`,
				userID: `${user.id}`,
				productID: masterClassById._id,
				type: 'masterClass'
			}
			const isMasterClassEnable = await masterClassClass.masterClassCheck(masterClassById, ctx)
			if (!isMasterClassEnable) {
				return
			}

			const { data } = await PaymentHandler.createPaymentLink(payload)
			const text = 'Отлично, нажмите кнопку "Оплатить"'
			const message = await ctx.telegram.sendMessage(ctx.from.id, text, {
				reply_markup: {
					inline_keyboard: [[
						{
							text: `Оплатить ${data.sum} ₽`,
							url: `${productPay}${data.token}`,
						}
					]]
				}
			})

			await PaymentBD.updatePayment(data.token, message.message_id)
			await ctx.telegram.deleteMessage(ctx.from.id, loadingMessage.message_id)
			return message
		} catch (e) {
			await ctx.telegram.deleteMessage(ctx.from.id, loadingMessage.message_id)
			return ctx.telegram.sendMessage(ctx.from.id, 'Возможно Вы уже оплатили участие в данном мастер классе, или что-то пошло не так')
		}
	}

	async _getCurrentMasterClass(id) {
		const { data } =await axios.get(`${masterClassModules.MASTER_CLASS_FIND_ONE}${id}`, { headers: {"Authorization" : `${this.token}`} });
		return data
	}

	async getCurrentMasterClasses(id) {
		const masterClass = await this._getCurrentMasterClass(id);
		if (masterClass) {
				const masterClassMessage = {
					description: masterClass.name + '\n\n' + masterClass.description,
					withPhoto: false,
					isEmpty: false,
					id: masterClass.id,
					paymentLink: masterClass.paymentLink,
				}
				if (masterClass.photo) {
					return {...masterClassMessage, photo: masterClass.photo.url, withPhoto: true}
				}

				return masterClassMessage
			}	else {
			return [
				{
					description: "Нет активных мастер-классов",
					isEmpty: true,
				}
			]
		}
		}

		async getAllMasterClassesNames() {
			const masterClasses = await this._getAllMasterClasses();
			return masterClasses.map((masterClass) => {
				const masterClasses = {}
				masterClasses[masterClass.name] = masterClass.id
				return masterClasses
			})
	}

	async init({jwtToken}) {
		this.token = jwtToken;
	}

})()

module.exports = masterClassClass;

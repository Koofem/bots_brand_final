const marathonModules = require('Constants/MarathonModules');
const PaymentHandler = require("Backs/PaymentHandler")
const axios = require('axios');
const marathonClass = new (class Marathon{
	token
	// paymentHandler
	constructor() {}

		async marathonCheck(currentMarathon, ctx) {
		try {
			if (currentMarathon) {
				if (currentMarathon.enabled) {
					return true
				} else {
					await ctx.telegram.sendMessage(ctx.chat.id, 'Произошла ошибка, марафон не активен')
					return false
				}
			}
		} catch (e) {
			await ctx.telegram.sendMessage(ctx.chat.id, 'Произошла ошибка, марафон не активен')
			return false
		}
	}

	async getMarathonById(id) {
		const { data } =await axios.get(`${marathonModules.MARATHON_FIND_ONE}/${id}`, { headers: {"Authorization" : `${this.token}`} });
		return data
	}

	async _getAllMarathons() {
		const { data } =await axios.get(marathonModules.MARATHON_FIND_ALL, { headers: {"Authorization" : `${this.token}`} });
		return data
	}
	//
	// async getInvoce({ctx, currentMarathon}) {
	// 		return this.paymentHandler.sendMarathonInvoice({ctx, product: currentMarathon});
	// }

	async getCurrentMarathon() {
		const marathons = await this._getAllMarathons();
		const currentMarathon = marathons.filter(marathon => marathon.enabled)[0];
		if (currentMarathon) {
			const marathonMessage = {
				name: currentMarathon.name,
				description:currentMarathon.description,
				withPhoto: false,
				isEmpty: false,
				id: currentMarathon.id,
				price: currentMarathon.price,
			}
			if (currentMarathon.photo) {
				return {...marathonMessage, photo: currentMarathon.photo.url, withPhoto: true}
			}
			return marathonMessage
		} else {
			return {
				description: "Нет активных марафонов",
				isEmpty: true,
			}
		}
	}

	async getPaymentLink(ctx, currentMarathon, user) {
		try {
			await ctx.telegram.sendMessage(ctx.from.id, 'Загрузка, пожалуйста подождите');
			const marathonById = await marathonClass.getMarathonById(currentMarathon);
			const {marathonURL} = await readFile('Constants/successURL.json')
			const {productPay} = await readFile('Constants/modules.json')
			const payload = {
				sum: marathonById.price,
				successURL: marathonURL,
				targets: marathonById.name,
				comment: `Оплата марафона ${marathonById.name}`,
				userID: user._id,
				productID: marathonById._id,
				type: 'marathon'
			}
			const isMarathonEnabled = await marathonClass.marathonCheck(marathonById, ctx)
			if (!isMarathonEnabled) {
				return
			}

		const { data } = await PaymentHandler.createPaymentLink(payload)
		const text = 'Отлично, нажмите кнопку "Оплатить"'
		return ctx.telegram.sendMessage(ctx.from.id, text, {
				reply_markup: {
					inline_keyboard: [[
						{
							text: `Оплатить ${data.sum} ₽`,
							url: `${productPay}${data.token}`,
						}
					]]
				}
			})
		} catch (e) {
			console.log(e)
			return ctx.telegram.sendMessage(ctx.from.id, 'Что-то пошло не так, попробуйте позже!')
		}
	}

	async init({jwtToken}) {
		this.token = jwtToken;
	}

})()

module.exports = marathonClass;
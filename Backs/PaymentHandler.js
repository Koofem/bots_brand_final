const axios = require('Backs/AxiosHandler');
const rabbit =  require('amqplib/callback_api');

const md5 = require('md5');
const PaymentBD = require("Models/PaymentBD");
const UsersBD = require("Models/UsersBD");
const readFile = require("Helpers/ReadFile.js");
const PaymentHandlerClass = new (class PaymentHandler {
	init() {
		rabbit.connect('amqp://localhost', (connError, connection) => {
			if (connError) {
				throw connError
			}

			connection.createChannel((channelError, channel) => {
				if (channelError) {
					throw channelError
				}

				const PaymentQUEUE = 'receivingPayments';
				const deletePaymentQUEUE = 'deletePayment';
				channel.assertQueue(PaymentQUEUE, {
					durable: false
				})
				channel.assertQueue(deletePaymentQUEUE, {
					durable: false
				});
				channel.consume(deletePaymentQUEUE, PaymentHandlerClass.paymentDeleting, {
					noAck: true
				})
				channel.consume(PaymentQUEUE, PaymentHandlerClass.paymentProcessing, {
					noAck: true
				})
			})
		})
	}

	paymentProcessing(msg) {
		const payment = JSON.parse(msg.content.toString());
		if (payment.type === 'marathon') {
			return PaymentHandlerClass.marathonPaymentProcessing(payment.id)
		} else if (payment.type === 'masterClass'){
		return PaymentHandlerClass.masterClassPaymentProcessing(payment.id)
		}
	}

	async masterClassPaymentProcessing(paymentID) {
		const payment = await PaymentBD.findPayment(paymentID);
		const user = await UsersBD.findUser(Number(payment.userID));
		const messageID = payment.messageID;
		const message = `Оплата за мастер класс ${payment.targets} прошла! Скоро наш менеджер с Вами свяжется.`
		// Добавить отправку в чат
		await masterClassBot.telegram.editMessageText(user.id , messageID, undefined, message);
		return PaymentHandlerClass.sendMessageToChannel(payment, user, 'masterClass');
	}

	async sendMessageToChannel(payment, user, type = '') {
		const { channelID } = await readFile('config/telegram_bots.json');
		const message = `Произошла новая оплата:\nПродукт:\nНазвание: <b><i>${payment.targets}</i></b>\nЦена: <b><i>${payment.sum}₽</i></b>\n\nКлиент:\nИмя: <b><i>${user.first_name || ''}</i></b>\nФамилия: <b><i>${user.last_name || ''}</i></b>\nОтчество: <b><i>${user.patronymic || ''}</i></b>\nТелефон: <b><i>${user.phone || ''}</i></b>\nEmail: <b><i>${user.email || ""}</i></b>\nInstagram: <b><i>${user.instagram || ''}</i></b>`
		if (type === 'masterClass') {
			return masterClassBot.telegram.sendMessage(channelID, message, {
				parse_mode: 'HTML'
			})
		} else if (type === 'marathon') {
			return marathonBot.telegram.sendMessage(channelID, message, {
				parse_mode: 'HTML'
			})
		}

	}

	async masterClassPaymentDelete(paymentID) {
		const payment = await PaymentBD.findPayment(paymentID)
		const user = await UsersBD.findUser(Number(payment.userID));
		const messageID = payment.messageID;
		const message = `Мы отменили транзакцию за ${payment.targets}, если у Вас есть вопросы - напишите нашему менеджеру`
		await PaymentBD.deletePayment(paymentID)
		return masterClassBot.telegram.editMessageText(user.id , messageID, undefined, message);
	}

	async paymentDeleting(msg) {
		const payment = JSON.parse(msg.content.toString());
		if (payment.type === 'marathon') {
			return PaymentHandlerClass.marathonPaymentDelete(payment.id)
		} else if (payment.type === 'masterClass') {
			return PaymentHandlerClass.masterClassPaymentDelete(payment.id)
		}
	}

	async marathonPaymentDelete(paymentID) {
		const payment = await PaymentBD.findPayment(paymentID)
		const user = await UsersBD.findUser(Number(payment.userID));
		const messageID = payment.messageID;
		const message =` Мы отменили транзакцию за ${payment.targets}, если у Вас есть вопросы - напишите нашему менеджеру`
		await PaymentBD.deletePayment(paymentID)
		return marathonBot.telegram.editMessageText(user.id , messageID, undefined, message);
	}

	async marathonPaymentProcessing(paymentID) {
		const payment = await PaymentBD.findPayment(paymentID);
		const user = await UsersBD.findUser(Number(payment.userID));
		const messageID = payment.messageID;
		const message = `Оплата за марафон ${payment.targets} прошла! Скоро наш менеджер с Вами свяжется.`
		await marathonBot.telegram.editMessageText(user.id , messageID, undefined, message);
		return PaymentHandlerClass.sendMessageToChannel(payment, user, 'marathon');
	}

	createPaymentLink = async function({sum,successURL,targets,comment, userID, productID, type}) {
		try {
			const link = await readFile('Constants/modules.json')
			const label = md5(`${userID} + ${productID}`);
			const data = {
				sum: sum,
				successURL: successURL,
				targets: targets,
				comment: comment,
				userID: userID,
				productID: productID,
				label: label,
				type: type
			}
			return await axios.post(link.createPayment, data)
		} catch (e) {
			throw e
		}
	}
})()


module.exports = PaymentHandlerClass

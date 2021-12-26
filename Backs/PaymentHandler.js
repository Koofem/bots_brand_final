const axios = require('Backs/AxiosHandler');
const rabbit =  require('amqplib/callback_api');
const {marathonPaymentProcessing} = require('Class/Marathon/Marathon');

const md5 = require('md5');
const PaymentBD = require("Models/PaymentBD");
const UsersBD = require("Models/UsersBD");
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

				const QUEUE = 'receivingPayments';
				channel.assertQueue(QUEUE, {
					durable: false
				})
				channel.consume(QUEUE, PaymentHandlerClass.paymentProcessing, {
					noAck: true
				})
			})
		})
	}

	paymentProcessing(msg) {
		const payment = JSON.parse(msg.content.toString());
		console.log(payment)
		if (payment.type === 'marathon') {
			return PaymentHandlerClass.marathonPaymentProcessing(payment.id)
		}
	}

	async marathonPaymentProcessing(paymentID) {
		const payment = await PaymentBD.findPayment(paymentID);
		console.log('payment', payment);
		const user = await UsersBD.findUser(Number(payment.userID));
		console.log('user', user);
		const messageID = payment.messageID;
		const message = 'Оплата прошла! Скоро наш менеджер с Вами свяжется.'
		return marathonBot.telegram.editMessageText(user.id , messageID, undefined, message);
	}

	createPaymentLink = async function({sum,successURL,targets,comment, userID, productID, type}) {
		console.log(userID, productID)
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

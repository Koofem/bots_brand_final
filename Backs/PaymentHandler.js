const axios = require('Backs/AxiosHandler');
const md5 = require('md5');
const PaymentHandlerClass = new (class PaymentHandler {
	createPaymentLink = async function({sum,successURL,targets,comment, userID, productID}) {
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
				label: label
			}
			return await axios.post(link.createPayment, data)
		} catch (e) {
			throw e
		}
	}
})()


module.exports = PaymentHandlerClass

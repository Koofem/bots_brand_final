const mongodb = require('Models/MongoBD');
class PaymentBD {
	paymentBD

	constructor() {
	}

	async init() {
		this.paymentBD = mongodb.db.collection('mel-payment');
		console.log('Оплата найдена')
	}

	async findPayment(id) {
		return await this.paymentBD.findOne({
			_id: id
		})
	}

	async deletePayment(id) {
		return await this.paymentBD.deleteOne({
			_id: id
		})
	}

	async updatePayment(id, messageID) {
		return await this.paymentBD.findOneAndUpdate({_id: id}, {
			$set: {
				messageID: messageID,
			},
		}, {upsert: true});
	}
}

const paymentBD = new PaymentBD();
module.exports = paymentBD;

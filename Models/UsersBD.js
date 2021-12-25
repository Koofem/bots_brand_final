const mongodb = require('Models/MongoBD');
class UserBD {
	userBD
	constructor() {
	}

	async init() {
		this.userBD = mongodb.db.collection('users');
		console.log('Пользователи найдены')
	}

	async findUser(id) {
		return await this.userBD.findOne({id: id});
	}

	async saveOrUpdateUser(user) {
			return await this.userBD.findOneAndUpdate({id: user.id}, {
				$set: {
					first_name_telegram: user.first_name,
					telegram_username: user.username,
					telegram_last_name: user.last_name? user.last_name : '',
					telegram_id: user.id,

				},
			}, {upsert: true});
		}

		async setActionToUser(user, action, messageID) {
			return await this.userBD.findOneAndUpdate({id: user.id}, {
				$set: {
					action: action,
					actionMessageID: messageID,
				},
			}, {upsert: true});
		}

		async resetUserAction(user) {
		return await this.userBD.findOneAndUpdate({id: user.id}, {
			$unset: {
				action: 1,
				actionMessageID: 1,
			}
		}, {upsert: true})
		}

		async getUserAction(user) {
			const userBD = await this.findUser(user.id)
			return {action: userBD.action, actionMessageID: userBD.actionMessageID}
		}

		async updateUser(user, key, value) {
			return await this.userBD.findOneAndUpdate({id: user.id}, {
				$set: {
					[key]: value
				}

				}, {upsert: true})
		}
}

const userBD = new UserBD();
module.exports = userBD;

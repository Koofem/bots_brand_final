require('dotenv')
const { MongoClient } = require('mongodb');
const readFile = require('Helpers/ReadFile.js')
const Mongodb = new (class Mongodb {
	mongodbConfig
	uri
	client
	db = '';
	constructor() {
	}

	async init() {
		this.mongodbConfig = await readFile('config/mongoBD.json');
		try {
			this.uri = `mongodb://AdminRoot:${this.mongodbConfig.MONGO_DB_PASS}@45.132.17.98:27017`;
			this.client = new MongoClient(this.uri, { useNewUrlParser: true, useUnifiedTopology: true });

			await this.client.connect();
			this.db = await this.client.db(this.mongodbConfig.MONGO_DB_BASE);
			console.log('Все заебись, база подключена')
		} catch (e) {
			console.log(e)
		}
	}
})();
module.exports =  Mongodb



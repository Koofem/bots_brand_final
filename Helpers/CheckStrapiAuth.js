const axios = require('axios');
const fs = require("fs");
require('dotenv')
const readFile = require('Helpers/ReadFile.js')
module.exports = async () => {
	const strapiConfig = await readFile('config/strapi.json')
	return new Promise(async (resolve) => {
			const { data } = await axios.post('https://admin.braidsandhairmedia.ru/auth/local', {
					identifier: strapiConfig.identifier,
					password: strapiConfig.password
			})
			process.env.STRAPI_JWT_TOKEN = `Bearer ${data.jwt}`
			return resolve();
	})

}

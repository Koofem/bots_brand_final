require('dotenv').config()

const MongoBD = require("Models/MongoBD");
const UserBD = require("Models/UsersBD");
const PaymentBD = require("Models/PaymentBD")
// Модули авторизации и сбора данных
const AuthHandler = require('Backs/AuthHandler');
const MarathonBot = require('Class/Marathon/index')
const MasterClassBot = require('Class/MasterClass/index')
const PaymentHandler = require("Backs/PaymentHandler")


//Модули бота мастер классов

// Хелперсы
const keyboardsExpander = require('Helpers/KeyBoardExpander.js');
const checkAuth = require('Helpers/CheckStrapiAuth');
const readFile = require('Helpers/ReadFile.js');

global.readFile = readFile;

const App = new (class App {
	async init() {
		await MongoBD.init();
		await UserBD.init();
		await PaymentBD.init();
		await AuthHandler.init()
		await keyboardsExpander.init(AuthHandler);
		checkAuth().then(async ()=> {
			const bots_token = await readFile('config/telegram_bots.json');

			await MasterClassBot.init({
				jwtToken: process.env.STRAPI_JWT_TOKEN,
				telegramBotToken: bots_token.masterClassBotModule,
				authHandler: AuthHandler,
				keyBoardExpander: keyboardsExpander.expand,
				authActions: AuthHandler.actions,
			})

			await MarathonBot.init({
				jwtToken: process.env.STRAPI_JWT_TOKEN,
				telegramBotToken: bots_token.marathonBotModule,
				authHandler: AuthHandler,
				keyBoardExpander: keyboardsExpander.expand,
				authActions: AuthHandler.actions,
			})

			PaymentHandler.init();

		})
	}
})();


App.init();


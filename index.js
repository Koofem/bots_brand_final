require('dotenv').config()

const MongoBD = require("Models/MongoBD");
const UserBD = require("Models/UsersBD");
const PaymentBD = require("Models/PaymentBD")
// Модули авторизации и сбора данных
// const MelAuth = require('AuthModule/index.js');
const AuthHandler = require('Backs/AuthHandler');
const MarathonBot = require('Class/Marathon/index')
const PaymentHandler = require("Backs/PaymentHandler")

// // Модули бота марафонов
// const MarathonController = require('MarathonBotModule/Controllers/AcceptMarathon.js')
// const MarathonBotModule = require('MarathonBotModule/index.js');


//Модули бота мастер классов
// const MasterClassBotModule = require('MasterClassBotModule/index.js')
// Хелперсы
const keyboardsExpander = require('Helpers/KeyBoardExpander.js');
const checkAuth = require('Helpers/CheckStrapiAuth');
const readFile = require('Helpers/ReadFile.js');

global.readFile = readFile;

const App = new (class App {
	constructor() {}
	async init() {
		await MongoBD.init();
		await UserBD.init();
		await PaymentBD.init();
		await AuthHandler.init()
		await keyboardsExpander.init(AuthHandler);
		checkAuth().then(async ()=> {
			// await MelAuth.init(MarathonController);
			const bots_token = await readFile('config/telegram_bots.json');
			// const provider_token = await readFile('config/payment.json');
			// await PaymentHandler.init(provider_token.marathonBot);

			// await MasterClassBotModule.init({
			// 	jwtToken: process.env.STRAPI_JWT_TOKEN,
			// 	telegramBotToken: bots_token.masterClassBotModule,
			// 	authHandler: AuthHandler,
			// 	keyBoardExpander: keyboardsExpander,
			// 	authActions: AuthActions,
			// 	// paymentHandler: PaymentHandler,
			// 	// paymentActions: PaymentActions
			// })


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


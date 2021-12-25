const messageHandler = require('Backs/MarathonMessageHandler')
const keyboardsCommands = [
			{
				trigger: 'Текущий марафон',
				action: messageHandler.sendMarathonMessage,
				name: 'GET_MARATHONS'
			}
]
module.exports = keyboardsCommands;

const messageHandler = require("Backs/MasterClassMessageHandler");
const keyboardsCommands = [
{
	trigger: 'Получить список актуальных мастер классов',
	action: messageHandler.restartAndStartCommandHandler,
	name: 'GET_MASTER_CLASSES'
}
	]
module.exports = keyboardsCommands;

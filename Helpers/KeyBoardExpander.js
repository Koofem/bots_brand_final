const KeyExpanderClass = new (class KeyExpander {
	AuthHandlerClass

	 init = async function (AuthHandler) {
		 this.AuthHandlerClass = AuthHandler
	}

	expand = function(extensionArray) {
		extensionArray.push({
			trigger: 'Личные данные',
			action: KeyExpanderClass.AuthHandlerClass.getUserInfo,
			name: 'GET_PERSONAL_DATA'
		});
		return extensionArray
}
})()

module.exports = KeyExpanderClass

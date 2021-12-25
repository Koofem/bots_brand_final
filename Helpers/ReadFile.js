const fs = require('fs');
module.exports = async (path) => {
	return new Promise((resolve) => {
		fs.readFile(path, (err, data) => {
			if (err) throw err;
			resolve(JSON.parse(data));
		});
	})

}

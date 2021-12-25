const axios = require('axios');

// Add a request interceptor
axios.interceptors.request.use(function (config) {
	// Do something before request is sent
	// console.log(config);
	return config;
}, function (error) {
	// Do something with request error
	return Promise.reject(error);
});

// Add a response interceptor
axios.interceptors.response.use(function (response) {

	// console.log(response.status)
	// console.log(response)
	// Do something with response data
	return response;
}, function (error) {
	if (error.response.status === 401) {
		 return  updateToken().then((token) => {
				error.config.headers['Authorization'] = `Bearer ${token}`
				error.config.baseURL = undefined;
				return axios.request(error.config);
			})
	}
	// Do something with response error
	return Promise.reject(error);
});

const updateToken = async function () {
	const link = await readFile('Constants/modules.json');
	const data = await axios.post(link.createSessions, {},{
		headers: {
			token: process.env.AUTH_TOKEN
		}
	})

	return data.headers.auth_token
}

module.exports = axios

module.exports = (kxapi) => {
	return {
		"getToken": (pluginName) => {
			return new Promise((resolve, reject) => {
				kxapi.getToken(pluginName, (error, token) => {
					if (error) reject(`getToken error: ${error}`);
					resolve(token);
				});
			});
		},

		"env": (varName) => {
			return new Promise((resolve, reject) => {
				kxapi.env(varName, (error, varObj) => {
					if (error) reject(`env error: ${error}`);
					resolve(varObj);
				});
			});
		},

		"verify": (filePath, opt) => {
			return new Promise((resolve, reject) => {
				kxapi.verify(filePath, opt, (error, verified) => {
					if (error) reject(`verify error: ${error}`);
					resolve(verified);
				});
			});
		},

		"getUsers": (usersList) => {
			return new Promise((resolve, reject) => {
				kxapi.getUsers(usersList, (error, data) => {
					if (error) reject(`getUsers error: ${error}`);
					resolve(data);
				});
			});
		},

		"getMine": () => {
			return new Promise((resolve, reject) => {
				kxapi.getMine((error, profile) => {
					if (error) reject(`getMine error: ${error}`);
					resolve(profile);
				});
			});
		},

		"searchTopics": (topics, negTopics, maxToUpload, searchContentType) => {
			return new Promise((resolve, reject) => {
				kxapi.search("", topics, negTopics, null, maxToUpload, searchContentType.theObject, function(error, topicsReturned){
					if (error) reject(`search error: ${error}`);
					resolve(topicsReturned);
				});
			});
		},

		"getAuthorFromTopic": (topic) => {
			return new Promise((resolve, reject) => {
				kxapi.getAuthor(topic.idx, (error, author) => {
					if (error) reject(`getAuthorFromTopicIdx error: ${error}`);
					resolve(author);
				});
			});
		},

		"getSharedFromTopic": (topic) => {
			return new Promise((resolve, reject) => {
				kxapi.getShared(topic.idx, (error, sharedList) => {
					if (error) reject(`getSharedFromTopicIdx error: ${error}`);
					resolve(sharedList);
				});
			});
		},

		"getUsersFromList": (sharedList) => {
			return new Promise((resolve, reject) => {
				if (!sharedList || !sharedList.shared || sharedList.shared.length < 1) resolve(null);
				kxapi.getUsers(sharedList.shared, (error, users) => {
					if (error) reject(`getUsersFromList error: ${error}`);
					resolve(users);
				});
			});
		},
	};
};

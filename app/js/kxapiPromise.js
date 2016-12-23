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

		"getLocations": (topicsIdx) => {
			return new Promise((resolve, reject) => {
				kxapi.getLocations(topicsIdx, (error, loc) => {
					if (error) reject(`getLocations error: ${error}`);
					resolve(loc);
				});
			});
		},

		"searchTopics": (topicsidx, negTopics, maxToUpload, searchContentType) => {
			return new Promise((resolve, reject) => {
				kxapi.search("", topicsidx, negTopics, null, maxToUpload,
						searchContentType.theObject, (error, topicsReturned) => {
					if (error) reject(`search error: ${error}`);
					resolve(topicsReturned);
				});
			});
		},

		"keeex": (filePath, refs, prevs, description, option) => {
			return new Promise((resolve, reject) => {
				kxapi.keeex(filePath, refs, prevs, description, option, (error, keeexedfile) => {
					if (error) reject(`keeexing file error: ${error}`);
					resolve(keeexedfile);
				});
			});
		},

		"generateFile": (name, description, target) => {
			return new Promise((resolve, reject) => {
				kxapi.generateFile(name, description, target, (error, filePath) => {
					if (error) reject(`generateFile error: ${error}`);
					resolve(filePath);
				});
			});
		},

		"share": (idx, path, recipients, option) => {
			return new Promise((resolve, reject) => {
				kxapi.share(idx, path, recipients, option, (error, sharedFile) => {
					if (error) reject(`share error: ${error}`);
					resolve(sharedFile);
				});
			});
		},

		"getRefs": (idx) => {
			return new Promise((resolve, reject) => {
				kxapi.getRefs(idx, (error, refs) => {
					if (error) reject(`getRefs error: ${error}`);
					resolve(refs);
				});
			});
		},

		"makeRef": (type, from, to) => {
			return new Promise((resolve, reject) => {
				kxapi.makeRef(type, from, to, (error) => {
					if (error) reject(`makeRef error: ${error}`);
					resolve();
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

		"getLocationsFromTopic": (topic) => {
			return new Promise((resolve, reject) => {
				kxapi.getLocations(topic.idx, (error, sharedList) => {
					if (error) reject(`getSharedFromTopicIdx error: ${error}`);
					resolve(sharedList);
				});
			});
		},
	};
};

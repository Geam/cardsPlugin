/*
Copyright (c) 2016 KeeeX SAS 

This is an open source project available under the MIT license.
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

*/
var request = require("request");

var port = 8288;
var host = "http://localhost:" + port;
var apiBase = host + "/kx/api";
var uri = {
	hello: apiBase + "/hello",
	token: apiBase + "/token",
	topic: apiBase + "/topic",
	user: apiBase + "/user",
	util: apiBase + "/util",
	plugin: apiBase + "/plugin"
};
var token = null;
var idx = "xoram-hunoc-huviv-levuv-nepul-vemeb-cyper-fonev-kumar-vuner-muven-rezyh-cycik-rusig-kugys-zyfem-dixix";

function handleResponse(error, response, body, callback) {
	if (error || response.statusCode !== 200)
		callback(error || new Error(response.statusCode + " " + body));
	else
  		callback(null, body);
}

/**
 * Get the IDX of the plugin file
 *
 * @return {string} the idx of the plugin file
 */
function getPluginIDX(){
	return idx
}

/**
 * Set the authorisation token to the given value for future API request.
 * Usualy you won't have to set it by yourself as getToken will store it.
 *
 * @param {string} _token - The API token
 */
function setToken(_token) {
	token = _token;
}

/** 
 * Function you'll have to implement when using getToken
 *
 * @callback hello_callback
 * @param {Array} error - Any error that could have happened (deny), null if none
 * @param {Object} response - The API response if everything is okay
 */

/**
 * This is not working
 *
 * @param {hello_callback} callback - The callback that handles the response.
 */
function hello(callback) {
	request(uri.hello, function (error, response, body) {
	  handleResponse(error, response, body, callback);
	});
}


/** 
 * Function you'll have to implement when using getToken
 *
 * @callback getToken_callback
 * @param {Array} error - Any error that could have happened (deny), null if none
 * @param {Object} response - The API response if everything is okay
 * @param {String} response.token - The token to access the local API
 */

/**
 * Ask an authentification token for the local API. It will be prompted to the user
 * if he wants to allow or deny the access
 * On success, it will automatically store the token for later use. No need to use setToken() afterward
 *
 * @param {string} appName - The application name
 * @param {getToken_callback} callback - The callback that handles the response.
 */
function getToken(appName, callback) {
	var self = this;
	request({
	  method: 'GET',
	  uri: uri.token,
	  json: {
	  	appName: appName
	  }
	},
	function (error, response, body) {
		if (!error && body && body.token) {
			token = body.token;
		}
		handleResponse(error, response, body, callback);
	});
}


/**
 * Function you'll have to implement when using keeex
 *
 * @callback keeex_callback
 * @param {Array} error - Any error that could have happened, null if none
 * @param {Object} response - The API response if everything is okay
 * @param {String} response.path - The keeexed file path
 * @param {keeex_topic} response.topic - All informations about the topic created
 */

/**
 * Keeex the given file with the parameters
 *
 * @param {String} path - Path of the file to keeex
 * @param {String[]} refs - Array of references (idx) for the document
 * @param {String[]} prevs - Array of idx of previous versions of the file
 * @param {String} description - The file description
 * @param {Object} option - Options for the operation
 * @param {String} option.targetFolder - Where the keeexed file will be stored. - Can be null and keeex will use the default folder
 * @param {boolean} option.timestamp - Put local creation time & ask for the topic to be timestamped on the bitcoin blockchain
 * @param {boolean} option.pattern - Put output filename pattern into metadata or not
 * @param {boolean} option.bitcoin - Put bitcoin signature into metadata or not
 * @param {keeex_callback} callback - The callback that handles the response.
 */
function keeex(path, refs, prevs, description, option, callback) {
	var opt = option || {};
	request({
	  method: 'POST',
	  uri: uri.topic + "/keeex",
	  json: {
	  	path: path,
	  	refs: refs,
	  	prevs: prevs,
			name: opt.name,
	  	description: description,
	  	option: opt
	  },
	  headers: {
			'Authorization': token
	  }
	},
	function (error, response, body) {
		handleResponse(error, response, body, callback);
	});
}

/**
 * Function you'll have to implement when using verify
 *
 * @callback verify_callback
 * @param {Array} error - Any error that could have happened, null if none
 * @param {Object} response - The API response if everything is okay
 * @param {Integer} response.verifiedStatus - 100 Keeexed / 101 Not keeexed / 102 keeexed but the file was modified
 * @param {string} response.idx - idx of the file
 */

/**
 * Verify the file in keeex
 *
 * @param {string} path - Absolute path of the file to be verified
 * @param {verify_callback} callback - The callback that handles the response.
 */
function verify(path, opt, callback) {
	request({
	  method: 'POST',
	  uri: uri.topic + "/verify",
	  json: {
	  	path: path,
			option: opt
	  },
	  headers: {
			'Authorization': token
	  }
	},
	function (error, response, body) {
		handleResponse(error, response, body, callback);
	});
}


/**
 * Function you'll have to implement when using getTopics
 *
 * @callback getTopics_callback
 * @param {Array} error - Any error that could have happened, null if none
 * @param {keeex_topic[]} response - List of topic info for the idxs given
 */

/**
 * Get the informations about the given idxs
 *
 * @param {string[]} idx - Array of idx to fetch informations
 * @param {getTopics_callback} callback - The callback that handles the response.
 */
function getTopics(idxs, callback) {
	request({
	  method: 'GET',
	  uri: uri.topic,
	  json: {
	  	idxs: idxs
	  },
	  headers: {
			'Authorization': token
	  }
	},
	function (error, response, body) {
		handleResponse(error, response, body, callback);
	});
}


/**
 * Function you'll have to implement when using getLocations
 *
 * @callback getLocations_callback
 * @param {Array} error - Any error that could have happened, null if none
 * @param {Array} response - The list of locations asked
 * @param {String} response.idx - The topic idx
 * @param {String[]} response.location - List of known locations by keeex
 */

/**
 * Get all file locations keeex knows about the given idxs
 *
 * @param {string[]} idx - Array of idx to fetch the location 
 * @param {getLocations_callback} callback - The callback that handles the response.
 */
function getLocations(idxs, callback) {
	request({
	  method: 'GET',
	  uri: uri.topic + "/locations",
	  json: {
	  	idxs: idxs
	  },
	  headers: {
			'Authorization': token
	  }
	},
	function (error, response, body) {
		handleResponse(error, response, body, callback);
	});
}


/**
 * Function you'll have to implement when using getAuthor
 *
 * @callback getAuthor_callback
 * @param {Array} error - Any error that could have happened, null if none
 * @param {keeex_user} response - The author of the document
 */

/**
 * Get the author of the given topic
 *
 * @param {string} idx - The topic idx
 * @param {getAuthor_callback} callback - The callback that handles the response.
 */
function getAuthor(idx, callback) {
	request({
	  method: 'GET',
	  uri: uri.topic + "/" + idx + "/author",
	  json: true,
	  headers: {
			'Authorization': token
	  }
	}, function (error, response, body) {
	  handleResponse(error, response, body, callback);
	});
}


/**
 * Function you'll have to implement when using getComments
 *
 * @callback getComments_callback
 * @param {Array} error - Any error that could have happened, null if none
 * @param {keeex_comment[]} response - Comment list of the topic
 */

/**
 * Get the list of comments on a given topic
 *
 * @param {string} idx - The topic idx
 * @param {getComments_callback} callback - The callback that handles the response.
 */
function getComments(idx, callback) {
	request({
		method: 'GET',
		uri: uri.topic + "/" + idx + "/comments",
		json: true,
	  headers: {
			'Authorization': token
	  }
	}, function (error, response, body) {
	  handleResponse(error, response, body, callback);
	});
}


/**
 * Function you'll have to implement when using comment
 *
 * @callback comment_callback
 * @param {Array} error - Any error that could have happened, null if none
 * @param {keeex_comment[]} response - Comment list of the topic
 */

/**
 * Post a comment on the given topic
 *
 * @param {string} idx - The topic idx
 * @param {string} message - The comment message
 * @param {comment_callback} callback - The callback that handles the response.
 */
function comment(idx, message, callback) {
	request({
		method: 'POST',
		uri: uri.topic + "/" + idx + "/comment",
		json: {
			message: message
		},
	  headers: {
			'Authorization': token
	  }
	}, function (error, response, body) {
	  handleResponse(error, response, body, callback);
	});
}


/**
 * Function you'll have to implement when using getPrevs
 *
 * @callback getPrevs_callback
 * @param {Array} error - Any error that could have happened, null if none
 * @param {keeex_topic[]} response - List of previous versions
 */

/**
 * Get a list of the previous version(s) of a given topic
 *
 * @param {string} idx - The topic idx
 * @param {getPrevs_callback} callback - The callback that handles the response.
 */
function getPrevs(idx, callback) {
	request({
		method: 'GET',
		uri: uri.topic + "/" + idx + "/prevs",
		json: true,
	  headers: {
			'Authorization': token
	  }
	}, function (error, response, body) {
	  handleResponse(error, response, body, callback);
	});
}


/**
 * Function you'll have to implement when using getNext
 * @callback getNexts_callback
 * @param {Array} error - Any error that could have happened, null if none
 * @param {keeex_topic[]} response - List of next versions
 */

/**
 * Get a list of the next version(s) of a given topic
 *
 * @param {string} idx - The topic idx
 * @param {getNexts_callback} callback - The callback that handles the response.
 */
function getNexts(idx, callback) {
	request({
		method: 'GET',
		uri: uri.topic + "/" + idx + "/nexts",
		json: true,
	  headers: {
			'Authorization': token
	  }
	}, function (error, response, body) {
	  handleResponse(error, response, body, callback);
	});
}


/**
 * Function you'll have to implement when using getRefs
 *
 * @callback getRefs_callback
 * @param {Array} error - Any error that could have happened, null if none
 * @param {keeex_topic[]} response - List of topic
 */

/**
 * Get a list of the all topics refering to the given one (including comments and previous versions)
 *
 * @param {string} idx - The topic idx
 * @param {getRefs_callback} callback - The callback that handles the response.
 */
function getRefs(idx, callback) {
	request({
		method: 'GET',
		uri: uri.topic + "/" + idx + "/refs",
		json: true,
	  headers: {
			'Authorization': token
	  }
	}, function (error, response, body) {
	  handleResponse(error, response, body, callback);
	});
}


/**
 * Function you'll have to implement when using getShared
 *
 * @callback getShared_callback
 * @param {Array} error - Any error that could have happened, null if none
 * @param {Object} response - The API response if everything is okay
 * @param {String[]} response.received - List of profile idx who reveived
 * @param {String[]} response.shared - List of profile idx who are shared
 */

/**
 * Get a list of people that partici
 *
 * @param {string} idx - The topic idx
 * @param {getShared_callback} callback - The callback that handles the response.
 */
function getShared(idx, callback) {
	request({
		method: 'GET',
		uri: uri.topic + "/" + idx + "/shared",
		json: true,
	  headers: {
			'Authorization': token
	  }
	}, function (error, response, body) {
	  handleResponse(error, response, body, callback);
	});
}


/**
 * Function you'll have to implement when using getAgreements
 *
 * @callback getAgreements_callback
 * @param {Array} error - Any error that could have happened, null if none
 * @param {keeex_user[]} response - List of users who agreed
 */

/**
 * Get a list of the all topics refering to the given one
 *
 * @param {string} idx - The topic idx
 * @param {getAgreements_callback} callback - The callback that handles the response.
 */
function getAgreements(idx, callback) {
	request({
		method: 'GET',
		uri: uri.topic + "/" + idx + "/agreements",
		json: true,
	  headers: {
			'Authorization': token
	  }
	}, function (error, response, body) {
	  handleResponse(error, response, body, callback);
	});
}


/**
 * Function you'll have to implement when using getShared
 *
 * @callback getShared_callback
 * @param {Array} error - Any error that could have happened, null if none
 * @param {Object} response - The API response if everything is okay
 * @param {String} response.idx - Topic idx
 * @param {Object} response.shared 
 * @param {String[]} response.shared.shared - People who are shared
 * @param {String[]} response.shared.received - People who received
 * @param {String} response.link - Url to download the ciphred file 
 */

/**
 * Share a topic 
 *
 * @param {string} idx - The topic idx
 * @param {string} path - Path of the file of the topic
 * @param {string[]} recipients - List of recipients idx
 * @param {Object} options - Sharing options
 * @param {String} options.email - Whether to send an email to the recipient or not
 * @param {getShared_callback} callback - The callback that handles the response.
 */
function share(idx, path, recipients, option, callback) {
	request({
	  method: 'POST',
	  uri: uri.topic + "/" + idx + "/share",
	  json: {
	  	path: path,
	  	recipients: recipients,
	  	option: option
	  },
	  headers: {
			'Authorization': token
	  }
	},
	function (error, response, body) {
		handleResponse(error, response, body, callback);
	});
}



/**
 * Function you'll have to implement when using makeRef
 *
 * @callback makeRef_callback
 * @param {Array} error - Any error that could have happened, null if none
 */

/**
 * Make a reference 
 *
 * @param {string} type - The reference type ("reference", "version" or "agreement")
 * @param {string} from - The topic idx when type is "reference" or "version", null when "agreement"
 * @param {string} to - The topic idx
 * @param {makeRef_callback} callback - The callback that handles the response.
 */
function makeRef(type, from, to, callback) {
	request({
	  method: 'POST',
	  uri: uri.topic + "/makeRef",
	  json: {
	  	type: type,
	  	from: from,
	  	to: to
	  },
	  headers: {
			'Authorization': token
	  }
	},
	function (error, response, body) {
		handleResponse(error, response, body, callback);
	});
}

/**
 * Function you'll have to implement when using remove
 *
 * @callback remove_callback
 * @param {Array} error - Any error that could have happened, null if none
 */

/**
 * Remove a topic from database
 *
 * @param {string} idx - The topic idx to remove
 * @param {remove_callback} callback - The callback that handles the response.
 */
function remove(idx, callback) {
	request({
	  method: 'POST',
	  uri: uri.topic + "/" + idx + "/remove",
	  json: true,
	  headers: {
			'Authorization': token
	  }
	},
	function (error, response, body) {
		handleResponse(error, response, body, callback);
	});
}

/**
 * Function you'll have to implement when using getMine
 *
 * @callback getMine_callback
 * @param {Array} error - Any error that could have happened, null if none
 * @param {keeex_user} response - The user's info
 */

/**
 * Get current user informations
 *
 * @param {getMine_callback} callback - The callback that handles the response.
 */
function getMine(callback) {
	request({
	  method: 'GET',
	  uri: uri.user + "/me",
	  json: true,
	  headers: {
			'Authorization': token
	  }
	},
	function (error, response, body) {
		handleResponse(error, response, body, callback);
	});
}

/**
 * Function you'll have to implement when using getUsers
 *
 * @callback getUsers_callback
 * @param {Array} error - Any error that could have happened, null if none
 * @param {keeex_user[]} response - Users' info
 */

/**
 * Get users information list of profile idxs
 *
 * @param {string[]} idx - List of idx
 * @param {getUsers_callback} callback - The callback that handles the response.
 */
function getUsers(idxs, callback) {
	request({
	  method: 'GET',
	  uri: uri.user,
	  json: {
	  	idxs: idxs
	  },
	  headers: {
			'Authorization': token
	  }
	},
	function (error, response, body) {
		handleResponse(error, response, body, callback);
	});
}

/**
 * Function you'll have to implement when using getUserByEmail
 *
 * @callback getUserByEmail_callback
 * @param {Array} error - Any error that could have happened, null if none
 * @param {keeex_user} response - User's info
 */

/**
 * Get users info froma list of profile idxs
 *
 * @param {string} email - The email of an user
 * @param {getUserByEmail_callback} callback - The callback that handles the response.
 */
function getUserByEmail(email, callback) {
	request({
	  method: 'GET',
	  uri: uri.user + "/email/" + email,
	  json: true,
	  headers: {
			'Authorization': token
	  }
	},
	function (error, response, body) {
		handleResponse(error, response, body, callback);
	});
}

/**
 * Function you'll have to implement when using generateFile
 *
 * @callback generateFile_callback
 * @param {Array} error - Any error that could have happened, null if none
 * @param {Object} response 
 * @param {String} response.file - Path of the created file
 */

/**
 * Generate a file, usefull when you want to create a keeex message
 *
 * @param {string} name - The file name
 * @param {string} description - The file description
 * @param {string} target - Path of the destination folder
 * @param {generateFile_callback} callback - The callback that handles the response.
 */
function generateFile(name, description, target, callback) {
	request({
	  method: 'POST',
	  uri: uri.util + "/generateFile",
	  json: {
	  	name: name,
			description: description,
			target: target
	  },
	  headers: {
			'Authorization': token
	  }
	},
	function (error, response, body) {
	  handleResponse(error, response, body, callback);
	});
}

/**
 * Function you'll have to implement when using search
 * @callback search_callback
 * @param {Array} error - Any error that could have happened, null if none
 * @param {keeex_topic[]} response - List of topic found
 */

/**
 * Get current user informations
 *
 * @param {String} filter - Text used to search
 * @param {String[]} topic - List of topics referenced (AND search)
 * @param {String[]} negTopic - List of topics not referenced (NOT search)
 * @param {Integer} skip - Number of topics to be skiped from search results
 * @param {Integer} limit - Maximum number of topics returned by search
 * @param {Object} option - Search options
 * @param {boolean} option.document - Search for a document or not 
 * @param {boolean} option.discussion - Search for a discussion or not
 * @param {boolean} option.comment - Search for a comment or not
 * @param {boolean} option.agreed - Search for a keeex agreement or not
 * @param {boolean} option.concept - Search for a keeex concept or not
 * @param {boolean} option.older_version - Search for old versions or not
 * @param {boolean} option.description - Search in topic description or not
 * @param {search_callback} callback - The callback that handles the response.
 */
function search(filter, topics, negTopics, skip, limit, option, callback) {
	request({
	  method: 'POST',
	  uri: uri.util + "/search",
	  json: {
	  	filter: filter,
	    topics: topics,
	    negTopics: negTopics,
	    skip: skip,
	    limit: limit,
	    option: option
	  },
	  headers: {
			'Authorization': token
	  }
	},
	function (error, response, body) {
	  handleResponse(error, response, body, callback);
	});
}

/**
 * Function you'll have to implement when using currentView
 * @callback currentView_callback
 * @param {Array} error - Any error that could have happened, null if none
 * @param {Object} response
 * @param {String} response.idx - The topic idx
 */

/**
 * Get the idx of the document/topic curently displayed in keeex
 *
 * @param {currentView_callback} callback - The callback that handles the response.
 */
function currentView(callback) {
	request({
	  method: 'GET',
	  uri: uri.util + "/currentView",
	  json: true,
	  headers: {
			'Authorization': token
	  }
	},
	function (error, response, body) {
		handleResponse(error, response, body, callback);
	});
}

/**
 * Function you'll have to implement when using env
 * @callback env_callback
 * @param {Array} error - Any error that could have happened, null if none
 * @param {Object} response
 * @param {String} response.value - The value of the environment variable
 */

/**
 * Get the value of a keeex environment variable
 *
 * @param {String} name - The variable name. It can be **DATA_PATH**, **KEEEX_PATH**, **KEEEXED_PATH**, **RECEIVED_PATH**, **FILENAME_FORMAT**
 * @param {env_callback} callback - The callback that handles the response.
 */
function env(name, callback) {
	request({
	  method: 'GET',
	  uri: uri.util + "/env" + "/" + name,
	  json: true,
	  headers: {
			'Authorization': token
	  }
	},
	function (error, response, body) {
		handleResponse(error, response, body, callback);
	});
}

/**
 * Function you'll have to implement when using setEnv
 * @callback setEnv_callback
 * @param {Array} error - Any error that could have happened, null if none
 * @param {null} response
 */

/**
 * Set the value of a keeex environment variable
 *
 * @param {String} name - The variable name. It can be **KEEEXED_PATH**, **RECEIVED_PATH**, **FILENAME_FORMAT**
 * @param {String} value - The variable value
 * @param {setEnv_callback} callback - The callback that handles the response.
 */
function setEnv(name, value, callback) {
	request({
	  method: 'POST',
	  uri: uri.util + "/env" + "/" + name,
	  json: {
	  	value: value
	  },
	  headers: {
			'Authorization': token
	  }
	},
	function (error, response, body) {
		handleResponse(error, response, body, callback);
	});	
}

module.exports = {
	hello: hello,
	getPluginIDX: getPluginIDX,
	setToken: setToken,
	getToken: getToken,
	keeex: keeex,
	verify: verify,
	getTopics: getTopics,
	getLocations: getLocations,
	getAuthor: getAuthor,
	getComments: getComments,
	comment: comment,
	getPrevs: getPrevs,
	getNexts: getNexts,
	getRefs: getRefs,
	getShared: getShared,
	getAgreements: getAgreements,
	getUsers: getUsers,
	getMine: getMine,
	getUserByEmail: getUserByEmail,
	share: share,
	makeRef: makeRef,
	remove: remove,
	generateFile: generateFile,
	search: search,
	currentView: currentView,
	env: env,
	setEnv: setEnv,
};


/**
 * 
 * @typedef keeex_topic
 * @property {String} idx - Topic identifier
 * @property {String} name - Topic name - the same file name
 * @property {String} description - Topic description
 * @property {Date} creationDate - Topic creation date
 * @property {Date} lastModify - Topic last modification date
 * @property {String[]} references - list of idx of references
 */

/**
 * It's the same structure as a topic as comments are keeex topics too
 * @typedef keeex_comment
 * @property {String} idx - Topic identifier
 * @property {String} name - Comment content
 * @property {String} description - Empty
 * @property {Date} creationDate - Topic creation date
 * @property {Date} lastModify - Topic last modification date
 * @property {String[]} references - list of idx of references
 */

/**
 * 
 * @typedef keeex_user
 * @property {String} profileIdx - User identifier
 * @property {String} name - User name
 * @property {String} avatar - Path to user's avatar
 * @property {email} email - User's email
 */

/*
keeex self xoram-hunoc-huviv-levuv-nepul-vemeb-cyper-fonev-kumar-vuner-muven-rezyh-cycik-rusig-kugys-zyfem-dixix , {main} xeeek
keeex self 2Uhe4Tnn86VnPpiJh5beHhvvHXoHuqMezYqQdPo , {alg:sha224,enc:b58,recursive:1} xeeek
keeex name "kxapi.js" , {main} xeeek
keeex prop "kx.author", "ruhim-lopyr-mybof-notes-vozed-mycip-raboc-mivov-kypav-zehih-kevys-zetis-pasic-fypeg-byter-kyros-buxur" xeeek
keeex ref "rigom-cudis-zuzan-goziz-dyfip-hilif-golyz-lihuv-herol-mekod-vofur-dilyt-buhyn-misok-zeret-habiv-buxar" , {mine} xeeek
keeex signer rerom-cityz-bivyc-ralav-bumon-mudyh-hocyr-pikyv-sysyz-cunat-gesiz-lipig-cozof-harif-sapor-gacaf-nixer xeeek
keeex prop "kx.time", "Thu, 28 Jul 2016 10:21:33 GMT" xeeek
keeex prop "kx.pattern", "%f_kx_%YYYY_$1-$2" xeeek
keeex prop "kx.description", "fix verify function: add opt parameter" xeeek
keeex prop "kx.publickey", "1H6taxDyHDvaLk9bfkzmmihyBXtAHp3Bse", {bitcoin} xeeek
keeex protected "G9yxQxz7WGOFchx97WqjUq8S07uSFGq:hUe1cLwQY0WhlrbOCIfU!IYY9wwceKTI4kNbmxgGzk7Q86nrNkxkH:w=" , {bitcoin} xeeek
keeex previous ribaz-labuv-gazis-cunez-pakop-birab-derob-rutov-tezes-zumib-pibuf-hutol-lecid-makyf-kifiz-rafac-texir xeeek
keeex ref "rusel-sunim-furyr-vivym-dupyn-tuden-zazep-kevav-fipef-fyzoc-madyz-zusur-nynyh-fofin-gymav-zumyg-voxur" xeeek
keeex ref "rimod-tifap-sokon-kehun-hagih-rufus-tezel-cuzuz-bedad-gizyr-kolul-sanug-codyk-kozal-lasyp-refik-myxir" xeeek
keeex ref "ririd-vetyp-fypyr-telic-micas-nugoz-kolip-fonif-tugim-noguz-vofec-periv-fobuz-guvus-mediv-syvyc-laxur" xeeek
keeex ref "ruhep-garal-mebyv-nanob-lakyz-lifyr-rodif-fumav-mifec-sotok-lepup-gobag-givyp-dilyd-nisep-liluk-maxir" xeeek
keeex prop "kx.folder", "edit" xeeek
keeex ref "recoc-kamid-cydez-sezev-pafez-lemak-dofal-mipis-tyvak-gonef-dynap-vokon-hihof-migyh-nyfyv-tubid-tyxir" xeeek
keeex ref "rizip-cylem-pacyc-sezaz-bacys-rined-hatyz-fyvev-durod-tecek-pisev-dityt-gygov-gilyf-decid-copot-pexir" xeeek

*/
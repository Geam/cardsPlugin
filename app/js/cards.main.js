/*
 * KeeeX Cards
 *
 * Copyright (c) 2016 KeeeX SAS
 *
 * This is an open source project available under the MIT license.
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 *
 * Author: Cheikh Ahmadou K. Savadogo   - savacheikh@gmail.com
 *
 * Date: June-August 2016
 */

/****************************
		Modules
 ***********************
 ****************************/

var utils = require('./js/utils.js').utils;
if (typeof path === "undefined")
	var path = require("path");
var fs = require('fs');
const kxapi = require("keeex-api");
const kxapiPromise = require("./js/kxapiPromise.js")(kxapi);
const dom = require("./js/dom.js")(window);

/*
####################-End of Modules-####################
*/

/****************************
		Data structures
 ***********************
 ****************************/

//Idxs used when creating new concept/topic
var conceptTypeIdx = "xecag-muges-vocul-tuvan-ryhar-rovap-hizit-zaget-rurot-zekyz-kazur-ganed-rofeg-kemul-kolig-luput-byxix";
var folderTypeIdx = "xezoz-dekaf-bovel-kahun-givyn-gufuf-sogyt-lases-kocut-dofyb-fipor-dumet-hepof-nyvor-mymok-rakim-buxox";
var keeexMsgTypeIdx = "xohos-dukyh-nahiv-pokeb-murem-lyfoh-lafoc-gicod-gevan-rehen-vefos-kylob-fabel-forib-kicop-hahym-puxax";
var boardTypeIdx = "xedof-becod-pipon-kolec-peseb-popyk-zogul-ticas-zevus-rulis-vihyg-volyp-sodof-bupit-sodum-nebit-syxex";
var crmCategory = "xikaz-cadir-retyf-bekyk-gytyt-kupun-rylog-rudyz-lycet-rutin-kotad-selec-venus-taril-birif-gopyl-gaxux";
var scrumCategory = "";

var savedBoardsArray = [];
var currentBoard = null;
var columnsNameArray = [];
var conceptsIdxArray = [];
var contactList = [];
var columnsArrayIndex = 0;
var addSharing = {};
var currentUser = {};
var maxToUpload; //Set the maximum content to upload in one call of search api
var autoRefresh = {};

var thisKEEEXED_PATH;
var rootPath;
var boardsPath;

/***Flag***/
var newDrop = false;
var boardToLoadFlag = null;
var	negToken = 0;	//To make tag appear negated in columnUpSearchForm

/* predefined tags and their idx */
var predefinedTags = {
	"Prospect.crm": "",
	"Lead.crm": "",
	"Opportunity.crm": "",
	"In progress.crm": "",
	"Won.crm": "",
	"Abandoned.crm": "",
	"Todo.scrum": "",
	"Feature.scrum": "",
	"Bug report.scrum": "",
	"Wait for validation.scrum": "",
	"Done.scrum": "",
	"Board Category.scrum": "",
	"CRM Category.crm": ""
};

/*
####################-End of data structure declarations-####################
*/

/****************************
		Init function
 ***********************
 ****************************/
function _init() {
	kxapiPromise.getToken("Keeex cards")
	.then((token) => {
		//console.log(`my token: ${token.token}`);
		return kxapiPromise.env('KEEEXED_PATH');
	})
	.then((varObj) => {
		//console.log(`KEEEXED_PATH: ${varObj.value}`);
		thisKEEEXED_PATH = varObj.value;
		boardsPath = path.join(thisKEEEXED_PATH, '/boards/');
		fs.mkdir(boardsPath, (error) => {
			if (error && error.code != 'EEXIST')
				console.error(`Creating folder error`, error);
		});
	})
	.then(() => {
		rootPath = path.dirname(utils.getDirName());
		//console.log(`rootPath: ${rootPath}`);
		Object.keys(predefinedTags).forEach((concept) => {
			//console.log(`verifying ${concept}`);
			kxapiPromise.verify(`${rootPath}/sys_tags/${concept}`, {'import': true})
			.then((verified) => {
				predefinedTags[concept] = verified.idx;
			})
			.catch((error) => {
				logDisplay(error);
				//console.error(error);
			});
		});
		return kxapiPromise.getUsers(null);
	})
	.then((usersList) => {
		contactList = usersList
			.filter(user => user.state === "ACCEPTED")
			.map(user => {
				return {
					"name": user.name,
					"avatar": user.avatar,
					"profileIdx": user.profileIdx
				};
			});
	})
	.then(() => {
		displayCurrentProfileAvatar();
		searchTags();
		saveBoardPopover();
		clicksOrKeyEvent();
		$('[data-toggle="tooltip"]').tooltip();
		$('[rel="tooltip"]').tooltip();
		$('#pageContainer').css('display', 'block');
		logDisplay('KeeeX Cards ready');
	})
	.catch(console.error);
}

/*
####################-End of Init function-####################
*/

/************************************
		Utility/UI/Helper functions
 ********************************
 ************************************/

(function ($) {
	$.fn.serializeFormJSON = function () {
		var o = {};
		var a = this.serializeArray();
		$.each(a, function () {
			if (o[this.name]) {
				if (!o[this.name].push) {
					o[this.name] = [o[this.name]];
				}
				o[this.name].push(this.value || '');
			} else {
				o[this.name] = this.value || '';
			}
		});
		return o;
	};
})(jQuery);

const searchContentType = (type) => {
	const validOpt = [ "document", "description", "discussion", "comment", "agreed", "older_version", "concept" ];
	if (type === null || type === "" || validOpt.indexOf(type) == -1) {
		return {
			"theObject": {
				"document": true,
				"description": true,
				"discussion": true,
				"comment": true,
				"agreed": true,
				"older_version": true
			},
			"name": "custom",
		};
	}
	var option = {
		"theObject": {},
		"name": type
	};
	option.theObject[type] = true;
	return option;
};

const promiseSerie = w => w.reduce((q, fn) => q.then(fn), Promise.resolve());

const traverseJSONArray = (arr, key, val, retKey) => {
	let obj = arr.find(e => e[key] === val);
	return obj ? obj[retKey] : "";
};

const setJSONArray = (theArray, name, val) => {
	let e = theArray.find((e) => { return e.name === name; });
	if (e) {
		e.idx = val;
	}
};

const sortByKey = (array, key) => {
	return array.sort((a, b) => a[key].toLowerCase().localeCompare(b[key].toLowerCase()));
};

const columnNegTags = (array, key1, key2) => {
	return array.reduce((prev, cur) => {
		prev.idx.push(cur[key1]);
		prev.concept.push(cur[key2]);
		return prev;
	}, {'idx': [], 'concept': []});
};

const searchParamsArray = (array) => {
	return array.map((e, i) => {
		return {
			'topics': { "idx": [e.idx], "concept": [e.concept] },
			'negtopics': columnNegTags(array.slice(i + 1), "idx", "concept")
		};
	});
};

const cloneColumnsArray = () => {
	return columnsNameArray.map((e) => {
		return {
			'id': e.id,
			'name': e.name,
			'topics': e.topics,
			'negtopics': e.negtopics
		};
	});
};

function displayCurrentProfileAvatar(){
	kxapiPromise.getMine()
		.then((profile) => {
			currentUser = profile;
			$('#mainBarAvatarImg').attr('src', "file://" + profile.avatar);
			$('#mainBarProfileName').text(''+profile.name.split(' ')[0]);
			logDisplay(`Current user: ${profile.name}`);
		})
		.catch(logDisplay);
}

function resetDisplay(empty) {
	//Reset flags
	newDrop = false;
	boardToLoadFlag = null;
	negToken = 0;
	// Reset arrays
	currentBoard = null;
	columnsNameArray = [];
	columnsArrayIndex = 0;
	window.clearTimeout(autoRefresh.timeoutID);
	//Clear tags & re-generate
	$('#concepts').empty();
	searchTags();
	$('#conceptBar').css('display', 'block');
	$('#concepts').css('display', 'inline-block');
	$(".mainBarSubmitBtn").attr('disabled', false);
	//Empty mainContainer
	clearComponents();
	if (!empty) {
		//Generate first column
		generateColumn(0, "column0");
	}
	//Hide loading icon
	$('#mainContainer').css('display', 'block');
	$('#mainContainer2').css('display', 'none');
}

/*
####################-End Helper Utility/UI/Helper functions-####################
*/

/**************************
		Search Functions
 *********************
 **************************/

/*
 * Loads all tags and displays them
 */
const searchTags = (reload) => {
	kxapiPromise.searchTopics([conceptTypeIdx], [], maxToUpload, searchContentType("concept"))
		.then((conceptsReturned) => {
			conceptsIdxArray = conceptsReturned.map((e) => {
				return {
					'name': e.name,
					'idx': e.idx
				};
			});
			conceptsIdxArray = sortByKey(conceptsIdxArray, 'name');
			if(reload)
				logDisplay("Concepts reloaded");
		})
		.catch((error) => {
			logDisplay(`${error} Get concepts error`);
		});
};
/*--End of searchTags--*/

/*
 * Add content to column
 */
const addColumnContent = (column, topicsToAdd) => {
	if (topicsToAdd.length === 0) return;
	// get location of the topics, doesn't need to have the data when building
	// the board hence the tile creation not in the "then"
	kxapiPromise.getLocations(topicsToAdd.map((topic) => topic.idx))
		.then((locations) => {
			topicsToAdd.forEach((topic) => {
				let topicResp = locations.find((e) => e.idx === topic.idx);
				topic.location = topicResp ? topicResp.location : [""];
			});
		});

	return Promise.all(topicsToAdd.map((topic) => {
		const topicObject = { "data": topic, 'author': {}, 'shared': [] };

		return kxapiPromise.getAuthorFromTopic(topicObject.data)
			.then((author) => {
				topicObject.author = author;
				return kxapiPromise.getSharedFromTopic(topicObject.data);
			})
			.then((usersIdx) => {
				return kxapiPromise.getUsersFromList(usersIdx);
			})
			.then((users) => {
				topicObject.shared = users || [];
				generateColumnItem(column, topicObject, false);
			})
			.catch((error) => {
				logDisplay(error);
				sideContainerColumnsList(column);
			});
	}))
		.then(ret => {
			logDisplay(`${column.name}: ${topicsToAdd.length} topics added`);
		});
};

const updateTileContent = (column, topicsToUpdate) => {
	if (topicsToUpdate.length === 0) return;
	return Promise.all(topicsToUpdate.map(topic => {
		const tile = column.listedTopics.find(e => e.data.idx === topic.idx);
		return kxapiPromise.getSharedFromTopic(topic)
			.then((users) => {
				if (!users || tile.shared.length === users.shared.length) {
					return false;
				}
				const tileSharedIdx = tile.shared.map(e => e.profileIdx);
				return kxapiPromise.getUsers(users.shared.filter(e => tileSharedIdx.indexOf(e) === -1));
			})
			.then((newUsers) => {
				if (!newUsers) return false;
				tile.shared = tile.shared.concat(newUsers);
				dom.addShare(`#column${column.id} .itemLiWrapper[idx=${topic.idx}] .sharedList`, newUsers);
				return true;
			});
	}))
		.then(ret => {
			if (!ret.length || !ret.filter(e => e).length) return;
			logDisplay(`${column.name}: ${ret.filter(e => e).length} topics updated`);
		});
};

const columnRemoveTile = (column, topicsToRemove) => {
	if (topicsToRemove.length === 0) return Promise.resolve();
	topicsToRemove.forEach(e => dom.removeTile(column, e.data.idx));
	column.listedTopics = column.listedTopics.filter(e => topicsToRemove.map(e => e.data.idx).indexOf(e.data.idx) === -1);
	logDisplay(`${column.name}: ${topicsToRemove.length} topics removed`);
	return Promise.resolve();
};

const sortColumnContent = (column, topicsReturnedIdx) => {
	$(`#column${column.id} .itemLiWrapper[idx]`).sort((a,b) => {
		return topicsReturnedIdx.indexOf(a.getAttribute("idx")) - topicsReturnedIdx.indexOf(b.getAttribute("idx"));
	}).appendTo(`#column${column.id} .columnMiddleUl`);
};

const updateColumnContent = (column, topicsReturned) => {
	const columnContentIdx = column.listedTopics.map(e => e.data.idx);
	const topicsReturnedIdx = topicsReturned.map(e => e.idx);
	const {topicsToAdd, topicsToUpdate} = topicsReturned.reduce((prev, cur) => {
		if (columnContentIdx.indexOf(cur.idx) === -1) prev.topicsToAdd.push(cur);
		else prev.topicsToUpdate.push(cur);
		return prev;
	}, {topicsToAdd: [], topicsToUpdate: []});
	const topicsToRemove = column.listedTopics.filter(e => topicsReturnedIdx.indexOf(e.data.idx) === -1);
	return columnRemoveTile(column, topicsToRemove)
		.then(() => addColumnContent(column, topicsToAdd))
		.then(() => updateTileContent(column, topicsToUpdate))
		.then(() => sortColumnContent(column, topicsReturnedIdx));
};

const doSearch = (column) => {
	return kxapiPromise.searchTopics(column.topics.idx, column.negtopics.idx, maxToUpload, searchContentType())
		.then((topicsReturned) => {
			sideContainerColumnsList(column, topicsReturned.length);
			return updateColumnContent(column, topicsReturned.sort((a, b) =>
				new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime()));
		})
		.catch((error) => {
			logDisplay(`${error} on ${column.name}`);
		});
};

/*
 * Search function used when forming board in custom mode
 */
function customSearchTopics(columnId) {
	if (columnId <= -1) {
		return console.error("customSearchTopics: columnIndex error");
	}

	const column = columnsNameArray[columnId];
	doSearch(column);
}
/*--End of customSearchTopics--*/

const getColumnsContent = () => {
	const el = document.querySelector("#refreshBoardBtn span");
	if (autoRefresh.inProgress) return;
	autoRefresh.inProgress = true;
	el.classList.add("spin");
	return Promise.all(columnsNameArray.map(doSearch))
		.then(() => {
			el.classList.remove("spin");
			autoRefresh.inProgress = false;
			autoRefreshBoardContent();
		});
};

const displayBoardFromSearchParam = (searchParams) => {
	searchParams.forEach((eachOption) => {
		if (!eachOption.name)
			eachOption.name = eachOption.topics.concept[0];

		//Generate new column
		const columnId = columnsNameArray.length;
		const column = generateColumn(columnId, eachOption.name);

		column.topics = eachOption.topics;
		if (eachOption.negtopics) {
			column.negtopics = eachOption.negtopics;
		} else {
			column.negtopics = { "idx": [], "concept": [] };
		}

		addTagToColumnUp(column);
		titleTooltipRoutine(column);
	});
	getColumnsContent();
};

/*
 * Search function used in scrum mode
 */
function scrum() {
	resetDisplay(true);
	const workTrackingList = [
		{ "concept": "Todo"                , "idx": predefinedTags["Todo.scrum"] || "" },
		{ "concept": "Feature"             , "idx": predefinedTags["Feature.scrum"] || "" },
		{ "concept": "Bug report"          , "idx": predefinedTags["Bug report.scrum"] || "" },
		{ "concept": "In progress"         , "idx": predefinedTags["In progress.crm"] || "" },
		{ "concept": "Wait for validation" , "idx": predefinedTags["Wait for validation.scrum"] || "" },
		{ "concept": "Done"                , "idx": predefinedTags["Done.scrum"] || "" }
	];
	displayBoardFromSearchParam(searchParamsArray(workTrackingList));
}
/*--End of scrum--*/

/*
 * Search function used in crm mode
 */
function crm() {
	resetDisplay(true);
	const workTrackingList = [
		{ "concept": "Prospect"    , "idx": [predefinedTags["Prospect.crm"] || ""] },
		{ "concept": "Lead"        , "idx": [predefinedTags["Lead.crm"] || ""] },
		{ "concept": "Opportunity" , "idx": [predefinedTags["Opportunity.crm"] || ""] },
		{ "concept": "In progress" , "idx": [predefinedTags["In progress.crm"] || ""] },
		{ "concept": "Won"         , "idx": [predefinedTags["Won.crm"] || ""] },
		{ "concept": "Abandoned"   , "idx": [predefinedTags["Abandoned.crm"] || ""] }
	];
	displayBoardFromSearchParam(searchParamsArray(workTrackingList));
}
/*--End of crm--*/

/*
 * Function used to restore a saved board
 */
function restoreBoard(columnsArray) {
	resetDisplay(true);
	// detect if older board version
	if (columnsArray[0].hasOwnProperty("columnSearchTopics")) {
		logDisplay("Old board detected, converting to new format");
		columnsArray = columnsArray.map((e) => {
			if (e.hasOwnProperty("columnSearchTopics")) {
				e.topics = e.columnSearchTopics;
				delete e.columnSearchTopics;
			}
			if (e.hasOwnProperty("columnSearchNegtopics")) {
				e.negtopics = e.columnSearchNegtopics;
				delete e.columnSearchNegtopics;
			}
			return e;
		});
	}
	displayBoardFromSearchParam(columnsArray);
}
/*-- End of restoreBoard --*/

/*
####################-End of search functions-####################
*/

/********************************
		Creation/Share Functions
 ****************************
 ********************************/

/*
 * Function used to add new reference to a topic
 */
function updateTopicRef(tile, theType, column) {
	var idx = "";

	//Get topic idx
	if ([ "reference", "version" ].indexOf(theType) > -1) {
		idx = tile.data.idx;
	}
	else if (theType !== "agreement") {
		return logDisplay("Specify topic type");
	}

	//Get column topics
	var topicsIdxs = column.topics.idx;

	const addRef = refIdx => () => {
		return kxapiPromise.makeRef(theType, idx, refIdx)
			.then(() => {
				const refObj = conceptsIdxArray.find(e => e.idx === refIdx);
				logDisplay(`Reference ${refObj ? refObj.name : refIdx} added to topic !`);
				if (idx === "") return null;
				return kxapiPromise.comment(idx,
					`${currentUser.name} added reference to ${refObj.name}`)
					.then(ret => {
						kxapiPromise.share(ret.comment.idx, ret.path, tile.shared.map(e => e.profileIdx));
					});
			})
			.catch((baseErr) => {
				throw Error(`Error on making reference: ${baseErr}`);
			});
	};

	const removeRef = (regToRemove, i) => {
		// TODO share with shared user the removal of the reference
		// TODO remove the ref
		// can't be done for now, the local api doesn't return the references informations
	};

	const isInTopicRef = (topic, columnRef) => topic.references.find((topicRef) => topicRef === columnRef);

	return kxapiPromise.getRefs(tile.data.idx)
		.then((refs) => {
			const topic = refs.find((e) => e.idx === tile.data.idx);
			// keep only new reference
			const refToAdd = column.topics.idx.filter((columnRef) => ! isInTopicRef(topic, columnRef));
			const refToRemove = column.negtopics.idx.filter((columnRef) => isInTopicRef(topic, columnRef));
			return promiseSerie(refToAdd.map(addRef))
				.then(() => {
					return {refToAdd, refToRemove};
				});
		})
		.catch(logDisplay);
}
/*--End of updateRefToTopic--*/

const createAndKeeex = (data) => {
	return kxapiPromise.generateFile(data.name, data.description, data.target)
		.then((filePath) => {
			if (!filePath) throw "No file generated";
			const opt = {
				targetFolder: thisKEEEXED_PATH,
				timestamp: false,
				name: data.name,
				except: {
					"name": true,
					"desc": true
				}
			};
			return kxapiPromise.keeex(filePath.file, data.ref, [], data.description, opt);
		});
};

/*
 * Function to create new concept
 */
function createConcept(){
	$("#crTag-form").submit(function(e){
		e.preventDefault();
		$("#crTag-modal").modal('hide');
		var data = $(this).serializeFormJSON();
		$("#crTagName").val("");
		$("#crTagDesc").val("");
		if (data.name === "" || data.name.length <= 1) return ;
		createAndKeeex(Object.assign({}, data, { "ref": [conceptTypeIdx] }))
			.then(() => {
				logDisplay("Concept created ! ");
				searchTags();
			})
			.catch(logDisplay);
	});
}
/*--End of createConcept --*/

/*
 * Function to create new topic/file from column
 */
function createTopic(column, topicName, topicDescription) {
	var columnTopics = column.topics.idx.slice(0);
	columnTopics.push(keeexMsgTypeIdx);

	const select = addSharing.select;

	if (!topicName || topicName === "" || topicName <= 1) return ;

	createAndKeeex({ "name": topicName, "description": topicDescription, "ref": columnTopics })
		.then((keeexedFile) => {
			const tile = {
				"data": keeexedFile.topic,
				"author": currentUser,
				"shared": []
			};
			tile.data.location = [keeexedFile.path];

			// display the tile
			const domTile = generateColumnItem(column, tile, true);
			logDisplay("Topic created !");
			// TODO display stuff => dom.js
			dom.hideColumnNewTopic(column);

			// share with other users if needed
			if (select.val().length > 0) {
				const userListIdx = select.val();
				const userList = userListIdx.map((idx) => contactList.find((c) => c.profileIdx === idx));
				kxapiPromise.share(keeexedFile.topic.idx, keeexedFile.path, userListIdx)
					.then((sharedFile) => {
						tile.shared = userList;
						dom.addShare(domTile.querySelector(".sharedList"), userList);
					})
					.catch(console.error);
			}
		})
		.catch(logDisplay);
}
/*--End of createTopic --*/

/*
####################-End of creation/share functions-####################
*/

/*******************************
		Board related Functions
 ***************************
 *******************************/

/**
 * Function used to save board configuration
 *
 * @param {String} tag name
 * @param {Integer} tag number
 */
function saveBoard(confName) {
	const filePath = path.join(boardsPath, confName.topicName + "_bd.json");
	//Write in file
	fs.writeFile(filePath, JSON.stringify(cloneColumnsArray()), function(error) {
		if (error)
			return console.log("Writing configuration error: "+error);
		console.log('File created');

		// Keeex file now
		const prev = currentBoard && !confName.topicNewVersion ? [currentBoard.idx] : [];
		const opt = {
			targetFolder:boardsPath,
			timestamp:false,
			name:confName.topicName
		};

		kxapiPromise.keeex(filePath, [boardTypeIdx], prev, confName.topicDescription, opt)
			.then((keeexedFile) => {
				currentBoard = {
					"idx": keeexedFile.topic.idx,
					"name": opt.name,
					"path": keeexedFile.path,
					"description": keeexedFile.description
				};
				logDisplay("Board saved ! ");
			})
			.catch((error) => {
				// Delete original file
				fs.unlink(filePath, function(error){
					if (error)
						console.log("Deleting file "+ path.parse(filePath).base +" error");
				});
				logDisplay(error);
			});
	});
}


/**
 * Function used to load saved boards configuration
 *
 */
function loadBoards() {
	const getTopicsLocation = (topicsReturned, i) => {
		const topic = topicsReturned[i];
		return kxapiPromise.getLocations([topic.idx])
			.then((loc) => {
				const tmpPath = loc[0].location[0];
				listingSavedBoards({
					"name": (path.parse(tmpPath).name).split("_bd_")[0],
					"saved": topic.creationDate
				}, i);
				savedBoardsArray.push({
					"idx": topic.idx,
					"path": tmpPath,
					"name": topic.name,
					"description": topic.description,
				});
				if (i < topicsReturned.length - 1) {
					return getTopicsLocation(topicsReturned, i + 1);
				} else {
					return Promise.resolve();
				}
			});
	};

	$("#tableBody").empty();
	kxapiPromise.searchTopics([boardTypeIdx], [], maxToUpload, searchContentType("document"))
		.then((topicsReturned) => {
			if (!topicsReturned.length) {
				logDisplay("No board saved");
				return;
			}
			savedBoardsArray = [];
			getTopicsLocation(topicsReturned, 0);
		})
		.then(() => {
			logDisplay("Boards loaded");
		})
		.catch((error) => {
			logDisplay(error);
			console.error(error);
		});
}

//Sanitize inputs
//Verify file
function readLoadedBoard(board) {
	filePath = board.path;
	if (!filePath || filePath === "" || filePath.length <= 1) return ;

	fs.readFile(filePath, 'utf8', (error, fileContent) => {
		if (error)
			return console.error("readfile error:", error.message);
		if (!fileContent || fileContent.length < 1)
			return logDisplay("Empty board file");
		const processedContent = JSON.parse(fileContent.replace(/ *\/\*[^/]*\*\/ */g, ""));
		restoreBoard(processedContent);
		currentBoard = board;
	});
}

const autoRefreshBoardContent = () => {
	autoRefresh.timeoutID = window.setTimeout(getColumnsContent, 60000);
};

const manualRefreshBoardContent = () => {
	window.clearTimeout(autoRefresh.timeoutID);
	getColumnsContent();
};

/*
####################-End of board related functions-####################
*/

/*******************************
		Document ready function
 ***************************
 *******************************/

function clicksOrKeyEvent() {
	$(".search").keyup(function () {
		var searchTerm = $(".search").val();
		var listItem = $('.results tbody').children('tr');
		var searchSplit = searchTerm.replace(/ /g, "'):containsi('");

		$.extend($.expr[':'], {'containsi': function(elem, i, match, array){
			return (elem.textContent || elem.innerText || '').toLowerCase().indexOf((match[3] || "").toLowerCase()) >= 0;
		}
		});
		$(".results tbody tr").not(":containsi('" + searchSplit + "')").each(function(e){
			$(this).attr('visible','false');
		});
		$(".results tbody tr:containsi('" + searchSplit + "')").each(function(e){
			$(this).attr('visible','true');
		});
	});
}

/*
####################-End of Document ready functions-####################
*/



/*
keeex self xufad-pigil-durem-cahar-zyved-karyt-fytyz-tifiz-ruman-sonat-gicuh-ketyz-mytus-mavog-sapyp-fusic-pexix , {main} xeeek
keeex self 3X729BVhtrmh9t3fVu7Tb9kRXozXhN6BQFpKYQY , {alg:sha224,enc:b58,recursive:1} xeeek
keeex name "cards.main.js" , {main} xeeek
keeex prop "kx.author", "resat-tutym-betav-binoh-refav-kobic-pehos-halig-lymar-rageb-bafoc-rikus-hulak-bukof-budeg-lerek-byxor" xeeek
keeex ref "ropoh-zigec-vulun-zocok-gezin-mazim-kemov-somuh-bacoc-bonut-kogef-duzev-bykom-tofyl-nusuc-vupyl-pyxyr" , {mine} xeeek
keeex signer rerom-cityz-bivyc-ralav-bumon-mudyh-hocyr-pikyv-sysyz-cunat-gesiz-lipig-cozof-harif-sapor-gacaf-nixer xeeek
keeex prop "kx.time", "Fri, 12 Aug 2016 09:38:20 GMT" xeeek
keeex prop "kx.pattern", "%f_kx_$1-$2" xeeek
keeex prop "kx.publickey", "1Lht9GuEcDvF3m7WUUv8igY4zKcQs6tyBR", {bitcoin} xeeek
keeex protected "G:l75aMFvIKM!cGkQjkoglTFw74eqpRid4e24bllIQ!NLGvIebfbWWVhT!4WJFk!s6AuHcDMXU!OkXrFoAtP:bI=" , {bitcoin} xeeek

*/

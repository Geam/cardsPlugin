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

const kxapi = require("./js/kxapi.js");
const components = require("./js/components.js");
const utils = require('./js/utils.js').utils;
const async = require("async");
const path = require("path");
const fs = require('fs');
const kxapiPromise = require("./js/kxapiPromise.js")(kxapi);
const dom = require("./js/dom.js")(window, jQuery);

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
var currentUser = {};
var maxToUpload; //Set the maximum content to upload in one call of search api

var thisKEEEXED_PATH;
var rootPath;
var boardsPath;

/***Flag***/
var newDrop;
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
		contactList.forEach((user) => displayContactList);
	})
	.then(() => {
		displayCurrentProfileAvatar();
		searchTags();
		saveBoardPopover();
		clicksOrKeyEvent();
		$('[data-toggle="tooltip"]').tooltip();
		$('[data-toggle="tooltip"]').tooltip();
		$('#pageContainer').css('display', 'block');
		logDisplay('KeeeX Cards ready');
	})
	.catch(console.log);
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

const traverseJSONArray = (theArray, key, val, retKey) => {
	return theArray.reduce((prev, cur) => {
		if (cur[key] === val) {
			return cur[retKey];
		}
		return prev;
	}, "");
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

const columnNegTags = (array, cur, key1, key2) => {
	return array.filter((e) => {
		if (e === cur)
			return false;
		return true;
	}).reduce((prev, cur) => {
		prev.idx.push(cur[key1]);
		prev.concept.push(cur[key2]);
		return prev;
	}, {'idx': [], 'concept': []});
};

const searchParamsArray = (array) => {
	return array.map((e) => {
		return {
			'topics': { "idx": [e.idx], "concept": [e.concept] },
			'negtopics': columnNegTags(array, e, "idx", "concept")
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
	newDrop = -1;
	boardToLoadFlag = null;
	negToken = 0;
	// Reset arrays
	currentBoard = null;
	columnsNameArray = [];
	columnsArrayIndex = 0;
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
			conceptsIdxArray.forEach((e, i) => {
				displayConcepts(e.name, i);
				if (e.name === "")
					$("#cncpt"+i).css('display', 'none');
			});
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
const addColumnContent = (column, topicsReturned) => {
	topicsReturned.forEach((topic) => {
		const topicObject = { "data": topic, 'author': {}, 'shared': [] };

		kxapiPromise.getAuthorFromTopic(topicObject.data)
			.then((author) => {
				topicObject.author = author;
				return kxapiPromise.getSharedFromTopic(topicObject.data);
			})
			.then(kxapiPromise.getUsersFromList)
			.then((users) => {
				topicObject.shared = users || [];
				topicObject.domId = `${column.id}-${column.nbItems}`;
				generateColumnItem(column, topicObject, false);
				column.nbItems += 1;
			})
			.catch((error) => {
				logDisplay(error);
				sideContainerColumnsList(column.id);
			});
	});
};

const doSeach = (column) => {
	kxapiPromise.searchTopics(column.topics.idx, column.negtopics.idx, maxToUpload, searchContentType())
		.then((topicsReturned) => {
			sideContainerColumnsList(column.id, topicsReturned.length);
			if (!topicsReturned.length) {
				return logDisplay(`${column.name}: No topics returned!`);
			}
			addColumnContent(column, topicsReturned);
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
	doSeach(column);
}
/*--End of customSearchTopics--*/

const displayBoardFromSearchParam = (searchParams) => {
	/*Ajax loader gif*/
	$('#mainContainer2').css('display', 'block');
	$('#mainContainer').css('display', 'none');

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

		addTagToColumnUp(column.id, column.topics.concept, 0);
		addTagToColumnUp(column.id, column.negtopics.concept, 1);
		titleTooltipRoutine(column);

		doSeach(column);
	});

	$('#mainContainer').css('display', 'block');
	$('#mainContainer2').css('display', 'none');
	//$('#mainContainer').animate({scrollLeft: $('#mainContainer').get(0).scrollWidth}, 1000);
};

/*
 * Search function used in scrum mode
 */
function scrum() {
	resetDisplay(true);
	const workTrackingList = [
		{ "concept": "Todo"                , "idx": predefinedTags["Todo.scrum"] || "" },
		{ "concept": "Feature"             , "idx": predefinedTags["Feature.scrum"] || "" },
		{ "concept": "Bug Report"          , "idx": predefinedTags["Bug Report.scrum"] || "" },
		{ "concept": "In Progress"         , "idx": predefinedTags["In Progress.scrum"] || "" },
		{ "concept": "Wait for Validation" , "idx": predefinedTags["Wait for Validation.scrum"] || "" },
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
		{ "concept": ["Prospect"]    , "idx": [predefinedTags["Prospect.crm"] || ""] },
		{ "concept": ["Lead"]        , "idx": [predefinedTags["Lead.crm"] || ""] },
		{ "concept": ["Opportunity"] , "idx": [predefinedTags["Opportunity.crm"] || ""] },
		{ "concept": ["In progress"] , "idx": [predefinedTags["In progress.crm"] || ""] },
		{ "concept": ["Won"]         , "idx": [predefinedTags["Won.crm"] || ""] },
		{ "concept": ["Abandoned"]   , "idx": [predefinedTags["Abandoned.crm"] || ""] }
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
			//var tmp = Object.assign({}, e);
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
function addRefToTopic(theTopicIdx, theType, columnId){
	var From = "";

	//Get topic idx
	if ([ "reference", "version" ].indexOf(theType) > -1) {
		From = theTopicIdx;
	}
	else if (theType !== "agreement") {
		return logDisplay("Specify topic type");
	}

	//Get column topics
	var topicsIdxs = columnsNameArray[columnId].topics.idx;

	//Make sure theTopicIdx is not already referenced by one/all of topicsIdxs
	kxapi.getRefs(theTopicIdx, function(error, theReferences) {
		if(error){
			logDisplay("Error on getting references");
			return callback(error);
		}
		for (var i = 0; i < topicsIdxs.length; i++) {
			for (var j = 0; j < theReferences.length; j++) {
				if(theReferences[j].idx == topicsIdxs[i])
					return logDisplay("Already referenced by: "+theReferences[j].name);
			}
		}
		//and makeRef of each one of them
		async.eachSeries(topicsIdxs, function(eachTopicIdx, callback){
			kxapi.makeRef(theType, From, eachTopicIdx, function(error){
				if(error){
					logDisplay("Error on making reference");
					return callback(error);
				}
				var idx2 = traverseJSONArray(conceptsIdxArray, 'idx', eachTopicIdx, 'name');
				logDisplay("Reference "+idx2+" added to topic !");
				callback(null);
			});
		}, function(error){
			if (error)
				logDisplay("addTopicRef error: "+ error);
		});
	});
}
/*--End of addRefToTopic--*/

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
		if (data.name !== "" && data.name.length > 1) {
			kxapi.generateFile(data.name, data.description, null, function(error, filePath){
				if (error) {
					logDisplay("Generate file error: "+error);
					return;
				}
				if(!filePath){
					logDisplay("No file generated");
					return;
				}
				// Keeex file now
				var  opt = {
					targetFolder:thisKEEEXED_PATH,
					timestamp:false,
					name:data.name,
					except:
					{
						"name": true,
						"desc": true
					}
				};
				kxapi.keeex(filePath.file, [conceptTypeIdx], [], data.description,  opt, function(error, keeexedFile){
					if(error){
						logDisplay("Keeexing file error: "+error);
						return;
					}
					logDisplay("Concept created ! ");
					searchTags();
				});
			});
		}
	});
}
/*--End of createConcept --*/

/*
 * Function to create new topic/file from column
 */
function createTopic(columnNumber, topicName, topicDescription, toShareIds){
	const column = columnsNameArray[columnNumber];
	var columnTopics = column.topics.idx.slice(0);
	columnTopics.push(keeexMsgTypeIdx);

	if (topicName !== "" && topicName.length > 1) {
		kxapi.generateFile(topicName, topicDescription, null, function(error, filePath){
			if(error){
				logDisplay("Generate file error: "+error);
				return;
			}
			if(!filePath){
				logDisplay("No file generated");
				return;
			}
			// Keeex file now
			var  opt = {
				targetFolder:thisKEEEXED_PATH,
				timestamp:false,
				name:topicName,
				except:
				{
					"name": true,
					"desc": true
				}
			};
			var keeexedFile = null;
			async.series([
				function crTpcKeeex(callback) {
					kxapi.keeex(filePath.file, columnTopics, [], topicDescription,  opt, function(error, data) {
						if (!error) keeexedFile = data;
						callback(error);
					});
				},
				function crTpShare(callback) {
					shareTopic(keeexedFile.topic.idx, keeexedFile.path,  toShareIds, callback);
				},
				function crTpDisplay(callback) {
					var tile = {
						'data': keeexedFile.topic,
						'domId': column.id + "-" + column.nbItems,
						'avatar': currentProfileAvatar,
						'shared': toShareIds
					};
					generateColumnItem(column, tile, true);
					column.nbItems +=1;
					logDisplay("Topic created ! ");
					//Clean file lds
					$('#itemTextarea'+column.id).val("");
					$('#itemInput'+column.id).val("");
					$('.addShare').remove();
					//hide block
					$('#item'+column.id+'-x').css('display', 'none');
					callback(null);
				}
			], function(error) {
				console.error(error);
			});
		});
	}
}
/*--End of createTopic --*/

/*
 * Function used to share topic function
 */
function shareTopic(topicIdx, topicPath,  shareObj, callback){
	if(shareObj && shareObj.length > 0){
		var shareIds = [];
		for (var i = 0; i < shareObj.length; i++)
			shareIds.push(shareObj[i].profileIdx);
		// console.log(topicIdx, topicPath, shareIds);
		kxapi.share(topicIdx, topicPath, shareIds, {}, callback);
	}else{
		callback(null);
	}
}
/*--End of shareTopic --*/

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
	});
	// Keeex file now
	const prev = currentBoard && !confName.topicNewVersion ? [currentBoard.idx] : [];
	console.log(prev);
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
			// Delete original file
			fs.unlink(filePath, function(error){
				if (error)
					console.log("Deleting file "+ path.parse(filePath).base +" error");
			});
		})
		.catch(logDisplay);
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
			getTopicsLocation(topicsReturned, 0)
			.then(() => {
				logDisplay("Boards loaded");
			})
			.catch((error) => {
				logDisplay(error);
				console.error(error);
			});
		})
		.catch(logDisplay);
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

/*
####################-End of board related functions-####################
*/


/***************************
		Drag&Drop functions
 ***********************
 ***************************/

function allowDrop(ev) {
	ev.preventDefault();
}

function dragstart(ev) {
	ev.dataTransfer.setData("text", ev.target.id);
}

function dragEnd(ev) {
	$(ev.toElement).css('position', 'relative');
}

function itemDrag(ev) {
	ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
	ev.preventDefault();
	var columnIndex;
	var data = ev.dataTransfer.getData("text");
	var targetId;

	if(ev.target.className =="columnUpTitle")
	{
		targetId = ev.srcElement.parentNode.id;
	}
	else if(ev.target.className =="spanColumnTitleWrapper")
	{
		targetId = ev.srcElement.parentNode.parentNode.id;
	}
	else if(ev.target.className =="spanColumnTitle")
	{
		targetId = ev.srcElement.parentNode.parentNode.parentNode.id;
	}
	else if(ev.target.className[0] =="columnUpRightIcon")
	{
		targetId = ev.srcElement.parentNode.parentNode.parentNode.id;
	}
	else{
		targetId = ev.target.id;
	}

	var upColumn = $('#'+targetId);
	var upForm = upColumn.find('.columnUpForm');
	var concept = $('#'+data);
	var conceptVal = concept.find('span').text();
	var cnceptIdxIndex = Number(data.replace("cncpt", ''));

	newDrop = 1;
	if(concept.hasClass('negTopic')){
		negToken = 1;
	}
	if(upForm.css('display') != 'none'){
		$('#'+ev.toElement.id).tagit('createTag', conceptVal);
		let columnName = upColumn.parent().parent().parent().attr('id');
		columnIndex =  Number((ev.toElement.id).replace("formTags", ''));
	}
	else{
		upColumn.find('.columnUpTitle').remove();
		upForm.css('display', 'block');
		upColumn.css('background-color', '#F0F0F0');
		upForm.find('ul').tagit('createTag', conceptVal);
		let columnName = upColumn.parent().attr('id');
		columnIndex =  Number(targetId.replace("columnUp", ''));
	}
	// push tag value in search array
	if(columnsNameArray[columnIndex].nbItems){
		//Emptiing the arrays
		clearColumnElements(columnIndex, 1);
	}
	if(concept.hasClass('negTopic')){
		if(columnsNameArray[columnIndex].negtopics.concept.indexOf(conceptVal) == -1){
			columnsNameArray[columnIndex].negtopics.concept.push(conceptVal);
			columnsNameArray[columnIndex].negtopics.idx.push(conceptsIdxArray[cnceptIdxIndex].idx);
		}
	}else{
		if(columnsNameArray[columnIndex].topics.concept.indexOf(conceptVal) == -1){
			columnsNameArray[columnIndex].topics.concept.push(conceptVal);
			columnsNameArray[columnIndex].topics.idx.push(conceptsIdxArray[cnceptIdxIndex].idx);
		}
	}
}

/*
####################-End of Drag/drop functions-####################
*/

/*******************************
		Document ready function
 ***************************
 *******************************/

function clicksOrKeyEvent(){
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

	//Listener on contact list elements when sharing
	$(document).on("click", ".contactLi", function(e) {
		var columnId = (e.originalEvent.path[5].id).split('-')[0].replace('item', '');
		var contactId = Number((e.toElement.parentNode.id).replace('contact', ''));
		console.log("clicked");
		if(!isNaN(contactId)){
			var data = contactList[contactId];
			var av = addSharedAvatars(columnId, data, contactId);
			$(av).addClass("addShare");
			$('.addItemShareList').append(av);
			shareBtnClicked = -1;
		}
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

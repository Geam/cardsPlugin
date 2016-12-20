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
var columnsNameArray = [];
var conceptsIdxArray = [];
var contactList = [];
var columnsArrayIndex = 0;
var currentProfileAvatar = '';
var maxToUpload; //Set the maximum content to upload in one call of search api

var thisKEEEXED_PATH;
var rootPath;
var boardsPath;

/***Flag***/
var newDrop;
var boardToLoadFlag;
var	negToken = 0;	//To make tag appear negated in columnUpSearchForm

/* predefined tags and their idx */
var predefinedTags2 = {
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

var predefinedTags = [
	{ name: "Prospect.crm"              , idx: "" },
	{ name: "Lead.crm"                  , idx: "" },
	{ name: "Opportunity.crm"           , idx: "" },
	{ name: "In progress.crm"           , idx: "" },
	{ name: "Won.crm"                   , idx: "" },
	{ name: "Abandoned.crm"             , idx: "" },
	{ name: "Todo.scrum"                , idx: "" },
	{ name: "Feature.scrum"             , idx: "" },
	{ name: "Bug report.scrum"          , idx: "" },
	{ name: "Wait for validation.scrum" , idx: "" },
	{ name: "Done.scrum"                , idx: "" },
	{ name: "Board Category.scrum"      , idx: "" },
	{ name: "CRM Category.crm"          , idx: "" }
];

/*
####################-End of data structure declarations-####################
*/

/****************************
		Init function
 ***********************
 ****************************/
function _init(){
	kxapi.getToken("Keeex cards", function(error, tok){
		if (error)
			return console.log(error);

		kxapi.setToken(tok.token);
		console.log(tok.token);

		async.series([
			function getKeeexedFolderPath(callback){
				kxapi.env('KEEEXED_PATH', function(error, apath){
					if(error)
						callback("KEEEXED_PATH");
					thisKEEEXED_PATH = apath.value;
					boardsPath = path.join(thisKEEEXED_PATH, '/boards/');
					fs.mkdir(boardsPath , function(error){
						if(error && error.code != 'EEXIST')
							console.error("Creating folder error", error);
					});
					callback(null);
				});
			},
			function verifyTags(callback){
				rootPath = path.dirname(utils.getDirName());
				async.eachSeries(predefinedTags, function(eachConcept, callback){
					kxapi.verify(rootPath+'/sys_tags/'+eachConcept.name, {'import':true}, function(error, verified){
						if(error){
							logDisplay("Verify "+eachConcept+" :"+error);
							return callback("verifyTags: "+error);
						}
						if (verified.verifiedStatus == 100)
						{
							setJSONArray(predefinedTags, eachConcept.name, verified.idx);
							predefinedTags2[eachConcept.name] = verified.idx;
						}
						// console.log("Verify "+eachConcept+" Ok. Status: ", verified.verifiedStatus);
						callback(null);
					});
				}, callback);
			},
			function loadContacts(callback){
				kxapi.getUsers(null, function(error, data){
					if(error)
						console.error("getting contacts error:", error);
					var contactObj = {};
					for (var i = 0; i < data.length; i++) {
						if(data[i].state == "ACCEPTED"){
							contactObj = {
								"name":data[i].name,
								"avatar":data[i].avatar,
								"profileIdx":data[i].profileIdx
							};
							displayContactList(contactObj, i);
						}
						contactList.push(contactObj);
					}
					callback(null);
				});
			},
			function interfaceEarly(callback){
				displayCurrentProfileAvatar();
				searchTags(0);
				saveBoardPopover();
				clicksOrKeyEvent();
				$('[data-toggle="tooltip"]').tooltip();
				$('#pageContainer').css('display', 'block');
				callback(null);
			}
		], function initSeries(error){
			if(error)
				console.error('Init series error', error);
			logDisplay('KeeeX Cards ready');
		});
	});
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
	const validOpt = [ "document", "description", "discussion", "comment", "agreed", "older_version" ];
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

function traverseJSONArray(theArray, key, val, retKey){
	return theArray.reduce((prev, cur) => {
		if (cur[key] === val) {
			return cur[retKey];
		}
		return prev;
	}, "");
}

function setJSONArray(theArray, name, val){
	var e = theArray.find((e) => { return e.name === name; });
	if (e) {
		e.idx = val;
	}
}

function sortByKey(array, key) {
	return array.sort(function(a, b) {
		var x = a[key]; var y = b[key];
		return (x.toLowerCase() < y.toLowerCase()) ? -1:
			(x.toLowerCase() > y.toLowerCase()) ? 1:0;
	});
}

function columnNegTags(array, cur, key1, key2){
	return array.filter((e) => {
		if (e === cur)
			return false;
		return true;
	}).reduce((prev, cur) => {
		prev.idx.push(cur[key1]);
		prev.concept.push(cur[key2]);
		return prev;
	}, {'idx': [], 'concept': []});
}

function searchParamsArray(array){
	return array.map((e) => {
		return {
			'columnSearchTopics': { "idx": [e.idx], "concept": [e.concept] },
			'columnSearchNegTopics': columnNegTags(array, e, "idx", "concept")
		};
	});
}

function cloneColumnsArray(){
	return columnsNameArray.map((e, i) => {
		return {
			'name': e.name,
			'columnsNumber': i,
			'columnSearchTopics': e.columnSearchTopics,
			'columnSearchNegTopics': e.columnSearchNegTopics
		};
	});
}

function displayCurrentProfileAvatar(){
	kxapi.getMine(function(error, profile){
		if(error)
			return logDisplay("getMine error");
		var profilName = ((profile.name).split(' '));
		//Display in main interface
		currentProfileAvatar = profile.avatar;
		$('#mainBarAvatarImg').attr('src', profile.avatar);
		$('#mainBarProfileName').text(''+profilName[0]);
		logDisplay("Current user"+": "+profilName[0] +' '+profilName[1]);
	});
}

function sharedListAvatars(idx, callback){
	kxapi.getShared(idx, function(error, lists){
		if(error){
			logDisplay("getShared error: " + error);
		}
		if(lists && lists.shared.length >0){
			kxapi.getUsers(lists.shared, function(error, users){
				if(error)
					logDisplay("Getting users error: "+error);
				else{
					callback(users);
				}
			});
		}else{
			callback(null);
		}
	});
}

function resetDisplay(tmp){
	//Reset flags
	newDrop = -1;
	boardToLoadFlag;
	negToken = 0;
	// Reset arrays
	columnsNameArray = [];
	columnsArrayIndex = 0;
	//Clear tags & re-generate
	$('#concepts').empty();
	searchTags(0);
	$('#conceptBar').css('display', 'block');
	$('#concepts').css('display', 'inline-block');
	$(".mainBarSubmitBtn").attr('disabled', false);
	//Empty mainContainer
	clearComponents();
	if(!tmp){
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
function searchTags(tmp){
	kxapi.search("", [conceptTypeIdx], [], null, null, {"concept":true}, function(error, conceptsReturned){
		if (error)
			return logDisplay("Get concepts error");
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
		if(tmp)
			logDisplay("Concepts reloaded");
	});
}
/*--End of searchTags--*/

/* wrapping keeex api in promise */
const searchTopics = (topics, negTopics, searchContentType) => {
	return new Promise((resolve, reject) => {
		kxapi.search("", topics, negTopics, null, maxToUpload, searchContentType.theObject, function(error, topicsReturned){
			if (error) reject(`search error: ${error}`);
			resolve(topicsReturned);
		});
	});
};

const getAuthorFromTopic = (topic) => {
	return new Promise((resolve, reject) => {
		kxapi.getAuthor(topic.idx, (error, author) => {
			if (error) reject(`getAuthorFromTopicIdx error: ${error}`);
			resolve(author);
		});
	});
};

const getSharedFromTopic = (topic) => {
	return new Promise((resolve, reject) => {
		kxapi.getShared(topic.idx, (error, sharedList) => {
			if (error) reject(`getSharedFromTopicIdx error: ${error}`);
			resolve(sharedList);
		});
	});
};

const getUsersFromList = (sharedList) => {
	return new Promise((resolve, reject) => {
		if (!sharedList || !sharedList.shared || sharedList.shared.length < 1) resolve(null);
		kxapi.getUsers(sharedList.shared, (error, users) => {
			if (error) reject(`getUsersFromList error: ${error}`);
			resolve(users);
		});
	});
};
/* / wrapping keeex api in promise */

/*
 * Add content to column
 */
const addColumnContent = (column, topicsReturned) => {

	topicsReturned.forEach((topic) => {
		const topicObject = { "data": topic, 'avatar': '', 'shared': [] };

		getAuthorFromTopic(topicObject.data)
			.then((author) => {
				topicObject.avatar = author;
				return getSharedFromTopic(topicObject.data);
			})
			.then(getUsersFromList)
			.then((users) => {
				topicObject.shared = users;
				generateColumnItem(column.columnNumber, column.nbItems, topicObject, 0);
				column.nbItems += 1;
			})
			.catch(logDisplay);
	});
	columnsNameArray.forEach((e, i) => {
		sideContainerColumnsList(i);
	});
};

/*
 * Search function used when forming board in custom mode
 */
function  customSearchTopics(columnId){
	if(columnId <= -1){
		return console.error("customSearchTopics: columnIndex error");
	}

	const column = columnsNameArray[columnId];

	searchTopics(column.columnSearchTopics.idx, column.columnSearchNegtopics.idx, searchContentType())
		.then((topicsReturned) => {
			if(!topicsReturned.length){
				return logDisplay(":/ No topics returned");
			}
			addColumnContent(column, topicsReturned);
		})
		.catch(logDisplay);
}
/*--End of customSearchTopics--*/

const displayBoardFromSearchParam = (searchParams) => {
	/*Ajax loader gif*/
	$('#mainContainer2').css('display', 'block');
	$('#mainContainer').css('display', 'none');

	var err = "";
	searchParams.some((eachOption) => {
		if (!eachOption.name)
			eachOption.name = eachOption.columnSearchTopics.concept[0];

		//Generate new column
		generateColumn(columnsNameArray.length, eachOption.name);
		const columnId = columnsNameArray.length - 1;
		const column = columnsNameArray[columnId];

		column.columnSearchTopics = eachOption.columnSearchTopics;
		if (eachOption.columnSearchNegTopics) {
			column.columnSearchNegTopics = eachOption.columnSearchNegTopics;
		} else {
			column.columnSearchNegTopics = { "idx": [], "concept": [] };
		}

		addTagToColumnUp(column.columnNumber, column.columnSearchTopics.concept, 0);
		addTagToColumnUp(column.columnNumber, column.columnSearchNegTopics.concept, 1);
		titleTooltipRoutine(column.columnNumber);

		searchTopics(column.columnSearchTopics.idx, column.columnSearchNegTopics.idx, searchContentType())
			.then((topicsReturned) => {
				if (!topicsReturned.length) {
					logDisplay(`${eachOption.name}: No topicsReturned!`);
				} else {
					addColumnContent(column, topicsReturned);
				}
			})
			.catch((error) => {
				logDisplay(`error on search: ${eachOption.name}`);
				err = error;
				return true;
			});
	});

	if (err !== "")
		console.error("scrum error: ", error);
	$('#mainContainer').css('display', 'block');
	$('#mainContainer2').css('display', 'none');
	$('#mainContainer').animate({scrollLeft: $('#mainContainer').get(0).scrollWidth}, 1000);
	columnsNameArray.forEach((e, i) => {
		sideContainerColumnsList(i);
	});
};

/*
 * Search function used in scrum mode
 */
function scrum(){
	resetDisplay(1);
	const workTrackingList = [
		{ "concept": "Todo"                , "idx": predefinedTags2["Todo.scrum"] || "" },
		{ "concept": "Feature"             , "idx": predefinedTags2["Feature.scrum"] || "" },
		{ "concept": "Bug Report"          , "idx": predefinedTags2["Bug Report.scrum"] || "" },
		{ "concept": "In Progress"         , "idx": predefinedTags2["In Progress.scrum"] || "" },
		{ "concept": "Wait for Validation" , "idx": predefinedTags2["Wait for Validation.scrum"] || "" },
		{ "concept": "Done"                , "idx": predefinedTags2["Done.scrum"] || "" }
	];
	displayBoardFromSearchParam(searchParamsArray(workTrackingList));
}
/*--End of scrum--*/

/*
 * Search function used in crm mode
 */
function crm(){
	resetDisplay(1);
	const workTrackingList = [
		{ "concept": ["Prospect"]    , "idx": [predefinedTags2["Prospect.crm"] || ""] },
		{ "concept": ["Lead"]        , "idx": [predefinedTags2["Lead.crm"] || ""] },
		{ "concept": ["Opportunity"] , "idx": [predefinedTags2["Opportunity.crm"] || ""] },
		{ "concept": ["In progress"] , "idx": [predefinedTags2["In progress.crm"] || ""] },
		{ "concept": ["Won"]         , "idx": [predefinedTags2["Won.crm"] || ""] },
		{ "concept": ["Abandoned"]   , "idx": [predefinedTags2["Abandoned.crm"] || ""] }
	];
	displayBoardFromSearchParam(searchParamsArray(workTrackingList));
}
/*--End of crm--*/


/*
 * Function used to restore a saved board
 */
function restoreBoard(columnsArray){
	resetDisplay(1);
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
	var From;

	//Get topic idx
	if(theType == "reference" || theType == "version"){
		From = theTopicIdx;
	}
	else if(theType == "agreement"){
		From = "";
	}
	else{
		return logDisplay("Specify topic type");
	}
	//Get column topics
	var topicsIdxs = columnsNameArray[columnId].columnSearchTopics.idx;

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
					searchTags(1);
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
	var columnTopics = columnsNameArray[columnNumber].columnSearchTopics.idx.slice(0);
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
					var columnItemNumber = columnsNameArray[columnNumber].nbItems;
					var columnItemData = {'data':keeexedFile.topic, 'avatar':currentProfileAvatar, 'shared':toShareIds};
					generateColumnItem(columnNumber, columnItemNumber, columnItemData, 1);
					columnsNameArray[columnNumber].nbItems +=1;
					logDisplay("Topic created ! ");
					//Clean file lds
					$('#itemTextarea'+columnNumber).val("");
					$('#itemInput'+columnNumber).val("");
					$('.addShare').remove();
					//hide block
					$('#item'+columnNumber+'-x').css('display', 'none');
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
function saveBoard(confName){
	var filePath = path.join(boardsPath, confName.topicName + "_bd.json");
	fs.open(filePath, "w", function(error, fd){
		if(error)
			console.log("Opening file error: ", error);
		console.log('File created');
		//Write in file
		fs.writeFile(filePath, JSON.stringify(cloneColumnsArray()), function(error){
			if(error)
				console.log("Writing configuration error: "+error);
			fs.close(fd);
		});
		// Keeex file now
		var  opt = {
			targetFolder:boardsPath,
			timestamp:false,
			name:confName.topicName
		};
		kxapi.keeex(filePath, [boardTypeIdx], [], confName.topicDescription,  opt, function(error, keeexedFile){
			if(error){
				logDisplay("Keeexing file error: "+error);
				return;
			}
			logDisplay("Board saved ! ");
			// Delete original file
			fs.unlink(filePath, function(error){
				if(error)
					console.log("Deleting file "+ path.parse(filePath).base +" error");
			});
		});
	});
}


/**
 * Function used to load saved boards configuration
 *
 */
function loadBoards(){
	$("#tableBody").empty();
	kxapi.search("", [boardTypeIdx], [], null, maxToUpload, searchContentType("document").theObject, function(error, topicsReturned){
		if(error){
			logDisplay("error on searching board: "+error);
			return ;
		}
		if(!topicsReturned.length){
			logDisplay("No board saved");
			return;
		}
		var i = 0;
		savedBoardsArray = [];
		async.eachSeries(topicsReturned, function(eachTopic, callback){
			kxapi.getLocations([eachTopic.idx], function(error, location){
				if(error){
					logDisplay("error on geting location: "+error);
					return callback(error);
				}
				var boardObj={
					name:(path.parse(location[0].location[0]).name).split("_bd_")[0],
					saved: eachTopic.creationDate
				};
				listingSavedBoards(boardObj, i);
				i++;
				savedBoardsArray.push({'idx':eachTopic.idx, 'path':location[0].location[0]});
				callback(null);
			});

		},function(error){
			if(error)
				console.log(error);
		});
		logDisplay("Boards loaded");
	});
}

//Sanitize inputs
//Verify file
function readLoadedBoard(flag){
	filePath = savedBoardsArray[flag].path;
	if (filePath !== "" && filePath.length > 1) {

		fs.open(filePath, 'r', function(error, fd){
			if(error)
				console.log("Opening file error: ", error);
			console.log('File Opened');
			fs.readFile(filePath , 'utf8', function(error, fileContent){
				if (error)
					return console.log("Reading file error");
				if(fileContent && fileContent.length >0){
					var processedContent = JSON.parse(fileContent.replace(/ *\/\*[^/]*\*\/ */g, ""));
				restoreBoard(processedContent);
			}else{
				logDisplay("Empty board file");
			}
			});
			fs.close(fd);
		});
	}
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
		if(columnsNameArray[columnIndex].columnSearchNegtopics.concept.indexOf(conceptVal) == -1){
			columnsNameArray[columnIndex].columnSearchNegtopics.concept.push(conceptVal);
			columnsNameArray[columnIndex].columnSearchNegtopics.idx.push(conceptsIdxArray[cnceptIdxIndex].idx);
		}
	}else{
		if(columnsNameArray[columnIndex].columnSearchTopics.concept.indexOf(conceptVal) == -1){
			columnsNameArray[columnIndex].columnSearchTopics.concept.push(conceptVal);
			columnsNameArray[columnIndex].columnSearchTopics.idx.push(conceptsIdxArray[cnceptIdxIndex].idx);
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

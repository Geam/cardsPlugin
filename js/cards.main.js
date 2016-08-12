/*
*	KeeeX Cards
*	
*	Copyright (c) 2016 KeeeX SAS 
*
*	This is an open source project available under the MIT license.
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
*
*
*	Author: Cheikh Ahmadou K. Savadogo   - savacheikh@gmail.com
*	
*	Date: June-August 2016
*/


/****************************
   	   		Modules
   ***********************
 ****************************/

var kxapi = require("./js/kxapi.js");
var components = require("./js/components.js");
var utils = require('./js/utils.js').utils;
var async = require("async");
var path = require("path");
var fs = require('fs');

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

var savedBoardsArray =[];
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

var predefinedTags = [
						{name:"Prospect.crm", idx:""}, 
						{name:"Lead.crm", idx:""},
						{name:"Opportunity.crm", idx:""}, 
						{name:"In progress.crm", idx:""},  
						{name:"Won.crm", idx:""}, 
						{name:"Abandoned.crm", idx:""}, 
						{name:"Todo.scrum", idx:""}, 
						{name:"Feature.scrum", idx:""}, 
						{name:"Bug report.scrum", idx:""}, 
						{name:"Wait for validation.scrum", idx:""}, 
						{name:"Done.scrum", idx:""},
						{name:"Board Category.scrum", idx:""}, 
						{name:"CRM Category.crm", idx:""}
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
		// console.log(tok.token);				
	 	
	 	async.series([
	 		function getKeeexedFolderPath(callback){
			 	kxapi.env('KEEEXED_PATH', function(error, apath){
					if(error)
						callback("KEEEXED_PATH");			
					thisKEEEXED_PATH = apath.value;
					boardsPath = path.join(thisKEEEXED_PATH, '/boards/');
					fs.mkdir(boardsPath , function(error){
						if(error && error.code != 'EEXIST')
							console.log("Creating folder error", error);						
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
						 }	
						// console.log("Verify "+eachConcept+" Ok. Status: ", verified.verifiedStatus);
						callback(null);
					});				
				}, callback);
			},
			function loadContacts(callback){
				kxapi.getUsers(null, function(error, data){
					if(error)
						console.log("getting contacts error:", error);
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
				console.log('Init series error', error);
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

function searchContentType(n){
	var option;
	switch(n){
		case 0: option = {theObject:{"document":true}, name:"document"};
			break;
		case 1: option = {theObject:{"discussion":true}, name:"discussion"};
			break;
		case 2: option = {theObject:{"concept":true}, name:"concept"};
			break;
		case 3: option = {theObject:{"comment":true}, name:"comment"};
			break;
		case 4: option = {theObject:{"agreed":true}, name:"agreed"};
			break;
		case 5: option = {theObject:{"older_version":true}, name:"older_version"};
			break;
		case 6: option = {theObject:{"description":true}, name:"description"};
			break; 
		default: option = { theObject:{	"document":true,
										"description":true, 
										"discussion":true, 
										"comment":true,
										"agreed":true, 
										"older_version":true
									 }, 
							name:"custom"
						};							
		}
	return option;	
}

function traverseJSONArray(theArray, key, val, retKey){
	for (var i = 0; i < theArray.length; i++) {
		if(theArray[i][key] == val){
			return theArray[i][retKey];
		}
	}
	return "";
}

function setJSONArray(theArray, name, val){
	for (var i = 0; i < theArray.length; i++) {
		if(theArray[i]["name"] == name){
			theArray[i]["idx"] = val;
			return;
		}
	}
}

function sortByKey(array, key) {
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return (x.toLowerCase() < y.toLowerCase()) ? -1: 
        	(x.toLowerCase() > y.toLowerCase()) ? 1:0;
    });
}

function columnNegTags(array, index, key1, key2){
	var toReturnObj ={"idx":[], "negConcepts":[]};
	for (var i = index+1; i < array.length; i++){
		toReturnObj.idx.push(array[i][key1]);
		toReturnObj.negConcepts.push(array[i][key2]);
	}
	return  toReturnObj;
}

function searchParamsArray(array){
	var finalArray = [];
	for (var i = 0; i < array.length; i++)
		finalArray[i] = {"topics": array[i], "negTopics":columnNegTags(array, i, "idx", "concept")};
	return finalArray;
}

function cloneColumnsArray(){
	var columnsArray = [];
	for (var i = 0; i < columnsNameArray.length; i++) {
		columnsArray[i] = {	
			name:columnsNameArray[i].name,
			columnNumber: i,
			columnSearchTopics:columnsNameArray[i].columnSearchTopics,						
			columnSearchNegtopics:columnsNameArray[i].columnSearchNegtopics
		};
	}
	return columnsArray;
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
	    conceptsIdxArray = [];
		for (var i = 0; i < conceptsReturned.length; i++) {				
					conceptsIdxArray.push({"name":conceptsReturned[i].name, "idx":conceptsReturned[i].idx});				
	    }
		conceptsIdxArray = sortByKey(conceptsIdxArray, 'name'); 
		for (var i = 0; i < conceptsReturned.length; i++) {
				displayConcepts(conceptsIdxArray[i].name, i);
				if(conceptsReturned[i].name == "")
					$("#cncpt"+i).css('display', 'none');
		}    
		if(tmp)
			logDisplay("Concepts reloaded");
	});
}
/*--End of searchTags--*/

/*
* Search function used when forming board in custom mode
*/
function  customSearchTopics(columnId){
	var topics = [];
	var negtopics = [];

	if(columnId <= -1){
		return console.log("customSearchTopics: columnIndex error");
	}
	
	topics = columnsNameArray[columnId].columnSearchTopics.idx;
	negtopics = columnsNameArray[columnId].columnSearchNegtopics.idx;
	
	console.log("topics: ", topics);
	console.log("negtopics: ", negtopics);
	kxapi.search("", topics, negtopics, null, maxToUpload, searchContentType(7).theObject, function(error, topicsReturned){
		if(error){
			var msg ="error on search: "+error;
			return logDisplay(msg);			
		}
		else{
			console.log("customSearchTopics|TopicsReturned: ", topicsReturned.length);
			if(!topicsReturned.length){
				var msg = ":/ No topicsReturned";
				logDisplay(msg);
			}			
			async.eachSeries(topicsReturned, function(eachTopic, callback2){
				var  itemObject ={"data":eachTopic, 'avatar':'', 'shared':[]};
				async.series(
				[
				function cGetAuthor(callback){
					kxapi.getAuthor(eachTopic.idx, function(error, author){
						if(error){
							var msg = "scrum | getAuthor error";
							logDisplay(msg);
						}
						itemObject.avatar = author.avatar;
						callback(null);						
					})
				},
				function cSharedAvatars(callback){
					sharedListAvatars(eachTopic.idx, function(users){
						if(users && users.length>0)
							itemObject.shared = users;
						callback(null);						
					})
				}	
				], function final(){
					generateColumnItem(columnId, columnsNameArray[columnId].nbItems, itemObject, 0);
					columnsNameArray[columnId].nbItems +=1;
					callback2(null);
				});								
			}, function(error){
				for (var i = 0; i < columnsNameArray.length; i++) {
					sideContainerColumnsList(i);
				}
				if(error)
					console.log(error);
			});
		}
	});
}
/*--End of customSearchTopics--*/

/*
* Search function used in scrum mode
*/
function scrum(){
	resetDisplay(1);
	var todoIdx = traverseJSONArray(predefinedTags, 'name', 'Todo.scrum', 'idx');
	var featureIdx = traverseJSONArray(predefinedTags, 'name', 'Feature.scrum', 'idx');
	var bugRepIdx = traverseJSONArray(predefinedTags, 'name', 'Bug report.scrum', 'idx');
	var inProgressIdx = traverseJSONArray(predefinedTags, 'name', 'In progress.crm', 'idx');
	var waitIdx = traverseJSONArray(predefinedTags, 'name', 'Wait for Validation.scrum', 'idx');
	var doneIdx = traverseJSONArray(predefinedTags, 'name', 'Done.scrum', 'idx');
	var workTrackingList = [{"concept":"Todo", "idx":todoIdx},
							{"concept":"Feature", "idx":featureIdx},
							{"concept":"Bug Report", "idx":bugRepIdx},
							{"concept": "In Progress", "idx":inProgressIdx},
							{"concept":"Wait for Validation", "idx":waitIdx},
							{"concept": "Done", "idx":doneIdx}
						   ];   
	var searchParams = searchParamsArray(workTrackingList);
	
	/*Ajax loader gif*/
	$('#mainContainer2').css('display', 'block');
	$('#mainContainer').css('display', 'none');
	async.eachSeries(searchParams, function(eachOption, callback){
		kxapi.search("", [eachOption.topics.idx], eachOption.negTopics.idx, null, maxToUpload, searchContentType(7).theObject, function(error, topicsReturned){
			if(error){
				var msg = "error on search: "+eachOption.topics.concept;
				logDisplay(msg);
				return callback(error);
			}
			if(!topicsReturned.length){
				var msg = eachOption.topics.concept +": No topicsReturned!";
				logDisplay(msg);
			}
			//Generate new column
			generateColumn(columnsNameArray.length, eachOption.topics.concept);
			var columnNumber = columnsNameArray.length-1;
			columnsNameArray[columnNumber].columnSearchTopics.concept.push(eachOption.topics.concept);
			columnsNameArray[columnNumber].columnSearchTopics.idx.push(eachOption.topics.idx);
			addTagToColumnUp(columnNumber, eachOption.topics.concept, 0);
    		columnsNameArray[columnNumber].columnSearchNegtopics.concept = eachOption.negTopics.negConcepts;
			columnsNameArray[columnNumber].columnSearchNegtopics.idx = eachOption.negTopics.idx;
			addTagToColumnUp(columnNumber, eachOption.negTopics.negConcepts, 1);
			titleTooltipRoutine(columnNumber);
			
			async.eachSeries(topicsReturned, function(eachTopic, callback2){
				var  itemObject ={"data":eachTopic, 'avatar':'', 'shared':[]};;
				async.series(
				[
				function cGetAuthor(callback){
					kxapi.getAuthor(eachTopic.idx, function(error, author){
						if(error){
							var msg = "scrum | getAuthor error";
							logDisplay(msg);
						}
						itemObject.avatar = author.avatar;
						callback(null);						
					})
				},
				function cSharedAvatars(callback){
					sharedListAvatars(eachTopic.idx, function(users){
						if(users && users.length>0)
							itemObject.shared = users;
						callback(null);						
					})
				}	
				], function final(){
					generateColumnItem(columnNumber, columnsNameArray[columnNumber].nbItems, itemObject, 0);
					columnsNameArray[columnNumber].nbItems +=1;
					callback2(null);
				});								
			}, callback);
		});
	}, function(error){
		if (error)
			console.log("scrum error: ", error);
		$('#mainContainer').css('display', 'block');
	    $('#mainContainer2').css('display', 'none');
		$('#mainContainer').animate({scrollLeft: $('#mainContainer').get(0).scrollWidth}, 1000);		
		for (var i = 0; i < columnsNameArray.length; i++) {
			sideContainerColumnsList(i);
		}
	});
}
/*--End of scrum--*/

/*
* Search function used in crm mode
*/
function crm(){
	resetDisplay(1);
	var prospectIdx = traverseJSONArray(predefinedTags, 'name', 'Prospect.crm', 'idx');
	var leadIdx = traverseJSONArray(predefinedTags, 'name', 'Lead.crm', 'idx');
	var opportunityIdx = traverseJSONArray(predefinedTags, 'name', 'Opportunity.crm', 'idx');
	var inProgressIdx = traverseJSONArray(predefinedTags, 'name', 'In progress.crm', 'idx');
	var wonIdx = traverseJSONArray(predefinedTags, 'name', 'Won.crm', 'idx');
	var abandonedIdx = traverseJSONArray(predefinedTags, 'name', 'Abandoned.crm', 'idx');
	var workTrackingList = [{"concept":"Prospect", "idx":prospectIdx},
							{"concept":"Lead", "idx":leadIdx},
							{"concept":"Opportunity", "idx":opportunityIdx},
							{"concept": "In progress", "idx":inProgressIdx},
							{"concept":"Won", "idx":wonIdx},
							{"concept": "Abandoned", "idx":abandonedIdx}
						   ];   
	var searchParams = searchParamsArray(workTrackingList);	
	/*Ajax loader gif*/
	$('#mainContainer2').css('display', 'block');
	$('#mainContainer').css('display', 'none');
	async.eachSeries(searchParams, function(eachOption, callback){
		kxapi.search("", [eachOption.topics.idx], eachOption.negTopics.idx, null, maxToUpload, searchContentType(7).theObject, function(error, topicsReturned){
			if(error){
				var msg = "error on search: "+eachOption.topics.concept;
				logDisplay(msg);
				return callback(error);
			}
			if(!topicsReturned.length){
				var msg = eachOption.topics.concept +": No topicsReturned!";
				logDisplay(msg);				
			}
			//Generate new column
			generateColumn(columnsNameArray.length, eachOption.topics.concept);
			var columnNumber = columnsNameArray.length-1;
    		columnsNameArray[columnNumber].columnSearchTopics.concept.push(eachOption.topics.concept);
			columnsNameArray[columnNumber].columnSearchTopics.idx.push(eachOption.topics.idx);
    		addTagToColumnUp(columnNumber, eachOption.topics.concept, 0);
    		columnsNameArray[columnsNameArray.length-1].columnSearchNegtopics.concept = eachOption.negTopics.negConcepts;
			columnsNameArray[columnsNameArray.length-1].columnSearchNegtopics.idx = eachOption.negTopics.idx;
			addTagToColumnUp(columnNumber, eachOption.negTopics.negConcepts, 1);
			titleTooltipRoutine(columnNumber);
			
			async.eachSeries(topicsReturned, function(eachTopic, callback2){
				var  itemObject ={"data":eachTopic, 'avatar':'', 'shared':[]};;
				async.series(
				[
				function cGetAuthor(callback){
					kxapi.getAuthor(eachTopic.idx, function(error, author){
						if(error){
							var msg = "scrum | getAuthor error";
							logDisplay(msg);
						}
						itemObject.avatar = author.avatar;
						callback(null);						
					})
				},
				function cSharedAvatars(callback){
					sharedListAvatars(eachTopic.idx, function(users){
						if(users && users.length>0)
							itemObject.shared = users;
						callback(null);						
					})
				}	
				], function final(){
					generateColumnItem(columnNumber, columnsNameArray[columnNumber].nbItems, itemObject, 0);
					columnsNameArray[columnNumber].nbItems +=1;
					callback2(null);
				});								
			}, callback);
		});
	}, function(error){
		if (error)
			console.log("crm error: ", error);
		$('#mainContainer').css('display', 'block');
	    $('#mainContainer2').css('display', 'none');
		$('#mainContainer').animate({scrollLeft: $('#mainContainer').get(0).scrollWidth}, 1000);		
		for (var i = 0; i < columnsNameArray.length; i++) {
			sideContainerColumnsList(i);
		}
	});
}
/*--End of crm--*/


/*
* Function used to restore a saved board
*/
function restoreBoard(columnsArray){
	resetDisplay(1);
	/*Ajax loader gif*/
	$('#mainContainer2').css('display', 'block');
	$('#mainContainer').css('display', 'none');
	async.eachSeries(columnsArray, function(column, callback){
		kxapi.search("", column.columnSearchTopics.idx, column.columnSearchNegtopics.idx, null, maxToUpload, searchContentType(7).theObject, function(error, topicsReturned){ 
			if(error){
				logDisplay("Restoring failed !");
				return;
			}
			if(!topicsReturned.length){
				logDisplay("Restoring board: No topicsReturned!");				
			}
			else{
				//Generate new column
				generateColumn(column.columnNumber, column.name);
				columnsNameArray[column.columnNumber].columnSearchTopics.concept = column.columnSearchTopics.concept;
				columnsNameArray[column.columnNumber].columnSearchTopics.idx = column.columnSearchTopics.idx;
				addTagToColumnUp(column.columnNumber, column.columnSearchTopics.concept, 0);
	    		columnsNameArray[column.columnNumber].columnSearchNegtopics.concept =  column.columnSearchNegtopics.concept;
				columnsNameArray[column.columnNumber].columnSearchNegtopics.idx = column.columnSearchNegtopics.idx;
				addTagToColumnUp(column.columnNumber, column.columnSearchNegtopics.concept, 1);
				titleTooltipRoutine(column.columnNumber);
				
				//Get each topic author's avatar
				var i = 0;
				async.eachSeries(topicsReturned, function(eachTopic, callback2){
					var  itemObject ={"data":eachTopic, 'avatar':'', 'shared':[]};;
					async.series(
					[
					function cGetAuthor(callback){
						kxapi.getAuthor(eachTopic.idx, function(error, author){
							if(error){
								var msg = "RestoreBoard | getAuthor error";
								logDisplay(msg);
							}
							itemObject.avatar = author.avatar;
							callback(null);						
						})
					},
					function cSharedAvatars(callback){
						sharedListAvatars(eachTopic.idx, function(users){
							if(users && users.length>0)
								itemObject.shared = users;
							callback(null);						
						})
					}	
					], function final(){
						generateColumnItem(column.columnNumber, columnsNameArray[column.columnNumber].nbItems, itemObject, 0);
						columnsNameArray[column.columnNumber].nbItems +=1;
						callback2(null);
					});								
				}, callback);
			}	
		});
	}, function(error){
		if(error)
			return console.log(error);
		$('#mainContainer').css('display', 'block');
	    $('#mainContainer2').css('display', 'none');
		$('#mainContainer').animate({scrollLeft: $('#mainContainer').get(0).scrollWidth}, 1000);		
		for (var i = 0; i < columnsNameArray.length; i++) {
			sideContainerColumnsList(i);
		}		
		logDisplay("Board restored");			
	});
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
		if((data.name !="") && (data.name.length >1)){
			kxapi.generateFile(data.name, data.description, null, function(error, filePath){
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

	if((topicName !="") && (topicName.length >1)){
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
        		console.log(error);
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
	kxapi.search("", [boardTypeIdx], [], null, maxToUpload, searchContentType(0).theObject, function(error, topicsReturned){
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
	if(filePath !="" && filePath.length > 1){

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
    	var columnName = upColumn.parent().parent().parent().attr('id');
    	columnIndex =  Number((ev.toElement.id).replace("formTags", ''));
    }
    else{
	    upColumn.find('.columnUpTitle').remove();
    	upForm.css('display', 'block');
    	upColumn.css('background-color', '#F0F0F0');
    	upForm.find('ul').tagit('createTag', conceptVal);
    	var columnName = upColumn.parent().attr('id');
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
		var searchSplit = searchTerm.replace(/ /g, "'):containsi('")

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
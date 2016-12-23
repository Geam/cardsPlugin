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
			Tile functions
 ***********************
 ****************************/

const contactSelectTemplate = (u) => {
	if (!u.id) { return u.text; }
	const user = contactList.find((e) => e.profileIdx === u.id);
	return dom.contactSelectListTemplate(user);
};

const contactSelectTokenTemplate = (u) => {
	if (!u.id) { return u.text; }
	const user = contactList.find((e) => e.profileIdx === u.id);
	return dom.contactSelectTokenTemplate(user);
};

/**
 * Function genarating column element
 *
 * @param {Object} column
 * @param {Object} data to be inserted in column element
 * @param {boolean} insert as firt or last
 */
function generateColumnItem(column, tile, first) {
	column.listedTopics.push(tile);
	const domTile = dom.generateTile(column, tile, first);
	$(domTile).click((e) => {
		e.preventDefault();
		itemInfo(tile.data);
	});
	$(domTile).find('[data-toggle="tooltip"]').tooltip({ "container": "body" });

	const addShare = $(domTile).find(`#addShare${tile.domId}`);

	// init contact list
	const contactSelect = $(domTile).find(`#tileContactSelect${tile.domId}`).select2({
		"data": contactList.map((e) => {
			return {
				"id": e.profileIdx,
				"text": e.name
			};
		}),
		"templateResult": contactSelectTemplate,
		"templateSelection": contactSelectTokenTemplate
	});

	// display tile ctrl div
	addShare.click((e) => {
		if (handleSharingClick(column, tile, contactSelect,
				dom.qs(`#sharedList${tile.domId}`)))
			dom.showTileAddShare(tile);
	});

	// validate sharing
	$(`#tileAddContactValidate${tile.domId}`).click((e) => {
		dom.hideTileAddShare(tile);
		const userList = contactSelect.val();
		const target = addSharing.target;
		addSharing = {};
		kxapiPromise.share(tile.data.idx, tile.data.location[0], userList)
			.then((sharedAnswer) => {
				userList.forEach((idx) => {
					const user = contactList.find((e) => e.profileIdx === idx);
					tile.shared.push(user);
					dom.addShare(target, user, true);
				});
			})
			.catch(console.error);
		contactSelect.val(null).trigger("change");
	});

	// cancel sharing
	$(`#tileAddContactCancel${tile.domId}`).click((e) => {
		dom.hideTileAddShare(tile);
		addSharing = {};
	});
}

/**
 * Function for genarating column element manually
 *
 * @param {Object} column
 */
function generateAddColumnItem(column, domColumn) {
	const jqueryDomColumn = $(domColumn);
	/* Actions */
	$(`#itemInput${column.id}-x`).focus();

	// init contact list
	const contactSelect = $(`#addItemShareList${column.id}`).select2({
		"data": contactList.map((e) => {
			return {
				"id": e.profileIdx,
				"text": e.name
			};
		}),
		"templateResult": contactSelectTemplate,
		"templateSelection": contactSelectTokenTemplate
	});

	// click on new topic "cancel"
	jqueryDomColumn.find(".addItemCancelWrapper").click(function(e){
		dom.hideColumnNewTopic(column);
		addSharing = {};
	});

	// click on new topic "add"
	jqueryDomColumn.find(".addItemBtn").click(function(e) {
		const topicName = $(`#itemInput${column.id}`).val();
		const topicDescription = $('#itemTextarea'+column.id).val();
		createTopic(column, topicName, topicDescription);
		dom.hideColumnNewTopic(column);
		addSharing = {};
	});

	// Clicking on column + to add topic
	$(`#columnUpRightIconWrapper${column.id}`).click((e) => {
		if (handleSharingClick(column, null, contactSelect,
				dom.qs(`#addItemShareList${column.id}`)))
			dom.showColumnNewTopic(column);
	});
}

/**
 * Function genarating column
 *
 * @param {Integer} column number
 * @param {String} column title
 */
function generateColumn(columnNumber, columnTitle) {
	let column = {
		"id": columnNumber,
		"name": columnTitle,
		"nbItems": 0,
		"topics": {
			"concept": [],
			"idx": []
		},
		"negtopics": {
			"concept": [],
			"idx": []
		},
		listedTopics: []
	};

	// generate grid before generating column
	dom.generateGrid(column.id);
	const domColumn = dom.generateColumn(column);
	$(`#divGrid${column.id}`).append(domColumn);

	/*------------------------------ Actions/Events ----------------------------*/
	/*
	if(!column.name){
		spanColumnTitle = $('<span>SearchFilter '+column.id+'</span>');
	}
	*/
	const domTag = $(domColumn).find(".formTags");
	domTag.tagit({
		availableTags: conceptsIdxArray.map((e) => e.name),
		beforeTagAdded: function(event, ui) {
			const concept = conceptsIdxArray.find((e) => e.name === ui.tagLabel);
			const target = $(ui.tag);
			if (!concept) {
				// if tag doesn't exist, hightlight text and quit
				domTag.data("ui-tagit").tagInput.css("color", "red");
				setTimeout(() => {
					domTag.data("ui-tagit").tagInput.css("color", "#333333");
				}, 1000);
				return false;
			}

			// if case of restoring board, do not add concept to column
			const filter = e => e === concept.name;
			if (column.topics.concept.find(filter)) {
				return ;
			} else if (column.negtopics.concept.find(filter)) {
				target.addClass('negTopic');
				return ;
			}

			// if typing the tag, add it to column
			column.topics.idx.push(concept.idx);
			column.topics.concept.push(concept.name);
			newDrop = true;
			clearColumnElements(column);
		},
		afterTagRemoved: function(event, ui) {
			const target = $(ui.tag);
			const source = target.hasClass('negTopic') ? "negtopics" : "topics";
			const i = column[source].concept.indexOf(ui.tagLabel);
			column[source].concept.splice(i, 1);
			column[source].idx.splice(i, 1);
			newDrop = true;
			clearColumnElements(column);
		},
		onTagClicked: (event, ui ) => {
			// toggle neg tag when clicked
			const target = $(ui.tag);
			const [source, destination] = target.hasClass('negTopic') ? [ "negtopics", "topics" ] : [ "topics", "negtopics" ];
			const i = column[source].concept.indexOf(ui.tagLabel);
			column[destination].concept.push(column[source].concept[i]);
			column[destination].idx.push(column[source].idx[i]);
			column[source].concept.splice(i, 1);
			column[source].idx.splice(i, 1);
			target.toggleClass("negTopic");
		},
		readOnly: false,
		allowDuplicates: false,
		placeholderText: "Add concept"
	});

	/* Form submission */
	$(domColumn).find('.columnUpForm').submit(function(e){
		e.preventDefault();
	});

	// validate form by clickig button
	$(`#colInput${column.id}`).click((e) => {
		e.preventDefault();
		$(`#columnUp${column.id}`).prepend($(`#columnUpTitle${column.id}`));
		onSubmitSearch(column);
	});

	// Edit column
	$(`#columnUpRightIcon2Wrapper${column.id}`).click((e) => {
		dom.showColumnEdit(column);
	});

	// change title by pressing enter
	$(`#columnUpTitleInput${column.id}`).keyup(function(e){
		if (e.which == 13) {
			titleChange(column);
		}
	});

	/*Apply sortable*/
	$(`#columnMiddleUl${column.id}`).sortable({
		connectWith: ".columnMiddleUl",
		handle: ".itemLiWrapper, .itemWrapper",
		placeholder: "sortablePlaceholder",
		stop: function(event, ui) {
			const itemId = ui.item.attr('id');
			const oldColumnId = Number(((itemId).split("-")[0]).replace('itemLiWrapper', ''));
			const newColumnId = Number(($(ui.item).parent().attr('id')).replace('columnMiddleUl', ''));

			if (oldColumnId == newColumnId) return ;

			const oldColumn = columnsNameArray[oldColumnId];
			const newColumn = columnsNameArray[newColumnId];

			const oldItemNum = Number(itemId.split("-")[1]);
			const newItemNum = newColumn.nbItems;
			const tile = oldColumn.listedTopics[oldItemNum];
			const oldTile = Object.assign({}, tile);
			tile.domId = `${newColumnId}-${newItemNum}`;

			//Change itemId
			$('#' + itemId).attr('id', `itemLiWrapper${tile.domId}`);
			$(`#item${oldTile.domId}`).attr('id', `item${tile.domId}`);
			//push
			newColumn.listedTopics.push(tile);
			newColumn.nbItems += 1;
			for (var i = oldItemNum; i < oldColumn.listedTopics.length; i++) {
				var x = i+1;
				$('#itemLiWrapper'+oldColumnId+'-'+x).attr('id', 'itemLiWrapper'+oldColumnId+'-'+i);
				$('#item'+oldColumnId+'-'+x).attr('id', 'item'+oldColumnId+'-'+i);
			}
			$("#itemLiWrapper"+newColumnId+'-x').prependTo('#columnMiddleUl'+newColumnId);
			//Add reference
			updateTopicRef(tile, "reference", newColumn)
			.then(() => {
				clearColumnElements(oldColumn);
				doSearch(oldColumn);
			});
		}
	});

	generateAddColumnItem(column, domColumn);

	/* Record column in columnsNameArray*/
	columnsNameArray.push(column);
	columnsArrayIndex +=1;
	return column;
}

/**
 * Function for adding new column to the board
 *
 */
function addNewColumn() {
	generateColumn(columnsArrayIndex, `column${columnsArrayIndex}`);
	$(".columnUpRightIconWrapper").css('display', 'inline');
	$(".columnUpRightIcon2Wrapper").css('display', 'inline');
}

/****************************************************************************/


/* column Up Form submit handling
 ***************************************************************************
 */

/**
 * Function executed when submit search criteria
 *
 * @param {event} [click] event
 * @param {Integer} column number
 */
function onSubmitSearch(column) {
	//Process tags
	if (newDrop) {
		customSearchTopics(column.id);
		newDrop = false;
	}

	titleChange(column);
}

/* Editing
 ***************************************************************************
 */

/*
 * Function used by titleEditRoutine
 */
function titleChange(column) {
	const newTitle = $(`#columnUpTitleInput${column.id}`).val();

	if (newTitle !== "" && newTitle != column.name) {
		//Update array
		column.name = newTitle;
		sideContainerColumnsList(column.id);
	}

	dom.hideColumnEdit(column);
}

/**
 * Function to handle column search tags
 *
 * @param {Integer} column number
 */
function titleTooltipRoutine(column) {
	$(`#spanColumnTitleWrapper${column.id}`).attr('data-toggle', "tooltip");
	$(`#spanColumnTitleWrapper${column.id}`).attr('data-html', "true");
	$(`#spanColumnTitleWrapper${column.id}`).attr("data-placement", "bottom");
	var titleText = column.topics.concept.reduce((prev, cur) => {
		return prev.concat(`+${cur}<br>`);
	}, "");
	titleText = column.negtopics.concept.reduce((prev, cur) => {
		return prev.concat(`--${cur}<br>`);
	}, titleText);
	$(`#spanColumnTitleWrapper${column.id}`).attr('title', titleText);
	$('[data-toggle="tooltip"]').tooltip();
}

/**
 * Function handling add of search tag in predefined boards(scrum, crm)
 *
 * @param {Integer} column number
 * @param {String}  tag value
 * @param {Integer} flag
 */
function addTagToColumnUp(column) {
	const domTag = $(`#columnUpForm${column.id}`).find("ul");
	column.topics.concept.forEach((e) => {
		domTag.tagit("createTag", e);
	});
	column.negtopics.concept.forEach((e) => {
		domTag.tagit("createTag", e);
	});
}

/*
 ***************************************************************************
 */
const handleSharingClick = (column, tile, select, target) => {
	if ((tile && tile === addSharing.tile) || (!tile && column == addSharing.column)) {
		return false;
	} else if (addSharing.tile) {
		dom.hideTileAddShare(addSharing.tile);
	} else if (addSharing.column) {
		dom.hideColumnNewTopic(addSharing.column);
	}
	if (addSharing.select)
		addSharing.select.val(null).trigger("change");
	addSharing = { column, tile, target, select };
	return true;
};

/* Clear out elements in the DOM
 ***************************************************************************
 */

/**
 * Function used to reset the board
 *
 */
function clearComponents(){
	$("#mainContainer").empty();
	$("#sideContainerColumnsUl").empty();
	$("#sideContainerItemInfoContent").empty();
	$("#sideContainerLogsUl").empty();
}

/**
 * Function used to clear properly column elements
 *
 * @param {Integer} column number
 * @param {Integer} flag
 */
function clearColumnElements(column){
	$(`#column${column.id}`).find('.columnMiddle').find(`.itemLiWrapper:not("#itemLiWrapper${column.id}-x ")`).remove();
	//Clear search arrays
	column.nbItems = 0;
	column.listedTopics = [];
	console.log(`column ${column.id} cleared`);
}

/****************************************************************************/


/* Side Container
 ***************************************************************************
 */

/**
 * Function used to display information of displayed column
 *
 * @param {Integer} column number
 */
function sideContainerColumnsList(columnNumber, nbItems) {
	const column = columnsNameArray[columnNumber];
	var sideContainerColumnsLi = $('<li></li>');
	var numbSpan = $('<span></span>');
	var nameSpan = $('<span></span>');

	sideContainerColumnsLi.attr('class', 'list-group-item');
	sideContainerColumnsLi.attr('id', 'list-group-li-' + column.id);
	nameSpan.attr('id', 'sideNameSpan'+column.id);
	numbSpan.attr('id', 'sideNumbSpan'+column.id);
	numbSpan.attr('class', 'badge');

	if ($("#list-group-li-"+columnNumber).length) {
		$("#list-group-li-"+columnNumber).find('span').empty();
		$("#sideNumbSpan"+columnNumber).text(nbItems || column.nbItems);
		$('#sideNameSpan'+columnNumber).text(column.name);
	} else {
		numbSpan.text(nbItems || column.nbItems);
		nameSpan.text(column.name);
		sideContainerColumnsLi.append(nameSpan);
		sideContainerColumnsLi.append(numbSpan);
		$('#sideContainerColumnsUl').append(sideContainerColumnsLi);
	}
}

/**
 * Function used to display information of a topic
 *
 * @param {Object} object containing information that will be displayed
 */
function itemInfo(msgObject){
	const formatDate = (date) => {
		return `${date.getHours()}h${date.getMinutes()}mn${date.getSeconds()}s, ` +
			`${date.getDate()}/${date.getMonth()}`;
	};

	var line1 = $('<p></p>');
	var line2 = $('<p></p>');
	var line3 = $('<p></p>');
	var line4 = $('<p></p>');
	var line5 = $('<p></p>');
	const lastModifyDate = new Date(msgObject.lastModify);
	const creationDateDate = new Date(msgObject.creationDate);

	const lastModifyTimeAndDate = formatDate(lastModifyDate);
	const creationTimeAndDate = formatDate(creationDateDate);

	line1.append("<strong class=\'text-primary\'>Idx: </strong><span>"+(msgObject.idx).split('-')[0]+'</span>');
	line2.append("<strong class=\'text-primary\'>Name: </strong><span>"+msgObject.name+'</span>');
	line3.append("<strong class=\'text-primary\'>Description: </strong><span>"+msgObject.description+'</span>');
	line4.append("<strong class=\'text-primary\'>Creation date: </strong><span>"+creationTimeAndDate+'</span>');
	line5.append("<strong class=\'text-primary\'>Last modify: </strong><span>"+lastModifyTimeAndDate+'</span>');

	$("#sideContainerItemInfoContent").empty();
	$('#sideContainerItemInfoContent').append(line1);
	$('#sideContainerItemInfoContent').append(line2);
	$('#sideContainerItemInfoContent').append(line3);
	$('#sideContainerItemInfoContent').append(line4);
	$('#sideContainerItemInfoContent').append(line5);
}

/**
 * Function used to trigger sideContainer hidding
 *
 */
function sideContainerHide(){
	var that = $('.sideDivHead').find('.glyphicon');
	if(that.hasClass('glyphicon-arrow-right')){
		$('#sideContainer').animate({'width':'50px'});
		$('.sideDivHead').css('height', '35px');
		$('#sideDivHeadText').css('display', 'none');
		$('#sideMainContainer').css('display', 'none');
		that.removeClass('glyphicon-arrow-right').addClass('glyphicon-arrow-left');
		$('#mainContainer').animate({'width': '97%'});

	}
	else if(that.hasClass('glyphicon-arrow-left')){
		$('#mainContainer').animate({'width': '85%'});
		$('#sideContainer').animate({'width':'250px'});
		$('.sideDivHead').css('height', 'auto');
		$('#sideMainContainer').css('display', 'block');
		$('#sideDivHeadText').css('display', 'inline');
		$('.sideDivHead').find('.glyphicon').removeClass('glyphicon-arrow-left');
		$('.sideDivHead').find('.glyphicon').addClass('glyphicon-arrow-right');
	}
}

/**
 * Function used to display log information on the activity part
 *
 * @param {Object} object containing information that will be displayed
 */
function logDisplay(msg) {
	var sideContainerLogsLi = $('<li></li>');

	sideContainerLogsLi.attr('class', 'list-group-item');
	sideContainerLogsLi.append(msg);
	$('#sideContainerLogsUl').append(sideContainerLogsLi);
	$('#sideContainerLogs').animate({scrollTop: $('#sideContainerLogsUl').css('height')}, 500);
	console.log(msg);
}

/* Creating/Saving/Listing Board
 **************************************************************************
 */

/**
 * Function used to genarate saving board pop up
 *
 */
function saveBoardPopover() {
	const newversionWrapper = $("#save_newversion_wrapper");
	const nameInput = $("#save_topicname");
	const descInput = $("#save_topicdesc");
	const newversionInput = $("#save_newversion");

	if (currentBoard) {
		newversionWrapper.show();
		nameInput.val(currentBoard.name);
		descInput.val(currentBoard.description);
	}
	$("#save-form").submit(function (e) {
		e.preventDefault();
		$("#save-modal").modal('hide');
		newversionWrapper.hide();
		if (nameInput.val() === "" || nameInput.val().length <= 1) return ;
		saveBoard({
			topicName: nameInput.val(),
			topicDescription: descInput.val(),
			topicNewVersion: newversionInput.prop("checked")
		});
		nameInput.val("");
		descInput.val("");
		newversionInput.prop("checked", false);
	});
}


/**
 * Function used to genarate restoring board pop up
 *
 */
function listingSavedBoards(boardObj, i){
	var appendingLine = $('<tr></tr>');
	var tdNumb = $('<td></td>');
	var tdBoard = $('<td></td>');
	var tdSavedOn = $('<td></td>');

	var tdLink = $("<a href='#' class='tdLinks' data-dismiss='modal'>"+boardObj.name+"</a>");
	tdNumb.append(i);
	tdBoard.attr('id', 'brd'+i);
	tdBoard.append(tdLink);
	tdSavedOn.append(boardObj.saved);
	appendingLine.append(tdNumb);
	appendingLine.append(tdBoard);
	appendingLine.append(tdSavedOn);

	tdLink.click(function(event){
		boardToLoadFlag = Number($(this).parent().attr("id").replace('brd', ''));
		readLoadedBoard(savedBoardsArray[boardToLoadFlag]);
	});
	$("#tableBody").append(appendingLine);
}

/*
keeex self xovem-ketel-lotoh-camoh-gocus-butom-dolyt-vokug-bisyd-tulyg-buhob-zuguh-surom-cezal-kulys-dozik-dyxax , {main} xeeek
keeex self 1UagFyxciBqwtcr3HouYpbpiiDkhPnBuCJ6KwFi , {alg:sha224,enc:b58,recursive:1} xeeek
keeex name "components.js" , {main} xeeek
keeex prop "kx.author", "resat-tutym-betav-binoh-refav-kobic-pehos-halig-lymar-rageb-bafoc-rikus-hulak-bukof-budeg-lerek-byxor" xeeek
keeex ref "ropoh-zigec-vulun-zocok-gezin-mazim-kemov-somuh-bacoc-bonut-kogef-duzev-bykom-tofyl-nusuc-vupyl-pyxyr" , {mine} xeeek
keeex signer rerom-cityz-bivyc-ralav-bumon-mudyh-hocyr-pikyv-sysyz-cunat-gesiz-lipig-cozof-harif-sapor-gacaf-nixer xeeek
keeex prop "kx.time", "Fri, 12 Aug 2016 09:38:27 GMT" xeeek
keeex prop "kx.pattern", "%f_kx_$1-$2" xeeek
keeex prop "kx.publickey", "1Lht9GuEcDvF3m7WUUv8igY4zKcQs6tyBR", {bitcoin} xeeek
keeex protected "HCVLZ4DOjQlvPilJXXDG5AUJdCIqVKU9WlKeVZ3L8sNfo36D1qLMUmynFBrTICGgTo9YQr3LZ68JMppW3!ioLOw=" , {bitcoin} xeeek

*/

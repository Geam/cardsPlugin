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
   Grid containing columns
   ***********************
 ****************************/

/**
 * Function genarating grid where column will be inserted
 *
 * @param {Integer} grid number
 */
function generateGrid(girdNumber){
	var divGrid = $("<div></div>");
	divGrid.attr('class', 'divGrid');
	divGrid.attr('id', 'divGrid'+girdNumber);
	$("#mainContainer").append(divGrid);
}


/****************************
   	  Column functions
   ***********************
 ****************************/

/**
 * Function genarating shared list icons
 *
 * @param {Integer} formed of column number and column element number
 * @param {Object} data (name, avatar, idx) to be inserted in column element
 * @param {Integer} flag to rule inserting order
 */
function addSharedAvatars(COLUMN_ITEM_ID, data, i){
 	var sharedListLi = $('<li></li>');
	var sharedListImg = $('<img>');
	var sharedListSpan = $('<span></span>');
	var sharedListImgLink = $('<a></a>');

	sharedListLi.attr('class', 'sharedListLi');
	sharedListLi.attr('id', 'sharedListLi'+i);
	sharedListImgLink.attr('class', 'sharedListImgLink');
	sharedListImgLink.attr('data-toggle', 'tooltip');
	sharedListImgLink.attr('data-placement', 'right');
	sharedListImgLink.attr('data-html', "true");
	sharedListImgLink.attr('href', '#');
	sharedListImgLink.attr('id', 'sharedListImgLink'+COLUMN_ITEM_ID+'-'+i);
	sharedListSpan.attr('class', "sharedListSpan glyphicon glyphicon-option-horizontal");
	sharedListImgLink.attr('id', 'sharedListImgLink'+COLUMN_ITEM_ID+'-'+i);
	sharedListImg.attr('src', data.avatar);
	sharedListImgLink.attr('title', data.name);
	sharedListImgLink.append(sharedListImg);

	$('.addShare').click(function(e){
		$(this).remove();
	});
	$('[data-toggle="tooltip"]').tooltip();
	sharedListLi.append(sharedListImgLink);

	return sharedListLi;	
 }

/**
 * Function genarating column element
 *
 * @param {Integer} column number
 * @param {Integer} column element number
 * @param {Integer} data to be inserted in column element
 * @param {Integer} flag to rule inserting order
 */
function generateColumnItem(columnNumber, columnItemNumber, columnItemData, order){
	var COLUMN_ITEM_ID = columnNumber+'-'+columnItemNumber;
	var itemWrapper = $('<div></div>');
	var itemContent = $('<div></div>');
	var itemAvatar =  $('<div></div>');
	var itemImg = $('<img>');
	var itemFooter =  $('<div></div>');
	var itemLiWrapper = $('<li></li>');
	var sharedList = $('<ul></ul>');
		 
	itemLiWrapper.attr('id', 'itemLiWrapper'+COLUMN_ITEM_ID);
	itemLiWrapper.attr('class', 'itemLiWrapper');
	itemWrapper.attr('id', 'item'+COLUMN_ITEM_ID);
	itemWrapper.attr('class', 'itemWrapper');
	itemContent.attr('class', 'itemContent');
	itemAvatar.attr('class', 'itemAvatar');
	itemImg.attr('class', 'itemImg');
	itemImg.attr('id', 'itemImg'+COLUMN_ITEM_ID);
	itemImg.attr('src', columnItemData.avatar);
	itemFooter.attr('id', 'itemFooter'+COLUMN_ITEM_ID);
	itemFooter.attr('class', 'itemFooter');
	sharedList.attr('id', 'sharedList'+COLUMN_ITEM_ID);
	sharedList.attr('class', 'sharedList');
	/*Setting content*/
	var desc = (columnItemData.data.name).substring(0, 50);
	if(columnItemData.data.name.length >50) desc += "...";
	$(itemContent).append('<p>'+desc+'</p>');
	columnsNameArray[columnNumber].listedTopics.push(columnItemData);

	/*Appending children*/
	itemAvatar.append(itemImg);
	itemWrapper.append(itemAvatar);
	if (columnItemData.shared && columnItemData.shared.length >0){
		for (var i = 0; i < columnItemData.shared.length; i++) {
			sharedList.append(addSharedAvatars(COLUMN_ITEM_ID, columnItemData.shared[i], i));			
		}
		itemFooter.append(sharedList);
		itemContent.append(itemFooter);
	}else{
		$('#itemFooter'+COLUMN_ITEM_ID).css('display', 'none');
	}
	itemWrapper.append(itemContent);
	/*Append in corresponding column*/
	itemLiWrapper.append(itemWrapper);
	var columnMiddleSelector = $("#column"+columnNumber).find(".columnMiddleUl");
	if(!order) {
		columnMiddleSelector.append(itemLiWrapper);
	}
	else{
		$('#columnMiddleUl'+columnNumber).find('.top-ele').after(itemLiWrapper);		
	}
	$("#itemLiWrapper"+COLUMN_ITEM_ID).click(function(e){
		e.preventDefault();
		itemInfo(columnItemData.data);
	});
}

/**
 * Function for genarating column element manually
 *
 * @param {Integer} column number
 */
function generateAddColumnItem(columnNumber){
	var COLUMN_ITEM_ID = columnNumber+'-x';	
	var itemWrapper = $('<div></div>');
	var itemContent = $('<div></div>');
	var itemFooter =  $('<div></div>');
	var itemLiWrapper = $('<li></li>');
	var itemInput = $('<input>');
	var itemTextarea = $('<textarea></textarea>');
	var shareWithBtn = $('<button>share</button>');	
	var addItemSubmit = $('<button>Add</button>');
	var addItemShareList = $('<ul></ul>');
	var addItemCancelWrapper = $('<a></a>');
	var addItemCancel = $('<span></span>');

	itemLiWrapper.attr('id', 'itemLiWrapper'+COLUMN_ITEM_ID);
	itemLiWrapper.attr('class', 'itemLiWrapper top-ele');
	itemWrapper.attr('id', 'item'+COLUMN_ITEM_ID);
	itemWrapper.attr('class', 'addItemWrapper');
	itemContent.attr('class', 'itemContent');
	itemInput.attr('class', 'itemInput');
	itemInput.attr('id', 'itemInput'+columnNumber);
	itemInput.attr('type', 'text');
	itemInput.attr('name', 'itemInput');
	itemInput.attr('placeholder', 'name...');
	shareWithBtn.attr('class', 'shareWithBtn btn-primary');
	shareWithBtn.attr('id', 'shareWithBtn'+columnNumber);
	shareWithBtn.attr("data-toggle", "popover");
	shareWithBtn.attr("data-placement", "right");
	shareWithBtn.attr("data-trigger", "focus");
	addItemShareList.attr('class', 'addItemShareList');
	addItemShareList.attr('id', 'addItemShareList'+columnNumber);
	itemTextarea.attr('id', 'itemTextarea'+columnNumber);
	itemTextarea.attr("class", 'itemTextarea');
	itemTextarea.attr("name", 'itemTextarea');	
	itemTextarea.attr('placeholder', 'description...');
	itemFooter.attr('class', 'itemFooter2');
	addItemSubmit.attr('class', 'addItemBtn');
	addItemCancel.attr('class', 'addItemCancel glyphicon glyphicon-remove');
	addItemCancelWrapper.attr('class', 'addItemCancelWrapper');
	
	/*Setting content*/
	/*Appending children*/
	itemFooter.append(addItemSubmit);
	addItemCancelWrapper.append(addItemCancel);
	itemFooter.append(addItemCancelWrapper);
	itemWrapper.append(itemInput);
	itemWrapper.append(itemTextarea);
	itemWrapper.append(addItemShareList);
	itemWrapper.append(shareWithBtn);
	itemWrapper.append(itemFooter);

	/*Append in corresponding column*/
	var columnMiddleSelector = $("#column"+columnNumber).find(".columnMiddleUl");
	itemLiWrapper.append(itemWrapper);
	columnMiddleSelector.prepend(itemLiWrapper);

	/* Actions */
	$('#itemInput'+columnNumber+'-x').focus();	
	$('#shareWithBtn'+columnNumber).click(function(e){
		$(this).popover('show');
	});
	$(".addItemCancelWrapper").click(function(e){
		$(this).parent().parent().css('display', 'none');
	});
	$(".addItemBtn").click(function(e){
		var topicName = $('#itemInput'+columnNumber).val();
		var topicDescription = $('#itemTextarea'+columnNumber).val();
		var liIds=[];
		$('.addShare').each(function(){
			var liId = Number($(this).attr('id').replace('sharedListLi', ''));
			if(contactList[liId] && (liIds.indexOf(contactList[liId])<= -1)){
				liIds.push(contactList[liId]);
				$(this).remove();
			}	
		});
		createTopic(columnNumber, topicName, topicDescription, liIds);
	});
}


/**
 * Function genarating column 
 *
 * @param {Integer} column number
 * @param {String} column title
 */
function generateColumn(columnNumber, columnTitle){
	/* Declarations */
	var spanColumnTitleWrapper = $('<a></a>');
	var spanColumnTitle = $('<span>'+columnTitle+'</span>');
	var divColumn = $('<div></div>');
	var divColumnUp = $('<div></div>');
	var divColumnUpRightIconWrapper = $('<a></a>');
	var divColumnUpRightIcon2Wrapper = $('<a></a>');
	var divColumnUpRightIcon = $('<span></span>');
	var divColumnUpRightIcon2 = $('<span></span>');
	var divColumnUpTitle = $('<div></div>');
	var divColumnUpTitleInput = $('<input/>');
	var divColumnUpTitleSubmitBtn = $('<button></button>');
	var divColumnUpTitleSubmitBtnIcon = $('<span></span>');	
	var divColumnTitleDisplay = $('<div></div>');
	var divColumnMiddle = $('<div></div>');
	var divColumnMiddleUl = $('<ul></ul>');
	var defaultMiddleWrapper = $('<div></div>');
	var defaultMiddleText = $('<span>No topic !</span>');
	var shadowDiv = $('<div></div>');
	var divColumnDown = $('<div></div>');
	var divColumnUpForm = $('<form></form>');
	var formUl = $('<ul></ul>');
	var formSubmitBtn = $('<input/>');

	/* Attributes setting*/
	divColumn.attr('id', 'column'+columnNumber);
	divColumn.attr('class', 'column');
	divColumnUp.attr('class', 'columnUp');
	divColumnUp.attr('id', 'columnUp'+columnNumber);
	formUl.attr('class', 'formTags');
	formUl.attr('id', 'formTags'+columnNumber);
	formSubmitBtn.attr('id', 'colInput'+columnNumber);
	formSubmitBtn.attr('class', 'formSubmitBtn btn btn-default');
	formSubmitBtn.attr('type', 'submit');
	formSubmitBtn.attr('value', 'valider');		
	divColumnUpForm.attr('action', '');
	divColumnUpForm.attr('class', 'columnUpForm');
	divColumnUpForm.attr('id', 'columnUpForm'+columnNumber);
	divColumnUpForm.css('display', 'none');
	spanColumnTitleWrapper.attr('class', 'spanColumnTitleWrapper');
	spanColumnTitleWrapper.attr('id', 'spanColumnTitleWrapper'+columnNumber);
	spanColumnTitle.attr('class', 'spanColumnTitle');
	spanColumnTitle.attr('id', 'spanColumnTitle'+columnNumber);
	divColumnUpTitleInput.attr("class", "columnUpTitleInput");
	divColumnUpTitleInput.attr("id", "columnUpTitleInput"+columnNumber);
	divColumnUpTitleInput.css("display", 'none');
	divColumnUpTitleInput.attr("placeholder", 'enter title...');
	divColumnUpTitleSubmitBtn.attr('id', 'titleSubmitBtn'+columnNumber);
	divColumnUpTitleSubmitBtn.attr('class', 'titleSubmitBtn btn');	
	divColumnUpTitleSubmitBtn.css("display", 'none');
	divColumnUpTitleSubmitBtnIcon.attr('class', 'glyphicon glyphicon-ok');
	divColumnUpRightIconWrapper.attr('class', 'columnUpRightIconWrapper');
	divColumnUpRightIconWrapper.attr('id', 'columnUpRightIconWrapper'+columnNumber);
	divColumnUpRightIconWrapper.attr('title', 'Add item');
	divColumnUpRightIcon2Wrapper.attr('class', 'columnUpRightIcon2Wrapper');
	divColumnUpRightIcon2Wrapper.attr('id', 'columnUpRightIcon2Wrapper'+columnNumber);
	divColumnUpRightIcon2Wrapper.attr('title', 'Edit column ');
	divColumnUpRightIcon.attr('class', 'columnUpRightIcon glyphicon glyphicon-plus');
	divColumnUpRightIcon2.attr('class', 'columnUpRightIcon glyphicon glyphicon-pencil');
	divColumnUpTitle.attr('class', 'columnUpTitle');
	divColumnUpTitle.attr('id', 'columnUpTitle'+columnNumber);
	divColumnTitleDisplay.attr('class', 'divColumnTitleDisplay');
	divColumnTitleDisplay.attr('id', 'divColumnTitleDisplay'+columnNumber);
	divColumnUp.attr('ondrop', "drop(event)");
	divColumnUp.attr('ondragover', "allowDrop(event)");
	divColumnMiddle.attr('class', 'columnMiddle');
	divColumnMiddle.attr('id', 'columnMiddle'+columnNumber);
	divColumnMiddleUl.attr('class', 'columnMiddleUl');
	divColumnMiddleUl.attr('id', 'columnMiddleUl'+columnNumber);
	divColumnDown.attr('class', 'columnDown');
	shadowDiv.attr('class', 'shadowDiv');
	shadowDiv.attr('id', 'shadowDiv'+columnNumber);

	/* Appending*/
	divColumnUpForm.append(formUl);
	divColumnUpForm.append(formSubmitBtn);	
	divColumnUpTitle.append(divColumnUpTitleInput);
	divColumnUpTitleSubmitBtn.append(divColumnUpTitleSubmitBtnIcon);
	// divColumnUpTitle.append(divColumnUpTitleSubmitBtn);
	spanColumnTitleWrapper.append(spanColumnTitle);
	divColumnUpTitle.append(spanColumnTitleWrapper);
	divColumnUpRightIconWrapper.append(divColumnUpRightIcon);
	divColumnUpRightIcon2Wrapper.append(divColumnUpRightIcon2);
	divColumnUpTitle.append(divColumnUpRightIconWrapper);
	divColumnUpTitle.append(divColumnUpRightIcon2Wrapper);
	divColumnUp.append(divColumnUpTitle);
	divColumnUp.append(divColumnUpForm);
	divColumnUp.append(divColumnTitleDisplay);
	divColumnMiddle.append(shadowDiv);
	divColumnMiddle.append(divColumnMiddleUl);
	divColumn.append(divColumnUp);
	divColumn.append(divColumnMiddle);
	divColumn.append(divColumnDown);

	/*------------------------------ Actions/Events ----------------------------*/
	if(!columnTitle){
		spanColumnTitle = $('<span>SearchFilter '+columnNumber+'</span>');       	
	}
	formUl.tagit({
				beforeTagAdded: function(event, ui){
                    var target = $(ui.tag);
					if(negToken){
                        target.addClass('negTopic');
 						negToken = 0;
					}                    
				},
                afterTagRemoved:function(event, ui){
                    var target = $(ui.tag);
                 	if (target.hasClass('negTopic')) {
				 		var indexToRemoveAt = columnsNameArray[columnNumber].columnSearchNegtopics.concept.indexOf(ui.tagLabel);
	   					columnsNameArray[columnNumber].columnSearchNegtopics.concept.splice(indexToRemoveAt, 1);
	   					columnsNameArray[columnNumber].columnSearchNegtopics.idx.splice(indexToRemoveAt, 1);
	   				} else {
				 		var indexToRemoveAt = columnsNameArray[columnNumber].columnSearchTopics.concept.indexOf(ui.tagLabel);
	   					columnsNameArray[columnNumber].columnSearchTopics.concept.splice(indexToRemoveAt, 1);
	   					columnsNameArray[columnNumber].columnSearchTopics.idx.splice(indexToRemoveAt, 1);
				 	}
                 }     
             });

	/* Form submission */
	$('.columnUpForm').submit(function(e){
		e.preventDefault();
	});	
	formSubmitBtn.on('click', function(e){
		divColumnUp.prepend(divColumnUpTitle);
		onSubmitSearch(e, columnNumber);
	});
	//Edit title
	spanColumnTitleWrapper.click(function(){
		$("#titleSubmitBtn"+columnNumber).css('display', 'inline');
		titleEditRoutine(this, columnNumber, 0);
	});
	//Edit column 
	divColumnUpRightIcon2Wrapper.click(function(e){
		$("#columnUpForm"+columnNumber).css('display', 'block');
		$("#titleSubmitBtn"+columnNumber).css('display', 'none');
		var that = $('#spanColumnTitleWrapper'+columnNumber);
		titleEditRoutine(that, columnNumber, 2);
	});
	//Add item
	divColumnUpRightIconWrapper.click(function(e){
		columnUpRightIconEvent(columnNumber);				
	});

	// generate grid before generating column 
	generateGrid(columnNumber);
	$("#divGrid"+columnNumber).append(divColumn);
	generateAddColumnItem(columnNumber);

    /*Apply sortable*/
    $('#columnMiddleUl'+columnNumber ).sortable({
	  connectWith: ".columnMiddleUl",
	  handle: ".itemLiWrapper, .itemWrapper",
	  placeholder: "sortablePlaceholder",
      stop: function(event, ui) {
      	var itemId = ui.item.attr('id');
        var oldColumnId = Number(((itemId).split("-")[0]).replace('itemLiWrapper', ''));
        var newColumnId = Number(($(ui.item).parent().attr('id')).replace('columnMiddleUl', ''));
        var oldItemNumb = Number(itemId.split("-")[1]);
        var guenuineItem = columnsNameArray[oldColumnId].listedTopics[oldItemNumb];	

        if(oldColumnId != newColumnId){	      
			//Change itemId
			var ItemNewNumb = columnsNameArray[newColumnId].nbItems;
			$('#'+itemId).attr('id', 'itemLiWrapper'+newColumnId+'-'+ItemNewNumb);
			$('#item'+oldColumnId+'-'+oldItemNumb).attr('id', 'item'+newColumnId+'-'+ItemNewNumb);
			//push
			columnsNameArray[newColumnId].listedTopics.push(guenuineItem);
			columnsNameArray[newColumnId].nbItems +=1;
			//pop 
			columnsNameArray[oldColumnId].listedTopics.splice(oldItemNumb, 1);
			columnsNameArray[oldColumnId].nbItems -=1;
			for (var i = oldItemNumb; i < columnsNameArray[oldColumnId].listedTopics.length; i++) {
				var x = i+1;
				$('#itemLiWrapper'+oldColumnId+'-'+x).attr('id', 'itemLiWrapper'+oldColumnId+'-'+i);
				$('#item'+oldColumnId+'-'+x).attr('id', 'item'+oldColumnId+'-'+i);
			}
			$("#itemLiWrapper"+newColumnId+'-x').prependTo('#columnMiddleUl'+newColumnId);
			//Add reference			
			addRefToTopic(guenuineItem.data.idx, "reference", newColumnId);									
        }
	  } 
    });

	/* Record column in columnsNameArray*/
	columnsNameArray.push({	name:columnTitle,
							columnNumber: columnNumber,
							nbItems:0,
							columnSearchTopics:{'concept':[],
												'idx':[] 
											   },
							columnSearchNegtopics:{'concept':[],
												   'idx':[] 
											   },
							listedTopics:[]
						});
	columnsArrayIndex +=1;
}		

/**
 * Function for adding new column to the board
 *
 */
function addNewColumn(){ 
		generateColumn(columnsArrayIndex, "column"+columnsArrayIndex);
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
function onSubmitSearch(e, columnNumber){
	e.preventDefault();
	//Process tags
	if(newDrop){
		customSearchTopics(columnNumber);
		newDrop = 0;
	}	
	//Hide form
	$('#columnUpForm'+columnNumber).css('display', 'none');
	$('#columnUp'+columnNumber).css('background-color', '#C0C0C0');
	
	if($('#columnUpTitleInput'+columnNumber).css('display') != 'none'){
		var that = $("#columnUpTitleInput"+columnNumber);
		titleChange(that, columnNumber, 1);
	}
	//Put events back
	$("#columnUpRightIconWrapper"+columnNumber).click(function(e){
		columnUpRightIconEvent(columnNumber);
	});
	$("#columnUpRightIcon2Wrapper"+columnNumber).click(function(e){
		$('#columnUpForm'+columnNumber).css('display', 'block');
		$("#titleSubmitBtn"+columnNumber).css('display', 'none');
		console.log($("#titleSubmitBtn"+columnNumber));
		var that = $('#spanColumnTitleWrapper'+columnNumber);
		titleEditRoutine(that, columnNumber, 1);			  	
	});
	titleTooltipRoutine(columnNumber); 
}

/**
 * Function to handle columnUp right icon event
 *
 * @param {Integer} column number
 */
function columnUpRightIconEvent(columnNumber){
	$('#item'+columnNumber+'-x').css('display', 'block');
	$('[data-toggle="popover"]').popover({
	    content: $('#contactsArea').html(),
	    html: true
	}); 		
}

/* Editing
***************************************************************************
*/

/**
 * Functions for handling  column title edition
 *
 * @param {Jquery Object} 
 * @param {Integer} column number
 * @param {Integer} flag
 */
function titleEditRoutine(that, columnNumber, tmp){
	$(that).find(".spanColumnTitle").empty();
	$(that).parent().css('float', 'left');
	if(tmp == 2)
		$("#titleSubmitBtn"+columnNumber).css("display", 'none');
	else	
		$("#titleSubmitBtn"+columnNumber).css("display", 'inline');
	$(that).parent().find(".columnUpRightIconWrapper").css('display', 'none');
	$(that).parent().find(".columnUpRightIcon2Wrapper").css('display', 'none');
	
	$("#columnUpTitle"+columnNumber).css("background-color", "#E0E0E0");
	$("#columnUpTitleInput"+columnNumber).css("display", "inline-block");
	$("#columnUpTitleInput"+columnNumber).focus();
	
	var that = $("#columnUpTitleInput"+columnNumber);
	$("#columnUpTitleInput"+columnNumber).keyup(function(e){
		if(e.which == 13){
			titleChange(that, columnNumber, tmp);
		}
	});
	$("#titleSubmitBtn"+columnNumber).click(function(e){
		titleChange(that, columnNumber, tmp);
	});
}

/*
* Function used by titleEditRoutine
*/
function titleChange(obj, columnNumber, tmp){
	var that = obj;
	var newTitle = $(obj).val();

	if(newTitle==""){
		$('#spanColumnTitle'+columnNumber).text(columnsNameArray[columnNumber].name);
			console.log("column",columnNumber,"\'s title unchanged");
	}else{
		$('#spanColumnTitle'+columnNumber).text(""+newTitle);
		//Update array
		columnsNameArray[columnNumber].name = newTitle;
		sideContainerColumnsList(columnNumber);
		console.log("column",columnNumber,"\'s title changed to: ", newTitle);
	}

	that.css("display", "none");
	if(tmp){
		$('#columnUpForm'+columnNumber).css('display', 'none');
	}
	$("#columnUpTitle"+columnNumber).css("background-color", "#C0C0C0");
	//Update(-back) css
	$(that).parent().css('width', '100%');
	$(that).parent().css('float', 'right');
	$(that).parent().find(".columnUpRightIconWrapper").css('display', 'inline');
	$(that).parent().find(".columnUpRightIcon2Wrapper").css('display', 'inline');
	$("#titleSubmitBtn"+columnNumber).css("display", 'none');
}

/**
 * Function to handle column search tags 
 *
 * @param {Integer} column number
 */
function titleTooltipRoutine(columnNumber){
	$("#spanColumnTitleWrapper"+columnNumber).attr('data-toggle', "tooltip");
	$("#spanColumnTitleWrapper"+columnNumber).attr('data-html', "true");
	$("#spanColumnTitleWrapper"+columnNumber).attr("data-placement", "bottom");
	var titleText = columnsNameArray[columnNumber].columnSearchTopics.concept;
	var tmpText = columnsNameArray[columnNumber].columnSearchNegtopics.concept;
	var titleText2 ='';
	for(var i = 0; i<titleText.length;i++)
		titleText2 = titleText2.concat("+"+titleText[i]+"<br>");
	for(var i = 0; i<tmpText.length;i++)
		titleText2 = titleText2.concat("--"+tmpText[i]+"<br>");
	$("#spanColumnTitleWrapper"+columnNumber).attr('title', titleText2);
	$('[data-toggle="tooltip"]').tooltip();
}

/**
 * Function handling add of search tag in predefined boards(scrum, crm)
 *
 * @param {Integer} column number
 * @param {String}  tag value
 * @param {Integer} flag
 */
function addTagToColumnUp(columnNumber, conceptVal, tmp){	
	if(Array.isArray(conceptVal)){
		for (var i = 0; i < conceptVal.length; i++) {
			if(tmp)
				negToken = 1;
			$('#columnUpForm'+columnNumber).find('ul').tagit('createTag', conceptVal[i]);
		}
	}else{
		if(tmp)
			negToken = 1;
		$('#columnUpForm'+columnNumber).find('ul').tagit('createTag', conceptVal);
	}
}

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
function clearColumnElements(columnNumber, tmp){
	$("#column"+columnNumber).find('.columnMiddle').find('.itemLiWrapper:not("#itemLiWrapper'+columnNumber+'-x ")').remove();
	//Clear search arrays
	if(!tmp){
		columnsNameArray[columnNumber].columnSearchTopics.concept = [];
		columnsNameArray[columnNumber].columnSearchTopics.idx = [];
		columnsNameArray[columnNumber].columnSearchNegtopics.concept = [];
		columnsNameArray[columnNumber].columnSearchNegtopics.idx = [];
	}
	columnsNameArray[columnNumber].nbItems = 0;
	columnsNameArray[columnNumber].listedTopics = [];
	console.log('column'+columnNumber+' cleared');
}

/****************************************************************************/

/* Concepts
***************************************************************************
*/

/**
 * Function used to clear properly column elements
 *
 * @param {String} tag name
 * @param {Integer} tag number
 */
function displayConcepts(content, conceptNumb){
	var conceptWrapper = $('<div></div>');
	var conceptText = $('<span></span>');
	var glyphiconWrapper = $('<span></span>');
	var zindex = 10;
	
	glyphiconWrapper.attr("class", "conceptGlyphicon glyphicon glyphicon-remove");
	conceptWrapper.attr("id", "cncpt"+conceptNumb);
	conceptText.text(content);
	conceptWrapper.attr("class", "conceptsLabel label");
	conceptWrapper.attr("draggable", "true");
	conceptWrapper.attr("ondragstart", "dragstart(event)");

	conceptWrapper.append(conceptText);
	conceptWrapper.append(glyphiconWrapper);
	
	/* Negation process */
	conceptWrapper.on("click", function(){
		if($(this).hasClass("negTopic")){
			$(this).removeClass("negTopic");
		}else{
			$(this).addClass("negTopic");
		}
	});
	glyphiconWrapper.on("click", function(){
    	$(this).parent().remove();
	});
	//Empty container
	if(!conceptNumb){
		$("#concepts").empty();	
	}
	$("#concepts").append(conceptWrapper);	
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
function sideContainerColumnsList(columnNumber){
	var sideContainerColumnsLi = $('<li></li>');
	var numbSpan = $('<span></span>');
	var nameSpan = $('<span></span>');
	
	sideContainerColumnsLi.attr('class', 'list-group-item');
	sideContainerColumnsLi.attr('id', 'list-group-li-'+columnNumber);
	nameSpan.attr('id', 'sideNameSpan'+columnNumber);
	numbSpan.attr('id', 'sideNumbSpan'+columnNumber);
	numbSpan.attr('class', 'badge');

	if($("#list-group-li-"+columnNumber).length){
		$("#list-group-li-"+columnNumber).find('span').empty();
		$("#sideNumbSpan"+columnNumber).text(columnsNameArray[columnNumber].nbItems);
		$('#sideNameSpan'+columnNumber).text(columnsNameArray[columnNumber].name);
	}
	else{
		numbSpan.text(columnsNameArray[columnNumber].nbItems);
		nameSpan.text(columnsNameArray[columnNumber].name);
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
	var line1 = $('<p></p>');
	var line2 = $('<p></p>');
	var line3 = $('<p></p>');
	var line4 = $('<p></p>');
	var line5 = $('<p></p>');
	var lastModifyDate = new Date(msgObject.lastModify);
	var creationDateDate = new Date(msgObject.creationDate);

   var lastModifyTimeAndDate = lastModifyDate.getHours()+"h"
					 +lastModifyDate.getMinutes()+"mn"
					 +lastModifyDate.getSeconds()+"s, "
					 +lastModifyDate.getDate()+"/"
					 +lastModifyDate.getMonth();

	var creationTimeAndDate = creationDateDate.getHours()+"h"
					 +creationDateDate.getMinutes()+"mn"
					 +creationDateDate.getSeconds()+"s, "
					 +creationDateDate.getDate()+"/"
					 +creationDateDate.getMonth();

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
function logDisplay(msg){
	var sideContainerLogsLi = $('<li></li>');
	
	sideContainerLogsLi.attr('class', 'list-group-item');
	sideContainerLogsLi.append(msg);
	$('#sideContainerLogsUl').append(sideContainerLogsLi);
	$('#sideContainerLogs').animate({scrollTop: $('#sideContainerLogsUl').css('height')}, 500);		
	console.log(msg);	
};

/* Creating/Saving/Listing Board
**************************************************************************
*/

/**
 * Function used to genarate saving board pop up
 *
 */
function saveBoardPopover(){    
    $("#save-form").submit(function (e) {
    	e.preventDefault();
    	$("#save-modal").modal('hide');
    	var topicname=$('#save_topicname').val();
        var topicdesc=$('#save_topicdesc').val();
        if (topicname != "" && topicname.length >1) {        
	        $('#save_topicname').val("");
	        $('#save_topicdesc').val("");
			var confName = {
				topicName: topicname,
				topicDescription: topicdesc
			};
			saveBoard(confName);
		}
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
		readLoadedBoard(boardToLoadFlag);
	});
	$("#tableBody").append(appendingLine);
}
	

/* User Contacts
****************************************************************************
*/

function displayContactList(data, i){
	var item = $("<li></li>");
	var avatarImg = $('<img>');
	var nameSpan = $('<span></span>');

	avatarImg.attr("class", 'contactAvatar');
	avatarImg.attr("src", data.avatar);
	nameSpan.attr("class", 'contactName');
	nameSpan.text(data.name);
	item.attr('class', 'contactLi');
	item.attr('id', 'contact'+i);
	item.append(avatarImg);
	item.append(nameSpan);
	
	$("#contactList").append(item);
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
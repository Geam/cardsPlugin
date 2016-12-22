module.exports = (window) => {
	const document = window.document;
	const console = window.console;
	const Element = window.Element;
	const qs = document.querySelector.bind(document);

	const addAttribute = (el, attr) => {
		if (typeof el === "string")
			el = qs(el);
		if (!(el instanceof Element)) { return; }
		Object.keys(attr).forEach((key) => {
			el.setAttribute(key, attr[key]);
		});
	};

	const addContent = (el, content) => {
		if (typeof el === "string")
			el = qs(el);
		if (!(el instanceof Element)) { return; }
		if (typeof content === "string") {
			el.appendChild(document.createTextNode(content));
		} else if (Array.isArray(content)) {
			content.forEach((subContent) => {
				addContent(el, subContent);
			});
		} else if (content instanceof Element) {
			el.appendChild(content);
		}
	};

	const addContentBeforeLastChild = (el, content) => {
		if (typeof el === "string")
			el = qs(el);
		if (!(el instanceof Element)) { return; }
		if (typeof content === "string") {
			el.insertBefore(document.createTextNode(content), el.lastChild);
		} else if (Array.isArray(content)) {
			content.forEach((subContent) => {
				addContentBeforeLastChild(el, subContent);
			});
		} else if (content instanceof Element) {
			el.insertBefore(content, el.lastChild);
		}
	};

	const newEl = (tag, attr, content) => {
		var el = document.createElement(tag);
		addAttribute(el, attr);
		addContent(el, content);
		return el;
	};

	const delElContent = (el) => {
		if (typeof el === "string")
			el = qs(el);
		if (el instanceof Element) {
			while (el.firstChild) {
				if (el.firstChild instanceof Element)
					delEl(el.firstChild);
				el.removeChild(el.firstChild);
			}
		}
	};

	const searchParentByClass = (el, className) => {
		if (typeof el === "string")
			el = qs(el);
		if (!(el instanceof Element)) return;
		let cur = el;
		while (cur.tagName != "BODY") {
			if (cur.classList.contains(className)) return cur;
			cur = cur.parentNode;
		}
	};

	/* start: tile related function */
	const returnSharedAvatar = (user, i) => {
		return newEl("li", { "id": `sharedListLi${i}`, "class": "sharedListLi" },
			newEl("a", {
				"class": "sharedListImgLink",
				"data-toggle": "tooltip", "data-placement": "bottom", "data-html": "true",
				"title": user.name, "href": "#"
			},
				newEl("img", { "src": `file:///${user.avatar}` })
			)
		);
	};

	const returnSharedList = (tile) => {
		var list = tile.shared.map((user, i) => returnSharedAvatar(user, i));
		list.push(newEl("li", { "class": "sharedListLi" },
			newEl("button", {
				"id": `addShare${tile.domId}`, "class": "shareWithBtn addItemContact btn-primary",
				"data-toggle": "popover", "data-placement": "auto bottom", "data-trigger": "focus",
			},
				newEl("span", { "class": "glyphicon glyphicon-plus" })
			)
		));
		return list;
	};

	const returnTileFooter = (tile) => {
		return newEl("div", {
			"id": `tileCtrlDiv${tile.domId}`, "style": "display: none"
		}, [
			newEl("hr", { "style": "margin: 5px 0" }),
			newEl("select", {
				"id": `tileContactSelect${tile.domId}`, "style": "width: 100%",
				"multiple": "multiple"
			}),
			newEl("div", {}, [
				newEl("button", { "id": `tileAddContactValidate${tile.domId}` }, "Add"),
				newEl("button", { "id": `tileAddContactCancel${tile.domId}` }, "Cancel")
			])
		]);
	};

	const returnTileAuthor = (tile) => {
		return newEl("div", { "class": "itemAvatar" },
			newEl("img", {
				"id": `itemImg${tile.domId}`, "class": "itemImg",
				"src": `file:///${tile.author.avatar}`
			})
		);
	};

	const returnTileContent = (tile, desc) => {
		return newEl("div", { "class": "itemContent" }, [
			newEl("p", {}, desc),
			newEl("div", { "id": `itemFooter${tile.domId}`, "class": "itemFooter" }, [
				newEl("ul", { "id": `sharedList${tile.domId}`, "class": "sharedList" },
					returnSharedList(tile)
				),
				returnTileFooter(tile)
			])
		]);
	};
	/* end: tile related function */

	/* start: column related function */
	const returnColumnHeaderIcon = (column, title, position, icon) => {
		return newEl("a", {
			"id": `columnUpRightIcon${position}Wrapper${column.id}`,
			"class": `columnUpRightIcon${position}Wrapper`,
			"title": title, "data-toggle": "tooltip", "data-placement": "bottom",
			"data-html": "true"
		},
			newEl("span", { "class": `columnUpRightIcon glyphicon ${icon}`})
		);
	};

	const returnColumnTitle = (column) => {
		return newEl("div", { "id": `columnUpTitle${column.id}`, "class": "columnUpTitle" }, [
			newEl("input", {
				"id": `columnUpTitleInput${column.id}`, "class": "columnUpTitleInput",
				"style": "display: none", "placeholder": "Enter title..."
			}, column.name),
			newEl("a", {
				"id": `spanColumnTitleWrapper${column.id}`,
				"class": "spanColumnTitleWrapper"
			},
				newEl("span", {
					"id": `spanColumnTitle${column.id}`,
					"class": "spanColumnTitle"
				}, column.name || `SearchFilter ${column.id}`)
			),
			returnColumnHeaderIcon(column, "Add item", "", "glyphicon-plus"),
			returnColumnHeaderIcon(column, "Edit column", "2", "glyphicon-pencil"),
		]);
	};

	const returnColumnHeaderForm = (column) => {
		return newEl("form", {
			"id": `columnUpForm${column.id}`, "class": "columnUpForm",
			"ation": "", "style": "display: none"
		}, [
			newEl("ul", { "id": `formTags${column.id}`, "class": "formTags" }),
			newEl("input", {
				"id": `colInput${column.id}`, "class": "formSubmitBtn btn btn-default",
				"type": "submit", "value": "valider"
			})
		]);
	};

	const returnColumnTitleDisplay = (column) => {
		return newEl("div", {
			"id" : `divColumnTitleDisplay${column.id}`, "class": "divColumnTitleDisplay"
		});
	};

	const returnColumnHeader = (column) => {
		return newEl("div", {
			"id": `columnUp${column.id}`, "class": "columnUp", "ondrop": "drop(event)",
			"ondragover": "allowDrop(event)"
		}, [
			returnColumnTitle(column),
			returnColumnHeaderForm(column),
			returnColumnTitleDisplay(column),
		]);
	};

	const returnColumnAddTile = (column) => {
		const domId = `${column.id}-x`;
		return newEl("li", { "id": `itemLiWrapper${domId}`, "class": `itemLiWrapper top-ele` },
			newEl("div", { "id": `item${domId}`, "class": "addItemWrapper" }, [
				newEl("input", {
					"id": `itemInput${column.id}`, "class": "itemInput", "type": "text",
					"name": "itemInput", "placeholder": "name..."
				}),
				newEl("textarea", {
					"id": `itemTextarea${column.id}`, "class": "itemTextarea",
					"name": "itemTextarea", "placeholder": "description..."
				}),
				newEl("select", {
					"id": `addItemShareList${column.id}`, "style": "width: 100%;",
					"multiple": "multiple"
				}),
				newEl("div", { "class": "itemFooter2" }, [
					newEl("button", { "class": "addItemBtn" }, "Add"),
					newEl("a", { "class": "addItemCancelWrapper" },
						newEl("span", { "class": "addItemCancel glyphicon glyphicon-remove" })
					)
				])
			])
		);
	};
	/* end: column related function */

	return {
		"qs": qs,
		"searchParentByClass": searchParentByClass,

		"generateGrid": (gridNumber) => {
			addContent("#mainContainer",
				newEl("div", { "id": `divGrid${gridNumber}`, "class": "divGrid" })
			);
		},

		"generateTile": (column, tile, first) => {
			const desc = tile.data.name.length > 50 ?
				`${(tile.data.name).substring(0, 50)}...` :
				tile.data.name;

			const domTile = newEl("li", {
				"id": `itemLiWrapper${tile.domId}`, "class": "itemLiWrapper"
			},
				newEl("div", { "id": `item${tile.domId}`, "class": "itemWrapper" }, [
					returnTileAuthor(tile),
					returnTileContent(tile, desc)
				])
			);

			if (first) {
				addContent(qs(`#columnMiddleUl${column.id}`).querySelector(".top-ele"), domTile);
			} else {
				addContent(qs(`#column${column.id}`).querySelector(".columnMiddleUl"), domTile);
			}
			return domTile;
		},

		"generateColumn": (column) => {
			const domColumn = newEl("div", { "id": `column${column.id}`, "class": "column" }, [
				returnColumnHeader(column),
				newEl("div", { "id": `columnMiddle${column.id}`, "class": "columnMiddle" }, [
					newEl("div", { "id": `shadowDiv${column.id}`, "class": "shadowDiv" }),
					newEl("ul", { "id": `columnMiddleUl${column.id}`, "class": "columnMiddleUl" },
						returnColumnAddTile(column)
					)
				]),
				newEl("div", { "class": "columnDown" }),
			]);
			return domColumn;
		},

		"showColumnEdit": (column) => {
			qs(`#columnUpForm${column.id}`).style.display = "block";
			qs(`#spanColumnTitle${column.id}`).innerHTML = "";
			qs(`#columnUpRightIconWrapper${column.id}`).style.display = "none";
			qs(`#columnUpRightIcon2Wrapper${column.id}`).style.display = "none";
			qs(`#columnUpTitle${column.id}`).style.backgroundColor = "#E0E0E0";
			qs(`#columnUpTitleInput${column.id}`).value = column.name;
			qs(`#columnUpTitleInput${column.id}`).style.display = "inline-block";
			qs(`#columnUpTitleInput${column.id}`).focus();
		},

		"hideColumnEdit": (column) => {
			qs(`#columnUpForm${column.id}`).style.display = "none";
			qs(`#spanColumnTitle${column.id}`).innerHTML = column.name;
			qs(`#columnUpRightIconWrapper${column.id}`).style.display = "inline";
			qs(`#columnUpRightIcon2Wrapper${column.id}`).style.display = "inline";
			qs(`#columnUpTitle${column.id}`).style.backgroundColor = "#C0C0C0";
			qs(`#columnUpTitleInput${column.id}`).style.display = "none";
		},

		"showColumnNewTopic": (column) => {
			qs(`#item${column.id}-x`).style.display = "block";
		},

		"hideColumnNewTopic": (column) => {
			qs(`#item${column.id}-x`).style.display = "none";
			qs(`#itemTextarea${column.id}`).value = "";
			qs(`#itemInput${column.id}`).value = "";
		},

		"showTileAddShare": (tile) => {
			qs(`#tileCtrlDiv${tile.domId}`).style.display = "";
		},

		"hideTileAddShare": (tile) => {
			qs(`#tileCtrlDiv${tile.domId}`).style.display = "none";
			const ulLst = qs(`#sharedList${tile.domId}`);
			const liBtn = qs(`#addShare${tile.domId}`).parentNode;
			while (ulLst.lastChild !== liBtn) {
				ulLst.removeChild(ulLst.lastChild);
			}
		},

		"addShare": (target, contact, beforeLast) => {
			if (typeof target === "string")
				target = qs(target);
			if (!(target instanceof Element)) { return; }

			var nbChild = target.childElementCount;
			if (nbChild && target.lastChild.childNodes[0].classList.contains("shareWithBtn"))
				nbChild--;
			const newContact = (Array.isArray(contact)) ?
				contact.map((e, i) => returnSharedAvatar(e, i + nbChild)) :
				returnSharedAvatar(contact, nbChild);

			if (beforeLast) {
				addContentBeforeLastChild(target, newContact);
			} else {
				addContent(target, newContact);
			}
		},

		"contactSelectListTemplate": (user) => {
			return newEl("span", {}, [
				newEl("img", { "class": "contactSelectImg", "src": `file:///${user.avatar}` }),
				user.name
			]);
		},

		"contactSelectTokenTemplate": (user) => {
			return newEl("span", {},
				newEl("img", { "class": "contactSelectImg", "src": `file:///${user.avatar}` })
			);
		}
	};
};
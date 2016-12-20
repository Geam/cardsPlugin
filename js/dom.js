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

	const newEl = (tag, attr, content) => {
		var el = document.createElement(tag);
		addAttribute(el, attr);
		addContent(el, content);
		return el;
	};

	const delEl = (el) => {
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

	/* start: tile related function */
	const returnSharedAvatar = (domId, user, i) => {
		return newEl("li", { "id": `sharedListLi${i}`, "class": "sharedListLi" },
			newEl("a", {
				"id": `sharedListImgLink${domId}-${i}`, "class": "sharedListImgLink",
				"data-toggle": "tooltip", "data-placement": "right", "data-html": "true",
				"title": user.name, "href": "#"
			},
				newEl("img", { "src": `file:///${user.avatar}` })
			)
		);
	};

	const returnSharedList = (tile) => {
		var list = tile.shared.map((user, i) => returnSharedAvatar(tile.domId, user, i));
		// TODO add sharing option
		return list;
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
			newEl("div", { "id": `itemFooter${tile.domId}`, "class": "itemFooter" },
				newEl("ul", { "id": `sharedList${tile.domId}`, "class": "sharedList" },
					returnSharedList(tile)
				)
			)
		]);
	};

	/* end: tile related function */

	/* start: column related function */
	const returnColumnHeaderIcon = (column, title, icon) => {
		return newEl("a", {
			"id": `columnUpRightIconWrapper${column.id}`,
			"class": "columnUpRightIconWrapper",
			"title": title
		},
			newEl("span", { "class": `columnUpRightIcon glyphicon ${icon}`})
		);
	};

	const returnColumnTitle = (column) => {
		return newEl("div", { "id": `columnUpTitle${column.id}`, "class": "columnUpTile" }, [
			newEl("input", {
				"id": `columnUpTitleInput${column.id}`, "class": "columnUpTitleInput",
				"style": "display: none", "placeholder": "Enten title..."
			}),
			newEl("a", {
				"id": `spanColumnTitleWrapper${column.id}`,
				"class": "spanColumnTitleWrapper"
			},
				newEl("span", {
					"id": `spanColumnTitle${column.id}`,
					"class": "spanColumnTitle"
				}, column.name || `${column.id}`)
			),
			returnColumnHeaderIcon(column, "Add item", "glyphicon-plus"),
			returnColumnHeaderIcon(column, "Edit column", "glyphicon-pencil"),
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

	const returnColumnHeader = (column) => {
		return newEl("div", {
			"id": `columnUp${column.id}`, "class": "columnUp", "ondrop": "drop(event)",
			"ondragover": "allowDrop(event)"
		}, [
			returnColumnTitle(column),
			returnColumnHeaderForm(column),
		]);
	};
	/* end: column related function */

	return {
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
				newEl("div", { "id": `item${tile.domId}`, "class": "itemWrapper"}, [
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
				newEl("div", { "id": `columnMiddle${column.id}`, "class": "columnMiddle" }),
				newEl("div", { "class": "columnDown" }),
			]);
		},
	};
};

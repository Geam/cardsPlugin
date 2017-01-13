/* this whole file is just a workaround to load jquery
 */

const loadScript = source => {
	return new Promise((resolve, reject) => {
		// script loader http://stackoverflow.com/a/28002292/6827472
		var script = document.createElement('script');
		script.async = 1;
		document.querySelector("head").appendChild(script);

		script.onload = script.onreadystatechange = function( _, isAbort ) {
			if (isAbort || !script.readyState || /loaded|complete/.test(script.readyState) ) {
				script.onload = script.onreadystatechange = null;
				script = undefined;

				if (!isAbort) {
					console.log("Loaded", source);
					resolve();
				}
			}
		};
		script.src = source;
	});
};

const loadScriptJquery = source => {
	return new Promise((resolve, reject) => {
		jQuery.getScript(source)
			.done(resolve)
			.fail(_ => {
				reject(new Error(`Can't load ${source}`));
			});
	});
};

if (window.location.href.match(/chrome-extension:\/\/[a-z]*\/plugins\/.*/)) {
	/* jshint ignore:start */
	var jQuery = require("jquery");
	/* jshint ignore:end */
	window.jquery = window.$ = jQuery;
	const localJsFiles = jsFiles.slice(1);
	const syncLoad = id => {
		if (id === localJsFiles.length) return ;
		return loadScriptJquery(localJsFiles[id])
			.then(_ => {
				return syncLoad(id + 1);
			});
	};

	syncLoad(0)
		.then(_ => { _init(); });
} else {
	const syncLoad = id => {
		if (id === jsFiles.length) return ;
		return loadScript(jsFiles[id])
			.then(_ => {
				return syncLoad(id + 1);
			});
	};
	syncLoad(0)
		.then(_ => { _init(); });
}

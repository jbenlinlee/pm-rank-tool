function appStart() {
	chrome.app.window.create('ranktool.html', {
		'bounds': {
			'width': 850,
			'height': 600
		}
	});
}

chrome.app.runtime.onLaunched.addListener(appStart);


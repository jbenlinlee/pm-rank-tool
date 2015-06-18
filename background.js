function appStart() {
	chrome.app.window.create('ranktool.html', {
		'bounds': {
			'width': 700,
			'height': 700
		}
	});
}

chrome.app.runtime.onLaunched.addListener(appStart);


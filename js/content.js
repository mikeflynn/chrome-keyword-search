var highlighted = 0;

chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) {
		if(request.action == "get_page_text") {
			sendResponse({html: document.body.innerText});
		} else if(request.action == "get_page_html") {
			if(highlighted === 0) {
				sendResponse({check: true, html: document.body.innerHTML});
			} else {
				sendResponse({check: false});
			}
		} else if(request.action == "set_page_html") {
			if(request.html) {
				document.body.innerHTML = request.html;
				highlighted = 1;
			}
			sendResponse({});
		} else if(request.action == "get_page_info") {
			sendResponse({
				'title': document.getElementsByTagName('title')[0].innerText,
				'url': document.location.href
			});
		} else {
			sendResponse({});
		}
	}
);

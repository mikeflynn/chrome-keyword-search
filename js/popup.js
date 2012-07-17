jQuery(document).ready(function(){
	chrome.tabs.getSelected(null, function(tab) {
		chrome.tabs.sendRequest(tab.id, {action: "get_page_text"}, function(response) {
			var html = unescape(response.html);

			if(jQuery.trim(html).length < 1) {
				progress(5, 100);
				jQuery('div#results').html('<strong style="display: block; text-align: center; color: #990000;">Unable to grab page HTML. Please try refreshing the page.</strong>');
				return;
			}

			var keywords = get_keywords();
			var total_kw = keywords.length;

			var found = new Array();
			for(var x = 0; x < total_kw; x++) {
				var kw = jQuery.trim(keywords[x]);
				if( kw !== '') {
					var regex = new RegExp('\\b'+kw+'\\b', "gi");
					console.log('Looking for '+regex);
					var res = html.match(regex.valueOf());
					console.log(res);
					if(res && res.length > 0) {
						found.push({
							'kw': keywords[x],
							'count': res.length
						});
					}

					progress(Math.round(((x+1) / total_kw)*50), keywords[x]);
				}
			}

			if(found.length === 0) {
				progress(100, 'Complete!');
			} else {
				progress(50, 'Search complete!');
			}

			found.sort(function(a, b) {
				if(a.count < b.count) {
					return 1;
				} else if(a.count > b.count) {
					return -1;
				}

				return 0;
			});

			if(list_results(found)){
				highlight(found);
				jQuery('div#export').fadeIn(250, function(){
					jQuery('div#export a.export_bookmark').click(function(){
						export_bookmark(found);
					});
				});
			}
		});
	});
});

function export_bookmark(found) {
	chrome.tabs.getSelected(null, function(tab) {
		chrome.tabs.sendRequest(tab.id, {action: "get_page_info"}, function(response) {
			if(response.url && response.title) {
				progress(5, '');

				var i = 0;
				var next = function() {
					progress(Math.round(((i+1) / found.length)*100), "Exporting "+found[i].kw);
					i++;
					if(typeof(found[i]) !== 'undefined') {
						Bookmark.create(found[i].kw, response.title, response.url, next);
					}
				}

				Bookmark.create(found[i].kw, response.title, response.url, next);

				progress(100, 'Export complete!');
				jQuery('div#export').html('Export complete to bookmarks.');
				return;
			} else {
				jQuery('div#export').html('<strong style="color: #990000">Couldn\'t pull page info. Export failed.</strong>');
			}
		});
	});
}

function list_results(results) {
	if(results.length > 0) {
		var rdiv = jQuery('div#results ul');
		rdiv.parent().prepend('<h4>The following keyword were found:</h4>');
		for(var row in results) {
			rdiv.append('<li class="'+row_class(row)+'"><span>'+results[row].count+'</span>'+results[row].kw.replace('\\s', ' ')+'</li>');
		}

		return true;
	} else {
		jQuery('div#results').html('<strong style="display: block; text-align: center;">No keyword matches.</strong>');
	}

	return false;
}

function highlight(results) {
	var keywords = new Array();
	for(var row in results) {
		keywords.push(results[row].kw);
	}
	var total_kw = keywords.length;

	if(keywords.length > 0) {
		chrome.tabs.getSelected(null, function(tab) {
			chrome.tabs.sendRequest(tab.id, {action: "get_page_html"}, function(response) {
				if(response.check === true) {
					var container = document.createElement("div");
					container.style.display = 'none';
    				container.innerHTML = response.html;
					
					for (var i = 0, len = keywords.length; i < len; ++i) {
						traverseElement(container, keywords[i]);
						progress(Math.round(((i+1) / total_kw)*50)+50, 'Highlighting '+keywords[i]);
					}

					chrome.tabs.sendRequest(tab.id, {action: "set_page_html", html: container.innerHTML}, function(response) {
						progress(100, 'Highlighting complete!');
					});
				} else {
					progress(100, 'Highlighting complete!');
				}


			});
		});
	}
}

function get_keywords() {
	var searches = unescape(Store.setting('keywords'));
	//var delimiter = Store.setting('keyword_delimiter');
	var delimiter = 'comma';
	if(delimiter === 'newline') {
		delimiter = "\\n";
	} else if(delimiter === 'tab') {
		delimiter = "\\t";
	} else {
		delimiter = ',';
	}

	var list = searches.split(delimiter);

	for(var x in list) {
		list[x] = jQuery.trim(list[x].replace('+', '\\s'));
	}

	return list;
}

function progress(per, msg) {
	jQuery('div#progress_bar div.ui-progress').css({
		'width': per+'%'
	});

	if(typeof(msg) === 'string') {
		var label = jQuery('div#progress_bar .ui-label');
		label.html(msg+'<b class="value">'+per+'%</b>');
		label.fadeIn();
	}
}

function row_class(value) {
	if (value%2 == 0) {
		return 'even';
	} else {
		return 'odd';
	}
}

function traverseElement(el, keyword) {
	if (!/^(script|style)$/.test(el.tagName)) {
		var child = el.lastChild;
		while (child) {
			if (child.nodeType == 1) {
				traverseElement(child, keyword);
			} else if (child.nodeType == 3) {
				surroundMatchingText(child, new RegExp('\\b'+keyword+'\\b', "gi"), createSpan);
			}
			child = child.previousSibling;
		}
	}
}

function surroundMatchingText(textNode, regex, surrounderCreateFunc) {
	var parent = textNode.parentNode;
	var result, surroundingNode, matchedTextNode, matchLength, matchedText;
	while ( textNode && (result = regex.exec(textNode.data)) ) {
		matchedTextNode = textNode.splitText(result.index);
		matchedText = result[0];
		matchLength = matchedText.length;
		textNode = (matchedTextNode.length > matchLength) ?
			matchedTextNode.splitText(matchLength) : null;
		surroundingNode = surrounderCreateFunc(matchedTextNode.cloneNode(true));
		parent.insertBefore(surroundingNode, matchedTextNode);
	parent.removeChild(matchedTextNode);
	}
}

function createSpan(matchedTextNode) {
	var el = document.createElement("span");
	el.className = "kw__highlight";
	el.appendChild(matchedTextNode);
	return el;
}

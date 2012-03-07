var Bookmark = (function(){
	var default_dir_name = 'Keyword Results';
	var dir_parent_id = '1';

	var init = function(callback) {
		// If init() has already been called, then just call the callback.
		if(Store.setting('bookmark_dir_id') !== false) {
			callback.call(this, Store.setting('bookmark_dir_id'));
		} else {
			var dir_id = false;

			// Search for it.
			chrome.bookmarks.getChildren(String(dir_parent_id), function(results) {
				for(var x in results) {
					if(!results[x].url && results[x].title == default_dir_name) {
						dir_id = results[x].id;
					}
				}

				// If we can't find it, create it.
				if(dir_id === false) {
					chrome.bookmarks.create({
						'parentId': String(dir_parent_id),
						'title': default_dir_name
					}, function(bookmark) {
						dir_id = bookmark.id;
						Store.setting('bookmark_dir_id', dir_id);
						callback.call(this, dir_id);
					});
				} else {
					Store.setting('bookmark_dir_id', dir_id);
					callback.call(this, dir_id);
				}
			});
		}
	}

	var keyword_dir = function(parent_id, keyword, callback) {
		chrome.bookmarks.getChildren(String(parent_id), function(children){
			for(var i in children) {
				if(children[i].title === keyword) {
					return callback.call(this, children[i].id);
				}
			}

			chrome.bookmarks.create({
				'parentId': String(parent_id),
				'title': keyword
			}, function(folder){
				if(folder){
					return callback.call(this, folder.id);
				}
			});
		});
	}

	return {
		create: function(keyword, name, url, callback) {
			console.log("Bookmarking "+keyword);
			init(function(dir_id){
				if(dir_id === false) {
					return false;
				}

				keyword_dir(dir_id, keyword, function(keyword_dir_id) {
					// Check for uniqueness
					chrome.bookmarks.getChildren(String(keyword_dir_id), function(children) {
						for(var n in children) {
							if(children[n].url === url) {
								callback.call();
								return;
							}
						}

						chrome.bookmarks.create({
							'parentId': String(keyword_dir_id),
							'title': name,
							'url': url
						}, function(bookmark) {
							// Do nothing.
						});

						callback.call();
					});
				});
			});
		}
	}
})();
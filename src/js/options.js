function save_options()
{
	var result = true;
	var serialized = jQuery('form[name="prefs"]').serialize().split('&');
	for(x in serialized) {
		var p = serialized[x].split('=');
		if(typeof(p[1]) !== 'undefined' && p[1] !== '') {
			if(!Store.setting(p[0], p[1])) {
				result = false;
			}
		}
	}

	if(result === true) {
		jQuery.facebox('All prefrences saved.');	
	} else {
		jQuery.facebox('<span style="color: #990000;">Error saving preferences!</span>');
	}
	setTimeout("jQuery.facebox.close();", 2000);
}

function load_options()
{
	var settings = Store.all_settings();

	jQuery('.option').each(function(index, Element){
		var value = settings[jQuery(this).attr('name')];
		if(typeof(value) === 'undefined' && jQuery(this).attr('default')) {
			value = jQuery(this).attr('default');
		}
		jQuery(this).val(unescape(value).replace(/\+/g, ' '));
	});

	load_bookmark_options();
}

function clear_cache()
{
	if(Store.clear_cache()) {
		jQuery.facebox('Local cache cleared.');
		setTimeout("jQuery.facebox.close();", 2000);
	}
}

function load_bookmark_options() {
	var select = jQuery('select[name="bookmark_dir_id"]');
	var value = Store.setting('bookmark_dir_id');
	chrome.bookmarks.getChildren('1', function(children){
		for(var i in children) {
			if(typeof(children[i].url) === 'undefined') {
				var selected = '';
				if(children[i].id === String(value)) {
					selected = 'selected="selected"';
				}
				select.append('<option value="'+children[i].id+'" '+selected+'>'+children[i].title+'</option>');
			}
		}
	});
}

jQuery(document).ready(function(){
	jQuery('select[name="bookmark_dir_id"]').select(function(){
		if(jQuery(this).val() === 'new') {
			var folder_name = prompt("Name of the new folder:");
			if(folder_name) {
				chrome.bookmarks.create({
					'parentId': '1',
					'title': folder_name
				}, function(bookmark) {
					pull_bookmark_options();
				});
			}
		}
	});


	load_options();

	jQuery('a#options_save').click(function(){ 
		save_options(); 
	});
});
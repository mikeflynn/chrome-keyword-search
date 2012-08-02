var Store = (function(){
	var default_ttl = 3600;
	var ns = {'settings':1, 'cache':1};

	if(window['localStorage'] === null) {
		// If you don't have localStorage, then die.
		return false;
	}

	var is_namespace = function(namespace) {
		if(ns.hasOwnProperty(namespace)) {
			return true;
		}

		return false;
	};

	var get_namespace_data = function(namespace) {
		if(is_namespace(namespace)) {
			var obj = window.localStorage.getItem(namespace);
			if(obj) {
				return fromJSON(obj);
			}
		}

		return false;
	}

	var set_namespace_data = function(namespace, obj) {
		if(is_namespace(namespace)) {
			window.localStorage.setItem(namespace, toJSON(obj));
			return true;
		}

		return false;
	}

	var set = function(namespace, key, value, ttl_seconds) {
		var data = get_namespace_data(namespace);
		if(!data) {
			data = {};
		}

		var ttl = 0;
		if(typeof(ttl_seconds) === 'undefined') {
			ttl_seconds = default_ttl;
		}

		if(ttl_seconds > 0) {
			var d = new Date();
			ttl = d.getTime() + (ttl_seconds * 1000);
		}

		data[key] = {
			'data': value,
			'ttl': ttl
		};

		if(set_namespace_data(namespace, data)){
			return true;
		}

		return false;
	};

	var get = function(namespace, key) {
		var cache = get_namespace_data(namespace);
		if(cache.hasOwnProperty(key)) {
			var obj = cache[key];
			var d = new Date();

			if(!obj.ttl || (obj.ttl !== 0 && obj.ttl > d.getTime())) {
				return fromJSON(obj.data);
			}
		}

		return false;
	};

	var remove = function(namespace, key) {
		var cache = get_namespace_data(namespace);
		if(cache.hasOwnProperty(key)) {
			delete cache[key];
			set_namespace_data(namespace, cache);
			return true;
		}

		return false;
	};

	var clear_all = function(namespace) {
		if(is_namespace(namespace) === true) {
			window.localStorage.removeItem(namespace);
			return true;
		}

		return false;
	};

	var get_all = function(namespace) {
		var cache = get_namespace_data(namespace);
		if(cache) {
			var list = {};
			for(var x in cache) {
				list[x] = cache[x]['data'];
			}

			return list;
		}

		return false;	
	};

	var toJSON = function (object) {
		if(typeof(JSON) !== 'undefined' && typeof(JSON.stringify) !== 'function') {
			return JSON.stringify(object);
		} else {
			var json = new Array();
			for(var index in object) {
				type = typeof(object[index]);
				if(type == 'object'){
					json.push('"'+index+'":' + toJSON(object[index]));
				} else if(type == 'string') {
					var cleaned_string = object[index].replace(/(?!\\)\"/g,'\\"').replace(/\n/g,'\\n').replace(/\t/g,'\\t').replace(/\r/g, '\\r');
					json.push('"'+index+'":' + '"'+cleaned_string+'"');
				} else if(type == 'boolean' || type == 'number') {
					json.push('"'+index+'":' +object[index]);
				}
			}
			string = '{' + json.join(',') + '}';

			return string;
		}
	};

	var fromJSON = function(json) {
		if(typeof(JSON) === 'object' && typeof(JSON.parse) === 'function') {
			return JSON.parse(json);
		} else {
			try {
				return eval('('+json+')');
			} catch (e) {
				return json;
			}
		}
	};

	return {
		cache: function(key, value, ttl) {
			if(typeof(key) === 'undefined') return false;

			if(typeof(value) !== 'undefined') {
				return set('cache', key, value, ttl);
			} else {
				return get('cache', key);
			}
		},

		setting: function(key, value) {
			if(typeof(key) === 'undefined') return false;
			
			if(typeof(value) !== 'undefined') {
				return set('settings', key, value, 0);
			} else {
				return get('settings', key);
			}
		},

		all_settings: function() {
			return get_all('settings');
		},

		dump_cache: function() {
			return get_all('cache');
		},

		clear_settings: function() {
			return clear_all('settings');
		},

		clear_cache: function(key) {
			if(typeof(key) === 'undefined') {
				return clear_all('cache');
			} else {
				return remove('cache', key);
			}
		}
	}
})();
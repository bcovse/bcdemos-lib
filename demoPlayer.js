
/**
 * DynamicPlayerLoader.js plugin
 *
 *
 * Dave Bornstein
 */


/* TODO:
 1. Allow page to override video properties like width, position, etc with an object
 2. Turn this into a class
 3. Remember players when we create them so we can destroy all that we created
 */

function destroyAllPlayers() {
	try{ videojs; }
	catch(e) {
		return
	}

	var playerList = videojs.getPlayers();
	for (var p in playerList) {
		destroyPlayer( p )
	}

	// Kill the playlist
	console.log('killing playlist')
}

function destroyPlayer( vjsId) {
	//console.log(videojs.getPlayers())

	player = videojs.getPlayers()[vjsId]
	if (player) {
		player.dispose()
	}
}

function loadVideo( vjsId, video) {
	if (! video) {
		return
	}

	console.log('[' + vjsId + '] loadVideo');
	console.log(video);

	var videoObject = new Object();
	videoObject.id = video.videoId || "";
	videoObject.name = video.metadata.name || "";
	videoObject.description = video.metadata.description || "";
	videoObject.account_id = video.accountId || "";
	videoObject.sources = video.src;

	videojs(vjsId).ready(function() {
		this.mediainfo = videoObject;
		this.src(this.mediainfo.sources);

		console.log('loading poster');
		if (typeof video.images.poster.src != 'undefined')  {
			this.poster(video.images.poster.src)
		}

	});
}

function createPlayer(vjsId, pid, div, inVideo) {

	// console.log("vjsId: " + vjsId)
	// console.log("pid: " + pid)
	// console.log("div: " + div)
	// console.log("inVideo: " + inVideo)

	console.log("Looking for player config(pid):" + pid);
	var myCfg = _cfg.players[pid];
	myCfg['pid'] = pid;
	var product = myCfg['product'] || 'vc';
	var playlistId = myCfg['playlistId'] || null;

	// xxx - validate myCfg was loaded or throw an error

	var video = inVideo || myCfg.defaultVideo || null;

	console.log("VIdeo is " + video)
	console.log("[" + vjsId + "] Dyanmically loading player " + pid + "[" + myCfg.bcPlayerId  +"] into " + div)

	var config = {
		'accountId':      myCfg.accountId,
		'dataPlayerId':   myCfg.bcPlayerId,
		'targetDiv':      div,
		'playerId':       vjsId
	};

	if (video) {
		config['videoId'] = video
	}

	// Load the player script first
	var playerScript = "https://players.brightcove.net/" + config.accountId + "/" + config.dataPlayerId + "_default/index.min.js";

	console.log('loading player: ' + playerScript);

	jQuery.getScript(playerScript, function(data, status, jqxhr) {

		//player script is loaded, now make the player object and load it.

		var vtagHTML = '';

		vtagHTML = '<video id="' + config.playerId.toString() + '" data-account="' + config.accountId + '" data-player="' + config.dataPlayerId + '" data-embed="default" class="video-js"';

		vtagHTML += ' preload="auto"';

		if (playlistId) {
			vtagHTML +=  ' data-playlist-id="' + playlistId + '"';
		} else {
			if ( product != "perform" && video)  {
				console.log("Adding Video ID: [" + video + "] to the HTML5 Video Element");
				vtagHTML +=  ' data-video-id="' + config.videoId + '"';
			}
		}

		if (myCfg.noposter)
			vtagHTML += ' poster ';

		if (myCfg.controls)
			vtagHTML += ' controls';

		if (myCfg.autoplay)
			vtagHTML += ' autoplay';

		if (myCfg.muted)
			vtagHTML += ' muted playsinline ';

		if (myCfg.loop)
			vtagHTML += ' loop';

		vtagHTML += '></video>';

		var playerHTML = '<div style="display: block; position: relative;"><div style="padding-top: 56.25%;">' + vtagHTML.toString().trim() + '</div></div>';

		console.log("PlayerInnerHTML: " + playerHTML);
		document.getElementById(config.targetDiv).innerHTML = playerHTML;

		var newDiv = document.getElementById(config.playerId.toString());

		// XXX Do we need to put these in the config file?
		newDiv.style.position = "absolute";
		newDiv.style.top = "0px";
		newDiv.style.bottom = "0px";
		newDiv.style.left = "0px";
		newDiv.style.right = "0px";
		newDiv.style.width = "100%";
		newDiv.style.height = "100%";

		console.log(document.getElementById(config.playerId.toString()));

		bc(document.getElementById(config.playerId.toString()));
		videojs(config.playerId.toString()).ready(function(){
			var player = this;
			console.log(player.tech_.hls.options());
			player.preload('auto');

			loadPlugins(vjsId, pid, myCfg);

			console.log( "Product is " + product);

			var vid;

			if ( product == "perform" && video) {
				console.log('Using Perform, Loading Video');
				vid = _cfg.videos[video] || {};
				if (! vid) {
					console.log('Could not find video: ' + video)
				} else {
					loadVideo(vjsId, vid);
				}
			}
			else if (product == 'vc') {
				vid = player;
			}
			console.log('Done loading player');
			$(document).trigger('playerLoaded', player);

		});
	});
}

function getScripts(scripts, callback) {
	var progress = 0;
	scripts.forEach(function(script) {
		console.log('loading ' + script);
		$.getScript(script, function () {
			if (++progress == scripts.length) callback();
		});
	});
}

function loadPlugins( vjsId, pid, config ) {

	console.log('**** initializing Plugins');

	var player  = videojs.getPlayers()[vjsId];
	var plugins = config.plugins || {};

	for (var pluginName in plugins) {
		var plugin = plugins[pluginName];
		console.log('pugin = ' + plugin);
		if (plugin.css) {
			$("<link/>", {
				rel: "stylesheet",
				type: "text/css",
				href: plugin.css
			}).appendTo("head");
		}
	}

	pluginList = [];
	for (var pluginName in plugins) {
		var plugin = plugins[pluginName];
		if (plugin.js)
			pluginList.push(plugin.js);


		getScripts(pluginList, function () {
			for (var pluginName in plugins) {

				var plugin = plugins[pluginName];
				console.log("Processing init for " + pluginName);
				player[pluginName](plugin.options)
			}
		});
	}
}


function testme(vjsId, pid, pluginName) {

	var options = _cfg.players[pid].plugins[pluginName].options;
	var player  = videojs.getPlayers()[vjsId];
	player[pluginName](options)
}

function initPlugin( vjsId, pid, pluginName) {

	player[pluginName](options);
	return;


	var options = _cfg.players[pid].plugins[pluginName].options;
	var player  = videojs.getPlayers()[vjsId];

	videojs.getPlayers()[vjsId].ready( function() {
		console.log('initializing plugin');
		player[pluginName](options)
	});
}
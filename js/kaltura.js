/**
 * Stand alone source grabber.
 */
/*
 * jQuery Kaltura Plugin
 */
(function($){
	
var methods = {
	init : function( options ) {
		// iterate the matched nodeset
		return this.each(function(index){
			var $cont = $(this);
			if ( $cont.data('kaltura.settings') ) return; // already initialized
			
			var opts = $.extend( {}, $.fn.kaltura.defaults, options || {});
			opts.index = index;
			opts.API = $.extend ( { cont: $cont }, $.fn.kaltura.API );
			opts.cont = $cont;
			opts.API.trigger = function( eventName, args ) {
				opts.cont.trigger( eventName, args );
				return opts.API;
			};
			
			$cont.data( 'kaltura.settings', opts );
			$cont.data( 'kaltura.API', opts.API );
			
			// opportunity for plugins to modify opts and API
			opts.API.trigger('kaltura-bootstrap', [ opts, opts.API ]);
			
			opts.API.preInitKaltura();
			kalturaGetSources($cont, index);
		});
	},
	destroy : function( ) {
	}
};

$.fn.kaltura = function( method ) {

	if ( methods[method] ) {
		return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
	} else if ( typeof method === 'object' || ! method ) {
		return methods.init.apply( this, arguments );
	} else {
		$.error( 'Method ' +  method + ' does not exist on jquery.tilezoom' );
	}

};

$.fn.kaltura.API = {
	opts: function() {
		return this.cont.data( 'kaltura.settings' );
	},
	preInitKaltura: function() {
		var opts = this.opts();
		
		var partnerId = opts.cont.data("partnerid");
		opts.partnerId = partnerId;
		if ( opts.partnerId == null ) {
			$.error( 'partnerId is not specified' );
		}
		//save entryId
		var entryId = opts.cont.data("entryid");
		opts.entryId = entryId;
		if ( opts.entryId == null ) {
			$.error( 'entryId is not specified' );
		}
		opts.cont.data( 'kaltura.settings', opts );
	}
}

//init Tilezoom
function kalturaGetSources($cont) {
	var settings = $cont.data('kaltura.settings');
	
	var wid = '_' + settings.partnerId;
	var entryId = settings.entryId;
	kalturaAddScript(settings.serviceUrl+'/api_v3/index.php?service=multirequest&format=9&1:service=session' +
			'&1:action=startWidgetSession&1:widgetId=' + wid +
			'&2:service=flavorasset&2:action=getByEntryId&2:ks={1:result:ks}&2:entryId=' + entryId +
			'&3:service=baseEntry&3:action=get&3:ks={1:result:ks}&3:entryId=' + entryId +
			'&callback=kalturaGetSourcesCallback'
	);
}

// Note we use a local pre-defined callback to enable cdn cache
kalturaGetSourcesCallback = function( result ) {
	
	// check for response object:
	if( !result[1] || !result[0]){
		console.log( "Error no flavor result" );
		return ;
	}
	var ks = result[0]['ks'];
	var ipadAdaptiveFlavors = [];
	var iphoneAdaptiveFlavors = [];
	var deviceSources = [];
	
	var entryId = result[1][0].entryId;
	
	var $video = $('video[data-entryId='+entryId+']');
	var settings = $video.data('kaltura.settings');
	var partnerId = settings.partnerId;
	var protocol = settings.protocol;
	
	var aspectRatio = result[1][0].width/result[1][0].height;
	settings.aspectRatio = aspectRatio;

	var baseUrl = settings.cdnUrl + '/p/' + partnerId +
			'/sp/' + partnerId + '00/playManifest';
			
	for( var i in result[1] ){
		var asset = result[1][i];
		// Continue if clip is not ready (2)
		if( asset.status != 2  ) {
			continue;
		}
		// Setup a source object:
		var source = {
			'data-bitrate' : asset.bitrate * 8,
			'data-width' : asset.width,
			'data-height' : asset.height
		};

		var src  = baseUrl + '/entryId/' + asset.entryId;
		// Check if Apple http streaming is enabled and the tags include applembr ( single stream HLS )
		if( asset.tags.indexOf('applembr') != -1 ) {
			src += '/format/applehttp/protocol/'+ protocol + '/a.m3u8';

			deviceSources.push({
				'data-flavorid' : 'AppleMBR',
				'type' : 'application/vnd.apple.mpegurl',
				'src' : src
			});

			continue;
		} else {
			src += '/flavorId/' + asset.id + '/format/url/protocol/' + protocol;
		}

		// add the file extension:
		if( asset.tags.toLowerCase().indexOf('ipad') != -1 ){
			source['src'] = src + '/a.mp4';
			source['data-flavorid'] = 'iPad';
			source['type'] = 'video/mp4';
		}

		// Check for iPhone src
		if( asset.tags.toLowerCase().indexOf('iphone') != -1 ){
			source['src'] = src + '/a.mp4';
			source['data-flavorid'] = 'iPhone';
			source['type'] = 'video/mp4';
		}

		// Check for ogg source
		if( asset.fileExt.toLowerCase() == 'ogg'
			||
			asset.fileExt.toLowerCase() == 'ogv'
			||
			asset.containerFormat.toLowerCase() == 'ogg'
		){
			source['src'] = src + '/a.ogg';
			source['data-flavorid'] = 'ogg';
			source['type'] = 'video/ogg';
		}

		// Check for webm source
		if( asset.fileExt == 'webm'
			||
			asset.tags.indexOf('webm') != -1
			|| // Kaltura transcodes give: 'matroska'
			asset.containerFormat.toLowerCase() == 'matroska'
			|| // some ingestion systems give "webm"
			asset.containerFormat.toLowerCase() == 'webm'
		){
			source['src'] = src + '/a.webm';
			source['data-flavorid'] = 'webm';
			source['type'] = 'video/webm';
		}

		// Check for 3gp source
		if( asset.fileExt == '3gp' ){
			source['src'] = src + '/a.3gp';
			source['data-flavorid'] = '3gp';
			source['type'] = 'video/3gp';
		}
		
		// Check for mbr mp4 file
		if( asset.tags.toLowerCase().indexOf('iphone') == -1
			&&
			asset.tags.toLowerCase().indexOf('ipad') == -1
			&&
			asset.fileExt == 'mp4'
		){
			source['src'] = src + '/a.mp4';
			source['type'] = 'video/mp4';
		}
		
		if( asset.width > 1280 ) {
			source['media'] = 'all and (min-width: 1280px)';
		}
		
		// Add the device sources
		if( source['src'] ){
			deviceSources.push( source );
		}

		// Check for adaptive compatible flavor:
		if( asset.tags.toLowerCase().indexOf('ipadnew') != -1 ){
			ipadAdaptiveFlavors.push( asset.id );
		}
		if( asset.tags.toLowerCase().indexOf('iphonenew') != -1 ){
			iphoneAdaptiveFlavors.push( asset.id );
		}

	};
	// Add the flavor list adaptive style urls ( multiple flavor HLS ):
	// Create iPad flavor for Akamai HTTP
	if( ipadAdaptiveFlavors.length != 0 ) {
		deviceSources.push({
			'data-flavorid' : 'iPadNew',
			'type' : 'application/vnd.apple.mpegurl',
			'src' : baseUrl + '/entryId/' + asset.entryId + '/flavorIds/' + ipadAdaptiveFlavors.join(',')  + '/format/applehttp/protocol/' + protocol + '/a.m3u8'
		});
	}
	// Create iPhone flavor for Akamai HTTP
	if(iphoneAdaptiveFlavors.length != 0 ) {
		deviceSources.push({
			'data-flavorid' : 'iPhoneNew',
			'type' : 'application/vnd.apple.mpegurl',
			'src' : baseUrl + '/entryId/' + asset.entryId + '/flavorIds/' + iphoneAdaptiveFlavors.join(',')  + '/format/applehttp/protocol/' + protocol + '/a.m3u8'
		});
	}
	
	if(/android/i.test(navigator.userAgent)){
		if(deviceSources[1] != undefined) {
			$video.append($('<source />').attr( deviceSources[1] ));
		}
		else {
			$video.append($('<source />').attr( deviceSources[0] ));
		}
	}
	else {
		for( var i = deviceSources.length - 1; i >= 0; i-- ){
			$video.append($('<source />').attr( deviceSources[i] ));		
		}	
	}
	
	var thumbnailUrl = result[2]['thumbnailUrl'];
	if(settings.thumbWidth) thumbnailUrl = thumbnailUrl + '/width/'+settings.thumbWidth;
	
	$video.attr({
		'title' : result[2]['name'],
		'data-entryid' : result[2]['id'],
		'data-description' : result[2]['description'],
		'data-durationhint' : result[2]['duration'],
		'poster' : thumbnailUrl,
		'controls': true,
		'controls': settings.controls,
		'preload': settings.preload,
		'autoplay' : settings.autoplay
	});
	
	settings.cont.data( 'kaltura.settings', settings );
	
	settings.API.trigger('kaltura-post-initialize', [ settings]);
	
}

function kalturaAddScript( url ){
	var script = document.createElement( 'script' );
	script.type = 'text/javascript';
	script.src = url;
	document.getElementsByTagName('head')[0].appendChild( script );
}

$.fn.kaltura.defaults = {
	protocol: location.protocol.substr(0, location.protocol.length-1),
	serviceUrl : 'https://www.kaltura.com',
	cdnUrl : 'http://cdnbakmi.kaltura.com',
	thumbWidth : null,
	controls: true,
	preload : true,
	autoplay : false
}

})(jQuery);

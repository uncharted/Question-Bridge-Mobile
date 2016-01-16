$(document).on('pageinit', '#page-ask-question-step-1', function(evt, ui) {
	initAsqQuestion();
});

$(document).on('pageinit', '#take-me-back', function(evt, ui) {
	videoRecordReturnBack();
});

var checkDeviceRotateInterval = null;

function showDeviceRotateMessage(){
	var activePageId = $.mobile.activePage.attr( "id" );
	var $activePage = $('#'+activePageId);

	$activePage.find('div#orientation-message').remove();
	var $divDevice = $('<div id="orientation-message-ico"><img src="images/device-rotate-ico.png" alt=""></div>');
	var $orientationText = $('<div id="orientation-text"><p>Please rotate your device to landscape orientation.</p></div>');
	var $orientationElements = $('<div id="orientation-elements">');
	$orientationElements.append($divDevice, $orientationText);
	var $orientationMessage = $('<div id="orientation-message"></div>');
	$orientationMessage.append($orientationElements);
	$activePage.append($orientationMessage);

	setTimeout(function() {
		$activePage.find('div#orientation-message').remove();
		return false;
	}, 4000);

	if(checkDeviceRotateInterval == null) {
		checkDeviceRotateInterval = setInterval(function() {
			var activePageId = $.mobile.activePage.attr( "id" );

			if(activePageId != 'page-question' && activePageId != 'page-ask-question-step-1' && activePageId != 'registration-step-3') {
				clearInterval(checkDeviceRotateInterval);
				checkDeviceRotateInterval = null;
			}
			else {
				if(/iPhone/i.test(navigator.userAgent)){
					navigator.accelerometer.getCurrentAcceleration(
						function(acceleration) {
							var accelerationX = acceleration.x;
							if(accelerationX >= 8 || accelerationX <= -8) {
								autoCaptureOnCorrectRotate();
							}
						},
						function() {
							alert('onError!');
						}
					);
				}
				else if(/iPad/i.test(navigator.userAgent)){
					if(orientation == 90 || orientation == -90) {
						autoCaptureOnCorrectRotate();
					}
				}
				else{
					autoCaptureOnCorrectRotate();
				}
			}
		}, 1000);
	}
}

function autoCaptureOnCorrectRotate(){
	clearInterval(checkDeviceRotateInterval);
	checkDeviceRotateInterval = null;

	if(qbApp.captureType == 'question') {
		submitHandlerCaptureVideo();
	}
	if(qbApp.captureType == 'answer') {
		prosessAnswerCaptureVideo();
	}
	if(qbApp.captureType == 'picture') {
		qbApp.behaviors.submitHandlerCapturePicture();
	}
}



function videoRecordReturnBack(){
	$('#take-me-back').find('a.return-back').on('click', function(event) {
		event.preventDefault();
		//$.mobile.silentScroll(1);
		$.mobile.changePage('#page-about', {transition: "slidefade"});
		//$.mobile.silentScroll(1);
		/*if(qbApp.returnPageId.length){
			$(qbApp.returnPageId).find('div.content-primary').css('visibility', 'visible');
			$.mobile.changePage(qbApp.returnPageId, {transition: "slidefade", changeHash: false});
		}
		else {
			$.mobile.changePage('#page-home', {transition: "slidefade"});
		}*/
	});
}

function initAsqQuestion(){
	$( '#page-ask-question-step-1' ).find("form.new-question-form-1").on('submit', function(event) {
		event.preventDefault();
	}).validate({
		errorPlacement: function(){
			return false;  // suppresses error message text
		},
		submitHandler: function(form) {
			//Reset #page-ask-question-step-1 form
			var $input = $('#page-ask-question-step-2').find("form.new-question-form-2 input:text, form.new-question-form-2 textarea");
			$.each($input, function(index, field) {
				 $(field).val('');
			});
			qbApp.captureType = 'question';
			if(/iPhone/i.test(navigator.userAgent)){
				navigator.accelerometer.getCurrentAcceleration(
					function(acceleration) {
						var accelerationX = acceleration.x;
						if( (accelerationX > 0 && accelerationX < 8) || (accelerationX < 0 && accelerationX > -8)) {
							showDeviceRotateMessage();
						}
						else {
							submitHandlerCaptureVideo();
						}
					},
					function() {
						alert('onError!');
					}
				);
			}
			else if((orientation != 90 && orientation != -90) && /iPad/i.test(navigator.userAgent)){
				showDeviceRotateMessage();
			}
			else{
				submitHandlerCaptureVideo();
			}
			return false;
		}
	});
}

function submitHandlerCaptureVideo() {
	$( '#page-ask-question-step-1' ).find( '.content' ).addClass( 'content-hidden' );
	captureVideo('question');
}

function askQuestionAftercapture(mediaFiles){
	var $questionSubmitPage = $( '#page-ask-question-step-2' ),
			$questionSubmitBtn = $questionSubmitPage.find( 'form input[type="submit"]' );

	$questionSubmitPage.find( 'div.progress-loader' ).show();
	$questionSubmitBtn.css( 'visibility' , 'visible' );

	$.mobile.changePage('#page-ask-question-step-2', {transition: "fade", changeHash: false});
	setTimeout(function() {
		$( '#page-ask-question-step-1' ).find( '.content' ).show().removeClass( 'content-hidden' );
	}, 1000);

	qbApp.capture.url  = qbApp.settings.serverUrl + 'qb/rest/video/video-upload';
	qbApp.capture.uid  = qbApp.cookie.user.uid;
	qbApp.returnPageId = '#page-home';
	qbApp.captureType  = 'question';
	uploadFile(mediaFiles);

	$('#page-ask-question-step-2').find("form.new-question-form-2").on('submit', function(event) {
		event.preventDefault();
	}).validate({
		errorPlacement: function(){
			return false;  // suppresses error message text
		},
		submitHandler: function(form) {
			if( qbApp.formSubmitAccess === true ) {
				qbApp.showLoading($('body > div.ui-loader'), 'html', true);
				$questionSubmitBtn.css( 'visibility' , 'hidden' );
				var $form = $(form),
						formData = $form.serialize(),
						requestUrl = qbApp.settings.serverUrl + 'qb/rest/video/question?' + formData + '&uid=' + qbApp.cookie.user.uid;

				$.getJSON(requestUrl, function(response) {
					if(response.success === true) {
						qbApp.hideLoading($('body > .ui-loader'));
						$.mobile.changePage('#take-me-back', {transition: "slide", changeHash: false});
						qbApp.formSubmitAccess = false;
					}
				});
			}
		}
	});
}

function prosessAnswer(){
	var loginCheck = checkAuthentication();
	if(loginCheck === true){
		qbApp.captureType = 'answer';
		if(/iPhone/i.test(navigator.userAgent)){
			navigator.accelerometer.getCurrentAcceleration(
				function(acceleration) {
					var accelerationX = acceleration.x;
					if( (accelerationX > 0 && accelerationX < 8) || (accelerationX < 0 && accelerationX > -8)) {
						showDeviceRotateMessage();
					}
					else {
						prosessAnswerCaptureVideo();
					}
				},
				function() {
					alert('onError!');
				}
			);
		}
		else if((orientation != 90 && orientation != -90) && /iPad/i.test(navigator.userAgent)){
			showDeviceRotateMessage()
		}
		else{
			prosessAnswerCaptureVideo();
		}
	}
}

function prosessAnswerCaptureVideo() {
	var activePageId = $.mobile.activePage.attr( "id" );
	$('#'+activePageId).find( '.content' ).hide();
	captureVideo('answer');
}

function checkAuthentication(){
	var activePageId = $.mobile.activePage.attr( "id" );
	if(qbApp.cookie == undefined){
		event.preventDefault();
		if($(window).width() >= 768){
			$( '#' + activePageId ).find( '#main-menu' ).find( '.ipad-sing-in a' ).trigger( 'click' );
			//$('#'+activePageId).find('div#ipad-login').popup('open');
		}
		else{
			$.mobile.changePage( "#page-sing-in", {transition: "slide", changeHash: false, reverse: true});
		}
	}
	else{
		return true;
	}
}

function captureSuccess(mediaFiles) {
	var i, len,
			activePageId = $.mobile.activePage.attr( "id" );
	for (i = 0, len = mediaFiles.length; i < len; i += 1) {
		var mediaFile = mediaFiles[i];
		//qbApp.capture.mediaFile = mediaFile;
		if( qbApp.capture.type == 'answer' ) {
			qbApp.capture.nid = $('#'+activePageId).find('div.question').data('nid');
			qbApp.capture.uid = qbApp.cookie.user.uid;
			qbApp.capture.url = qbApp.settings.serverUrl + 'qb/rest/video/answer';
			qbApp.returnPageId = '#'+activePageId;
			qbApp.captureType = null;
			$.mobile.changePage('#take-me-back', {transition: "fade", changeHash: false});
			setTimeout(function() {
				$('#'+activePageId).find( '.content' ).show().removeClass( 'content-hidden' );
			}, 1000);
			$( '#take-me-back' ).find( '.answer-uploading' ).show().siblings( '.after-upload' ).hide();
			uploadFile(mediaFiles[i]);
		}
		else {
			qbApp.showLoading($('body > div.ui-loader'), 'html');
			askQuestionAftercapture(mediaFiles[i]);
		}
	}
}

function captureError(error) {
	var activePageId = $.mobile.activePage.attr( "id" );
	if ( activePageId == 'page-ask-question-step-1' ) {
		$( '#page-ask-question-step-1' ).find( '.content' ).fadeIn().removeClass( 'content-hidden' );
	} else {
		$('#'+activePageId).find( '.content' ).fadeIn().removeClass( 'content-hidden' );
	}
}

function captureVideo(type) {
	qbApp.capture.type = type;
	var duration = (type =='question') ? 30 : 90,
			windowWidth = $( window ).width(),
			portraitOverlay = ( windowWidth > 768 ) ? 'overlay-iPad-portrait.png' : 'overlay-iPhone-portrait.png',
			landscapeOverlay = ( windowWidth > 768 ) ? 'overlay-iPad-landscape.png' : 'overlay-iPhone-landscape.png';

	if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
		/*navigator.device.capture.captureVideo(captureSuccess, captureError, {limit: 1, duration: 90});*/
		window.plugins.videocaptureplus.captureVideo(
      captureSuccess, // your success callback
      captureError,   // your error callback
      {
        limit: 1, // the nr of videos to record, default 1 (on iOS always 1)
        duration: duration, // max duration in seconds, default 0, which is 'forever'
        highquality: true, // set to true to override the default low quality setting
        frontcamera: true, // set to true to override the default backfacing camera setting
        // you'll want to sniff the useragent/device and pass the best overlay based on that.. assuming iphone here
        portraitOverlay: 'www/images/cameraoverlays/' + portraitOverlay, // put the png in your www folder
        landscapeOverlay: 'www/images/cameraoverlays/' + landscapeOverlay // not passing an overlay means no image is shown for the landscape orientation
      }
  	);
	}
	else{
		$.mobile.changePage('#take-me-back', {transition: "slide", changeHash: false});
	}

}

function uploadFile( mediaFile ) {

	var uploadSuccess = function( result ){
		if( qbApp.captureType  == 'question' ) {
			var activePageId = $.mobile.activePage.attr( "id" );
					$questionCreatePage = $( '#' + activePageId ),
					response = jQuery.parseJSON(result.response),
					fid = response.fid;

			$questionCreatePage.find( 'input.uploaded-video-id' ).attr( 'value', fid );
			$questionCreatePage.find( 'div.progress-loader' ).hide(function() {
				qbApp.formSubmitAccess = true;
			});
		}
		else {
			var $takeMeBackPage = $( '#take-me-back' );
			$takeMeBackPage.find( '.answer-uploading' ).fadeOut(function(){
				$takeMeBackPage.find( '.after-upload' ).fadeIn();
			});
		}
	};

	var uploadFail = function(error){
		if (error.code == 1) {
			navigator.notification.alert("file " + error.source + " not found",null,'Error');
		} else if (error.code == 2) {
			navigator.notification.alert("url " + error.target +" invalid",null,'Error');
		} else if (error.code == 3) {
			navigator.notification.alert("Connection error",null,'Error');
		} else {
			navigator.notification.alert("Unknown error",null,'Error');
		}
	};
	var ft = new FileTransfer(),
		path = mediaFile.fullPath,
		name = mediaFile.name;

		if( qbApp.captureType  == 'question' ) {
			var $progressBar = $('#page-ask-question-step-2').find('div.progress-loader');
		}
		else {
			var $progressBar = $('#take-me-back').find('div.progress-loader');
		}

		var perc;
		ft.onprogress = function(progressEvent) {
			if (progressEvent.lengthComputable) {
				perc = Math.floor(progressEvent.loaded / progressEvent.total * 100);
				$progressBar.css('width', perc*2.6);
			} else {
				alert('done');
				$progressBar.hide();
			}
		};

	var options = new FileUploadOptions();
		options.chunkedMode = false;
		options.fileName = name;
		options.mimeType = mediaFile.type;
		options.headers = {
			Connection: "close"
		};

	//Additional data for send
	options.params = qbApp.capture;
	ft.upload(path, qbApp.capture.url, uploadSuccess, uploadFail, options);

	//Remove temp video file
/*	videoURI = mediaFile.substr(8, text.length-8);

	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){alert(fileSystem.name)}, fail);

	window.resolveLocalFileSystemURI(videoURI, function(fileEntry){alert(fileEntry.name)}, fail);

	var fail = function(error) {
        console.log(error.code);
    }*/
}

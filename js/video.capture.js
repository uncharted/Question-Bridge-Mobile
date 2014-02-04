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
							if(accelerationX >= 8) {
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
		submitHandlerCapturePicture();
	}
}



function videoRecordReturnBack(){
	$('#take-me-back').find('a.return-back').on('click', function(event) {
		event.preventDefault();
		if(qbApp.returnPageId.length){
			$(qbApp.returnPageId).find('div.content-primary').css('visibility', 'visible');
			$.mobile.changePage(qbApp.returnPageId, {transition: "slidefade"});
		}
		else {
			$.mobile.changePage('#page-home', {transition: "slidefade"});
		}
	});
}

function initAsqQuestion(){
	$('#page-ask-question-step-1').find("form.new-question-form-1").on('submit', function(event) {
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
						if(accelerationX < 8) {
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
	/*qbApp.captureType = null;*/
	captureVideo('question');
}

function askQuestionAftercapture(mediaFiles){
	$.mobile.changePage('#page-ask-question-step-2', {transition: "slide"/*, reloadPage: true*/});
	var $questionSubmitPage = $( '#page-ask-question-step-2' ),
			$questionSubmitBtn = $questionSubmitPage.find( 'form input[type="submit"]' );

	$questionSubmitBtn.css( 'visibility' , 'visible' );

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
			qbApp.showLoading($('body > div.ui-loader'), 'html', true);
			$questionSubmitBtn.css( 'visibility' , 'hidden' );
			var $form = $(form),
					formData = $form.serialize(),
					requestUrl = qbApp.settings.serverUrl + 'qb/rest/video/question?' + formData;

			$.getJSON(requestUrl, function(response) {
				if(response.success == true) {
					alert('success');
				}
			});
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
					if(accelerationX < 8) {
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
	qbApp.capture.nid = $('#'+activePageId).find('div.question').data('nid');
	qbApp.capture.uid = qbApp.cookie.user.uid;
	qbApp.capture.url = qbApp.settings.serverUrl + 'qb/rest/video/answer';
	qbApp.returnPageId = '#'+activePageId;
	qbApp.captureType = null;
	$('#'+activePageId).find('div.content-primary').css('visibility', 'hidden');
	captureVideo('answer');
}

function checkAuthentication(){
	var activePageId = $.mobile.activePage.attr( "id" );
	if(qbApp.cookie == undefined){
		event.preventDefault();
		if($(window).width() >= 768){
			$('#'+activePageId).find('div#ipad-login').popup('open');
		}
		else{
			$.mobile.changePage( "#page-sing-in", {transition: "slide"});
		}
	}
	else{
		return true;
	}
}

function captureSuccess(mediaFiles) {
	qbApp.showLoading($('body > div.ui-loader'), 'html');
	var i, len;
	for (i = 0, len = mediaFiles.length; i < len; i += 1) {
		var mediaFile = mediaFiles[i];
		//qbApp.capture.mediaFile = mediaFile;
		qbApp.capture.type == 'answer' ? 	uploadFile(mediaFiles[i]) : askQuestionAftercapture(mediaFiles[i]);
	}
}

function captureError(error) {
	var activePageId = $.mobile.activePage.attr( "id" );
	$('#'+activePageId).find('div.content-primary').css('visibility', 'visible');
}

function captureVideo(type) {
	qbApp.capture.type = type;
	var duration = (type =='question') ? 30 : 90;

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
        portraitOverlay: 'www/images/cameraoverlays/overlay-iPhone-portrait.png', // put the png in your www folder
        landscapeOverlay: 'www/images/cameraoverlays/overlay-iPhone-landscape.png' // not passing an overlay means no image is shown for the landscape orientation
      }
  	);
	}
	else{
		$.mobile.changePage('#take-me-back', {transition: "slide"});
	}

}

function uploadFile( mediaFile ) {

	var uploadSuccess = function( result ){
		if( qbApp.captureType  == 'question' ) {
			var activePageId = $.mobile.activePage.attr( "id" );
					$questionCreatePage = $( '#' + activePageId ),
					response = jQuery.parseJSON(result.response),
					fid = response.fid;

			alert(response);
			$questionCreatePage.find( 'input.uploaded-video-id' ).attr( 'value', fid );
			$questionCreatePage.find( 'div.progress-loader' ).hide();
			alert(fid);
		}
		else {
			qbApp.hideLoading($('body > .ui-loader'));
			$.mobile.changePage('#take-me-back', {transition: "slide"});
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
			var $progressBar = $('#page-ask-question-step-2').find('div.progress-loader'),
					perc;

			ft.onprogress = function(progressEvent) {
				if (progressEvent.lengthComputable) {
					perc = Math.floor(progressEvent.loaded / progressEvent.total * 100);
					$progressBar.css('width', perc*3);
				} else {
					alert('done');
					$progressBar.hide();
				}
			};
		}

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
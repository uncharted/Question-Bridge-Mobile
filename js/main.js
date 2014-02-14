
var qbApp = qbApp || { 'settings': {}, 'behaviors': {} };
//var FB = FB || null;

(function ($) {
	$.mobile.autoInitializePage = false;
	$.mobile.buttonMarkup.hoverDelay = 25;


	qbApp.settings.serverUrl = 'http://drupal7.dev/qbridge/';
	//qbApp.settings.serverUrl = 'http://dev.uncharteddigital.com/questionbridge/';
	//qbApp.settings.serverUrl = 'http://107.21.242.74/';
	qbApp.settings.restUrl = qbApp.settings.serverUrl + 'qb/rest/';
	qbApp.settings.kaltura = {};
	qbApp.settings.kaltura.serviceUrl = 'http://107.22.246.60';
	qbApp.settings.kaltura.cdnUrl = 'http://d2dubxfb4mntd4.cloudfront.net';
	qbApp.settings.kaltura.thumbWidth = 360;
	qbApp.settings.kaltura.smallThumbWidth = 160;
	qbApp.settings.kaltura.bigThumbWidth = 1024;
	qbApp.spinner = null;
	qbApp.cookie = null;
	qbApp.capture = {};
	"ontouchmove" in window ? qbApp.clickEvent = 'tap' : qbApp.clickEvent = 'click';
	qbApp.searchResultsInLoading = false;
	qbApp.question = null;
	qbApp.data = null;
	qbApp.pageComeFrom = null;
	qbApp.captureType = null;
	qbApp.requestingPage = null;
	qbApp.formReset = false;
	qbApp.formSubmitAccess = false;
	qbApp.captureCounter = 0;
	qbApp.wideWidthHeight = ($(window).width()/16)*9;

	if("deviceready" in window) {
		document.addEventListener("deviceready", function(){
			initApp();
		},true);
	}
	else {
		$(document).on('ready', function(){
			initApp();
		});
	}

	function initApp() {
		initDevice();
		copyMainMenu();
		$.mobile.initializePage();
		setTimeout( function() { initGeolocation();}, 2200);
		initCheckAuth();
		initMainMenu();
		initLogoNavigate();
		initOrientationChange();
		initLogOut();
		initAndroidHardcode();
		FB.init({ appId: "315999478539121", nativeInterface: CDV.FB, useCachedDialogs: false });
	}

	/**
	 * [initAndroidHardcode quick fix for vedroid]
	 */
	function initAndroidHardcode() {
		if( navigator.userAgent.match( /Android/i ) ) {
			$( 'div[data-role="footer"]' ).removeAttr( 'data-position' );
		}
	}

	function initDevice() {
		var $body = $('body');

		if(navigator.userAgent.match(/Android/i)){
			$body.addClass('android');
		}

		// TODO FIXME: HARDCODE for quick fix placeholder problem. Add class on non-empty input.
		$('input').on('focus', function(){
			var $this = $(this);
			if($this.val().length)	$this.addClass('filled');
		});
		$('input').on('focusout', function(){
			var $this = $(this);
			if(!$this.val().length)	$this.removeClass('filled');
		});
		//First time app run. Slide on tutotial page
		var applaunchCount = window.localStorage.getItem('launchCount');
		if(applaunchCount === null){
				window.localStorage.setItem('launchCount', true);
/*				setTimeout(function() {
					$.mobile.changePage('#page-tutorial-1', {transition: "fade"});
		    }, 600);*/
				initTutorialPage();
		}
		else {
			$( 'body' ).children( '.page-tutorial' ).remove();
		}
		//initTutorialPage();
		setTimeout(function() {
			navigator.splashscreen.hide();
    }, 2000);

		$.ajaxSetup({
			timeout: 60000,
			global: true
		});

		$(document).ajaxComplete(function( event, xhr, settings ) {
			/*alert(xhr.responseHTML);
			alert(xhr.responseHTML.questions);
			alert(xhr.responseHTML.questions.length);*/
		});
	}

	function initTutorialPage() {
/*		$('body')
			.one('swipeleft', function(event) {
				var activePageId = $.mobile.activePage.attr( "id" ),
						$nextPageLink = $('#' + activePageId).find('ul.tutorial-slide li.active a').parent().next().find('a');
				if($nextPageLink.length) {
					$nextPageLink.trigger('click');
				}
				else {
					$.mobile.changePage('#page-home', {transition: "slidefade"});
					$('body').off('swipeleft swiperight');
				}
				event.stopImmediatePropagation();
			})
			.one('swiperight', function(event) {
				var activePageId = $.mobile.activePage.attr( "id" ),
						$prevPageLink = $('#' + activePageId).find('ul.tutorial-slide li.active a').parent().prev().find('a');
				if($prevPageLink.length) $prevPageLink.trigger('click');
				event.stopImmediatePropagation();
			});*/
		$('div.page-tutorial').on({
		    swipeleft: function(event){
		    	var activePageId = $.mobile.activePage.attr( "id" ),
					$img = $( '#' + activePageId ).find( 'img' ),
					forwardPage = $img.data( 'slide-forward' );
					if( forwardPage != undefined ) {
						$.mobile.changePage( forwardPage, {transition: "slide"});
					}
					else {
						$.mobile.changePage( '#page-home', {transition: "slide"});
					}

/*						$nextPageLink = $('#' + activePageId).find('ul.tutorial-slide li.active a').parent().next().find('a');
				if($nextPageLink.length) {
					$nextPageLink.trigger('click');
				}
				else {
					$.mobile.changePage('#page-home', {transition: "slidefade"});
					$('body').off('swipeleft swiperight');
				}*/
		        event.stopImmediatePropagation();
		    },
		    swiperight: function(event){
		    	var activePageId = $.mobile.activePage.attr( "id" ),
					$img = $( '#' + activePageId ).find( 'img' ),
					backPage = $img.data( 'slide-back' );
					if( backPage != undefined ) {
						$.mobile.changePage( backPage, {transition: "slide", reverse: true});
					}
/*		        var activePageId = $.mobile.activePage.attr( "id" ),
						$prevPageLink = $('#' + activePageId).find('ul.tutorial-slide li.active a').parent().prev().find('a');
				if($prevPageLink.length) $prevPageLink.trigger('click');*/
		        event.stopImmediatePropagation();
		    }
		});
		$( window ).on( 'orientationchange', function() {
			var activePageId = $.mobile.activePage.attr( "id" );
			$( '#' + activePageId ).css( 'maxHeight', $( window ).height() );
		})
	}


	//iOs recalculate page height without status bar
	$(document).bind('pagechange', function(e, data) {
		//remove animation
		if($('div#orientation-message').length) $('div#orientation-message').remove();
/*		var activePageId = $.mobile.activePage.attr( "id" );
		var $activePage = $('#'+activePageId);
		var pageHeight = $activePage.height();
		$activePage.css('min-height' , pageHeight-20);
		alert(pageHeight);*/
	})

	//Add/remove question to user favorite list
	function toggleIsQuestionFavorite(nid, action){
		if(qbApp.cookie){
			qbApp.showLoading($('body > div.ui-loader'), 'html');
			var uid = qbApp.cookie.user.uid;
			if(typeof parseInt(nid) === 'number' && typeof  parseInt(uid) === 'number'){
				$.getJSON(qbApp.settings.restUrl + "video/actions?jsoncallback=?&action="+action+"&favorite-nid=" + nid + "&uid=" + uid + '&bundle=question',
							function(response){
								var activePageId = $.mobile.activePage.attr( "id" );
								if(response.result == 'addSuccess'){
									$('#'+activePageId).find('a.nav-favorite').addClass('is-favorite');
								}
								else if(response.result == 'removeSuccess'){
									$('#'+activePageId).find('a.nav-favorite').removeClass('is-favorite');
								}
								else{
									alert('Sorry, an error occurred.');
								}
								qbApp.hideLoading($('body > div.ui-loader'), 'html');

								var $listviewContainer = $('#page-home').find('ul.questions[data-role="listview"]');
								var order = $listviewContainer.attr('data-order');
								if(order == 'favourites') {
									initQuestionsList('#page-home', {order:'favourites'}, 'replace');
								}

							})
			}
		}
		else{
			checkAuthentication();
		}
	}

	function createNewTag($newTagForm){
		//if (!checkAuthentication()) return false;

		var $newTag = $newTagForm.find('.new-tag');
		$newTagForm.show();
		$newTag.select();
		$(document).delegate('.ui-content', 'touchmove', false);

		//Load data for submit
		var activePageId = $.mobile.activePage.attr( "id" );
		var nid = $('#'+activePageId).find('div.question').data('nid');
		if(!$newTagForm.hasClass('processed')) {
			$newTagForm.on('submit', function(event) {
				if($newTag.val().length){
					$newTagForm.hide();
					$newTag.focusout().blur();
					//$('#'+activePageId).find('a.video-respond').focus();
					$.getJSON(qbApp.settings.restUrl + "video/actions?jsoncallback=?&nid=" + nid + "&new-tags="+$newTag.val(),
						function(response){
							if($('#'+activePageId).find('div.themes-wrapper').length == 0) {
								//build HTML for themes container
								var $themesWrapper = $('<div class="themes-wrapper"></div>');
								var $themesTitle = $('<h3>Themes</h3>');
								var $themesContainer = $('<ul class="themes"></ul>');
								var $content = $('#'+activePageId).find('div.content-primary');
								var $questionInfoWrapper = $content.find('div.question-additional-wrapper');
								$themesWrapper.append($themesTitle);
								$themesWrapper.append($themesContainer);
								$questionInfoWrapper.append($themesWrapper);
							}
							var $themeTagsUl = $('#'+activePageId).find('ul.themes');
							$.each(response.created_tags, function(index, tag) {
								var $newTagLi = $('<li class="theme"><a href="#page-theme" data-tid="'+tag.tid+'">'+tag.name+'</a></li>');
								$themeTagsUl.append($newTagLi);
							});
							initSwipeScroll($('#'+activePageId).find('div.themes-wrapper'));
							$newTag.val('');
						});
					$newTagForm.addClass('processed');
				}
				return false;
			});
		}

		$newTag.focusout(function(){
			$newTagForm.hide();
			$(document).undelegate('.ui-content', 'touchmove', false);
			$.mobile.silentScroll(1);
		})
	}

	function homepageImgVerticalAlign($thumb){
			var aspectRatio = $thumb.width()/$thumb.height();
			if(aspectRatio < 1.5){
				var $parentLi = $thumb.parent('li');
				$parentLi.css('max-height', $(window).width()/1.77);
				var parentLiHeight = $parentLi.height();
				var imgCropOffset = (parentLiHeight - $thumb.height())/2;
				$thumb.css('marginTop', imgCropOffset)
			}
	}

	function socialShare(){
		/*window.plugins.socialsharing.available(function(isAvailable) {
			if (isAvailable) {
				var activePageId = $.mobile.activePage.attr( "id" );
				var $activePage = $('#'+activePageId);
				var urlAlias = $activePage.find('div.question').data('url');
				var questionTheme = $activePage.find('h2').html();
				var thumbUrl =  $activePage.find('img.thumb').attr('src');
				window.plugins.socialsharing.share(qbApp.settings.serverUrl+urlAlias, questionTheme, thumbUrl);
			}
		})*/
	}

	function initOrientationChange(){
		$(window).width() <= 768 ? $('body').addClass('portrait') :	$('body').addClass('landscape');
		//alert($(window).width());
		$(window).on('resize orientationchange', function(event) {
			var activePageId = $.mobile.activePage.attr( "id" );
			var $activePage = $('#'+activePageId);
			if(activePageId == 'page-question'){
				var $questionActions = $activePage.find('div.qiestion-navigation').detach();
				var $videoWrapper = $activePage.find('.video-wrapper');
				//calculate aspectRatio
				var $thumb = $videoWrapper.find('img.thumb');
				var aspectRatio = $thumb.width() / $thumb.height();

				if($(window).width() <= 768){
					var width = $(window).width();
					var height = width / aspectRatio;
					if(height > qbApp.wideWidthHeight) height = qbApp.wideWidthHeight;
					$('body').addClass('portrait');
					$('body').removeClass('landscape');
				}
				else{
					var width = $(window).width()*0.66;
					var height = width / aspectRatio;
					if(height > qbApp.wideWidthHeight) height = qbApp.wideWidthHeight*0.66;
					$('body').addClass('landscape');
					$('body').removeClass('portrait');
				}

				//TODO FIXME: Refactor this part!
				$videoWrapper.height(height);
				$.each($videoWrapper.children(), function(index, val) {
					var $val = $(val);
					if(aspectRatio < 1.7){
						height = $videoWrapper.height();
						if($(val).hasClass("thumb")){
							width = 'auto';
							var leftOffset = ($videoWrapper.width()-$(val).width())/2;
							$(val).css({'marginLeft' : leftOffset, 'left' : 0});
						}
					}
					if(!$val.hasClass('play-pause')) $(val).css({'width':width, 'height':height});
				});

				$(window).width() <= 768 ? $activePage.find('div.video-wrapper').append($questionActions) : $questionActions.insertAfter("div.video-wrapper");

				$.mobile.silentScroll(1);
				resizeQuestionAdditionalWrapper();

				//Recalculate answer thumbs and theme tags ul width;
				var $answersWrapper = $activePage.find('div.answers-wrapper'),
						$themesWrapper  = $activePage.find('div.answers-wrapper');
				if($answersWrapper.length) {
					initSwipeScroll($answersWrapper);
					$answersWrapper.find('ul.answers').css('marginLeft', 0);
				}
				if($themesWrapper.length) {
					initSwipeScroll($themesWrapper);
					$themesWrapper.find('ul.themes').css('marginLeft', 0);
				}
			}
			setMainMenuHeight();
		});
		setMainMenuHeight();
	}

	function initLogoNavigate(){
		$('h1.logo').on(qbApp.clickEvent, function(event) {
			$.mobile.changePage('#page-home', {transition: "slidefade"});
			initQuestionsList('#page-home', {order:'latest'}, 'replace');

			/*var activePageId = $.mobile.activePage.attr( "id" );
			$('#'+activePageId).find('a[href="#page-home?order=latest"]').trigger('tap');*/
		});
	}

	function initCheckAuth(){
		var cookie = $.cookie('drupal_sess');
		if(cookie === undefined|| cookie.length < 100) return;

		var jsonObject = JSON.parse(cookie);
		qbApp.cookie = jsonObject;
		if($.cookie('drupal_sess')){
			$('body').addClass('logged-in');
		}
	}


	//copy main menu to all div[data-role="page"]
	function copyMainMenu() {
		//alert(1)
		if( $( window ).width() < 768 )	$('#page-home #main-menu div[data-role="popup"]').remove();

		var $pages = $('div[data-role="page"]');
		$pages.each(function(index,item){
			var $page = $(item);
			if($page.find('#main-menu').length === 0) {
				var $mainMenuPanel = $('#page-home #main-menu').clone();
				$page.append($mainMenuPanel);
			}
		});
	}

	//init Main Menu links
	function initMainMenu() {
		var $mainMenu = $('#main-menu');
		$('#main-menu a').on(qbApp.clickEvent, function(event) {
			var activePageId = $.mobile.activePage.attr( "id" );
			var href = $(this).attr('href');
			var data = parseUrl(href);
			if(data.page=='#'+activePageId) {
				$( '#main-menu' ).panel("close");
			}
			//alert(href);
			var $listviewContainer = $(data.page).find('ul.questions[data-role="listview"]');
/*			if(data.page == '#page-ask-question' || data.query.order == 'favourites') {
				if(qbApp.cookie === null){
					checkAuthentication();
					return false;
				}
			}*/
			if($listviewContainer.get(0) && data.query.order !== undefined) {
				$(data.page).find('div.search-container').hide();
				initQuestionsList(data.page, data.query, 'replace');
			}
		});

		/*$('a.main-menu').on('click tap', function(event) {
			event.preventDefault();
			var activePageId = $.mobile.activePage.attr( "id" );
			$('#'+activePageId).find('#main-menu').panel( "open" );
		});*/

		$mainMenu.find('a.uncharted-digital-link').click(function() {
			event.preventDefault();
			var $link = $(this),
					url = $link.attr('href');
      if (url.indexOf('http://') !== -1) {
          window.open(url, '_system');
      }
		});
	}

	function setMainMenuHeight() {
		var mainMenuHeight;
		if(/iPad/i.test(navigator.userAgent)){
			setTimeout(function(){
				if(window.orientation == '90' || window.orientation == '-90') {
					mainMenuHeight = 748;
				} else {
					mainMenuHeight = 1004;
				}
				//mainMenuHeight = $(window).height();
				//alert(mainMenuHeight);
				//mainMenuHeight = $(window).height();
				$('div.main-menu').find('ul[data-role="listview"]').css('height', mainMenuHeight - 84);
			}, 0);
		}
		else {
			mainMenuHeight = $(window).height();
			$('div.main-menu').find('ul[data-role="listview"]').css('height', mainMenuHeight - 84);
		}

	}

	function initGeolocation(){
		navigator.geolocation.getCurrentPosition (
			function (pos) {
				var $localLink = $('#main-menu li.local a'),
						href = $localLink.attr('href'),
						lon = pos.coords.longitude,
						lat = pos.coords.latitude;

				href += '&lat='+ lat + '&lon=' + lon;
				$localLink.attr('href', href);
				if(qbApp.geolocation === undefined) qbApp.geolocation = {};
				qbApp.geolocation.lat = lat;
				qbApp.geolocation.lon = lon;
			},
			function(error) { //error callback
				$('#main-menu li.local').hide();
			},
			{ //options
				enableHighAccuracy : true,
				maximumAge : 3000,
				timeout : 5000
			}
		);
	}

	//init Home Page
	$(document).on('pageinit', '#page-home', function(evt, ui) {
		//init questions list
		initQuestionsList('#page-home');
		//init search box
		initSearchInput('#edit-search-home');
	});

	$( document ).on("pageinit", "#page-search", function() {
		//init search box
		initSearchInput('#edit-search-results');
	});

	/*Change active menu item on page show*/
	$(document).on('pageshow', function(event, ui) {
		var activePageId = $.mobile.activePage.attr( "id" );
		var $activePage = $('#'+activePageId);

		if(activePageId != 'page-home') {
			$( '#main-menu li a' ).removeClass('active');
			$( '#main-menu li a[href*="#'+activePageId+'"]' ).addClass('active');
		}

		//FIX: Only for android registration form. Set content height equal to page height;
/*		if($('body').hasClass('android')) {
			if($activePage.hasClass("page-registration")) {
				var pageContentMinHeight = $activePage.outerHeight(true);
				$activePage.find('div[data-role="content"]').css('min-height', pageContentMinHeight);
			}
		}*/
/*		if($activePage.hasClass("page-registration")) {
			var pageContentHeight = $activePage.find('div.ui-panel-content-wrap').height(),
					contentHeight = $activePage.find('div.ui-content').height(),
					$footer = $activePage.find('div.footer'),
					footerHeight = $footer.height();

			if(pageContentHeight > contentHeight) {
				$footer.css('marginTop', pageContentHeight - contentHeight);
			}
			//$activePage.find('div[data-role="content"]').css('min-height', pageContentMinHeight);
		}*/
	});

	/*Hide search box on homepage hide*/
	$(document).on("pagehide pageshow", '#page-home', function( event, ui ) {
		$('#page-home').find('div.search-container').hide();
	});

	//init questions list
	function initQuestionsList(pageId, query, insertMethod) {
		var queryStr = '';
		if(insertMethod==undefined) insertMethod = 'append';
		//order
		var order = 'latest';
		if(query != undefined && query.order != undefined) order = query.order;

		//queryStr
		queryStr = '&order='+order;
		if(query != undefined && query.lat!=undefined) queryStr = queryStr + '&lat='+query.lat;
		if(query != undefined && query.lon!=undefined) queryStr = queryStr + '&lon='+query.lon;

		$( '#main-menu li a' ).removeClass('active');
		$( '#main-menu li a[href*="order='+order+'"]' ).addClass('active');

		var $page = $(pageId);
		var $listviewContainer = $page.find('ul.questions[data-role="listview"]');
		$listviewContainer.attr('data-order', order);
		if(insertMethod=='replace') {
			$listviewContainer.html('');
		}
		$page.find('div.content-primary > div.no-results').remove();

		qbApp.showLoading($page.find('div.content'));
		var uid  = (qbApp.cookie != null) ? qbApp.cookie.user.uid : 0;

		$.getJSON( qbApp.settings.restUrl + "questions?jsoncallback=?&uid="+uid+"&limit=10&offset=0"+queryStr,
			function(response){
				//console.log(response);
				qbApp.hideLoading($page.find('div.content'));
				if(response.questions.length === 0){
					var $noResults = $('<div class="no-results"></div>');

					var $noResultsStr = $('<p>Sorry, no videos related to your request were found.</p>');
					if(order == 'local') {
						$noResultsStr = $('<p>It looks like no questions have been asked in your area. Are you ready to get the conversation started?</p>');
						var $respond = $('<a href="#" class="video-respond-repeatable"><span>Ask a Question</span></a>');
						$respond.on('click', function(event){
							event.preventDefault();
							prosessAnswer();
						});
						$noResults.append($respond);
					}
					$noResults.prepend($noResultsStr);
					//if(!$page.find('div.no-results').length) {
					$page.find('div.content-primary').append($noResults);
					//}
				}
				else {
					buildQuestionsList(response, $listviewContainer, insertMethod);
					initQuestionsInfiniteScroll(pageId);
				}
			});
	}

	//build questions list and refresh it's container
	function buildQuestionsList(response, $listviewContainer, insertMethod) {
		if(insertMethod==undefined) insertMethod = 'append';

		if(response) {
			if(insertMethod == 'prepend') {
				response.questions = response.questions.reverse();
			}
			if(insertMethod == 'replace') {
				$listviewContainer.html('');
			}
			$.each(response.questions, function( key, question ) {
				var $li = $('<li class="question" data-url="#page-question?nid='+question.nid+'" data-nid="'+question.nid+'"></li>');
				var thumbnailPath = question.thumbnail + '/width/'+ qbApp.settings.kaltura.thumbWidth;
				var $thumb = $('<img src="'+thumbnailPath+'" alt="'+question.title+'">');
				$thumb.on('load', function(event) {
					homepageImgVerticalAlign($(this));
				});
				var $shadow = $('<div class="shadow"></div>');
				var $title = $('<h2>'+question.title+'</h2><span class="submitted">&mdash; '+question.first_name+' ' +question.last_name+ '</span>');
				$li.append($thumb);
				$li.append($shadow);
				$li.append($title);

				//init Question
				$li.on(qbApp.clickEvent, function(event) {
					event.preventDefault();
					var url = $(this).data('url');
					var data = parseUrl(url);
					if(data.query.nid && data.page) {
						initQuestion(question, data);
					}
				});

				if(insertMethod == 'prepend') {
					$listviewContainer.prepend($li);
				}
				else {
					$listviewContainer.append($li);
				}
			});
			$listviewContainer.listview('refresh');
		}
	}

	function initQuestionsInfiniteScroll(pageId) {
		var $page = $(pageId);
		if($page.attr('data-scroll')=='processed') return;
		$page.attr('data-scroll', 'processed');

		var infiniteScrolLoading = false;

		setTimeout(function() {
			$(pageId).find('div.content').css('marginTop', '1px');

			//scroll down by 1px ( search input fix )
			var windowScrollTop = $(window).scrollTop();
			if(windowScrollTop == 0) {
				$.mobile.silentScroll(1);
			}

			//init scroll
			var scrollEvent = 'scroll';
			if("ontouchmove" in window) scrollEvent = 'touchmove';

			$(window).on(scrollEvent, function(event) {
				setTimeout(function() {

					var activePageId = $.mobile.activePage.attr( "id" );
					if('#'+activePageId == pageId) {
						var $listviewContainer = $(pageId).find('ul.questions[data-role="listview"]');
						var order = $listviewContainer.attr('data-order');

						//init top scroll
						var pixelsFromWindowTop = 0 + $(window).scrollTop();
						if(pixelsFromWindowTop == 0) {
							$page.find('div.search-container').show();
							//Fix placeholder for android
							if(navigator.userAgent.match(/Android/i)){
								$( '#edit-search-home' )
									.attr( 'placeholder', '').val( 'Search' ).addClass( 'android-placeholder' )
									.on( 'focus', function() {
										$( this ).val( '' ).removeClass( 'android-placeholder' );
									})
									.on( 'focusout', function() {
										var $input = $( this );
										if( $input.val() == '' ) $input.val( 'Search' ).addClass( 'android-placeholder' );
									});
							}
							if(infiniteScrolLoading == false ) {
								//get new questions
								var latestNid = $(pageId).find('ul.questions > li:first').data('nid');
								if(latestNid!=undefined) {
									infiniteScrolLoading = true;
									qbApp.showLoading($page.find('div.content'), 'prepend');
									var queryStr = '&order='+order+'&nid='+latestNid;
									if(order == 'local') {
										if(qbApp.geolocation != undefined && qbApp.geolocation.lat!=undefined) queryStr = queryStr + '&lat='+qbApp.geolocation.lat;
										if(qbApp.geolocation != undefined && qbApp.geolocation.lon!=undefined) queryStr = queryStr + '&lon='+qbApp.geolocation.lon;
									}
									$.getJSON( qbApp.settings.restUrl + "questions?jsoncallback=?&limit=10&offset=0"+queryStr,
										function(response){
											qbApp.hideLoading($page.find('div.content'));
											infiniteScrolLoading = false;
											buildQuestionsList(response, $listviewContainer, 'prepend');
										});
								}
							}
						}

						//init bottom scroll
						var pixelsFromWindowBottomToBottom = 0 + $(document).height() - ($(window).scrollTop()) - $(window).height();
						if(pixelsFromWindowBottomToBottom <= 100) {
							if(infiniteScrolLoading == false ) {
								infiniteScrolLoading = true;
								qbApp.showLoading($page.find('div.content'));
								var heigth = $(document).height();
								$.mobile.silentScroll(heigth);
								var loadedQuestionsNum = $listviewContainer.children('li').size();
								if(loadedQuestionsNum <= 100 ) {
									var queryStr = '&offset='+loadedQuestionsNum+'&order='+order;
									if(order == 'local') {
										if(qbApp.geolocation != undefined && qbApp.geolocation.lat!=undefined) queryStr = queryStr + '&lat='+qbApp.geolocation.lat;
										if(qbApp.geolocation != undefined && qbApp.geolocation.lon!=undefined) queryStr = queryStr + '&lon='+qbApp.geolocation.lon;
									}
									$.getJSON( qbApp.settings.restUrl + "questions?jsoncallback=?&limit=10"+queryStr,
										function(response){
											qbApp.hideLoading($page.find('div.content'));
											infiniteScrolLoading = false;
											buildQuestionsList(response, $listviewContainer, 'append');
										});
								}
							}
						}

					}

				}, 50);
			});

		}, 1000);

	}

	//build single question and load/buld additional question info
	function initQuestion(question, data) {
		qbApp.question = question;
		qbApp.data = data;
		var $content = $(data.page).find('div.content-primary');
		$content.html('');

		$.mobile.changePage( data.page, {transition: "slidefade"});


		/*buildQuestion(question, data);

		qbApp.showLoading($(data.page).find('div.content-primary'), 'append');

		var uid  = (qbApp.cookie != null) ? qbApp.cookie.user.uid : 0;

		$.getJSON( qbApp.settings.restUrl + "questions/"+question.nid+"?uid="+uid+"&jsoncallback=?",
			function(response){
				buildQuestionAdditional(response, data);
			});*/
	}

	/*Change active menu item on page show*/
	$(document).on('pageshow', function(event, ui) {
		var activePageId = $.mobile.activePage.attr( "id" );
		if(activePageId == 'page-question') {

			if(qbApp.question && qbApp.data) {
				var question = qbApp.question;
				var data = qbApp.data;

				buildQuestion(question, data);

				qbApp.showLoading($(data.page).find('div.content-primary > div.question-additional-wrapper'), 'append');

				var uid  = (qbApp.cookie != null) ? qbApp.cookie.user.uid : 0;

				$.getJSON( qbApp.settings.restUrl + "questions/"+question.nid+"?uid="+uid+"&jsoncallback=?",
					function(response){
						buildQuestionAdditional(response, data);
					});
			}

		}
	});


	function buildQuestion(question, data) {
		var $content = $(data.page).find('div.content-primary');
		$content.html('');

		var $div = $('<div class="question" data-url="' + question.url + '" data-nid="' + question.nid + '"></div>');

		var thumbnailPath = question.thumbnail + '/width/'+ qbApp.settings.kaltura.bigThumbWidth;
		var $video = $('<video class="kaltura" data-partnerId="'+question.partner_id+'" data-entryId="'+question.kaltura_id+'"></video>');
		//var $thumb = $('<img class="thumb" src="'+thumbnailPath+'" alt="'+question.title+'" data-partnerId="'+question.partner_id+'" data-entryId="'+question.kaltura_id+'">');
		var $videoWrapper = $('<div class="video-wrapper"></div>');

		//Create input for new Theme tag
		var $newTagFormWrapper = $('<div class="new-tag-form-wrapper"></div>');
		var $newTagFormOverlay = $('<div class="new-tag-form-overlay"></div>');
		var $newTagFormHelptext = $('<div class="new-tag-form-helptext"><p>Add themes to this conversation. You can add multiple at one time by seperating each with a comma.</p></div>');
		var $newTagForm = $('<form class="new-tag-form"></form>');
		var $newTagInput = $('<input type="text" name="new-tag" class="new-tag" />');
		var $newTagSubmit = $('<input type="submit" />');
		$newTagForm.append($newTagInput, $newTagSubmit);
		$newTagFormWrapper.append($newTagFormOverlay, $newTagFormHelptext, $newTagForm);

		//$videoWrapper.append($thumb);
		$videoWrapper.append($video);
		$div.append($videoWrapper);

		$video.on('kaltura-post-initialize', function(event, optionHash) {

			var $video = $('video[data-entryId='+optionHash.entryId+']');
			var $thumb = $('<img class="thumb" src="'+thumbnailPath+'" alt="'+question.title+'" data-partnerId="'+question.partner_id+'" data-entryId="'+question.kaltura_id+'">');
			var $videoWrapper = $video.parent();
			$videoWrapper.append($thumb);

			//Set thumb size depend on video size
			$("<img/>").attr("src", thumbnailPath).load(function() {
				var height = parseInt(width/optionHash.aspectRatio);

				if(this.width/this.height < 1.7){
					var thumbWidth = 'auto';
					var width = '100%';
					var height = parseInt($video.parent('.video-wrapper').height());
					if(height > qbApp.wideWidthHeight) height = qbApp.wideWidthHeight;
					$thumb.css({'width':thumbWidth, 'height':height});
					$thumb.css({'left':'50%', 'marginLeft': -$thumb.width()/2});
				}
				else{
					var width = $video.parent('.video-wrapper').width();
					var height = parseInt(width/optionHash.aspectRatio);
					if(height > qbApp.wideWidthHeight) height = qbApp.wideWidthHeight;
					$thumb.css({'width':width, 'height':height});
				}

				if(height > qbApp.wideWidthHeight) height = qbApp.wideWidthHeight;
				$video.parent('.video-wrapper').css({'height':height});
				$video.css({'width':width, 'height':height});
			});



/*				var width = $video.parent('.video-wrapper').width();
				var height = parseInt(width/optionHash.aspectRatio);
				$thumb.css({'width':width, 'height':height});
				$video.parent('.video-wrapper').css({'height':height});
				$video.css({'width':width, 'height':height});*/


			if($video.children('source').get(0)) {
				$thumb.on('click', function() {
					$video.css('visibility', 'visible');
					$video.get(0).play();
				});

				$video.on('play', function() {
					$thumb.hide();
				});

				$video.on('pause ended', function() {
					$video.css('visibility', 'hidden');
					$thumb.show();
				});
			}
			else {
				$videoWrapper.addClass('processing');
				$videoWrapper.append('<p>This question is still being processed.</p>');
			}

			resizeQuestionAdditionalWrapper();
		});

		$video.kaltura({serviceUrl: qbApp.settings.kaltura.serviceUrl,
			cdnUrl: qbApp.settings.kaltura.cdnUrl,
			thumbWidth: qbApp.settings.kaltura.bigThumbWidth,
			protocol:'http',
			preload: 'auto'
		});

		var $title = $('<h2>'+question.title+'</h2><span class="submitted">&mdash; '+question.first_name+' ' +question.last_name+ '</span>');
		var $respond = $('<a href="#" class="video-respond"><span>Respond</span></a>');
		$respond.on('click', function(event){
			event.preventDefault();
			prosessAnswer();
		});
		var $questionInfo = $('<div class="question-info"></div>').append($title, $respond);

		//Question navigation
		var $theme = $('<li><a href="#" class="nav-theme"><span>Theme</span></a></li>');
		$theme.on('click', function(event) {
			event.preventDefault();
			createNewTag($newTagFormWrapper);
		});

		var $favorite = $('<li><a href="#" class="nav-favorite"><span>Favorite</span></a></li>');
		$favorite.on('click', function(event) {
			event.preventDefault();
			if($(this).find('a.nav-favorite').hasClass('is-favorite') === false){
				toggleIsQuestionFavorite(question.nid, 'add');
			}else{
				toggleIsQuestionFavorite(question.nid, 'remove');
				//if(order == favourites )
				//console.log(order);
			}
		});

		var $flag  = $('<li><a href="#" class="nav-flag"><span>Flag</span></a></li>');
		$flag.on('click', function(event) {
			event.preventDefault();
			//console.log(qbApp.cookie);
		});

		var $share = $('<li><a href="#" class="nav-share"><span>Share</span></a></li>');
		$share.on('click', function(event) {
			event.preventDefault();
			socialShare();
		});
		var $ulNavigation = $('<ul class="navigation"></ul>').append($theme, $favorite, $flag, $share);
		var $playPause = $('<span class="play-pause">Play</span>').on('click', function(event) {
												event.preventDefault();
												$video.css('visibility', 'visible');
												$video.get(0).play();
											});
		var $questionNavigation = $('<div class="qiestion-navigation"></div>').append($ulNavigation);
		$(window).width() > 768 ? $div.append($questionNavigation) : $videoWrapper.append($playPause, $questionNavigation);

		var $questionInfoWrapper = $('<div class="question-info-wrapper"></div>').append($questionInfo);
		$div.append($questionInfoWrapper);

		$content.html($div);

		var $questionInfoWrapper = $('<div class="question-additional-wrapper"></div>');
		$content.append($questionInfoWrapper);
		resizeQuestionAdditionalWrapper();
		$content.append($newTagFormWrapper);

		//Play/pause event
		$video.on('play', function(){
			$questionNavigation.addClass('video-paying');
			$playPause.hide();
		});
		$video.on('pause', function(){
			$questionNavigation.removeClass('video-paying');
			$playPause.show();
		});
	}

	function initSwipeScroll($conteiner){
		var moveAnimate = false;
		var $containerUl = $conteiner.find('ul');
		var containerUlPadding = parseInt($containerUl.css('paddingRight'));
		var containerStartPosition = 0;
		var touchStartX = 0;
		var screenWidth = $(window).width();
		var containerWidth = 0;

		//Calculate container width
		var $containerLi = $containerUl.children('li');
		$.each($containerLi, function(index, li) {
			 var liWidth = $(li).outerWidth(true);
			 containerWidth += liWidth;
		});

		$containerUl.css('width', containerWidth + 10);

		var maximumOffset = (screenWidth - containerWidth) - containerUlPadding;

		$containerUl.touchit({
			onTouchStart: function (x, y) {
				moveAnimate = true;
				containerStartPosition = parseInt($containerUl.css('marginLeft').replace(/[^-\d\.]/g, ''));
				touchStartX = x;
			},
			onTouchMove: function (x, y) {
				if(moveAnimate === true){
					var offset = containerStartPosition + (x - touchStartX);
					if(offset < 0 && offset > maximumOffset){
						$containerUl.animate({'marginLeft' : offset}, 0, function(){});
					}
				}
			},
			onTouchEnd: function (x, y) {
				moveAnimate === false;
			}
		})

	}

	//Create single node page structure
	function buildQuestionAdditional(response, data) {

		var $content = $(data.page).find('div.content-primary');

		//remove loader
		qbApp.hideLoading($content.find('div.question-additional-wrapper'));

		var question = response.question;
		if(question.is_favorite){
			$content.find('a.nav-favorite').addClass('is-favorite');
		}

		if(response.answers.length > 0 || response.themes.length > 0){
			var $leftInnerShadow = $('<div class="left-inner-shadow"></div>');
			var $rightInnerShadow = $('<div class="right-inner-shadow"></div>');
			var $questionInfoWrapper = $content.find('div.question-additional-wrapper');
			$questionInfoWrapper.append($leftInnerShadow, $rightInnerShadow);
			//var $questionInfoWrapper = $('<div class="question-additional-wrapper"></div>').append($leftInnerShadow, $rightInnerShadow);

			//build answers
			if(response.answers.length > 0){
				var $answersWrapper = $('<div class="answers-wrapper"></div>');
				var $answersTitle = $('<h3>Answers</h3>');
				var $answersContainer = $('<ul class="answers"></ul>');
				$.each(response.answers, function( key, answer ){
					var $answer = $('<li class="answer"></li>'),
							thumbnailPath = answer.thumbnail + '/width/'+ qbApp.settings.kaltura.smallThumbWidth,
							$thumb = $('<img src="'+thumbnailPath+'" alt="'+answer.kaltura_id+'" data-partnerId="'+question.partner_id+'" data-entryId="'+answer.kaltura_id+'">'),
							$video = $('<video class="kaltura" poster="'+thumbnailPath+'" data-partnerId="'+question.partner_id+'" data-entryId="'+answer.kaltura_id+'"></video>');

					//qbApp.showLoading($answer);
					$answer.append($video);

					$video.kaltura({serviceUrl: qbApp.settings.kaltura.serviceUrl,
						cdnUrl: qbApp.settings.kaltura.cdnUrl,
						thumbWidth: qbApp.settings.kaltura.smallThumbWidth,
						protocol:'http',
						preload: 'none'
					});

					$video.on('kaltura-post-initialize', function(event, optionHash) {

						//qbApp.hideLoading($answer);
						var $video = $('video[data-entryId='+optionHash.entryId+']');

						if($video.children('source').get(0)) {
							var $thumb = $video.prev();

							$video.on('play', function() {
									var $this = this;
									setTimeout(function() {
										$this.webkitEnterFullscreen();
									}, 250);

									//this.webkitEnterFullscreen();
							});

							/*TODO FIXME:
							*Check, if video is playing, but not in full screen. Fix bug in iPad when answer playing in small
							*window .*/
							var enterFullScreenCheck = 0;
							$video.on('webkitbeginfullscreen', function() {
								enterFullScreenCheck = 1;
							});
							$video.on('webkitendfullscreen', function() {
								enterFullScreenCheck = 0;
								$(this).get(0).pause();
							});
							$video.on('durationchange', function() {
								if(enterFullScreenCheck === 0) {
									this.webkitEnterFullscreen();
								}
							});
							/*HARDCODE END*/

							$video.on('pause ended', function() {
								$thumb.show();
								this.webkitExitFullscreen();
								$(this).get(0).pause();
								$video.css('visibility', 'hidden');
							});

							$answer.on('tap', function(event) {
								$thumb.hide();
								$video.css('visibility', 'visible');
								$video.get(0).play();
								if($('body').hasClass("android"))	$video.get(0).webkitEnterFullscreen();
							});
						}
						else {
							var $videoContainer = $video.parent();
							$videoContainer.addClass('processing');
							$videoContainer.append('<p>This answer is still being processed.</p>');
						}

					});


					$answer.prepend($thumb);
					$answersContainer.append($answer);
				});
				$answersWrapper.append($answersTitle);
				$answersWrapper.append($answersContainer);
				$questionInfoWrapper.append($answersWrapper);
			}

			//build themes
			if(response.themes.length > 0){
				var $themesWrapper = $('<div class="themes-wrapper"></div>');
				var $themesTitle = $('<h3>Themes</h3>');
				var $themesContainer = $('<ul class="themes"></ul>');
				$.each(response.themes, function( key, theme ){
					var $theme = $('<li class="theme"></li>');
					var $themeLink = $('<a href="#page-theme" data-tid="'+theme.tid+'">'+theme.name+'</a>');
					$theme.append($themeLink);
					$theme.on(qbApp.clickEvent, function(event){
						if(qbApp.searchResultsInLoading == true ) return false;
						qbApp.searchResultsInLoading = true;
						var keywords = $(this).children('a').text();
						updateSearchResults(keywords);
					});
					$themesContainer.append($theme);
				});
				$themesWrapper.append($themesTitle);
				$themesWrapper.append($themesContainer);
				$questionInfoWrapper.append($themesWrapper);
			}

			$content.append($questionInfoWrapper);
			if ($answersWrapper != undefined )	initSwipeScroll($answersWrapper);
			if ($themesWrapper  != undefined )	initSwipeScroll($themesWrapper);

		}

		resizeQuestionAdditionalWrapper();
	}

	function resizeQuestionAdditionalWrapper(){
		var windowHeight = $(window).height(),
				$qaWrapper = $('div.question-additional-wrapper'),
				qaWrapperTopPos = $qaWrapper.offset().top,
				qaWrapperHeight = $qaWrapper.height();

		if(windowHeight - qaWrapperTopPos - qaWrapperHeight > 0) {
			$qaWrapper.css('height', windowHeight - qaWrapperTopPos);
		}
		/*if(/iPad/i.test(navigator.userAgent)){
			setTimeout(function(){
				if(window.orientation == '90' || window.orientation == '-90') {
					windowHeight = 748;
				} else {
					windowHeight = 1004;
				}
			});
		}*/

/*		var activePageId   = $.mobile.activePage.attr( "id" );
		var windowHeight   = $(window).height();
		var headerHeight   = $('#'+activePageId).find('.header').outerHeight(true);
		var questionHeight = $('#'+activePageId).find('.question').outerHeight(true);
		var additionalWrapperHeight = windowHeight - headerHeight - questionHeight;

		//TODO: FIXME skip for iPhone less then 5
		if(/iPhone/i.test(navigator.userAgent) && windowHeight > 568) {
			$('#'+activePageId).find('.question-additional-wrapper').height(additionalWrapperHeight);
		}*/
	}

	function initSearchInput(searchInputId) {
		$(searchInputId).on( "change", function(event, ui) {
			if(qbApp.searchResultsInLoading == true ) return false;
			qbApp.searchResultsInLoading = true;
			var keywords = $(this).val();
			updateSearchResults(keywords);
		});
		if(navigator.userAgent.match(/Android/i)){
			$( '#edit-search-results' )
				.attr( 'placeholder', '').val( 'Search' ).addClass( 'android-placeholder' )
				.on( 'focus', function() {
					$( this ).val( '' ).removeClass( 'android-placeholder' );
				})
				.on( 'focusout', function() {
					var $input = $( this );
					if( $input.val() == '' ) $input.val( 'Search' ).addClass( 'android-placeholder' );
				});
		}
	}

	function updateSearchResults(keywords) {
		$page = $("#page-search");
		$page.find('ul.search-results').html('');

		$page.find("div.search-container").show();
		$.mobile.changePage( $page, {transition: "slidefade"});
		$page.find("div.search-container input").val(keywords);
		qbApp.showLoading($page.find('div.content'));
		$.getJSON( qbApp.settings.restUrl + "questions/search?jsoncallback=?&keywords="+keywords,
			function(response){
				qbApp.hideLoading($page.find('div.content'));
				buildSearchResults(response);
				qbApp.searchResultsInLoading = false;
			});
	}

	//build search results list
	function buildSearchResults(response) {
		var $listviewContainer = $('#page-search ul.search-results[data-role="listview"]');

		if(response) {
			$.each(response.questions, function( key, question ) {
				var $li = $('<li class="question" data-url="#page-question?nid='+question.nid+'" data-nid="'+question.nid+'"></li>');
				var thumbnailPath = question.thumbnail + '/width/'+ qbApp.settings.kaltura.thumbWidth;
				var $thumb = $('<img src="'+thumbnailPath+'" alt="'+question.title+'">');
				var $title = $('<h2>'+question.title+'</h2><span class="submitted">&ndash; '+question.first_name+' ' +question.last_name+ '</span>');
				//init Question
				$li.on(qbApp.clickEvent, function(event) {
					event.preventDefault();
					var url = $(this).data('url');
					var data = parseUrl(url);
					if(data.query.nid && data.page) {
						initQuestion(question, data);
					}
				});
				$li.append($thumb);
				$li.append($title);
				$listviewContainer.append($li);
			});
			$listviewContainer.listview('refresh');
		}
	}


	qbApp.showLoading = function($container, insertMethod, overlay) {
		if($container.hasClass('ui-loader')) {
			$.mobile.loading('show');
		}

		var opts = {
			lines: 11, // The number of lines to draw
			length: 4, // The length of each line
			width: 2, // The line thickness
			radius: 5, // The radius of the inner circle
			corners: 1, // Corner roundness (0..1)
			rotate: 28, // The rotation offset
			direction: 1, // 1: clockwise, -1: counterclockwise
			color: '#fff', // #rgb or #rrggbb or array of colors
			speed: 1, // Rounds per second
			trail: 50, // Afterglow percentage
			shadow: false, // Whether to render a shadow
			hwaccel: false, // Whether to use hardware acceleration
			className: 'spinner', // The CSS class to assign to the spinner
			zIndex: 2e9, // The z-index (defaults to 2000000000)
			top: 'auto', // Top position relative to parent in px
			left: 'auto' // Left position relative to parent in px
		};

		var $loader = $('<div id="loader" class="qb-loader"></div>');
		if(insertMethod==undefined) insertMethod = 'append';

		$container[insertMethod]($loader);

		if(overlay == true) {
			var $overlay = $('<div class="overlay"></div>');
			$container.append($overlay);
		}

		var target = document.getElementById('loader');
		var spinner = new Spinner(opts).spin(target);
	}

	qbApp.hideLoading = function($container) {
		if($container.hasClass('ui-loader')) {
			$.mobile.loading('hide');
		}
		$container.children('.qb-loader').remove();
	}

	function parseUrl( url ) {
		var data = {};
		if ( typeof url === "string" ) {
			var u = $.mobile.path.parseUrl( url );
			if ( $.mobile.path.isEmbeddedPage( u ) ) {
				// The request is for an internal page, if the hash
				// contains query (search) params, strip them off the
				// toPage URL and then set options.dataUrl appropriately
				// so the location.hash shows the originally requested URL
				// that hash the query params in the hash.
				var u2 = $.mobile.path.parseUrl( u.hash.replace( /^#/, "" ) );
				data.page = u.hrefNoHash + "#" + u2.pathname;
				if ( u2.search ) {
					data.query = queryStringToObject( u2.search );
				}
			}
		}
		return data;
	}

	// Given a query string, convert all the name/value pairs
	// into a property/value object. If a name appears more than
	// once in a query string, the value is automatically turned
	// into an array.
	function queryStringToObject( qstr ) {
		var result = {},
			nvPairs = ( ( qstr || "" ).replace( /^\?/, "" ).split( /&/ ) ),
			i, pair, n, v;
		for ( i = 0; i < nvPairs.length; i++ ) {
			var pstr = nvPairs[ i ];
			if ( pstr ) {
				pair = pstr.split( /=/ );
				n = pair[ 0 ];
				v = pair[ 1 ];
				if ( result[ n ] === undefined ) {
					result[ n ] = v;
				} else {
					if ( typeof result[ n ] !== "object" ) {
						result[ n ] = [ result[ n ] ];
					}
					result[ n ].push( v );
				}
			}
		}
		return result;
	}





	/**************************************************************AUTH**************************************************************/

$(document).on("pagebeforechange", function(e, data) {
	//Sing in required for following links
	if(data.toPage.length) {
		var requestPageUrl = data.toPage;
		if(/order=favourites|page-ask-question-step-1/i.test(requestPageUrl)) {
			var loginCheck = checkAuthentication();
			if(loginCheck !== true) {
				e.preventDefault();
			}
		}
	}
});

$(document).on('pagebeforeshow', '#page-sing-in', function(event, data) {
		var prevPageID = data.prevPage.attr('id');
		$( '#page-sing-in' ).find( 'form' ).get( 0 ).reset();
		if($(data.prevPage).hasClass("page-registration")){
			qbApp.pageComeFrom = '#page-home';
		}
		else{
			qbApp.pageComeFrom = '#'+prevPageID;
		}
	});

	$(document).on('pageinit', '#page-sing-in', function(evt, ui) {
		initAuthentification('page-sing-in');

		$(evt.target).find('a.facebook').on('click', function(event){
			event.preventDefault();
			qbApp.showLoading($('body > div.ui-loader'), 'html', true);
			FB.init({ appId: "1397201370521243", nativeInterface: CDV.FB, useCachedDialogs: false });
			FB.getLoginStatus(function(response){
				FB.login(
					function(response) {
						FB.api('/me', function(response) {
							var me = {};
							me.name       = response.name;
							me.username   = response.username;
							me.email      = response.email;
							me.first_name = response.first_name;
							me.last_name  = response.last_name;
							me.link       = response.link;

							$.getJSON(qbApp.settings.restUrl + "social/facebook?jsoncallback=?&facebook-data=" + JSON.stringify(me),
								function(response){
									if(response.status == 'success'){
										finalizeUserLogin(response);
									}
									else{
										alert('Sorry, login failed. Try again please.');
									}
									qbApp.hideLoading($('body > div.ui-loader'), 'html');
								});
						});

					},
					{ scope: "email" }
				);
			});
		});

		//Reset all registration form
		$( evt.target ).find( 'a.phone-registration' ).on( 'click', function() {
			$.each( $( '.page-registration form' ), function(index, val) {
				var $form = $( val );
					$form.get(0).reset();
					$form.find( '.error' ).removeClass( 'error' );

					if( $form.attr( 'id' ) == 'register-2') {
						$form.find( '.fieldset-wrapper fieldset:not(:first)' ).remove();
						$form.find( '.fieldset-wrapper fieldset' ).removeAttr( 'style' );
					}
					if( $form.attr( 'id' ) == 'register-3' ) {
						$form.find( 'a.make-portrait' ).show();
						$form.find( 'input.registr-btn' ).hide();
						$form.prev().hide().find( 'img' ).attr( 'src', '#' );
					}
			});
		});
	});

	$(document).on('pageinit', '.page-registration', function(evt, ui) {
		var activePageId = $(evt.target).attr( "id" );
		initPhoneRegistrationForm(activePageId);
	});

	$(document).on('pageinit', '#page-forgot-password', function(evt, ui) {
		var $form = ($('div#page-forgot-password')).find("#forgot-password-form");
		restorePassword($form);
	});

	/*Listeners for popup events*/
	$(document).bind({
		popupafteropen: function(event, ui) {
			var $response = $(event.target);
			switch ($response.attr('id')){
				case 'ipad-login':
					var activePageId = $.mobile.activePage.attr( "id" );
					initAuthentification(activePageId);
					$response.find('a.facebook').on('click', function(){
						qbApp.showLoading($('body > div.ui-loader'), 'html', true);
						FB.login(
							function(response) {
								FB.api('/me', function(response) {
									$.getJSON(qbApp.settings.restUrl + "social/facebook?jsoncallback=?&facebook-data=" + JSON.stringify(response),
										function(response){
											if(response.status == 'success'){
												qbApp.hideLoading($('body > div.ui-loader'), 'html');
												finalizeUserLogin(response);
											}
											else{
												alert('Sorry, login failed. Try again please.');
											}
										});
								});
							},
							{ scope: "email" }
						);
					});
					break;
				case 'ipad-registration':
					initIPadRegistrationForm($response);
					break;
				case 'ipad-page-forgot-password':
					var $form = $response.find('form');
					restorePassword($form);
					break;
			}
		},
		popupbeforeposition: function( event, ui ) {
			var $response = $(event.target);
			switch ($response.attr('id')){
				case 'ipad-login':
					var $form = $response.find( 'form' );
					$form.get( 0 ).reset();
					$form .find( '.error' ).removeClass( 'error' );
				break;
				case 'ipad-registration':
					if(qbApp.formReset === true) {
						var $ipadForm  = $response.find('form#ipadForm');
						$ipadForm.find('div.ipad-profile-image-wrapper').hide();
						$ipadForm.find('div.left-block, div.right-block').show();
						$ipadForm.get(0).reset();
						$ipadForm.find('#ipad-user-profile-photo-id').val(0);
						qbApp.formReset = false;
					}
				break;
			}

		}
	});

	function restorePassword($form){
		var authentificationLoading = false;
		$form.submit(function(event) {
			event.preventDefault();
		}).validate({
			errorPlacement: function(){
				return false;  // suppresses error message text
			},
			submitHandler: function(form) {
				var $form = $(form);
				var formData = $form.serialize();
				var restoreData = $form.find('input[name="restore"]').val();
				if(restoreData.length){
					qbApp.showLoading($('body > div.ui-loader'), 'html');
					if(authentificationLoading === false){
						authentificationLoading = true;

						$.getJSON(qbApp.settings.restUrl + "user/restore?jsoncallback=?&restore-data="+restoreData,
							function(response){
								qbApp.hideLoading($('body > .ui-loader'));
								authentificationLoading = false;
									if(response.status == 'success'){
										$form.get(0).reset();
										alert("Account information was send to your e-mail. Please check it.");
										$.mobile.changePage( "#page-sing-in", {transition: "slide", changeHash: false});
									}
							});
					}

				}
				return false;
			}
		});
	}

	function initAuthentification(activePageId){
		var authentificationLoading = false,
				$form = $( '#'+activePageId ).find( "#login-form" );
		$form.find( 'input.login' ).on( 'focus', function( event ) {
			$( this ).css('color', '#666666');
		});
		$form.submit(function(event) {
			event.preventDefault();
		}).validate({
			errorPlacement: function(){
				return false;  // suppresses error message text
			},
			submitHandler: function(form) {
				var $form = $(form);
				var formData = $form.serialize();
				var login = $form.find('input[name="login"]').val();
				var pass = $form.find('input[name="pass"]').val();
				if(login.length && pass.length){

					qbApp.showLoading($('body > div.ui-loader'), 'html');
					if(authentificationLoading === false){
						authentificationLoading = true;

						$.getJSON(qbApp.settings.restUrl + "user/login?jsoncallback=?&"+formData,
							function(response){
								qbApp.hideLoading($('body > .ui-loader'));
								authentificationLoading = false;
								if(response.sessid !== undefined){
									finalizeUserLogin(response);
									$form.get(0).reset();
								}else{
									$form.find('.login').css('color', 'red');
								}
							});
					}

				}
				return false;
			}
		});
	}

	function finalizeUserLogin(response){
		var $body = $('body');

		$body.addClass('logged-in');
		if(!response.user.roles[4]) $body.addClass('not-black-male');

		qbApp.cookie = response;
		var jsonString = JSON.stringify(response);
		$.cookie('drupal_sess', jsonString, { expires: 7 });

		//Check on what page shod redirect after login
		var activePageId   = $.mobile.activePage.attr( "id" );
		var $returnBtn = $('#'+activePageId).find('a[data-rel="back"]');
		if(qbApp.pageComeFrom){
			$.mobile.changePage( qbApp.pageComeFrom, {transition: "slide"});
		}
		else{
			$returnBtn.length ? $returnBtn.trigger('click') : $.mobile.changePage( "#page-home", {transition: "slide", changeHash: false});
		}
	}

	function initLogOut(){
		//Log-out
		$('li.log-out').on('click', function(event) {
			event.preventDefault();

			//Send URL to destroy drupal user session
			var uid = qbApp.cookie.user.uid;
			$.getJSON(qbApp.settings.restUrl + "user/logout?jsoncallback=?&uid="+qbApp.cookie.user.uid, function(response){
				console.log(response);
			});

			//Destroy mobile session
			$.removeCookie('drupal_sess');
			qbApp.cookie = null;
			$('body').removeClass('logged-in not-black-male');

			//Some action after user logout
			//var activePageId = $.mobile.activePage.attr( "id" );
			//$('#'+activePageId).find('#main-menu').panel( "close" );
			var activePageId = $.mobile.activePage.attr( "id" );
			if(activePageId == 'page-home') {
				initQuestionsList('#page-home', {order:'latest'}, 'replace');
				$('#page-home #main-menu' ).panel("close");
			} else {
				$.mobile.changePage( "#page-home", {transition: "slide"});
			}
		});
	}

	function initIPadRegistrationForm($response){
			var	$date_of_birth = $response.find('input[name="date_of_birth"]'),
					$label_date_of_birth = $date_of_birth.parent().prev();
					qbApp.requestingPage = 'ipad-registration';

			$date_of_birth.on('focus', function() {
				$label_date_of_birth.hide();
			});
			var $registrationFormFieldset = $response.find( '.fieldset-wrapper' );
					infinitiInputFieldset($registrationFormFieldset);
			$response.find('#ipadForm').submit(function(event) {
				event.preventDefault();
			}).validate({
				errorPlacement: function(){
					return false;  // suppresses error message text
				},
				submitHandler: function(form) {
					//$.mobile.silentScroll(1);
					$form = $( form );
					qbApp.showLoading($('body > div.ui-loader'), 'html');
					var userImageID = $form.find('input#ipad-user-profile-photo-id').attr('value');
					alert(userImageID)
					if( userImageID != 0 ) {
						//Submit registration form
						$.getJSON(qbApp.settings.restUrl + "user/register?jsoncallback=?&"+formData,
							function(response){
								$form.get(0).reset();
								qbApp.hideLoading($('body > .ui-loader'));
								if(response.sessid !== undefined){
									$('body').addClass('logged-in');
									$.cookie('drupal_sess', response, { expires: 7 });
									qbApp.formReset = true;
									$('#ipad-registration').popup( "close" );
									//$.mobile.changePage( "#page-home", {transition: "slide"});
									qbApp.cookie = response;
								}
								else{
									//Registration fail
								}
							}
						)
					}
					else {
						var $form = $(form),
						formData = $form.serialize();
						$.getJSON(qbApp.settings.restUrl + "user/pre-pregistration?jsoncallback=?&"+formData,
							function(response){
								if(response.error === true){
									qbApp.hideLoading($('body > .ui-loader'));
									$.each(response, function(index, row) {
										$form.find('input[name="'+index+'"]').val('').attr('placeholder', row).addClass('error');
									});
								}
								//Send data to create new user
								else{
									qbApp.hideLoading($('body > .ui-loader'));
									var $captureMenu = $( '#ipad-create-avatar-popup' );
									$captureMenu.fadeIn();
									qbApp.behaviors.captureProfilePhotoIpad( $form );
								}
							}
						)
					}
				}
			});
	}
	/*
	 * Create infinity fieldset append.
	 * If user focus on input with placeholder "+" we check, if there is some empty field. If we have -
	 * we focus on it, to show user that he still has place where to wright.
	 * If not - we append new clone of original fieldset, and change input name on "fieldset-wrapper" data-input-name + index
	 */
	function infinitiInputFieldset($fieldsetWrapper) {
		var $firstFieldset = $fieldsetWrapper.find( 'fieldset' ).eq( 0 ),
				$emptyFieldset = $firstFieldset.clone(),
				$form = $fieldsetWrapper.closest( 'form' ).css( 'overflow', 'hidden' ),
				inputNamePrefix = $fieldsetWrapper.data( 'input-name' ),
				inputNameIndexStart = $firstFieldset.find( 'input' ).not( '.add-more' ).length,
				fieldsetStartWidth,	fieldsetWidth, fieldsetLength,
				touchStartX, touchEndX,
				animate = false;

		$firstFieldset.addClass( 'active' );

		//Back button return previous fieldset if user add more
		var $backBtn = $( '#registration-step-2' ).find( '.header a[data-rel="back"]');
		$backBtn.on( 'touchstart', function(event) {
			event.preventDefault();
			var $activeFieldset = $fieldsetWrapper.find( '.active' );
			var $previosFieldset = $activeFieldset.prev();
			if( $previosFieldset.length ) {
				animate = true;
				$activeFieldset.animate({ 'marginLeft' : 0 }, 1000).removeClass( 'active' );
				$previosFieldset.delay( 600 ).animate({ 'opacity' : 1 }, 1000, function() { animate = false; }).addClass( 'active' );
			}
			else {
				$backBtn.attr( 'data-rel', 'back' );
			}
		});

		$fieldsetWrapper.on( 'focus', 'input.add-more', function(){
			var $activeFieldset = $( this ).closest( 'fieldset' ),
					$emptyInputs = $activeFieldset.find( 'input:text' ).filter(function() { //Looking for empty rows
						var $input = $( this );
						if( $input.val() == '' && !$input.hasClass( 'add-more' )) return $input;
					});
			if( $emptyInputs.length ) { //Focus on empty row
				$emptyInputs.eq(0).trigger( 'focus' );
			}
			else {
				if( $activeFieldset.next().length ) { //User return back and we already have appended fieldset
					$activeFieldset.animate({ 'opacity' : 0 }, 1000).removeClass( 'active' )
													.next().delay( 600 ).animate({ 'marginLeft' : fieldsetStartWidth * -1 }, 1000, function() {
														$( this ).find( 'input' ).first().trigger( 'focus' );
													}).addClass( 'active' );
					$backBtn.attr( 'data-rel', 'back-block' );
				}
				else { //Need to add new fieldset
					fieldsetWidth = $fieldsetWrapper.width();
					if( fieldsetStartWidth == undefined ) fieldsetStartWidth = fieldsetWidth;
					//Append new fieldset
					var $newFieldset = $emptyFieldset.clone();
					$.each( $newFieldset.find( 'input' ).not( '.add-more' ), function( index, input ) {
						inputNameIndexStart++;
						$( input ).attr( 'name', inputNamePrefix + '-' + inputNameIndexStart )
											.attr( 'placeholder', inputNameIndexStart )
											.removeAttr('required');
					});
					$fieldsetWrapper.append( $newFieldset );
					//$newFieldset.find( 'input' ).first().trigger( 'focus' );
					$fieldsetWrapper.find( 'fieldset' ).css({ 'float' : 'left', 'width' : fieldsetStartWidth });
					fieldsetLength = $fieldsetWrapper.find( 'fieldset' ).length;
					$fieldsetWrapper.width( fieldsetWidth + fieldsetStartWidth );

					$fieldsetWrapper.find( '.active' )
														.stop( true, true ).animate({ 'opacity' : 0 }, 900).removeClass( 'active' )
													.next()
														.delay( 600 ).stop( true, true ).animate({ 'marginLeft' : fieldsetStartWidth * -1 }, 900, function() {
															$( this ).find( 'input' ).first().trigger( 'focus' );
														}).addClass( 'active' );
					$backBtn.attr( 'data-rel', 'back-block' );
				}
			}
		})
		.on( 'touchstart', function(e) {
			touchStartX = e.originalEvent.touches[0].clientX;
		})
		.on( 'touchend', function(e) {
			touchEndX = e.originalEvent.changedTouches[0].clientX;
			var swipe = touchStartX - touchEndX;
			if( Math.abs( swipe ) > 50 && animate === false ) {
				var $activeFieldset = $fieldsetWrapper.find( '.active' );
				if ( swipe < 0 ) { //Show previous fieldset
					var $previosFieldset = $activeFieldset.prev();
					if( $previosFieldset.length ) {
						animate = true;
						$activeFieldset.animate({ 'marginLeft' : 0 }, 1000).removeClass( 'active' );
						$previosFieldset.delay( 600 ).animate({ 'opacity' : 1 }, 1000, function() { animate = false; }).addClass( 'active' );
					}
					else {
						$backBtn.attr( 'data-rel', 'back' );
					}
				}
				else { //Show next fieldset
					var $nextFieldset = $activeFieldset.next();
					if( $nextFieldset.length ) {
						animate = true;
						$activeFieldset.animate({ 'opacity' : 0 }, 1000).removeClass( 'active' );
						$nextFieldset.delay( 600 ).animate({ 'marginLeft' : fieldsetStartWidth * -1 }, 1000, function() { animate = false; }).addClass( 'active' );
					}
				}
			}
		});
	}

	function initPhoneRegistrationForm(activePageId) {
		switch (activePageId){
			case 'registration-step-1':
				var $conteiner = $('#'+activePageId);
				var $form = $conteiner.find('form.registration-form');

				var $date_of_birth =  $conteiner.find('input[name="date_of_birth"]');
				var $label_date_of_birth = $date_of_birth.parent().prev();
				$date_of_birth.on('focus', function() {
					$label_date_of_birth.hide();
				});
				$label_date_of_birth.on('click', function() {
					$date_of_birth.trigger('focus');
				});

				$form.find( 'input' ).on( 'focus focusout', function() {
					$( this ).removeClass( 'error' );
				});

				$form.submit(function(event) {
						event.preventDefault();
					}).validate({
						errorPlacement: function() {
							return false;  // suppresses error message text
						},
						submitHandler: function(form) {
								var registerStepForm = $(form).serialize();
								/*Check some field for validation in drupal*/
								$.getJSON(qbApp.settings.restUrl + "user/pre-pregistration?jsoncallback=?&"+registerStepForm,
									function(response){
										if(response.error === true){
											$.each(response, function(index, row) {
												$form.find('input[name="'+index+'"]').val('').attr('placeholder', row).addClass('error');
											});
										}
										//If everything is ok - switch to next step
										else{
											//Check if user check 'Yes, I identify as a black male' to show or not create identity tag page
											var blackIdentify = $('form#register-0').find('input[name="black-identify"]').is(':checked'),
													nextPage;

											blackIdentify ? nextPage = $form.data('next') : nextPage = '#registration-step-3';
											$.mobile.changePage( nextPage, {transition: "slidefade"});
										}
									}
								);
							}
						});
			break;
			case 'registration-step-3':
				var $conteiner = $('#'+activePageId);
				var $form = $conteiner.find('form.registration-form');

				$form.submit(function(event) {
					event.preventDefault();
				}).validate({
					errorPlacement: function(){
						return false;  // suppresses error message text
					},
					submitHandler: function(form) {
						$.mobile.changePage( $form.data('next'), {transition: "slidefade"});
					}
				});

				qbApp.behaviors.captureProfilePhotoPhone( $conteiner.find( '#create-avatar-popup-popup' ) );

			break;
			/*Finish registration. Collect data from all step registration form*/
			case 'registration-step-4':
				var $conteiner = $('#'+activePageId);
				var $form = $conteiner.find('form.registration-form');

/*				$conteiner.find('input[type="submit"]').on('click', function(){$form.submit();})*/

				$form.submit(function(event) {
						event.preventDefault();
					}).validate({
						errorPlacement: function(){
							return false;  // suppresses error message text
						},
						submitHandler: function(form) {
							qbApp.showLoading($('body > div.ui-loader'), 'html', true);
							var formDataUrl = '';
							$.each($('.page-registration'), function(index, page) {
								$form = $(page).find('form.registration-form');
								var formData = $form.serialize();
								formDataUrl += '&'+formData;
								$form.get(0).reset();
							});
							$.getJSON(qbApp.settings.restUrl + "user/register?jsoncallback=?&"+formDataUrl,
									function(response){
										if(response.sessid !== undefined){
											qbApp.hideLoading($('body > div.ui-loader'), 'html');
											$('body').addClass('logged-in');
											$.cookie('drupal_sess', response, { expires: 7 });
											qbApp.cookie = response;
											if(response.user.field_black_identity.und[0].value == 0) $('body').addClass('not-black-male');
											if(qbApp.pageComeFrom){
												$.mobile.changePage( qbApp.pageComeFrom, {transition: "slidefade"});
											}else{
												$.mobile.changePage( "#page-home", {transition: "slidefade"});
											}
										}
										else{
											//Registration fail
											alert('Sorry, an error occurred.');
										}
									})
						}
					})
			break;

			default:
				var $conteiner = $('#'+activePageId),
						$form = $conteiner.find('form.registration-form');

				if( activePageId == 'registration-step-2' ) {
					var $registrationFormFieldset = $( '#registration-step-2' ).find( '.fieldset-wrapper' );
					infinitiInputFieldset($registrationFormFieldset);
				}

				$form.submit(function(event) {
						event.preventDefault();
					}).validate({
						errorPlacement: function(){
							return false;  // suppresses error message text
						},
						submitHandler: function(form) {
							$.mobile.changePage( $form.data('next'), {transition: "slidefade"});
						}
					})
			break;
		}
	}

	qbApp.behaviors.captureProfilePhotoPhone = function($popup) {
		$popup.find( 'a.photo' ).on( 'click', function( event ) {
			event.preventDefault();
			qbApp.captureType = 'picture';
			if(/iPhone/i.test(navigator.userAgent)){
				navigator.accelerometer.getCurrentAcceleration(
					function(acceleration) {
						var accelerationX = acceleration.x;
						if(accelerationX < 8) {
							showDeviceRotateMessage();
						}
						else {
							$( "#create-avatar-popup" ).popup( "close" )
							qbApp.behaviors.submitHandlerCapturePicture();
						}
					},
					function() {
						alert('Accelerometer Error! Please reload Application.');
					}
				);
			}
			else{
				$( "#create-avatar-popup" ).popup( "close" )
				qbApp.behaviors.submitHandlerCapturePicture();
			}
		});
		$popup.find( 'a.librarie' ).on( 'click', function( event ) {
			event.preventDefault();

			qbApp.showLoading($('body > div.ui-loader'), 'html', true);
			$( "#create-avatar-popup" ).popup( "close" )
			var options = {
				quality: 50,
				targetWidth: 300,
				targetHeight: 300,
				allowEdit: true,
				saveToPhotoAlbum: false,
				limit: 1,
				destinationType: navigator.camera.DestinationType.FILE_URI,
				sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY
			};
			navigator.camera.getPicture( uploadPhoto, function(err) {
				qbApp.hideLoading($('body > .ui-loader'));
			}, options);
		});
	}

	qbApp.behaviors.captureProfilePhotoIpad = function( $form ) {
		var $menu = $( '#ipad-create-avatar-popup' ),
				$requestingPage = $('#ipad-registration');
		$menu.find( 'a.photo' ).on( 'click', function( event ) {
			event.preventDefault();
			qbApp.captureType = 'picture';
			qbApp.behaviors.submitHandlerCapturePicture();
		});
		$menu.find( 'a.librarie' ).on( 'click', function( event ) {
			event.preventDefault();
			qbApp.showLoading($('body > div.ui-loader'), 'html', true);
			$( "#ipad-create-avatar-popup" ).hide();
			var options = {
				quality: 50,
				targetWidth: 300,
				targetHeight: 300,
				allowEdit: true,
				saveToPhotoAlbum: false,
				limit: 1,
				destinationType: navigator.camera.DestinationType.FILE_URI,
				sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY
			};
			qbApp.captureType = 'picture';
			navigator.camera.getPicture( uploadPhoto, function(err) {
				qbApp.hideLoading($('body > .ui-loader'));
			}, options);
		});
	}

	qbApp.behaviors.submitHandlerCapturePicture = function() {
		qbApp.showLoading($('body > div.ui-loader'), 'html', true);
			navigator.camera.getPicture(uploadPhoto, getPictureFail, { quality: 50,
				destinationType: navigator.camera.DestinationType.FILE_URI,
				correctOrientation: true
			});
	}

	function getPictureFail(){
		if(qbApp.requestingPage == 'ipad-registration') {
			var $requestingPage = $('#ipad-registration');

			$requestingPage.find('div.left-block, div.right-block').show();
			$requestingPage.find('div.ipad-profile-image-wrapper').hide();

			alert('Image capture was canceled.');
			qbApp.hideLoading($('body > .ui-loader'));
		}
	}
	function uploadPhoto(imageURI){
		var options = new FileUploadOptions();
		options.fileKey = "file";
		options.fileName = imageURI.substr(imageURI.lastIndexOf('/')+1)+'.png';
		options.mimeType = "image/jpg";

		options.params = qbApp.capture;

		var ft = new FileTransfer();
		ft.upload(imageURI, encodeURI(qbApp.settings.restUrl + 'user/pre-pregistration?&user-photo='+imageURI), uploadPhotoSuccessCallback, uploadPhotoFailCallback, options);
	}

	function uploadPhotoSuccessCallback(r) {
		var response = jQuery.parseJSON(r.response),
				$profileAvatar,
				$inputProfileFid;

		if(qbApp.requestingPage == 'ipad-registration') {
			var $requestingPage = $('#' + qbApp.requestingPage);
			$inputProfileFid = $requestingPage.find('input#ipad-user-profile-photo-id');
			$profileAvatar = $requestingPage.find('img#ipad-smallImage');
			$requestingPage.find('div.left-block, div.right-block').hide();
			$requestingPage.find('div.ipad-profile-image-wrapper').show();
		}
		else {
			var $registrationPage = $( '#registration-step-3' );
			$inputProfileFid = $( '#user-profile-photo-id' );
			$profileAvatar = $( '#smallImage' );

			$registrationPage.find( 'a.make-portrait' ).hide();
			$registrationPage.find( 'input.registr-btn' ).show();
		}

		$inputProfileFid.attr('value', response.profile_fid);
		var src = qbApp.settings.serverUrl+'sites/default/files/users/'+response.user_photo;
		$profileAvatar.attr('src', src);
		//calculate image margin-top offset to centered image
		$profileAvatar.on('load', function(){
			var imageHeight = $profileAvatar.height(),
					imageWrapperHeight = $profileAvatar.parent().height(),
					topOffset = (imageHeight - imageWrapperHeight)/2;

			$( '#registration-step-3' ).addClass( 'avatar-loaded' );
			$profileAvatar.parent().show().css('visibility', 'visible');

			if(topOffset > 0){
				topOffset *= -1;
				$profileAvatar.css('marginTop', topOffset);
			}
			qbApp.hideLoading($('body > .ui-loader'));
		});
	}
	//Failure callback
	function uploadPhotoFailCallback(error) {
		alert("There was an error uploading image");
	}
})(jQuery);

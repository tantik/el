$(function() {
	
	// open/close
	$('div.header-toggle-js').elleToggle({
		link: 'strong.title-heading a',
		slide: 'ul.heading-menu',
		open: 'title-open',
		speed: 300,
		ease: 'linear'
	});
	
	// custom select
	$('div.form-select-collection select').customSelect({
		flexible: true
	});
	
	// lightbox
	$('a.fancy').fancybox({
		overlayOpacity: 0,
		overlayColor: 'transparent',
		titlePosition: 'inside',
		centerOnScroll: true
	});
	
	// carousels
	// with dots and autoslide
	$('div.slider-num-auto-js').elleCarousel({
		speed: 350, // speed .6sec
		auto: 15000, // autoslide, 15sec
		num: 'div.switcher a',
		current: 'active',
		ease: 'swing'
	});
	// simple
	$('div.slider-js').elleCarousel({
		speed: 250, // speed .3sec
		ease: 'swing'
	});
	// simple, step 2 elements
	$('div.slider-step2-js').elleCarousel({
		speed: 250, // speed .3sec
		step: 2,
		ease: 'swing'
	});
	// with fade
	$('div.slider-fade-js').elleCarousel({
		speed: 250, // speed .3sec
		link: 'a.linked', // reset custom href link wth inner slide link
		fade: .5, // animate slide opacity 1 => 0.5 => 1
		ease: 'swing'
	});
	// search
	$('div.search-header-holder').elleSearch({
		field: 'div.search-header',
		popup: 'div.form-search-up'
	});
	// vote
	$('div.opinion-js').elleVote({
		urlAttr: 'data-url',
		done: 'voted',
		button: 'a',
		visual: 'div.visual'
	});
	//  dual frame pics
	$('div.dual-frame-js').elleDualFrame({
		frame: 'div.frame',
		pic: 'img.bg-frame-link',
		links: 'div.wrap-link',
		link: 'div.link-box a'
	});
});
$(window).load(function() {
	
	// custom scroll
	$('div.fashionable-scroll').jScrollPane({
		verticalGutter: 4
	});
	
	// fixed navigation
	$('.navigation-holder').elleHeader();
	
	// remove fixed navigation:
		// var elleHeaderApi = $('.navigation-holder').data('elleHeader');
		// elleHeaderApi.destroy();
		
	// fixed sidebar widgets
	$('div.fixed-widget-js').fixedWidget({
		topOffset: 60,
		wrapper: 'div.main',
		pinClass: 'fix-aside-widget',
		overClass: 'sidebar-section-bottom'
	});
	
	// thumbs popup
	var thumbsPopup = $('div.popup-gallery');
	thumbsPopup.thumbsPopup({
		overlay: 'div.items-transparent',
		closer: 'a.cloze-gallery',
		prev: 'a.next',
		next: 'a.prev',
		slicer: 'div.slicer',
		node: 'div.slideshow',
		panel: 'div.panel',
		item: 'div.frame',
		speed: 400
	});
	thumbsPopupApi = thumbsPopup.data('thumbsPopup');
	
	// thumbs slider
	$('div.gallery-slide-js').thumbsSlide({
		opener: 'a.open-gallery',
		closer: 'a.cloze-gallery',
		thumbs: 'div.gallery-article-wrapper',
		toggleSpeed: 800,
		openClass: 'visible-item'
	});
	
	// article carousel
	$('div.carouselle-article-js').carousElle({
		main: 'div.carousel-top-article',
		prev: 'a.prev',
		next: 'a.next',
		numb: 'span.no',
		slicer: 'div.slicer',
		node: 'div.slideshow',
		panel: 'div.panel',
		item: 'div.frame',
		slideSpeed: 200,
		
		thumbs: 'div.carousel-bottom-article',
		thumbsPrev: 'a.prev',
		thumbsNext: 'a.next',
		thumbsSlicer: 'div.slicer',
		thumbsNode: 'div.slideshow',
		thumbsPanel: 'div.panel',
		thumbsItem: 'div.frame'
	});
});
/*! Copyright (c) 2011 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.0.6
 * 
 * Requires: 1.2.2+
 */

;(function($) {

	var types = ['DOMMouseScroll', 'mousewheel'];
	
	if ($.event.fixHooks) {
		for ( var i=types.length; i; ) {
			$.event.fixHooks[ types[--i] ] = $.event.mouseHooks;
		}
	}
	
	$.event.special.mousewheel = {
		setup: function() {
			if ( this.addEventListener ) {
				for ( var i=types.length; i; ) {
					this.addEventListener( types[--i], handler, false );
				}
			} else {
				this.onmousewheel = handler;
			}
		},
		
		teardown: function() {
			if ( this.removeEventListener ) {
				for ( var i=types.length; i; ) {
					this.removeEventListener( types[--i], handler, false );
				}
			} else {
				this.onmousewheel = null;
			}
		}
	};
	
	$.fn.extend({
		mousewheel: function(fn) {
			return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
		},
		
		unmousewheel: function(fn) {
			return this.unbind("mousewheel", fn);
		}
	});
	
	
	function handler(event) {
		var orgEvent = event || window.event, args = [].slice.call( arguments, 1 ), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
		event = $.event.fix(orgEvent);
		event.type = "mousewheel";
		
		// Old school scrollwheel delta
		if ( orgEvent.wheelDelta ) { delta = orgEvent.wheelDelta/120; }
		if ( orgEvent.detail     ) { delta = -orgEvent.detail/3; }
		
		// New school multidimensional scroll (touchpads) deltas
		deltaY = delta;
		
		// Gecko
		if ( orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
			deltaY = 0;
			deltaX = -1*delta;
		}
		
		// Webkit
		if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY/120; }
		if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = -1*orgEvent.wheelDeltaX/120; }
		
		// Add event and delta to the front of the arguments
		args.unshift(event, delta, deltaX, deltaY);
		
		return ($.event.dispatch || $.event.handle).apply(this, args);
	}

})(jQuery);

/**
 * @author trixta
 * @version 1.2
 */
;(function($){

	var mwheelI = {
				pos: [-260, -260]
			},
		minDif 	= 3,
		doc 	= document,
		root 	= doc.documentElement,
		body 	= doc.body,
		longDelay, shortDelay
	;
	
	function unsetPos(){
		if(this === mwheelI.elem){
			mwheelI.pos = [-260, -260];
			mwheelI.elem = false;
			minDif = 3;
		}
	}
	
	$.event.special.mwheelIntent = {
		setup: function(){
			var jElm = $(this).bind('mousewheel', $.event.special.mwheelIntent.handler);
			if( this !== doc && this !== root && this !== body ){
				jElm.bind('mouseleave', unsetPos);
			}
			jElm = null;
			return true;
		},
		teardown: function(){
			$(this)
				.unbind('mousewheel', $.event.special.mwheelIntent.handler)
				.unbind('mouseleave', unsetPos)
			;
			return true;
		},
		handler: function(e, d){
			var pos = [e.clientX, e.clientY];
			if( this === mwheelI.elem || Math.abs(mwheelI.pos[0] - pos[0]) > minDif || Math.abs(mwheelI.pos[1] - pos[1]) > minDif ){
				mwheelI.elem = this;
				mwheelI.pos = pos;
				minDif = 250;
				
				clearTimeout(shortDelay);
				shortDelay = setTimeout(function(){
					minDif = 10;
				}, 200);
				clearTimeout(longDelay);
				longDelay = setTimeout(function(){
					minDif = 3;
				}, 1500);
				e = $.extend({}, e, {type: 'mwheelIntent'});
				return $.event.handle.apply(this, arguments);
			}
		}
	};
	$.fn.extend({
		mwheelIntent: function(fn) {
			return fn ? this.bind("mwheelIntent", fn) : this.trigger("mwheelIntent");
		},
		
		unmwheelIntent: function(fn) {
			return this.unbind("mwheelIntent", fn);
		}
	});
	
	$(function(){
		body = doc.body;
		//assume that document is always scrollable, doesn't hurt if not
		$(doc).bind('mwheelIntent.mwheelIntentDefault', $.noop);
	});
})(jQuery);

/*!
 * jScrollPane - v2.0.0beta12 - 2012-09-27
 * http://jscrollpane.kelvinluck.com/
 *
 * Copyright (c) 2010 Kelvin Luck
 * Dual licensed under the MIT or GPL licenses.
 */
;(function($,window,undefined){

	$.fn.jScrollPane = function(settings)
	{
		// JScrollPane "class" - public methods are available through $('selector').data('jsp')
		function JScrollPane(elem, s)
		{
			var settings, jsp = this, pane, paneWidth, paneHeight, container, contentWidth, contentHeight,
				percentInViewH, percentInViewV, isScrollableV, isScrollableH, verticalDrag, dragMaxY,
				verticalDragPosition, horizontalDrag, dragMaxX, horizontalDragPosition,
				verticalBar, verticalTrack, scrollbarWidth, verticalTrackHeight, verticalDragHeight, arrowUp, arrowDown,
				horizontalBar, horizontalTrack, horizontalTrackWidth, horizontalDragWidth, arrowLeft, arrowRight,
				reinitialiseInterval, originalPadding, originalPaddingTotalWidth, previousContentWidth,
				wasAtTop = true, wasAtLeft = true, wasAtBottom = false, wasAtRight = false,
				originalElement = elem.clone(false, false).empty(),
				mwEvent = $.fn.mwheelIntent ? 'mwheelIntent.jsp' : 'mousewheel.jsp';

			originalPadding = elem.css('paddingTop') + ' ' +
								elem.css('paddingRight') + ' ' +
								elem.css('paddingBottom') + ' ' +
								elem.css('paddingLeft');
			originalPaddingTotalWidth = (parseInt(elem.css('paddingLeft'), 10) || 0) +
										(parseInt(elem.css('paddingRight'), 10) || 0);

			function initialise(s)
			{

				var /*firstChild, lastChild, */isMaintainingPositon, lastContentX, lastContentY,
						hasContainingSpaceChanged, originalScrollTop, originalScrollLeft,
						maintainAtBottom = false, maintainAtRight = false;

				settings = s;

				if (pane === undefined) {
					originalScrollTop = elem.scrollTop();
					originalScrollLeft = elem.scrollLeft();

					elem.css(
						{
							overflow: 'hidden',
							padding: 0
						}
					);
					// TODO: Deal with where width/ height is 0 as it probably means the element is hidden and we should
					// come back to it later and check once it is unhidden...
					paneWidth = elem.innerWidth() + originalPaddingTotalWidth;
					paneHeight = elem.innerHeight();

					elem.width(paneWidth);
					
					pane = $('<div class="jspPane" />').css('padding', originalPadding).append(elem.children());
					container = $('<div class="jspContainer" />')
						.css({
							'width': paneWidth + 'px',
							'height': paneHeight + 'px'
						}
					).append(pane).appendTo(elem);

					/*
					// Move any margins from the first and last children up to the container so they can still
					// collapse with neighbouring elements as they would before jScrollPane 
					firstChild = pane.find(':first-child');
					lastChild = pane.find(':last-child');
					elem.css(
						{
							'margin-top': firstChild.css('margin-top'),
							'margin-bottom': lastChild.css('margin-bottom')
						}
					);
					firstChild.css('margin-top', 0);
					lastChild.css('margin-bottom', 0);
					*/
				} else {
					elem.css('width', '');

					maintainAtBottom = settings.stickToBottom && isCloseToBottom();
					maintainAtRight  = settings.stickToRight  && isCloseToRight();

					hasContainingSpaceChanged = elem.innerWidth() + originalPaddingTotalWidth != paneWidth || elem.outerHeight() != paneHeight;

					if (hasContainingSpaceChanged) {
						paneWidth = elem.innerWidth() + originalPaddingTotalWidth;
						paneHeight = elem.innerHeight();
						container.css({
							width: paneWidth + 'px',
							height: paneHeight + 'px'
						});
					}

					// If nothing changed since last check...
					if (!hasContainingSpaceChanged && previousContentWidth == contentWidth && pane.outerHeight() == contentHeight) {
						elem.width(paneWidth);
						return;
					}
					previousContentWidth = contentWidth;
					
					pane.css('width', '');
					elem.width(paneWidth);

					container.find('>.jspVerticalBar,>.jspHorizontalBar').remove().end();
				}

				pane.css('overflow', 'auto');
				if (s.contentWidth) {
					contentWidth = s.contentWidth;
				} else {
					contentWidth = pane[0].scrollWidth;
				}
				contentHeight = pane[0].scrollHeight;
				pane.css('overflow', '');

				percentInViewH = contentWidth / paneWidth;
				percentInViewV = contentHeight / paneHeight;
				isScrollableV = percentInViewV > 1;

				isScrollableH = percentInViewH > 1;

				//console.log(paneWidth, paneHeight, contentWidth, contentHeight, percentInViewH, percentInViewV, isScrollableH, isScrollableV);

				if (!(isScrollableH || isScrollableV)) {
					elem.removeClass('jspScrollable');
					pane.css({
						top: 0,
						width: container.width() - originalPaddingTotalWidth
					});
					removeMousewheel();
					removeFocusHandler();
					removeKeyboardNav();
					removeClickOnTrack();
				} else {
					elem.addClass('jspScrollable');

					isMaintainingPositon = settings.maintainPosition && (verticalDragPosition || horizontalDragPosition);
					if (isMaintainingPositon) {
						lastContentX = contentPositionX();
						lastContentY = contentPositionY();
					}

					initialiseVerticalScroll();
					initialiseHorizontalScroll();
					resizeScrollbars();

					if (isMaintainingPositon) {
						scrollToX(maintainAtRight  ? (contentWidth  - paneWidth ) : lastContentX, false);
						scrollToY(maintainAtBottom ? (contentHeight - paneHeight) : lastContentY, false);
					}

					initFocusHandler();
					initMousewheel();
					initTouch();
					
					if (settings.enableKeyboardNavigation) {
						initKeyboardNav();
					}
					if (settings.clickOnTrack) {
						initClickOnTrack();
					}
					
					observeHash();
					if (settings.hijackInternalLinks) {
						hijackInternalLinks();
					}
				}

				if (settings.autoReinitialise && !reinitialiseInterval) {
					reinitialiseInterval = setInterval(
						function()
						{
							initialise(settings);
						},
						settings.autoReinitialiseDelay
					);
				} else if (!settings.autoReinitialise && reinitialiseInterval) {
					clearInterval(reinitialiseInterval);
				}

				originalScrollTop && elem.scrollTop(0) && scrollToY(originalScrollTop, false);
				originalScrollLeft && elem.scrollLeft(0) && scrollToX(originalScrollLeft, false);

				elem.trigger('jsp-initialised', [isScrollableH || isScrollableV]);
			}

			function initialiseVerticalScroll()
			{
				if (isScrollableV) {

					container.append(
						$('<div class="jspVerticalBar" />').append(
							$('<div class="jspCap jspCapTop" />'),
							$('<div class="jspTrack" />').append(
								$('<div class="jspDrag" />').append(
									$('<div class="jspDragTop" />'),
									$('<div class="jspDragBottom" />')
								)
							),
							$('<div class="jspCap jspCapBottom" />')
						)
					);

					verticalBar = container.find('>.jspVerticalBar');
					verticalTrack = verticalBar.find('>.jspTrack');
					verticalDrag = verticalTrack.find('>.jspDrag');

					if (settings.showArrows) {
						arrowUp = $('<a class="jspArrow jspArrowUp" />').bind(
							'mousedown.jsp', getArrowScroll(0, -1)
						).bind('click.jsp', nil);
						arrowDown = $('<a class="jspArrow jspArrowDown" />').bind(
							'mousedown.jsp', getArrowScroll(0, 1)
						).bind('click.jsp', nil);
						if (settings.arrowScrollOnHover) {
							arrowUp.bind('mouseover.jsp', getArrowScroll(0, -1, arrowUp));
							arrowDown.bind('mouseover.jsp', getArrowScroll(0, 1, arrowDown));
						}

						appendArrows(verticalTrack, settings.verticalArrowPositions, arrowUp, arrowDown);
					}

					verticalTrackHeight = paneHeight;
					container.find('>.jspVerticalBar>.jspCap:visible,>.jspVerticalBar>.jspArrow').each(
						function()
						{
							verticalTrackHeight -= $(this).outerHeight();
						}
					);


					verticalDrag.hover(
						function()
						{
							verticalDrag.addClass('jspHover');
						},
						function()
						{
							verticalDrag.removeClass('jspHover');
						}
					).bind(
						'mousedown.jsp',
						function(e)
						{
							// Stop IE from allowing text selection
							$('html').bind('dragstart.jsp selectstart.jsp', nil);

							verticalDrag.addClass('jspActive');

							var startY = e.pageY - verticalDrag.position().top;

							$('html').bind(
								'mousemove.jsp',
								function(e)
								{
									positionDragY(e.pageY - startY, false);
								}
							).bind('mouseup.jsp mouseleave.jsp', cancelDrag);
							return false;
						}
					);
					sizeVerticalScrollbar();
				}
			}

			function sizeVerticalScrollbar()
			{
				verticalTrack.height(verticalTrackHeight + 'px');
				verticalDragPosition = 0;
				scrollbarWidth = settings.verticalGutter + verticalTrack.outerWidth();

				// Make the pane thinner to allow for the vertical scrollbar
				pane.width(paneWidth - scrollbarWidth - originalPaddingTotalWidth);

				// Add margin to the left of the pane if scrollbars are on that side (to position
				// the scrollbar on the left or right set it's left or right property in CSS)
				try {
					if (verticalBar.position().left === 0) {
						pane.css('margin-left', scrollbarWidth + 'px');
					}
				} catch (err) {
				}
			}

			function initialiseHorizontalScroll()
			{
				if (isScrollableH) {

					container.append(
						$('<div class="jspHorizontalBar" />').append(
							$('<div class="jspCap jspCapLeft" />'),
							$('<div class="jspTrack" />').append(
								$('<div class="jspDrag" />').append(
									$('<div class="jspDragLeft" />'),
									$('<div class="jspDragRight" />')
								)
							),
							$('<div class="jspCap jspCapRight" />')
						)
					);

					horizontalBar = container.find('>.jspHorizontalBar');
					horizontalTrack = horizontalBar.find('>.jspTrack');
					horizontalDrag = horizontalTrack.find('>.jspDrag');

					if (settings.showArrows) {
						arrowLeft = $('<a class="jspArrow jspArrowLeft" />').bind(
							'mousedown.jsp', getArrowScroll(-1, 0)
						).bind('click.jsp', nil);
						arrowRight = $('<a class="jspArrow jspArrowRight" />').bind(
							'mousedown.jsp', getArrowScroll(1, 0)
						).bind('click.jsp', nil);
						if (settings.arrowScrollOnHover) {
							arrowLeft.bind('mouseover.jsp', getArrowScroll(-1, 0, arrowLeft));
							arrowRight.bind('mouseover.jsp', getArrowScroll(1, 0, arrowRight));
						}
						appendArrows(horizontalTrack, settings.horizontalArrowPositions, arrowLeft, arrowRight);
					}

					horizontalDrag.hover(
						function()
						{
							horizontalDrag.addClass('jspHover');
						},
						function()
						{
							horizontalDrag.removeClass('jspHover');
						}
					).bind(
						'mousedown.jsp',
						function(e)
						{
							// Stop IE from allowing text selection
							$('html').bind('dragstart.jsp selectstart.jsp', nil);

							horizontalDrag.addClass('jspActive');

							var startX = e.pageX - horizontalDrag.position().left;

							$('html').bind(
								'mousemove.jsp',
								function(e)
								{
									positionDragX(e.pageX - startX, false);
								}
							).bind('mouseup.jsp mouseleave.jsp', cancelDrag);
							return false;
						}
					);
					horizontalTrackWidth = container.innerWidth();
					sizeHorizontalScrollbar();
				}
			}

			function sizeHorizontalScrollbar()
			{
				container.find('>.jspHorizontalBar>.jspCap:visible,>.jspHorizontalBar>.jspArrow').each(
					function()
					{
						horizontalTrackWidth -= $(this).outerWidth();
					}
				);

				horizontalTrack.width(horizontalTrackWidth + 'px');
				horizontalDragPosition = 0;
			}

			function resizeScrollbars()
			{
				if (isScrollableH && isScrollableV) {
					var horizontalTrackHeight = horizontalTrack.outerHeight(),
						verticalTrackWidth = verticalTrack.outerWidth();
					verticalTrackHeight -= horizontalTrackHeight;
					$(horizontalBar).find('>.jspCap:visible,>.jspArrow').each(
						function()
						{
							horizontalTrackWidth += $(this).outerWidth();
						}
					);
					horizontalTrackWidth -= verticalTrackWidth;
					paneHeight -= verticalTrackWidth;
					paneWidth -= horizontalTrackHeight;
					horizontalTrack.parent().append(
						$('<div class="jspCorner" />').css('width', horizontalTrackHeight + 'px')
					);
					sizeVerticalScrollbar();
					sizeHorizontalScrollbar();
				}
				// reflow content
				if (isScrollableH) {
					pane.width((container.outerWidth() - originalPaddingTotalWidth) + 'px');
				}
				contentHeight = pane.outerHeight();
				percentInViewV = contentHeight / paneHeight;

				if (isScrollableH) {
					horizontalDragWidth = Math.ceil(1 / percentInViewH * horizontalTrackWidth);
					if (horizontalDragWidth > settings.horizontalDragMaxWidth) {
						horizontalDragWidth = settings.horizontalDragMaxWidth;
					} else if (horizontalDragWidth < settings.horizontalDragMinWidth) {
						horizontalDragWidth = settings.horizontalDragMinWidth;
					}
					horizontalDrag.width(horizontalDragWidth + 'px');
					dragMaxX = horizontalTrackWidth - horizontalDragWidth;
					_positionDragX(horizontalDragPosition); // To update the state for the arrow buttons
				}
				if (isScrollableV) {
					verticalDragHeight = Math.ceil(1 / percentInViewV * verticalTrackHeight);
					if (verticalDragHeight > settings.verticalDragMaxHeight) {
						verticalDragHeight = settings.verticalDragMaxHeight;
					} else if (verticalDragHeight < settings.verticalDragMinHeight) {
						verticalDragHeight = settings.verticalDragMinHeight;
					}
					verticalDrag.height(verticalDragHeight + 'px');
					dragMaxY = verticalTrackHeight - verticalDragHeight;
					_positionDragY(verticalDragPosition); // To update the state for the arrow buttons
				}
			}

			function appendArrows(ele, p, a1, a2)
			{
				var p1 = "before", p2 = "after", aTemp;
				
				// Sniff for mac... Is there a better way to determine whether the arrows would naturally appear
				// at the top or the bottom of the bar?
				if (p == "os") {
					p = /Mac/.test(navigator.platform) ? "after" : "split";
				}
				if (p == p1) {
					p2 = p;
				} else if (p == p2) {
					p1 = p;
					aTemp = a1;
					a1 = a2;
					a2 = aTemp;
				}

				ele[p1](a1)[p2](a2);
			}

			function getArrowScroll(dirX, dirY, ele)
			{
				return function()
				{
					arrowScroll(dirX, dirY, this, ele);
					this.blur();
					return false;
				};
			}

			function arrowScroll(dirX, dirY, arrow, ele)
			{
				arrow = $(arrow).addClass('jspActive');

				var eve,
					scrollTimeout,
					isFirst = true,
					doScroll = function()
					{
						if (dirX !== 0) {
							jsp.scrollByX(dirX * settings.arrowButtonSpeed);
						}
						if (dirY !== 0) {
							jsp.scrollByY(dirY * settings.arrowButtonSpeed);
						}
						scrollTimeout = setTimeout(doScroll, isFirst ? settings.initialDelay : settings.arrowRepeatFreq);
						isFirst = false;
					};

				doScroll();

				eve = ele ? 'mouseout.jsp' : 'mouseup.jsp';
				ele = ele || $('html');
				ele.bind(
					eve,
					function()
					{
						arrow.removeClass('jspActive');
						scrollTimeout && clearTimeout(scrollTimeout);
						scrollTimeout = null;
						ele.unbind(eve);
					}
				);
			}

			function initClickOnTrack()
			{
				removeClickOnTrack();
				if (isScrollableV) {
					verticalTrack.bind(
						'mousedown.jsp',
						function(e)
						{
							if (e.originalTarget === undefined || e.originalTarget == e.currentTarget) {
								var clickedTrack = $(this),
									offset = clickedTrack.offset(),
									direction = e.pageY - offset.top - verticalDragPosition,
									scrollTimeout,
									isFirst = true,
									doScroll = function()
									{
										var offset = clickedTrack.offset(),
											pos = e.pageY - offset.top - verticalDragHeight / 2,
											contentDragY = paneHeight * settings.scrollPagePercent,
											dragY = dragMaxY * contentDragY / (contentHeight - paneHeight);
										if (direction < 0) {
											if (verticalDragPosition - dragY > pos) {
												jsp.scrollByY(-contentDragY);
											} else {
												positionDragY(pos);
											}
										} else if (direction > 0) {
											if (verticalDragPosition + dragY < pos) {
												jsp.scrollByY(contentDragY);
											} else {
												positionDragY(pos);
											}
										} else {
											cancelClick();
											return;
										}
										scrollTimeout = setTimeout(doScroll, isFirst ? settings.initialDelay : settings.trackClickRepeatFreq);
										isFirst = false;
									},
									cancelClick = function()
									{
										scrollTimeout && clearTimeout(scrollTimeout);
										scrollTimeout = null;
										$(document).unbind('mouseup.jsp', cancelClick);
									};
								doScroll();
								$(document).bind('mouseup.jsp', cancelClick);
								return false;
							}
						}
					);
				}
				
				if (isScrollableH) {
					horizontalTrack.bind(
						'mousedown.jsp',
						function(e)
						{
							if (e.originalTarget === undefined || e.originalTarget == e.currentTarget) {
								var clickedTrack = $(this),
									offset = clickedTrack.offset(),
									direction = e.pageX - offset.left - horizontalDragPosition,
									scrollTimeout,
									isFirst = true,
									doScroll = function()
									{
										var offset = clickedTrack.offset(),
											pos = e.pageX - offset.left - horizontalDragWidth / 2,
											contentDragX = paneWidth * settings.scrollPagePercent,
											dragX = dragMaxX * contentDragX / (contentWidth - paneWidth);
										if (direction < 0) {
											if (horizontalDragPosition - dragX > pos) {
												jsp.scrollByX(-contentDragX);
											} else {
												positionDragX(pos);
											}
										} else if (direction > 0) {
											if (horizontalDragPosition + dragX < pos) {
												jsp.scrollByX(contentDragX);
											} else {
												positionDragX(pos);
											}
										} else {
											cancelClick();
											return;
										}
										scrollTimeout = setTimeout(doScroll, isFirst ? settings.initialDelay : settings.trackClickRepeatFreq);
										isFirst = false;
									},
									cancelClick = function()
									{
										scrollTimeout && clearTimeout(scrollTimeout);
										scrollTimeout = null;
										$(document).unbind('mouseup.jsp', cancelClick);
									};
								doScroll();
								$(document).bind('mouseup.jsp', cancelClick);
								return false;
							}
						}
					);
				}
			}

			function removeClickOnTrack()
			{
				if (horizontalTrack) {
					horizontalTrack.unbind('mousedown.jsp');
				}
				if (verticalTrack) {
					verticalTrack.unbind('mousedown.jsp');
				}
			}

			function cancelDrag()
			{
				$('html').unbind('dragstart.jsp selectstart.jsp mousemove.jsp mouseup.jsp mouseleave.jsp');

				if (verticalDrag) {
					verticalDrag.removeClass('jspActive');
				}
				if (horizontalDrag) {
					horizontalDrag.removeClass('jspActive');
				}
			}

			function positionDragY(destY, animate)
			{
				if (!isScrollableV) {
					return;
				}
				if (destY < 0) {
					destY = 0;
				} else if (destY > dragMaxY) {
					destY = dragMaxY;
				}

				// can't just check if(animate) because false is a valid value that could be passed in...
				if (animate === undefined) {
					animate = settings.animateScroll;
				}
				if (animate) {
					jsp.animate(verticalDrag, 'top', destY,	_positionDragY);
				} else {
					verticalDrag.css('top', destY);
					_positionDragY(destY);
				}

			}

			function _positionDragY(destY)
			{
				if (destY === undefined) {
					destY = verticalDrag.position().top;
				}

				container.scrollTop(0);
				verticalDragPosition = destY;

				var isAtTop = verticalDragPosition === 0,
					isAtBottom = verticalDragPosition == dragMaxY,
					percentScrolled = destY/ dragMaxY,
					destTop = -percentScrolled * (contentHeight - paneHeight);

				if (wasAtTop != isAtTop || wasAtBottom != isAtBottom) {
					wasAtTop = isAtTop;
					wasAtBottom = isAtBottom;
					elem.trigger('jsp-arrow-change', [wasAtTop, wasAtBottom, wasAtLeft, wasAtRight]);
				}
				
				updateVerticalArrows(isAtTop, isAtBottom);
				pane.css('top', destTop);
				elem.trigger('jsp-scroll-y', [-destTop, isAtTop, isAtBottom]).trigger('scroll');
			}

			function positionDragX(destX, animate)
			{
				if (!isScrollableH) {
					return;
				}
				if (destX < 0) {
					destX = 0;
				} else if (destX > dragMaxX) {
					destX = dragMaxX;
				}

				if (animate === undefined) {
					animate = settings.animateScroll;
				}
				if (animate) {
					jsp.animate(horizontalDrag, 'left', destX,	_positionDragX);
				} else {
					horizontalDrag.css('left', destX);
					_positionDragX(destX);
				}
			}

			function _positionDragX(destX)
			{
				if (destX === undefined) {
					destX = horizontalDrag.position().left;
				}

				container.scrollTop(0);
				horizontalDragPosition = destX;

				var isAtLeft = horizontalDragPosition === 0,
					isAtRight = horizontalDragPosition == dragMaxX,
					percentScrolled = destX / dragMaxX,
					destLeft = -percentScrolled * (contentWidth - paneWidth);

				if (wasAtLeft != isAtLeft || wasAtRight != isAtRight) {
					wasAtLeft = isAtLeft;
					wasAtRight = isAtRight;
					elem.trigger('jsp-arrow-change', [wasAtTop, wasAtBottom, wasAtLeft, wasAtRight]);
				}
				
				updateHorizontalArrows(isAtLeft, isAtRight);
				pane.css('left', destLeft);
				elem.trigger('jsp-scroll-x', [-destLeft, isAtLeft, isAtRight]).trigger('scroll');
			}

			function updateVerticalArrows(isAtTop, isAtBottom)
			{
				if (settings.showArrows) {
					arrowUp[isAtTop ? 'addClass' : 'removeClass']('jspDisabled');
					arrowDown[isAtBottom ? 'addClass' : 'removeClass']('jspDisabled');
				}
			}

			function updateHorizontalArrows(isAtLeft, isAtRight)
			{
				if (settings.showArrows) {
					arrowLeft[isAtLeft ? 'addClass' : 'removeClass']('jspDisabled');
					arrowRight[isAtRight ? 'addClass' : 'removeClass']('jspDisabled');
				}
			}

			function scrollToY(destY, animate)
			{
				var percentScrolled = destY / (contentHeight - paneHeight);
				positionDragY(percentScrolled * dragMaxY, animate);
			}

			function scrollToX(destX, animate)
			{
				var percentScrolled = destX / (contentWidth - paneWidth);
				positionDragX(percentScrolled * dragMaxX, animate);
			}

			function scrollToElement(ele, stickToTop, animate)
			{
				var e, eleHeight, eleWidth, eleTop = 0, eleLeft = 0, viewportTop, viewportLeft, maxVisibleEleTop, maxVisibleEleLeft, destY, destX;

				// Legal hash values aren't necessarily legal jQuery selectors so we need to catch any
				// errors from the lookup...
				try {
					e = $(ele);
				} catch (err) {
					return;
				}
				eleHeight = e.outerHeight();
				eleWidth= e.outerWidth();

				container.scrollTop(0);
				container.scrollLeft(0);
				
				// loop through parents adding the offset top of any elements that are relatively positioned between
				// the focused element and the jspPane so we can get the true distance from the top
				// of the focused element to the top of the scrollpane...
				while (!e.is('.jspPane')) {
					eleTop += e.position().top;
					eleLeft += e.position().left;
					e = e.offsetParent();
					if (/^body|html$/i.test(e[0].nodeName)) {
						// we ended up too high in the document structure. Quit!
						return;
					}
				}

				viewportTop = contentPositionY();
				maxVisibleEleTop = viewportTop + paneHeight;
				if (eleTop < viewportTop || stickToTop) { // element is above viewport
					destY = eleTop - settings.verticalGutter;
				} else if (eleTop + eleHeight > maxVisibleEleTop) { // element is below viewport
					destY = eleTop - paneHeight + eleHeight + settings.verticalGutter;
				}
				if (destY) {
					scrollToY(destY, animate);
				}
				
				viewportLeft = contentPositionX();
	            maxVisibleEleLeft = viewportLeft + paneWidth;
	            if (eleLeft < viewportLeft || stickToTop) { // element is to the left of viewport
	                destX = eleLeft - settings.horizontalGutter;
	            } else if (eleLeft + eleWidth > maxVisibleEleLeft) { // element is to the right viewport
	                destX = eleLeft - paneWidth + eleWidth + settings.horizontalGutter;
	            }
	            if (destX) {
	                scrollToX(destX, animate);
	            }

			}

			function contentPositionX()
			{
				return -pane.position().left;
			}

			function contentPositionY()
			{
				return -pane.position().top;
			}

			function isCloseToBottom()
			{
				var scrollableHeight = contentHeight - paneHeight;
				return (scrollableHeight > 20) && (scrollableHeight - contentPositionY() < 10);
			}

			function isCloseToRight()
			{
				var scrollableWidth = contentWidth - paneWidth;
				return (scrollableWidth > 20) && (scrollableWidth - contentPositionX() < 10);
			}

			function initMousewheel()
			{
				container.unbind(mwEvent).bind(
					mwEvent,
					function (event, delta, deltaX, deltaY) {
						var dX = horizontalDragPosition, dY = verticalDragPosition;
						jsp.scrollBy(deltaX * settings.mouseWheelSpeed, -deltaY * settings.mouseWheelSpeed, false);
						// return true if there was no movement so rest of screen can scroll
						return dX == horizontalDragPosition && dY == verticalDragPosition;
					}
				);
			}

			function removeMousewheel()
			{
				container.unbind(mwEvent);
			}

			function nil()
			{
				return false;
			}

			function initFocusHandler()
			{
				pane.find(':input,a').unbind('focus.jsp').bind(
					'focus.jsp',
					function(e)
					{
						scrollToElement(e.target, false);
					}
				);
			}

			function removeFocusHandler()
			{
				pane.find(':input,a').unbind('focus.jsp');
			}
			
			function initKeyboardNav()
			{
				var keyDown, elementHasScrolled, validParents = [];
				isScrollableH && validParents.push(horizontalBar[0]);
				isScrollableV && validParents.push(verticalBar[0]);
				
				// IE also focuses elements that don't have tabindex set.
				pane.focus(
					function()
					{
						elem.focus();
					}
				);
				
				elem.attr('tabindex', 0)
					.unbind('keydown.jsp keypress.jsp')
					.bind(
						'keydown.jsp',
						function(e)
						{
							if (e.target !== this && !(validParents.length && $(e.target).closest(validParents).length)){
								return;
							}
							var dX = horizontalDragPosition, dY = verticalDragPosition;
							switch(e.keyCode) {
								case 40: // down
								case 38: // up
								case 34: // page down
								case 32: // space
								case 33: // page up
								case 39: // right
								case 37: // left
									keyDown = e.keyCode;
									keyDownHandler();
									break;
								case 35: // end
									scrollToY(contentHeight - paneHeight);
									keyDown = null;
									break;
								case 36: // home
									scrollToY(0);
									keyDown = null;
									break;
							}

							elementHasScrolled = e.keyCode == keyDown && dX != horizontalDragPosition || dY != verticalDragPosition;
							return !elementHasScrolled;
						}
					).bind(
						'keypress.jsp', // For FF/ OSX so that we can cancel the repeat key presses if the JSP scrolls...
						function(e)
						{
							if (e.keyCode == keyDown) {
								keyDownHandler();
							}
							return !elementHasScrolled;
						}
					);
				
				if (settings.hideFocus) {
					elem.css('outline', 'none');
					if ('hideFocus' in container[0]){
						elem.attr('hideFocus', true);
					}
				} else {
					elem.css('outline', '');
					if ('hideFocus' in container[0]){
						elem.attr('hideFocus', false);
					}
				}
				
				function keyDownHandler()
				{
					var dX = horizontalDragPosition, dY = verticalDragPosition;
					switch(keyDown) {
						case 40: // down
							jsp.scrollByY(settings.keyboardSpeed, false);
							break;
						case 38: // up
							jsp.scrollByY(-settings.keyboardSpeed, false);
							break;
						case 34: // page down
						case 32: // space
							jsp.scrollByY(paneHeight * settings.scrollPagePercent, false);
							break;
						case 33: // page up
							jsp.scrollByY(-paneHeight * settings.scrollPagePercent, false);
							break;
						case 39: // right
							jsp.scrollByX(settings.keyboardSpeed, false);
							break;
						case 37: // left
							jsp.scrollByX(-settings.keyboardSpeed, false);
							break;
					}

					elementHasScrolled = dX != horizontalDragPosition || dY != verticalDragPosition;
					return elementHasScrolled;
				}
			}
			
			function removeKeyboardNav()
			{
				elem.attr('tabindex', '-1')
					.removeAttr('tabindex')
					.unbind('keydown.jsp keypress.jsp');
			}

			function observeHash()
			{
				if (location.hash && location.hash.length > 1) {
					var e,
						retryInt,
						hash = escape(location.hash.substr(1)) // hash must be escaped to prevent XSS
						;
					try {
						e = $('#' + hash + ', a[name="' + hash + '"]');
					} catch (err) {
						return;
					}

					if (e.length && pane.find(hash)) {
						// nasty workaround but it appears to take a little while before the hash has done its thing
						// to the rendered page so we just wait until the container's scrollTop has been messed up.
						if (container.scrollTop() === 0) {
							retryInt = setInterval(
								function()
								{
									if (container.scrollTop() > 0) {
										scrollToElement(e, true);
										$(document).scrollTop(container.position().top);
										clearInterval(retryInt);
									}
								},
								50
							);
						} else {
							scrollToElement(e, true);
							$(document).scrollTop(container.position().top);
						}
					}
				}
			}

			function hijackInternalLinks()
			{
				// only register the link handler once
				if ($(document.body).data('jspHijack')) {
					return;
				}

				// remember that the handler was bound
				$(document.body).data('jspHijack', true);

				// use live handler to also capture newly created links
				$(document.body).delegate('a[href*=#]', 'click', function(event) {
					// does the link point to the same page?
					// this also takes care of cases with a <base>-Tag or Links not starting with the hash #
					// e.g. <a href="index.html#test"> when the current url already is index.html
					var href = this.href.substr(0, this.href.indexOf('#')),
						locationHref = location.href,
						hash,
						element,
						container,
						jsp,
						scrollTop,
						elementTop;
					if (location.href.indexOf('#') !== -1) {
						locationHref = location.href.substr(0, location.href.indexOf('#'));
					}
					if (href !== locationHref) {
						// the link points to another page
						return;
					}

					// check if jScrollPane should handle this click event
					hash = escape(this.href.substr(this.href.indexOf('#') + 1));

					// find the element on the page
					element;
					try {
						element = $('#' + hash + ', a[name="' + hash + '"]');
					} catch (e) {
						// hash is not a valid jQuery identifier
						return;
					}

					if (!element.length) {
						// this link does not point to an element on this page
						return;
					}

					container = element.closest('.jspScrollable');
					jsp = container.data('jsp');

					// jsp might be another jsp instance than the one, that bound this event
					// remember: this event is only bound once for all instances.
					jsp.scrollToElement(element, true);

					if (container[0].scrollIntoView) {
						// also scroll to the top of the container (if it is not visible)
						scrollTop = $(window).scrollTop();
						elementTop = element.offset().top;
						if (elementTop < scrollTop || elementTop > scrollTop + $(window).height()) {
							container[0].scrollIntoView();
						}
					}

					// jsp handled this event, prevent the browser default (scrolling :P)
					event.preventDefault();
				});
			}
			
			// Init touch on iPad, iPhone, iPod, Android
			function initTouch()
			{
				var startX,
					startY,
					touchStartX,
					touchStartY,
					moved,
					moving = false;
  
				container.unbind('touchstart.jsp touchmove.jsp touchend.jsp click.jsp-touchclick').bind(
					'touchstart.jsp',
					function(e)
					{
						var touch = e.originalEvent.touches[0];
						startX = contentPositionX();
						startY = contentPositionY();
						touchStartX = touch.pageX;
						touchStartY = touch.pageY;
						moved = false;
						moving = true;
					}
				).bind(
					'touchmove.jsp',
					function(ev)
					{
						if(!moving) {
							return;
						}
						
						var touchPos = ev.originalEvent.touches[0],
							dX = horizontalDragPosition, dY = verticalDragPosition;
						
						jsp.scrollTo(startX + touchStartX - touchPos.pageX, startY + touchStartY - touchPos.pageY);
						
						moved = moved || Math.abs(touchStartX - touchPos.pageX) > 5 || Math.abs(touchStartY - touchPos.pageY) > 5;
						
						// return true if there was no movement so rest of screen can scroll
						return dX == horizontalDragPosition && dY == verticalDragPosition;
					}
				).bind(
					'touchend.jsp',
					function(e)
					{
						moving = false;
						/*if(moved) {
							return false;
						}*/
					}
				).bind(
					'click.jsp-touchclick',
					function(e)
					{
						if(moved) {
							moved = false;
							return false;
						}
					}
				);
			}
			
			function destroy(){
				var currentY = contentPositionY(),
					currentX = contentPositionX();
				elem.removeClass('jspScrollable').unbind('.jsp');
				elem.replaceWith(originalElement.append(pane.children()));
				originalElement.scrollTop(currentY);
				originalElement.scrollLeft(currentX);

				// clear reinitialize timer if active
				if (reinitialiseInterval) {
					clearInterval(reinitialiseInterval);
				}
			}

			// Public API
			$.extend(
				jsp,
				{
					// Reinitialises the scroll pane (if it's internal dimensions have changed since the last time it
					// was initialised). The settings object which is passed in will override any settings from the
					// previous time it was initialised - if you don't pass any settings then the ones from the previous
					// initialisation will be used.
					reinitialise: function(s)
					{
						s = $.extend({}, settings, s);
						initialise(s);
					},
					// Scrolls the specified element (a jQuery object, DOM node or jQuery selector string) into view so
					// that it can be seen within the viewport. If stickToTop is true then the element will appear at
					// the top of the viewport, if it is false then the viewport will scroll as little as possible to
					// show the element. You can also specify if you want animation to occur. If you don't provide this
					// argument then the animateScroll value from the settings object is used instead.
					scrollToElement: function(ele, stickToTop, animate)
					{
						scrollToElement(ele, stickToTop, animate);
					},
					// Scrolls the pane so that the specified co-ordinates within the content are at the top left
					// of the viewport. animate is optional and if not passed then the value of animateScroll from
					// the settings object this jScrollPane was initialised with is used.
					scrollTo: function(destX, destY, animate)
					{
						scrollToX(destX, animate);
						scrollToY(destY, animate);
					},
					// Scrolls the pane so that the specified co-ordinate within the content is at the left of the
					// viewport. animate is optional and if not passed then the value of animateScroll from the settings
					// object this jScrollPane was initialised with is used.
					scrollToX: function(destX, animate)
					{
						scrollToX(destX, animate);
					},
					// Scrolls the pane so that the specified co-ordinate within the content is at the top of the
					// viewport. animate is optional and if not passed then the value of animateScroll from the settings
					// object this jScrollPane was initialised with is used.
					scrollToY: function(destY, animate)
					{
						scrollToY(destY, animate);
					},
					// Scrolls the pane to the specified percentage of its maximum horizontal scroll position. animate
					// is optional and if not passed then the value of animateScroll from the settings object this
					// jScrollPane was initialised with is used.
					scrollToPercentX: function(destPercentX, animate)
					{
						scrollToX(destPercentX * (contentWidth - paneWidth), animate);
					},
					// Scrolls the pane to the specified percentage of its maximum vertical scroll position. animate
					// is optional and if not passed then the value of animateScroll from the settings object this
					// jScrollPane was initialised with is used.
					scrollToPercentY: function(destPercentY, animate)
					{
						scrollToY(destPercentY * (contentHeight - paneHeight), animate);
					},
					// Scrolls the pane by the specified amount of pixels. animate is optional and if not passed then
					// the value of animateScroll from the settings object this jScrollPane was initialised with is used.
					scrollBy: function(deltaX, deltaY, animate)
					{
						jsp.scrollByX(deltaX, animate);
						jsp.scrollByY(deltaY, animate);
					},
					// Scrolls the pane by the specified amount of pixels. animate is optional and if not passed then
					// the value of animateScroll from the settings object this jScrollPane was initialised with is used.
					scrollByX: function(deltaX, animate)
					{
						var destX = contentPositionX() + Math[deltaX<0 ? 'floor' : 'ceil'](deltaX),
							percentScrolled = destX / (contentWidth - paneWidth);
						positionDragX(percentScrolled * dragMaxX, animate);
					},
					// Scrolls the pane by the specified amount of pixels. animate is optional and if not passed then
					// the value of animateScroll from the settings object this jScrollPane was initialised with is used.
					scrollByY: function(deltaY, animate)
					{
						var destY = contentPositionY() + Math[deltaY<0 ? 'floor' : 'ceil'](deltaY),
							percentScrolled = destY / (contentHeight - paneHeight);
						positionDragY(percentScrolled * dragMaxY, animate);
					},
					// Positions the horizontal drag at the specified x position (and updates the viewport to reflect
					// this). animate is optional and if not passed then the value of animateScroll from the settings
					// object this jScrollPane was initialised with is used.
					positionDragX: function(x, animate)
					{
						positionDragX(x, animate);
					},
					// Positions the vertical drag at the specified y position (and updates the viewport to reflect
					// this). animate is optional and if not passed then the value of animateScroll from the settings
					// object this jScrollPane was initialised with is used.
					positionDragY: function(y, animate)
					{
						positionDragY(y, animate);
					},
					// This method is called when jScrollPane is trying to animate to a new position. You can override
					// it if you want to provide advanced animation functionality. It is passed the following arguments:
					//  * ele          - the element whose position is being animated
					//  * prop         - the property that is being animated
					//  * value        - the value it's being animated to
					//  * stepCallback - a function that you must execute each time you update the value of the property
					// You can use the default implementation (below) as a starting point for your own implementation.
					animate: function(ele, prop, value, stepCallback)
					{
						var params = {};
						params[prop] = value;
						ele.animate(
							params,
							{
								'duration'	: settings.animateDuration,
								'easing'	: settings.animateEase,
								'queue'		: false,
								'step'		: stepCallback
							}
						);
					},
					// Returns the current x position of the viewport with regards to the content pane.
					getContentPositionX: function()
					{
						return contentPositionX();
					},
					// Returns the current y position of the viewport with regards to the content pane.
					getContentPositionY: function()
					{
						return contentPositionY();
					},
					// Returns the width of the content within the scroll pane.
					getContentWidth: function()
					{
						return contentWidth;
					},
					// Returns the height of the content within the scroll pane.
					getContentHeight: function()
					{
						return contentHeight;
					},
					// Returns the horizontal position of the viewport within the pane content.
					getPercentScrolledX: function()
					{
						return contentPositionX() / (contentWidth - paneWidth);
					},
					// Returns the vertical position of the viewport within the pane content.
					getPercentScrolledY: function()
					{
						return contentPositionY() / (contentHeight - paneHeight);
					},
					// Returns whether or not this scrollpane has a horizontal scrollbar.
					getIsScrollableH: function()
					{
						return isScrollableH;
					},
					// Returns whether or not this scrollpane has a vertical scrollbar.
					getIsScrollableV: function()
					{
						return isScrollableV;
					},
					// Gets a reference to the content pane. It is important that you use this method if you want to
					// edit the content of your jScrollPane as if you access the element directly then you may have some
					// problems (as your original element has had additional elements for the scrollbars etc added into
					// it).
					getContentPane: function()
					{
						return pane;
					},
					// Scrolls this jScrollPane down as far as it can currently scroll. If animate isn't passed then the
					// animateScroll value from settings is used instead.
					scrollToBottom: function(animate)
					{
						positionDragY(dragMaxY, animate);
					},
					// Hijacks the links on the page which link to content inside the scrollpane. If you have changed
					// the content of your page (e.g. via AJAX) and want to make sure any new anchor links to the
					// contents of your scroll pane will work then call this function.
					hijackInternalLinks: $.noop,
					// Removes the jScrollPane and returns the page to the state it was in before jScrollPane was
					// initialised.
					destroy: function()
					{
							destroy();
					}
				}
			);
			
			initialise(s);
		}

		// Pluginifying code...
		settings = $.extend({}, $.fn.jScrollPane.defaults, settings);
		
		// Apply default speed
		$.each(['mouseWheelSpeed', 'arrowButtonSpeed', 'trackClickSpeed', 'keyboardSpeed'], function() {
			settings[this] = settings[this] || settings.speed;
		});

		return this.each(
			function()
			{
				var elem = $(this), jspApi = elem.data('jsp');
				if (jspApi) {
					jspApi.reinitialise(settings);
				} else {
					$("script",elem).filter('[type="text/javascript"],:not([type])').remove();
					jspApi = new JScrollPane(elem, settings);
					elem.data('jsp', jspApi);
				}
			}
		);
	};

	$.fn.jScrollPane.defaults = {
		showArrows					: false,
		maintainPosition			: true,
		stickToBottom				: false,
		stickToRight				: false,
		clickOnTrack				: true,
		autoReinitialise			: false,
		autoReinitialiseDelay		: 500,
		verticalDragMinHeight		: 0,
		verticalDragMaxHeight		: 99999,
		horizontalDragMinWidth		: 0,
		horizontalDragMaxWidth		: 99999,
		contentWidth				: undefined,
		animateScroll				: false,
		animateDuration				: 300,
		animateEase					: 'linear',
		hijackInternalLinks			: false,
		verticalGutter				: 4,
		horizontalGutter			: 4,
		mouseWheelSpeed				: 0,
		arrowButtonSpeed			: 0,
		arrowRepeatFreq				: 50,
		arrowScrollOnHover			: false,
		trackClickSpeed				: 0,
		trackClickRepeatFreq		: 70,
		verticalArrowPositions		: 'split',
		horizontalArrowPositions	: 'split',
		enableKeyboardNavigation	: true,
		hideFocus					: false,
		keyboardSpeed				: 0,
		initialDelay                : 300,        // Delay before starting repeating
		speed						: 30,		// Default speed when others falsey
		scrollPagePercent			: .8		// Percent of visible area scrolled when pageUp/Down or track area pressed
	};

})(jQuery,this);

/*
 * FancyBox - jQuery Plugin
 * Simple and fancy lightbox alternative
 *
 * Examples and documentation at: http://fancybox.net
 *
 * Copyright (c) 2008 - 2010 Janis Skarnelis
 * That said, it is hardly a one-person project. Many people have submitted bugs, code, and offered their advice freely. Their support is greatly appreciated.
 *
 * Version: 1.3.4 (11/11/2010)
 * Requires: jQuery v1.3+
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */

;(function($) {
	var tmp, loading, overlay, wrap, outer, content, close, title, nav_left, nav_right,

		selectedIndex = 0, selectedOpts = {}, selectedArray = [], currentIndex = 0, currentOpts = {}, currentArray = [],

		ajaxLoader = null, imgPreloader = new Image(), imgRegExp = /\.(jpg|gif|png|bmp|jpeg)(.*)?$/i, swfRegExp = /[^\.]\.(swf)\s*$/i,

		loadingTimer, loadingFrame = 1,

		titleHeight = 0, titleStr = '', start_pos, final_pos, busy = false, fx = $.extend($('<div/>')[0], { prop: 0 }),

		isIE6 = $.browser.msie && $.browser.version < 7 && !window.XMLHttpRequest,

		/*
		 * Private methods 
		 */

		_abort = function() {
			loading.hide();

			imgPreloader.onerror = imgPreloader.onload = null;

			if (ajaxLoader) {
				ajaxLoader.abort();
			}

			tmp.empty();
		},

		_error = function() {
			if (false === selectedOpts.onError(selectedArray, selectedIndex, selectedOpts)) {
				loading.hide();
				busy = false;
				return;
			}

			selectedOpts.titleShow = false;

			selectedOpts.width = 'auto';
			selectedOpts.height = 'auto';

			tmp.html( '<p id="fancybox-error">The requested content cannot be loaded.<br />Please try again later.</p>' );

			_process_inline();
		},

		_start = function() {
			var obj = selectedArray[ selectedIndex ],
				href, 
				type, 
				title,
				str,
				emb,
				ret;

			_abort();

			selectedOpts = $.extend({}, $.fn.fancybox.defaults, (typeof $(obj).data('fancybox') == 'undefined' ? selectedOpts : $(obj).data('fancybox')));

			ret = selectedOpts.onStart(selectedArray, selectedIndex, selectedOpts);

			if (ret === false) {
				busy = false;
				return;
			} else if (typeof ret == 'object') {
				selectedOpts = $.extend(selectedOpts, ret);
			}

			title = selectedOpts.title || (obj.nodeName ? $(obj).attr('title') : obj.title) || '';

			if (obj.nodeName && !selectedOpts.orig) {
				selectedOpts.orig = $(obj).children("img:first").length ? $(obj).children("img:first") : $(obj);
			}

			if (title === '' && selectedOpts.orig && selectedOpts.titleFromAlt) {
				title = selectedOpts.orig.attr('alt');
			}

			href = selectedOpts.href || (obj.nodeName ? $(obj).attr('href') : obj.href) || null;

			if ((/^(?:javascript)/i).test(href) || href == '#') {
				href = null;
			}

			if (selectedOpts.type) {
				type = selectedOpts.type;

				if (!href) {
					href = selectedOpts.content;
				}

			} else if (selectedOpts.content) {
				type = 'html';

			} else if (href) {
				if (href.match(imgRegExp)) {
					type = 'image';

				} else if (href.match(swfRegExp)) {
					type = 'swf';

				} else if ($(obj).hasClass("iframe")) {
					type = 'iframe';

				} else if (href.indexOf("#") === 0) {
					type = 'inline';

				} else {
					type = 'ajax';
				}
			}

			if (!type) {
				_error();
				return;
			}

			if (type == 'inline') {
				obj	= href.substr(href.indexOf("#"));
				type = $(obj).length > 0 ? 'inline' : 'ajax';
			}

			selectedOpts.type = type;
			selectedOpts.href = href;
			selectedOpts.title = title;

			if (selectedOpts.autoDimensions) {
				if (selectedOpts.type == 'html' || selectedOpts.type == 'inline' || selectedOpts.type == 'ajax') {
					selectedOpts.width = 'auto';
					selectedOpts.height = 'auto';
				} else {
					selectedOpts.autoDimensions = false;	
				}
			}

			if (selectedOpts.modal) {
				selectedOpts.overlayShow = true;
				selectedOpts.hideOnOverlayClick = false;
				selectedOpts.hideOnContentClick = false;
				selectedOpts.enableEscapeButton = false;
				selectedOpts.showCloseButton = false;
			}

			selectedOpts.padding = parseInt(selectedOpts.padding, 10);
			selectedOpts.margin = parseInt(selectedOpts.margin, 10);

			tmp.css('padding', (selectedOpts.padding + selectedOpts.margin));

			$('.fancybox-inline-tmp').unbind('fancybox-cancel').bind('fancybox-change', function() {
				$(this).replaceWith(content.children());				
			});

			switch (type) {
				case 'html' :
					tmp.html( selectedOpts.content );
					_process_inline();
				break;

				case 'inline' :
					if ( $(obj).parent().is('#fancybox-content') === true) {
						busy = false;
						return;
					}

					$('<div class="fancybox-inline-tmp" />')
						.hide()
						.insertBefore( $(obj) )
						.bind('fancybox-cleanup', function() {
							$(this).replaceWith(content.children());
						}).bind('fancybox-cancel', function() {
							$(this).replaceWith(tmp.children());
						});

					$(obj).appendTo(tmp);

					_process_inline();
				break;

				case 'image':
					busy = false;

					$.fancybox.showActivity();

					imgPreloader = new Image();

					imgPreloader.onerror = function() {
						_error();
					};

					imgPreloader.onload = function() {
						busy = true;

						imgPreloader.onerror = imgPreloader.onload = null;

						_process_image();
					};

					imgPreloader.src = href;
				break;

				case 'swf':
					selectedOpts.scrolling = 'no';

					str = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="' + selectedOpts.width + '" height="' + selectedOpts.height + '"><param name="movie" value="' + href + '"></param>';
					emb = '';

					$.each(selectedOpts.swf, function(name, val) {
						str += '<param name="' + name + '" value="' + val + '"></param>';
						emb += ' ' + name + '="' + val + '"';
					});

					str += '<embed src="' + href + '" type="application/x-shockwave-flash" width="' + selectedOpts.width + '" height="' + selectedOpts.height + '"' + emb + '></embed></object>';

					tmp.html(str);

					_process_inline();
				break;

				case 'ajax':
					busy = false;

					$.fancybox.showActivity();

					selectedOpts.ajax.win = selectedOpts.ajax.success;

					ajaxLoader = $.ajax($.extend({}, selectedOpts.ajax, {
						url	: href,
						data : selectedOpts.ajax.data || {},
						error : function(XMLHttpRequest, textStatus, errorThrown) {
							if ( XMLHttpRequest.status > 0 ) {
								_error();
							}
						},
						success : function(data, textStatus, XMLHttpRequest) {
							var o = typeof XMLHttpRequest == 'object' ? XMLHttpRequest : ajaxLoader;
							if (o.status == 200) {
								if ( typeof selectedOpts.ajax.win == 'function' ) {
									ret = selectedOpts.ajax.win(href, data, textStatus, XMLHttpRequest);

									if (ret === false) {
										loading.hide();
										return;
									} else if (typeof ret == 'string' || typeof ret == 'object') {
										data = ret;
									}
								}

								tmp.html( data );
								_process_inline();
							}
						}
					}));

				break;

				case 'iframe':
					_show();
				break;
			}
		},

		_process_inline = function() {
			var
				w = selectedOpts.width,
				h = selectedOpts.height;

			if (w.toString().indexOf('%') > -1) {
				w = parseInt( ($(window).width() - (selectedOpts.margin * 2)) * parseFloat(w) / 100, 10) + 'px';

			} else {
				w = w == 'auto' ? 'auto' : w + 'px';	
			}

			if (h.toString().indexOf('%') > -1) {
				h = parseInt( ($(window).height() - (selectedOpts.margin * 2)) * parseFloat(h) / 100, 10) + 'px';

			} else {
				h = h == 'auto' ? 'auto' : h + 'px';	
			}

			tmp.wrapInner('<div style="width:' + w + ';height:' + h + ';overflow: ' + (selectedOpts.scrolling == 'auto' ? 'auto' : (selectedOpts.scrolling == 'yes' ? 'scroll' : 'hidden')) + ';position:relative;"></div>');

			selectedOpts.width = tmp.width();
			selectedOpts.height = tmp.height();

			_show();
		},

		_process_image = function() {
			selectedOpts.width = imgPreloader.width;
			selectedOpts.height = imgPreloader.height;

			$("<img />").attr({
				'id' : 'fancybox-img',
				'src' : imgPreloader.src,
				'alt' : selectedOpts.title
			}).appendTo( tmp );

			_show();
		},

		_show = function() {
			var pos, equal;

			loading.hide();

			if (wrap.is(":visible") && false === currentOpts.onCleanup(currentArray, currentIndex, currentOpts)) {
				$.event.trigger('fancybox-cancel');

				busy = false;
				return;
			}

			busy = true;

			$(content.add( overlay )).unbind();

			$(window).unbind("resize.fb scroll.fb");
			$(document).unbind('keydown.fb');

			if (wrap.is(":visible") && currentOpts.titlePosition !== 'outside') {
				wrap.css('height', wrap.height());
			}

			currentArray = selectedArray;
			currentIndex = selectedIndex;
			currentOpts = selectedOpts;

			if (currentOpts.overlayShow) {
				overlay.css({
					'background-color' : currentOpts.overlayColor,
					'opacity' : currentOpts.overlayOpacity,
					'cursor' : currentOpts.hideOnOverlayClick ? 'pointer' : 'auto',
					'height' : $(document).height()
				});

				if (!overlay.is(':visible')) {
					if (isIE6) {
						$('select:not(#fancybox-tmp select)').filter(function() {
							return this.style.visibility !== 'hidden';
						}).css({'visibility' : 'hidden'}).one('fancybox-cleanup', function() {
							this.style.visibility = 'inherit';
						});
					}

					overlay.show();
				}
			} else {
				overlay.hide();
			}

			final_pos = _get_zoom_to();

			_process_title();

			if (wrap.is(":visible")) {
				$( close.add( nav_left ).add( nav_right ) ).hide();

				pos = wrap.position(),

				start_pos = {
					top	 : pos.top,
					left : pos.left,
					width : wrap.width(),
					height : wrap.height()
				};

				equal = (start_pos.width == final_pos.width && start_pos.height == final_pos.height);

				content.fadeTo(currentOpts.changeFade, 0.3, function() {
					var finish_resizing = function() {
						content.html( tmp.contents() ).fadeTo(currentOpts.changeFade, 1, _finish);
					};

					$.event.trigger('fancybox-change');

					content
						.empty()
						.removeAttr('filter')
						.css({
							'border-width' : currentOpts.padding,
							'width'	: final_pos.width - currentOpts.padding * 2,
							'height' : selectedOpts.autoDimensions ? 'auto' : final_pos.height - titleHeight - currentOpts.padding * 2
						});

					if (equal) {
						finish_resizing();

					} else {
						fx.prop = 0;

						$(fx).animate({prop: 1}, {
							 duration : currentOpts.changeSpeed,
							 easing : currentOpts.easingChange,
							 step : _draw,
							 complete : finish_resizing
						});
					}
				});

				return;
			}

			wrap.removeAttr("style");

			content.css('border-width', currentOpts.padding);

			if (currentOpts.transitionIn == 'elastic') {
				start_pos = _get_zoom_from();

				content.html( tmp.contents() );

				wrap.show();

				if (currentOpts.opacity) {
					final_pos.opacity = 0;
				}

				fx.prop = 0;

				$(fx).animate({prop: 1}, {
					 duration : currentOpts.speedIn,
					 easing : currentOpts.easingIn,
					 step : _draw,
					 complete : _finish
				});

				return;
			}

			if (currentOpts.titlePosition == 'inside' && titleHeight > 0) {	
				title.show();	
			}

			content
				.css({
					'width' : final_pos.width - currentOpts.padding * 2,
					'height' : selectedOpts.autoDimensions ? 'auto' : final_pos.height - titleHeight - currentOpts.padding * 2
				})
				.html( tmp.contents() );

			wrap
				.css(final_pos)
				.fadeIn( currentOpts.transitionIn == 'none' ? 0 : currentOpts.speedIn, _finish );
		},

		_format_title = function(title) {
			if (title && title.length) {
				if (currentOpts.titlePosition == 'float') {
					return '<table id="fancybox-title-float-wrap" cellpadding="0" cellspacing="0"><tr><td id="fancybox-title-float-left"></td><td id="fancybox-title-float-main">' + title + '</td><td id="fancybox-title-float-right"></td></tr></table>';
				}

				return '<div id="fancybox-title-' + currentOpts.titlePosition + '">' + title + '</div>';
			}

			return false;
		},

		_process_title = function() {
			titleStr = currentOpts.title || '';
			titleHeight = 0;

			title
				.empty()
				.removeAttr('style')
				.removeClass();

			if (currentOpts.titleShow === false) {
				title.hide();
				return;
			}

			titleStr = $.isFunction(currentOpts.titleFormat) ? currentOpts.titleFormat(titleStr, currentArray, currentIndex, currentOpts) : _format_title(titleStr);

			if (!titleStr || titleStr === '') {
				title.hide();
				return;
			}

			title
				.addClass('fancybox-title-' + currentOpts.titlePosition)
				.html( titleStr )
				.appendTo( 'body' )
				.show();

			switch (currentOpts.titlePosition) {
				case 'inside':
					title
						.css({
							'width' : final_pos.width - (currentOpts.padding * 2),
							'marginLeft' : currentOpts.padding,
							'marginRight' : currentOpts.padding
						});

					titleHeight = title.outerHeight(true);

					title.appendTo( outer );

					final_pos.height += titleHeight;
				break;

				case 'over':
					title
						.css({
							'marginLeft' : currentOpts.padding,
							'width'	: final_pos.width - (currentOpts.padding * 2),
							'bottom' : currentOpts.padding
						})
						.appendTo( outer );
				break;

				case 'float':
					title
						.css('left', parseInt((title.width() - final_pos.width - 40)/ 2, 10) * -1)
						.appendTo( wrap );
				break;

				default:
					title
						.css({
							'width' : final_pos.width - (currentOpts.padding * 2),
							'paddingLeft' : currentOpts.padding,
							'paddingRight' : currentOpts.padding
						})
						.appendTo( wrap );
				break;
			}

			title.hide();
		},

		_set_navigation = function() {
			if (currentOpts.enableEscapeButton || currentOpts.enableKeyboardNav) {
				$(document).bind('keydown.fb', function(e) {
					if (e.keyCode == 27 && currentOpts.enableEscapeButton) {
						e.preventDefault();
						$.fancybox.close();

					} else if ((e.keyCode == 37 || e.keyCode == 39) && currentOpts.enableKeyboardNav && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') {
						e.preventDefault();
						$.fancybox[ e.keyCode == 37 ? 'prev' : 'next']();
					}
				});
			}

			if (!currentOpts.showNavArrows) { 
				nav_left.hide();
				nav_right.hide();
				return;
			}

			if ((currentOpts.cyclic && currentArray.length > 1) || currentIndex !== 0) {
				nav_left.show();
			}

			if ((currentOpts.cyclic && currentArray.length > 1) || currentIndex != (currentArray.length -1)) {
				nav_right.show();
			}
		},

		_finish = function () {
			if (!$.support.opacity) {
				content.get(0).style.removeAttribute('filter');
				wrap.get(0).style.removeAttribute('filter');
			}

			if (selectedOpts.autoDimensions) {
				content.css('height', 'auto');
			}

			wrap.css('height', 'auto');

			if (titleStr && titleStr.length) {
				title.show();
			}

			if (currentOpts.showCloseButton) {
				close.show();
			}

			_set_navigation();
	
			if (currentOpts.hideOnContentClick)	{
				content.bind('click', $.fancybox.close);
			}

			if (currentOpts.hideOnOverlayClick)	{
				overlay.bind('click', $.fancybox.close);
			}

			$(window).bind("resize.fb", $.fancybox.resize);

			if (currentOpts.centerOnScroll) {
				$(window).bind("scroll.fb", $.fancybox.center);
			}

			if (currentOpts.type == 'iframe') {
				$('<iframe id="fancybox-frame" name="fancybox-frame' + new Date().getTime() + '" frameborder="0" hspace="0" ' + ($.browser.msie ? 'allowtransparency="true""' : '') + ' scrolling="' + selectedOpts.scrolling + '" src="' + currentOpts.href + '"></iframe>').appendTo(content);
			}

			wrap.show();

			busy = false;

			$.fancybox.center();

			currentOpts.onComplete(currentArray, currentIndex, currentOpts);

			_preload_images();
		},

		_preload_images = function() {
			var href, 
				objNext;

			if ((currentArray.length -1) > currentIndex) {
				href = currentArray[ currentIndex + 1 ].href;

				if (typeof href !== 'undefined' && href.match(imgRegExp)) {
					objNext = new Image();
					objNext.src = href;
				}
			}

			if (currentIndex > 0) {
				href = currentArray[ currentIndex - 1 ].href;

				if (typeof href !== 'undefined' && href.match(imgRegExp)) {
					objNext = new Image();
					objNext.src = href;
				}
			}
		},

		_draw = function(pos) {
			var dim = {
				width : parseInt(start_pos.width + (final_pos.width - start_pos.width) * pos, 10),
				height : parseInt(start_pos.height + (final_pos.height - start_pos.height) * pos, 10),

				top : parseInt(start_pos.top + (final_pos.top - start_pos.top) * pos, 10),
				left : parseInt(start_pos.left + (final_pos.left - start_pos.left) * pos, 10)
			};

			if (typeof final_pos.opacity !== 'undefined') {
				dim.opacity = pos < 0.5 ? 0.5 : pos;
			}

			wrap.css(dim);

			content.css({
				'width' : dim.width - currentOpts.padding * 2,
				'height' : dim.height - (titleHeight * pos) - currentOpts.padding * 2
			});
		},

		_get_viewport = function() {
			return [
				$(window).width() - (currentOpts.margin * 2),
				$(window).height() - (currentOpts.margin * 2),
				$(document).scrollLeft() + currentOpts.margin,
				$(document).scrollTop() + currentOpts.margin
			];
		},

		_get_zoom_to = function () {
			var view = _get_viewport(),
				to = {},
				resize = currentOpts.autoScale,
				double_padding = currentOpts.padding * 2,
				ratio;

			if (currentOpts.width.toString().indexOf('%') > -1) {
				to.width = parseInt((view[0] * parseFloat(currentOpts.width)) / 100, 10);
			} else {
				to.width = currentOpts.width + double_padding;
			}

			if (currentOpts.height.toString().indexOf('%') > -1) {
				to.height = parseInt((view[1] * parseFloat(currentOpts.height)) / 100, 10);
			} else {
				to.height = currentOpts.height + double_padding;
			}

			if (resize && (to.width > view[0] || to.height > view[1])) {
				if (selectedOpts.type == 'image' || selectedOpts.type == 'swf') {
					ratio = (currentOpts.width ) / (currentOpts.height );

					if ((to.width ) > view[0]) {
						to.width = view[0];
						to.height = parseInt(((to.width - double_padding) / ratio) + double_padding, 10);
					}

					if ((to.height) > view[1]) {
						to.height = view[1];
						to.width = parseInt(((to.height - double_padding) * ratio) + double_padding, 10);
					}

				} else {
					to.width = Math.min(to.width, view[0]);
					to.height = Math.min(to.height, view[1]);
				}
			}

			to.top = parseInt(Math.max(view[3] - 20, view[3] + ((view[1] - to.height - 40) * 0.5)), 10);
			to.left = parseInt(Math.max(view[2] - 20, view[2] + ((view[0] - to.width - 40) * 0.5)), 10);

			return to;
		},

		_get_obj_pos = function(obj) {
			var pos = obj.offset();

			pos.top += parseInt( obj.css('paddingTop'), 10 ) || 0;
			pos.left += parseInt( obj.css('paddingLeft'), 10 ) || 0;

			pos.top += parseInt( obj.css('border-top-width'), 10 ) || 0;
			pos.left += parseInt( obj.css('border-left-width'), 10 ) || 0;

			pos.width = obj.width();
			pos.height = obj.height();

			return pos;
		},

		_get_zoom_from = function() {
			var orig = selectedOpts.orig ? $(selectedOpts.orig) : false,
				from = {},
				pos,
				view;

			if (orig && orig.length) {
				pos = _get_obj_pos(orig);

				from = {
					width : pos.width + (currentOpts.padding * 2),
					height : pos.height + (currentOpts.padding * 2),
					top	: pos.top - currentOpts.padding - 20,
					left : pos.left - currentOpts.padding - 20
				};

			} else {
				view = _get_viewport();

				from = {
					width : currentOpts.padding * 2,
					height : currentOpts.padding * 2,
					top	: parseInt(view[3] + view[1] * 0.5, 10),
					left : parseInt(view[2] + view[0] * 0.5, 10)
				};
			}

			return from;
		},

		_animate_loading = function() {
			if (!loading.is(':visible')){
				clearInterval(loadingTimer);
				return;
			}

			$('div', loading).css('top', (loadingFrame * -40) + 'px');

			loadingFrame = (loadingFrame + 1) % 12;
		};

	/*
	 * Public methods 
	 */

	$.fn.fancybox = function(options) {
		if (!$(this).length) {
			return this;
		}

		$(this)
			.data('fancybox', $.extend({}, options, ($.metadata ? $(this).metadata() : {})))
			.unbind('click.fb')
			.bind('click.fb', function(e) {
				e.preventDefault();

				if (busy) {
					return;
				}

				busy = true;

				$(this).blur();

				selectedArray = [];
				selectedIndex = 0;

				var rel = $(this).attr('rel') || '';

				if (!rel || rel == '' || rel === 'nofollow') {
					selectedArray.push(this);

				} else {
					selectedArray = $("a[rel=" + rel + "], area[rel=" + rel + "]");
					selectedIndex = selectedArray.index( this );
				}

				_start();

				return;
			});

		return this;
	};

	$.fancybox = function(obj) {
		var opts;

		if (busy) {
			return;
		}

		busy = true;
		opts = typeof arguments[1] !== 'undefined' ? arguments[1] : {};

		selectedArray = [];
		selectedIndex = parseInt(opts.index, 10) || 0;

		if ($.isArray(obj)) {
			for (var i = 0, j = obj.length; i < j; i++) {
				if (typeof obj[i] == 'object') {
					$(obj[i]).data('fancybox', $.extend({}, opts, obj[i]));
				} else {
					obj[i] = $({}).data('fancybox', $.extend({content : obj[i]}, opts));
				}
			}

			selectedArray = jQuery.merge(selectedArray, obj);

		} else {
			if (typeof obj == 'object') {
				$(obj).data('fancybox', $.extend({}, opts, obj));
			} else {
				obj = $({}).data('fancybox', $.extend({content : obj}, opts));
			}

			selectedArray.push(obj);
		}

		if (selectedIndex > selectedArray.length || selectedIndex < 0) {
			selectedIndex = 0;
		}

		_start();
	};

	$.fancybox.showActivity = function() {
		clearInterval(loadingTimer);

		loading.show();
		loadingTimer = setInterval(_animate_loading, 66);
	};

	$.fancybox.hideActivity = function() {
		loading.hide();
	};

	$.fancybox.next = function() {
		return $.fancybox.pos( currentIndex + 1);
	};

	$.fancybox.prev = function() {
		return $.fancybox.pos( currentIndex - 1);
	};

	$.fancybox.pos = function(pos) {
		if (busy) {
			return;
		}

		pos = parseInt(pos);

		selectedArray = currentArray;

		if (pos > -1 && pos < currentArray.length) {
			selectedIndex = pos;
			_start();

		} else if (currentOpts.cyclic && currentArray.length > 1) {
			selectedIndex = pos >= currentArray.length ? 0 : currentArray.length - 1;
			_start();
		}

		return;
	};

	$.fancybox.cancel = function() {
		if (busy) {
			return;
		}

		busy = true;

		$.event.trigger('fancybox-cancel');

		_abort();

		selectedOpts.onCancel(selectedArray, selectedIndex, selectedOpts);

		busy = false;
	};

	// Note: within an iframe use - parent.$.fancybox.close();
	$.fancybox.close = function() {
		if (busy || wrap.is(':hidden')) {
			return;
		}

		busy = true;

		if (currentOpts && false === currentOpts.onCleanup(currentArray, currentIndex, currentOpts)) {
			busy = false;
			return;
		}

		_abort();

		$(close.add( nav_left ).add( nav_right )).hide();

		$(content.add( overlay )).unbind();

		$(window).unbind("resize.fb scroll.fb");
		$(document).unbind('keydown.fb');

		content.find('iframe').attr('src', isIE6 && /^https/i.test(window.location.href || '') ? 'javascript:void(false)' : 'about:blank');

		if (currentOpts.titlePosition !== 'inside') {
			title.empty();
		}

		wrap.stop();

		function _cleanup() {
			overlay.fadeOut('fast');

			title.empty().hide();
			wrap.hide();

			$.event.trigger('fancybox-cleanup');

			content.empty();

			currentOpts.onClosed(currentArray, currentIndex, currentOpts);

			currentArray = selectedOpts	= [];
			currentIndex = selectedIndex = 0;
			currentOpts = selectedOpts	= {};

			busy = false;
		}

		if (currentOpts.transitionOut == 'elastic') {
			start_pos = _get_zoom_from();

			var pos = wrap.position();

			final_pos = {
				top	 : pos.top ,
				left : pos.left,
				width :	wrap.width(),
				height : wrap.height()
			};

			if (currentOpts.opacity) {
				final_pos.opacity = 1;
			}

			title.empty().hide();

			fx.prop = 1;

			$(fx).animate({ prop: 0 }, {
				 duration : currentOpts.speedOut,
				 easing : currentOpts.easingOut,
				 step : _draw,
				 complete : _cleanup
			});

		} else {
			wrap.fadeOut( currentOpts.transitionOut == 'none' ? 0 : currentOpts.speedOut, _cleanup);
		}
	};

	$.fancybox.resize = function() {
		if (overlay.is(':visible')) {
			overlay.css('height', $(document).height());
		}

		$.fancybox.center(true);
	};

	$.fancybox.center = function() {
		var view, align;

		if (busy) {
			return;	
		}

		align = arguments[0] === true ? 1 : 0;
		view = _get_viewport();

		if (!align && (wrap.width() > view[0] || wrap.height() > view[1])) {
			return;	
		}

		wrap
			.stop()
			.animate({
				'top' : parseInt(Math.max(view[3] - 20, view[3] + ((view[1] - content.height() - 40) * 0.5) - currentOpts.padding)),
				'left' : parseInt(Math.max(view[2] - 20, view[2] + ((view[0] - content.width() - 40) * 0.5) - currentOpts.padding))
			}, typeof arguments[0] == 'number' ? arguments[0] : 200);
	};

	$.fancybox.init = function() {
		if ($("#fancybox-wrap").length) {
			return;
		}

		$('body').append(
			tmp	= $('<div id="fancybox-tmp"></div>'),
			loading	= $('<div id="fancybox-loading"><div></div></div>'),
			overlay	= $('<div id="fancybox-overlay"></div>'),
			wrap = $('<div id="fancybox-wrap"></div>')
		);

		outer = $('<div id="fancybox-outer"></div>')
			.append('<div class="fancybox-bg" id="fancybox-bg-n"></div><div class="fancybox-bg" id="fancybox-bg-ne"></div><div class="fancybox-bg" id="fancybox-bg-e"></div><div class="fancybox-bg" id="fancybox-bg-se"></div><div class="fancybox-bg" id="fancybox-bg-s"></div><div class="fancybox-bg" id="fancybox-bg-sw"></div><div class="fancybox-bg" id="fancybox-bg-w"></div><div class="fancybox-bg" id="fancybox-bg-nw"></div>')
			.appendTo( wrap );

		outer.append(
			content = $('<div id="fancybox-content"></div>'),
			close = $('<a id="fancybox-close"></a>'),
			title = $('<div id="fancybox-title"></div>'),

			nav_left = $('<a href="javascript:;" id="fancybox-left"><span class="fancy-ico" id="fancybox-left-ico"></span></a>'),
			nav_right = $('<a href="javascript:;" id="fancybox-right"><span class="fancy-ico" id="fancybox-right-ico"></span></a>')
		);

		close.click($.fancybox.close);
		loading.click($.fancybox.cancel);

		nav_left.click(function(e) {
			e.preventDefault();
			$.fancybox.prev();
		});

		nav_right.click(function(e) {
			e.preventDefault();
			$.fancybox.next();
		});

		if ($.fn.mousewheel) {
			wrap.bind('mousewheel.fb', function(e, delta) {
				if (busy) {
					e.preventDefault();

				} else if ($(e.target).get(0).clientHeight == 0 || $(e.target).get(0).scrollHeight === $(e.target).get(0).clientHeight) {
					e.preventDefault();
					$.fancybox[ delta > 0 ? 'prev' : 'next']();
				}
			});
		}

		if (!$.support.opacity) {
			wrap.addClass('fancybox-ie');
		}

		if (isIE6) {
			loading.addClass('fancybox-ie6');
			wrap.addClass('fancybox-ie6');

			$('<iframe id="fancybox-hide-sel-frame" src="' + (/^https/i.test(window.location.href || '') ? 'javascript:void(false)' : 'about:blank' ) + '" scrolling="no" border="0" frameborder="0" tabindex="-1"></iframe>').prependTo(outer);
		}
	};

	$.fn.fancybox.defaults = {
		padding : 10,
		margin : 40,
		opacity : false,
		modal : false,
		cyclic : false,
		scrolling : 'auto',	// 'auto', 'yes' or 'no'

		width : 560,
		height : 340,

		autoScale : true,
		autoDimensions : true,
		centerOnScroll : false,

		ajax : {},
		swf : { wmode: 'transparent' },

		hideOnOverlayClick : true,
		hideOnContentClick : false,

		overlayShow : true,
		overlayOpacity : 0.7,
		overlayColor : '#777',

		titleShow : true,
		titlePosition : 'float', // 'float', 'outside', 'inside' or 'over'
		titleFormat : null,
		titleFromAlt : false,

		transitionIn : 'fade', // 'elastic', 'fade' or 'none'
		transitionOut : 'fade', // 'elastic', 'fade' or 'none'

		speedIn : 300,
		speedOut : 300,

		changeSpeed : 300,
		changeFade : 'fast',

		easingIn : 'swing',
		easingOut : 'swing',

		showCloseButton	 : true,
		showNavArrows : true,
		enableEscapeButton : true,
		enableKeyboardNav : true,

		onStart : function(){},
		onCancel : function(){},
		onComplete : function(){},
		onCleanup : function(){},
		onClosed : function(){},
		onError : function(){}
	};

	$(document).ready(function() {
		$.fancybox.init();
	});

})(jQuery);

// fixed menu
;(function($) {
	var ElleHeader = function(element, options) {
		var elem = $(element),
		    obj = this,
			wdw = $(window),
			headerTop;
			
		// set header position
		function _headerPosition() {
			var wdwTop = wdw.scrollTop();
			if(wdwTop > headerTop) {
				elem.addClass('fixed');
			} else {
				elem.removeClass('fixed');
			}
		};
		
		// dtor
		obj.destroy = function() {
			wdw.off('scroll.elleheader');
			elem.removeClass('fixed');
			elem.removeData('elleHeader');
		};
		
		// ctor
		obj.initialize = function() {
			headerTop = elem.offset().top;
			wdw.on('scroll.elleheader', function() {
				_headerPosition();
			});
		}();
	};
	$.fn.elleHeader = function(options) {
		return this.each(function() {
			var element = $(this);
			if (element.data('elleHeader')) return;
			var elleHeader = new ElleHeader(this, options);
			element.data('elleHeader', elleHeader);
		});
	};
})(jQuery);

// open/close
;(function($) {
	var ElleToggle = function(element, options) {
		var elem = $(element),
		    obj = this,
			opener, slide,
		    settings = $.extend({
				speed: 200,
				link: 'a',
				slide: 'div.slide',
				ease: 'swing',
				open: 'open'
			}, options || {});
			
		// dtor
		obj.destroy = function() {
			if(opener) opener.off('click.elletoggle');
			elem.removeData('elleToggle');
		};
		
		// ctor
		obj.initialize = function() {
			opener = $(settings.link, elem);
			slide = $(settings.slide, elem);
			opener.on('click.elletoggle', function() {
				if(elem.hasClass(settings.open)) {
					elem.removeClass(settings.open);
					slide.slideUp(settings.speed, settings.ease);
				} else {
					elem.addClass(settings.open);
					slide.slideDown(settings.speed, settings.ease);
				}
				return false;
			});
		}();
	};
	$.fn.elleToggle = function(options) {
		return this.each(function() {
			var element = $(this);
			if (element.data('elleToggle')) return;
			var elleToggle = new ElleToggle(this, options);
			element.data('elleToggle', elleToggle);
		});
	};
})(jQuery);

// custom selects
;(function($) {
	var CustomSelect = function(element, options) {
		var elem = $(element),
		    obj = this,
			customSelect, customOptions,
			wdw = $(window),
			dcm = $(document),
			bdy = $('body'),
		    settings = $.extend({
				customizedClass : 'customizedElement',
				selectOptionHTML : '<div><ul>{list}</ul></div>',
				selectOptionItem : '<li><a href="#" data-value="{value}">{text}</a></li>',
				selectClass : 'customSelect',
				selectDisabledClass : 'disabled-select',
				optionsClass : 'customOptions',
				optionsHiddenClass : 'customOptionsHidden',
				selectActiveClass : 'customSelectActive',
				height: false,
				flexible: false,
				selectImplemented : false
			}, options || {});
			
		elem.options = $('option', elem),
			
		// @private
		// console log
		function _echo(mssg) {
			if(typeof window.console !== 'undefined') console.log(mssg);
		};
			
		// @private
		// hide custom select dropdown
		function _hideOptions() {
			customOptions.addClass(settings.optionsHiddenClass);
			customSelect.removeClass(settings.selectActiveClass);
		}
		
		// @private
		// show custom select dropdown
		function _showOptions() {
			$('div.' + settings.optionsClass).addClass(settings.optionsHiddenClass);
			var selectHeight = settings.height ? settings.height : customSelect.height();
			customOptions
				.css({
					left: customSelect.offset().left,
					top: customSelect.offset().top + selectHeight,
					width: customSelect.width()
				})
				.removeClass(settings.optionsHiddenClass);
			customSelect.addClass(settings.selectActiveClass);
		};
		
		// @private
		// template render
		function _tpl(obj, tpl) {
			return obj.replace(/{([^{}]*)}/g, function(a, b) {
				var r = tpl[b];
				return typeof r === 'string' || typeof r === 'number' ? r : a;
			});
		}
		
		// @public
		// update custom select options html
		obj.render = function(obj) {
			customOptions.remove();
			var customOptionsHTML = {
				list: ''
			};
			elem.options = $('option', elem);
			elem.options.each(function() {
				var optionData = {
					value: $(this).attr('value'),
					text: $(this).text()
				};
				customOptionsHTML.list += _tpl(settings.selectOptionItem, optionData);
			});
			customOptions = $( _tpl(settings.selectOptionHTML, customOptionsHTML) ).addClass(settings.optionsClass);
			bdy.append(customOptions);
			customOptions.addClass(settings.optionsHiddenClass);
			$('a', customOptions).on('click', function() {
				var customOptionsLink = $(this),
				    currentValue = elem.val();
					
				elem.customSelectText.text( customOptionsLink.text() );
				
				elem.options.each(function() {
					if( customOptionsLink.attr('data-value') !== $(this).attr('value') ) {
						$(this).attr('selected', false);
					} else {
						$(this).attr('selected', 'selected');
					}
				});
				
				if(currentValue !== elem.val())
					elem.trigger('change');
					
				_hideOptions();
				return false;
			});
			$('div.bg-select-center', customSelect).text( elem.options.filter(':selected').length ? elem.options.filter(':selected').text() : elem.options.eq(0).text() );
		};
			
		// @public
		// dtor
		obj.destroy = function() {
			dcm.off('click.urselect');
			wdw.off('resize.urselect');
			wdw.off('scroll.urselect');
			
			elem.removeClass(settings.customizedClass);
			customSelect
				.off('click.urselect')
				.remove();
			customOptions.remove();
			elem.removeData('customSelect');
		};
		
		// @public
		// ctor
		obj.initialize = function() {
			// select
			var customSelectText = elem.options.filter(':selected').length ? elem.options.filter(':selected').text() : elem.options.eq(0).text();
			customSelect = $('<div class="' + settings.selectClass + '">\
				<div class="bg-select-left"></div>\
				<div class="disabled"></div>\
				<div class="bg-select-center">' + customSelectText + '</div>\
				<a href="javascript:void(0);"></a>\
			</div>').css({
				width: settings.flexible ? '100%' : 'auto'
			});
			customSelect.insertAfter(elem);
			elem.customSelectText = $('div.bg-select-center', customSelect);
			
			// options
			var customOptionsHTML = {
				list: ''
			};
			elem.options = $('option', elem);
			elem.options.each(function() {
				var optionData = {
					value: $(this).attr('value'),
					text: $(this).text()
				};
				customOptionsHTML.list += _tpl(settings.selectOptionItem, optionData);
			});
			customOptions = $( _tpl(settings.selectOptionHTML, customOptionsHTML) ).addClass(settings.optionsClass);
			bdy.append(customOptions);
			customOptions.addClass(settings.optionsHiddenClass);
			$('a', customOptions).on('click', function() {
				var customOptionsLink = $(this),
				    currentValue = elem.val();
					
				elem.customSelectText.text( customOptionsLink.text() );
				
				elem.options.each(function() {
					if( customOptionsLink.attr('data-value') !== $(this).attr('value') ) {
						$(this).attr('selected', false);
					} else {
						$(this).attr('selected', 'selected');
					}
				});
				
				if(currentValue !== elem.val())
					elem.trigger('change');
					
				_hideOptions();
				return false;
			});
			
			// click custom select
			customSelect.on('click.urselect', function() {
				if( customSelect.hasClass(settings.selectActiveClass) ) {
					_hideOptions();
				} else {
					_showOptions();
				}
			});
			
			// hide options causes
			wdw
				.on('resize.urselect', function() {
					if( customSelect.hasClass(settings.selectActiveClass) )
						_hideOptions();
				})
				.on('scroll.urselect', function() {
					if( customSelect.hasClass(settings.selectActiveClass) )
						_hideOptions();
				});
				
			dcm.on('click.urselect', function(e) {
				var _target = $(e.target);
				if(_target.parents('div.' + settings.selectActiveClass).length) {
					_target = _target.closest('div.' + settings.selectActiveClass);
				}
				if(!_target.hasClass(settings.selectActiveClass)) {
					_hideOptions();
				}
			});
			
			// done
			elem.addClass(settings.customizedClass);
			if(settings.selectImplemented) settings.selectImplemented.apply(obj);
		}();
	};
	$.fn.customSelect = function(options) {
		return this.each(function() {
			var element = $(this);
			if (element.data('customSelect')) return;
			var customSelect = new CustomSelect(this, options);
			element.data('customSelect', customSelect);
		});
	};
})(jQuery);

// fixed widget
;(function($) {
	var FixedWidget = function(element, options) {
		var elem = $(element),
		    obj = this,
			wdw = $(window),
		    settings = $.extend({
				pinClass: 'fixed',
				overClass: 'bottom',
				topOffset: 0,
				wrapper: '.wrapper'
			}, options || {});
		
		// @private
		// console log
		function _echo(mssg) {
			if(typeof window.console !== 'undefined') console.log(mssg);
		};
		
		// #private
		// place widget
		function _placeWidget() {
			var scrollTop = wdw.scrollTop();
			if( scrollTop < (elem.offMin - settings.topOffset) ) {
				elem.removeClass(settings.overClass);
				elem.removeClass(settings.pinClass);
			} else if( scrollTop > elem.offMax - settings.topOffset ) {
				elem.addClass(settings.overClass);
				elem.removeClass(settings.pinClass);
			} else {
				elem.removeClass(settings.overClass);
				elem.addClass(settings.pinClass);
			}
		}
			
		// @public
		// dtor
		obj.destroy = function() {
			wdw.off('scroll.fixedwidget');
			elem
				.removeClass(settings.pinClass)
				.removeClass(settings.overClass)
				.removeData('fixedWidget');
		};
		
		// @public
		// ctor
		obj.initialize = function() {
			elem.offMin = parseInt(elem.offset().top, 10);
			var _elemWrap = elem.closest(settings.wrapper),
			    _elemWrapOff = parseInt(_elemWrap.offset().top, 10);
			if(_elemWrap.length) {
				elem.offMax = _elemWrapOff + _elemWrap.innerHeight() - elem.outerHeight();
			} else {
				_echo('[Wrapper for fixedWidget is not defined]');
				return;
			}
			
			elem.addClass(settings.pinClass);
			
			_placeWidget();
			wdw.on('scroll.fixedwidget', function() {
				_placeWidget();
			});
		}();
	};
	$.fn.fixedWidget = function(options) {
		return this.each(function() {
			var element = $(this);
			if (element.data('fixedWidget')) return;
			var fixedWidget = new FixedWidget(this, options);
			element.data('fixedWidget', fixedWidget);
		});
	};
})(jQuery);

// carousel
;(function($) {
	var ElleCarousel = function(element, options) {
		var elem = $(element),
		    obj = this,
			currentSlide, slicer, node, panel, nodeBefore, nodeAfter, item, itemLength, itemWidth, num, btnLeft, btnRight, visibleItems, step,
			tick = false,
			animated = false,
			settings = $.extend({
				speed: 200,
				num: false,
				left: 'a.btn-prev',
				right: 'a.btn-next',
				auto: false,
				fade: false,
				ease: 'linear',
				slicer: 'div.slicer',
				node: 'div.node',
				item: 'div.item',
				current: 'current',
				step: 1,
				link: false
			}, options || {});
			
		// @private
		// reset numbers
		function _numReset() {
			if(settings.num) {
				num.removeClass(settings.current);
				num.eq(currentSlide).addClass(settings.current);
			}
		}
		
		// @private
		// move to next element
		function _moveNext() {
			if(currentSlide < itemLength - visibleItems)
				currentSlide++;
			else
				currentSlide = 0;
				
			obj.slide(true);
		}
			
		// @public
		// slide
		obj.slide = function(direction) {
			num.removeClass(settings.current);
			panel.stop();
			if(settings.fade) {
				panel.animate({
					opacity: settings.fade
				}, {
					duration: settings.speed / 2,
					easing: settings.ease,
					complete: function() {
						panel.animate({
							opacity: 1
						}, {
							duration: settings.speed / 2,
							easing: settings.ease
						});
					}
				});
			}
			var _direction = (direction) ? '-=' : '+=';
			panel.animate({
				left: _direction + itemWidth * step
			}, {
				duration: settings.speed,
				easing: settings.ease,
				complete: function() {
					if(settings.link) {
						$(settings.link, elem).attr({
							href: $('a', item.eq(currentSlide)).attr('href')
						});
					}
					_numReset();
					var panelLeft = parseInt(panel.css('left'), 10);
					if( panelLeft <= -2 * itemWidth * itemLength ) {
						panel.css({
							left: '+=' + itemWidth * itemLength
						});
					}
					if( panelLeft >= 0) {
						panel.css({
							//left: - currentSlide * itemWidth - itemWidth * itemLength,
							left: '-=' + itemWidth * itemLength
						});
					}
					animated = false;
				}
			});
		};
		
		// @public
		// reset
		obj.reset = function() {
			item =  $(settings.item, node);
			itemWidth = item.eq(0).width();
			itemLength = item.length;
			currentSlide = 0;
			_numReset();
			panel.css({
				width: itemWidth * itemLength * 3,
				left: - currentSlide * itemWidth - itemWidth * itemLength
			});
		};
		
		// @public
		// dtor
		obj.destroy = function() {
			btnLeft.off('click.carousel');
			btnRight.off('click.carousel');
			num.off('click.carousel');
			elem.removeData('elleCarousel');
			panel
				.css({
					width: 'auto',
					left: 0
				})
				.attr('class', false);
			nodeBefore.remove();
			nodeAfter.remove();
		};
		
		// @public
		// ctor
		obj.initialize = function() {
			btnLeft = $(settings.left, elem);
			btnRight = $(settings.right, elem);
			num = $(settings.num, elem);
			slicer = $(settings.slicer, elem);
			node =  $(settings.node, slicer);
			step = settings.step;
			
			node.wrap('<div class="slide-carousel-panel"></div>');
			panel = $('div.slide-carousel-panel', elem);
			nodeBefore = node.clone(true).insertBefore(node);
			nodeAfter = node.clone(true).insertAfter(node);
			
			item =  $(settings.item, node);
			itemWidth = item.eq(0).outerWidth();
			itemLength = item.length;
			visibleItems = Math.round( slicer.width() / itemWidth );
			
			currentSlide = num.index( num.filter('.' + settings.current) );
			if(currentSlide < 0)
				currentSlide = 0;
			_numReset();
			
			panel.css({
				position: 'relative',
				left: - currentSlide * itemWidth - itemWidth * itemLength,
				width: itemWidth * itemLength * 3
			});
			
			if(settings.link) {
				$(settings.link, elem).attr({
					href: $('a', item.eq(currentSlide)).attr('href')
				});
			}
			
			// click '<'
			btnLeft.on('click.carousel', function() {
				if(!animated) {
					animated = true;
					if(currentSlide > 0)
						currentSlide--;
					else
						currentSlide = itemLength - 1;
						
					obj.slide(false);
				}
				return false;
			});
			
			// click '>'
			btnRight.on('click.carousel', function() {
				if(!animated) {
					animated = true;
					_moveNext();
				}
				return false;
			});
			
			// click number
			num.on('click.carousel', function() {
				if(!animated && !$(this).hasClass(settings.current)) {
					animated = true;
					var currentSlidePrev = currentSlide;
					currentSlide = num.index(this);
					obj.slide( (currentSlidePrev < currentSlide) );
				}
				return false;
			});
			
			// autoslide
			if(settings.auto) {
				var autoSlide = settings.auto;
				function sliderAuto() {
					tick = setTimeout(function() {
						if(!animated) {
							animated = true;
							_moveNext();
						}
						sliderAuto();
					}, autoSlide);
				}
				sliderAuto();
				elem
					.mouseenter(function() {
						if(tick) {
							clearTimeout(tick);
							tick = null;
						}
					})
					.mouseleave(function() {
						sliderAuto();
					});
			}
		}();
	};
	$.fn.elleCarousel = function(options) {
		return this.each(function() {
			var element = $(this);
			if (element.data('elleCarousel')) return;
			var elleCarousel = new ElleCarousel(this, options);
			element.data('elleCarousel', elleCarousel);
		});
	};
})(jQuery);

// search
;(function($) {
	var ElleSearch = function(element, options) {
		var elem = $(element),
		    obj = this,
		    field = $(options.field, elem),
			fieldInput = $('input:text', field),
			fieldSubmit = $('input:submit', field),
			popup = $(options.popup, elem),
			popupInput = $('input:text', popup),
			popupSubmit =  $('input:submit', popup),
			popupTimer = false;
			
		// dtor
		obj.destroy = function() {
			fieldInput.off('focus.ellesrc');
			fieldSubmit.off('click.ellesrc');
			popupSubmit
				.off('focus.ellesrc')
				.off('blur.ellesrc')
				.off('click.ellesrc');
			popupInput
				.on('keypress.ellesrc')
				.off('focus.ellesrc')
				.off('blur.ellesrc');
			
			elem.removeData('elleSearch');
		};
		
		// ctor
		obj.initialize = function() {
			fieldInput.on('focus.ellesrc', function() {
				popup.show();
				popupInput.focus();
			});
			
			fieldSubmit.on('click.ellesrc', function() {
				popup.show();
				popupInput.focus();
				return false;
			});
			
			popupInput
				.on('keypress.ellesrc', function(e) {
					if(e.which === 13 && $(this).val() !== '') {
						$(this).closest('form').submit();
					}
				})
				.on('focus.ellesrc', function() {
					if(popupTimer) {
						clearTimeout(popupTimer);
						popupTimer = false;
					}
				})
				.on('blur.ellesrc', function() {
					popupTimer = setTimeout(function() {
						popup.hide();
					}, 150);
				});
			
			popupSubmit
				.on('focus.ellesrc', function() {
					if(popupTimer) {
						clearTimeout(popupTimer);
						popupTimer = false;
					}
				})
				.on('blur.ellesrc', function() {
					popupTimer = setTimeout(function() {
						popup.hide();
					}, 50);
				})
				.on('click.ellesrc', function() {
					$(this).closest('form').submit();
				});
		}();
	};
	$.fn.elleSearch = function(options) {
		return this.each(function() {
			var element = $(this);
			if (element.data('elleSearch')) return;
			var elleSearch = new ElleSearch(this, options);
			element.data('elleSearch', elleSearch);
		});
	};
})(jQuery);

// vote
;(function($) {
	var ElleVote = function(element, options) {
		var elem = $(element),
			button = $(options.button, elem),
			voteUrl = elem.attr(options.urlAttr),
			visual = $(options.visual, elem),
		    obj = this;
			
		// dtor
		obj.destroy = function() {
			button.off('click.ellevote');
			elem.removeData('elleVote');
		};
		
		// ctor
		obj.initialize = function() {
			button.on('click.ellevote', function() {
				if( !elem.hasClass(options.done) ) {
					$.ajax({
						url: voteUrl,
						dataType: 'json',
						data: {
							id: button.index(this)
						},
						success: function(voteResponse) {
							if(voteResponse['error']) {
								alert(voteResponse.error);
							} else {
								visual.each(function(i) {
									$(this).text( voteResponse['result'][i] );
								});
								elem.addClass(options.done);
							}
						}
					});
				}
				return false;
			});
		}();
	};
	$.fn.elleVote = function(options) {
		return this.each(function() {
			var element = $(this);
			if (element.data('elleVote')) return;
			var elleVote = new ElleVote(this, options);
			element.data('elleVote', elleVote);
		});
	};
})(jQuery);

// dual frame pics
;(function($) {
	var ElleDualFrame = function(element, options) {
		var elem = $(element),
			frame = $(options.frame, elem),
			pic = $(options.pic, elem),
			links = $(options.links, elem),
			link = $(options.link, links),
		    obj = this;
			
		// dtor
		obj.destroy = function() {
			links.off('click.elledualframe');
			frame.off('mouseenter.elledualframe');
			elem.off('mouseleave.elledualframe');
			
			elem.removeData('elleDualFrame');
		};
		
		// ctor
		obj.initialize = function() {
			link.on('click.elledualframe', function() {
				var frameIndex = frame.index( $(this).closest(options.frame) );
				if(frameIndex === 0) {
					pic.eq(1).attr('src', $(this).attr('href'));
				} else {
					pic.eq(0).attr('src', $(this).attr('href'));
				}
				return false;
			});
			
			frame.on('mouseenter.elledualframe', function() {
				if( !elem.hasClass('hovered') ) {
					if( frame.index(this) === 0 ) {
						links.eq(1).fadeIn(200);
					} else {
						links.eq(0).fadeIn(200);
					}
					elem.addClass('hovered');
				}
			});
			
			elem.on('mouseleave.elledualframe', function() {
				links.fadeOut(200);
				elem.removeClass('hovered');
			});
		}();
	};
	$.fn.elleDualFrame = function(options) {
		return this.each(function() {
			var element = $(this);
			if (element.data('elleDualFrame')) return;
			var elleDualFrame = new ElleDualFrame(this, options);
			element.data('elleDualFrame', elleDualFrame);
		});
	};
})(jQuery);


// Elle Thumbs Popup
;(function($) {
	var ThumbsPopup = function(element, options) {
		var elem = $(element),
			overlay = $(options.overlay),
			closer = $(options.closer, elem),
			prev = $(options.prev, elem),
			next = $(options.next, elem),
			slicer = $(options.slicer, elem),
			slicerWidth,
			slicerWidthHalf,
			node = $(options.node, slicer),
			panel = $(options.panel, node),
			item = $(options.item, panel),
			itemLen = item.length,
			itemWidth = [],
			mm = 0,
			current = 0,
			animated = false,
		    obj = this;
			
		// reset active
		function _resetActive(index) {
			$('div.frame', node).removeClass('active');
			panel.each(function() {
				$('div.frame', $(this) ).eq(index).addClass('active');
			});
		}
		
		// move left
		function _moveLeft() {
			// main carousel animate
			node.stop();
				
			var stepWidth = itemWidth[current]/2;
			
			if (current > 0) {
				current--;
			} else {
				current = itemLen-1;
			}
			
			if (parseInt(node.css('left'), 10) > -mm) {
				node.css({
					left: '-=' + mm
				});
			}
			
			stepWidth += itemWidth[current]/2;
			
			node.animate({
				left: '+=' + stepWidth
			}, {
				duration: options.speed,
				complete: function() {
					_resetActive(current);
					animated = false;
				}
			});
		}
		
		// move right
		function _moveRight() {
			// main carousel animate
			node.stop();
				
			var stepWidth = itemWidth[current]/2;
			
			if (current < itemLen-1) {
				current++;
			} else {
				current = 0;
			}
			
			if (parseInt(node.css('left'), 10) < -2*mm) {
				node.css({
					left: '+=' + mm
				});
			}
			
			stepWidth += itemWidth[current]/2;
			
			node.animate({
				left: '-=' + stepWidth
			}, {
				duration: options.speed,
				complete: function() {
					_resetActive(current);
					animated = false;
				}
			});
		}
		
		// set node position
		function _nodePos() {
			var _itw = 0;
			for (var i=0; i<current; i++) {
				_itw += itemWidth[i];
			}
			_itw += itemWidth[current]/2;
			node.css({
				left: -mm + slicerWidthHalf - _itw
			});
		}
			
		// show
		obj.show = function() {
			overlay.fadeIn(options.speed/2, function() {
				elem.fadeIn(options.speed/2);
			});
		};
		
		// hide
		obj.hide = function() {
			elem.fadeOut(options.speed/2, function() {
				overlay.fadeOut(options.speed/2);
			});
		};
		
		// set active slide
		obj.set = function(index) {
			if (index <= itemLen-1) {
				current = index;
				_nodePos();
				_resetActive(current);
			}
		};
		
		// dtor
		obj.destroy = function() {
			overlay.off('click.thp');
			closer.off('click.thp');
			prev.off('click.thp');
			next.off('click.thp');
			$(window).off('resize.thp');
			
			elem.removeData('thumbsPopup');
		};
		
		// ctor
		obj.initialize = function() {
			elem.show();
			
			slicerWidth = slicer.width();
			slicerWidthHalf = slicerWidth/2;
			
			item.each(function() {
				var _iW = $(this).outerWidth() + 10;
				itemWidth.push( _iW );
				mm += _iW;
			});
			elem.hide();
			
			if (mm <= slicerWidth) {
				prev.hide();
				next.hide();
			} else {
				_nodePos();
			}
			
			var panelBefore = panel.clone(true).insertBefore(panel),
			    panelAfter = panel.clone(true).insertAfter(panel);
			
			panel = $(options.panel, node);
			node.css('width', 4*mm);
			
			_resetActive(current);
			
			$(window).on('resize.thp', function() {
				slicerWidth = slicer.width();
				slicerWidthHalf = slicerWidth/2;
				_nodePos();
			});
			
			prev.on('click.thp', function() {
				if (animated) {
					return false;
				}
				animated = true;
				
				_moveLeft();
				
				return false;
			});
			
			next.on('click.thp', function() {
				if (animated) {
					return false;
				}
				animated = true;
				
				_moveRight();
				
				return false;
			});
			
			// close popup
			overlay.on('click.thp', function() {
				obj.hide();
			});
			closer.on('click.thp', function() {
				obj.hide();
				return false;
			});
		}();
	};
	$.fn.thumbsPopup = function(options) {
		return this.each(function() {
			var element = $(this);
			if (element.data('thumbsPopup')) return;
			var thumbsPopup = new ThumbsPopup(this, options);
			element.data('thumbsPopup', thumbsPopup);
		});
	};
})(jQuery);

// Elle Thumbs Slider
;(function($) {
	var ThumbsSlide = function(element, options) {
		var elem = $(element),
			opener = $(options.opener, elem),
			closer = $(options.closer, elem),
			thumbs = $(options.thumbs, elem),
			toggleSpeed = options.toggleSpeed || 200,
		    obj = this;
			
		// dtor
		obj.destroy = function() {
			opener.off('click.thumbslide');
			closer.off('click.thumbslide');
			
			elem.removeData('thumbsSlide');
		};
		
		function _popupClose() {
			thumbsPopupApi.hide();
		}
		
		// ctor
		obj.initialize = function() {
			// reset thumbs
			if (elem.hasClass(options.openClass)) {
				thumbs.show();
			}
			
			// click big photo -> open popup
			$('a.image-left-holder', elem).on('click.thumbslide', function() {
				var _index = $('a.image-left-holder', elem).index(this);
				if(typeof thumbsPopupApi !== 'undefined') {
					if (_index>-1) {
						thumbsPopupApi.set(_index);
					}
					thumbsPopupApi.show();
				}
				return false;
			});
			
			// open thumbs
			opener.on('click.thumbslide', function() {
				if (elem.hasClass(options.openClass)) {
					thumbs.slideUp(toggleSpeed, function() {
						elem.removeClass(options.openClass)
					});
				} else {
					elem.addClass(options.openClass);
					thumbs.slideDown(toggleSpeed);
				}
				
				return false;
			});
			
			// close thumbs
			closer.on('click.thumbslide', function() {
				thumbs.slideUp(toggleSpeed, function() {
					elem.removeClass(options.openClass)
				});
				
				return false;
			});
			
			// click thumb -> open popup
			$('a', thumbs).on('click.thumbslide', function() {
				var _index = $('a', thumbs).index(this);
				if(typeof thumbsPopupApi !== 'undefined') {
					if (_index>-1) {
						thumbsPopupApi.set(_index);
					}
					thumbsPopupApi.show();
				}
				return false;
			});
		}();
	};
	$.fn.thumbsSlide = function(options) {
		return this.each(function() {
			var element = $(this);
			if (element.data('thumbsSlide')) return;
			var thumbsSlide = new ThumbsSlide(this, options);
			element.data('thumbsSlide', thumbsSlide);
		});
	};
})(jQuery);

// carousel
;(function($) {
	var CarousElle = function(element, options) {
		var elem = $(element),
			numb = $(options.numb, elem),
			main = $(options.main, elem),
			prev = $(options.prev, main),
			next = $(options.next, main),
			slicer = $(options.slicer, main),
			slicerWidth = slicer.width(),
			slicerWidthHalf = slicerWidth/2,
			node = $(options.node, slicer),
			panel = $(options.panel, node),
			item = $(options.item, panel),
			itemCurrent = 0,
			mm = 0,
			itemLen = item.length,
			itemWidth = [],
			animated = false,
			
			thumbs = $(options.thumbs, elem),
			thumbsPrev = $(options.thumbsPrev, thumbs),
			thumbsNext = $(options.thumbsNext, thumbs),
			thumbsSlicer = $(options.thumbsSlicer, thumbs),
			thumbsSlicerWidth = thumbsSlicer.width(),
			thumbsSlicerWidthHalf = thumbsSlicerWidth/2,
			thumbsNode = $(options.thumbsNode, thumbsSlicer),
			thumbsPanel = $(options.thumbsPanel, thumbsNode),
			thumbsItem = $(options.thumbsItem, thumbsPanel),
			thumbsMM = 0,
			thumbsItemLen = thumbsItem.length,
			thumbsItemWidth = [],
			thumbsAnimated = false,
		    obj = this;
			
		// reset active
		function _resetActive() {
			$('div.frame', node).removeClass('active');
			$('div.frame', thumbsNode).removeClass('active');
			panel.each(function() {
				$('div.frame', $(this) ).eq(itemCurrent).addClass('active');
			});
			thumbsPanel.each(function() {
				$('div.frame', $(this) ).eq(itemCurrent).addClass('active');
			});
			numb.text( (itemCurrent+1) + '/' + itemLen );
		}
		
		// move left
		function _moveLeft() {
			// main carousel animate
			node.stop();
				
			var stepWidth = itemWidth[itemCurrent]/2,
			    thumbsStepWidth = thumbsItemWidth[itemCurrent]/2;
			
			if (itemCurrent > 0) {
				itemCurrent--;
			} else {
				itemCurrent = itemLen-1;
			}
			
			if (parseInt(node.css('left'), 10) > -mm) {
				node.css({
					left: '-=' + mm
				});
			}
			
			stepWidth += itemWidth[itemCurrent]/2;
			thumbsStepWidth += thumbsItemWidth[itemCurrent]/2;
			
			node.animate({
				left: '+=' + stepWidth
			}, {
				duration: options.slideSpeed,
				complete: function() {
					_resetActive();
					animated = false;
				}
			});
			
			// thumbs animate
			thumbsNode.stop();
			
			if (parseInt(thumbsNode.css('left'), 10) > -thumbsMM) {
				thumbsNode.css({
					left: '-=' + thumbsMM
				});
			}
			
			thumbsNode.animate({
				left: '+=' + thumbsStepWidth
			}, {
				duration: options.slideSpeed
			});
		}
		
		// move right
		function _moveRight() {
			// main carousel animate
			node.stop();
				
			var stepWidth = itemWidth[itemCurrent]/2,
			    thumbsStepWidth = thumbsItemWidth[itemCurrent]/2;
			
			if (itemCurrent < itemLen-1) {
				itemCurrent++;
			} else {
				itemCurrent = 0;
			}
			
			if (parseInt(node.css('left'), 10) < -2*mm) {
				node.css({
					left: '+=' + mm
				});
			}
			
			stepWidth += itemWidth[itemCurrent]/2;
			thumbsStepWidth += thumbsItemWidth[itemCurrent]/2;
			
			node.animate({
				left: '-=' + stepWidth
			}, {
				duration: options.slideSpeed,
				complete: function() {
					_resetActive();
					animated = false;
				}
			});
			
			// thumbs animate
			thumbsNode.stop();
			
			if (parseInt(thumbsNode.css('left'), 10) < -2*thumbsMM) {
				thumbsNode.css({
					left: '+=' + thumbsMM
				});
			}
			
			thumbsNode.animate({
				left: '-=' + thumbsStepWidth
			}, {
				duration: options.slideSpeed
			});
		}
			
		// dtor
		obj.destroy = function() {
			panelBefore.remove();
			panelAfter.remove();
			prev.off('click.carouselle');
			next.off('click.carouselle');
			$('a', panel).off('click.carouselle');
			
			thumbsPanelBefore.remove();
			thumbsPanelAfter.remove();
			thumbsPrev.off('click.carouselle');
			thumbsNext.off('click.carouselle');
			$('a', thumbsPanel).off('click.carouselle');
			
			elem.removeData('carousElle');
		};
		
		// ctor
		obj.initialize = function() {
			item.each(function() {
				var _iW = $(this).outerWidth();
				itemWidth.push( _iW );
				mm += _iW;
			});
			
			thumbsItem.each(function() {
				var _iW = $(this).outerWidth();
				thumbsItemWidth.push( _iW );
				thumbsMM += _iW;
			});
			
			if (mm <= slicerWidth) {
				prev.hide();
				next.hide();
			} else {
				node.css({
					left: -mm + slicerWidthHalf - itemWidth[itemCurrent]/2
				});
			}
			
			if (thumbsMM <= thumbsSlicerWidth) {
				thumbsPrev.hide();
				thumbsNext.hide();
			} else {
				thumbsNode.css({
					left: -thumbsMM + thumbsSlicerWidthHalf - thumbsItemWidth[itemCurrent]/2
				});
			}
			
			var panelBefore = panel.clone(true).insertBefore(panel),
			    panelAfter = panel.clone(true).insertAfter(panel);
			
			panel = $(options.panel, node);
			node.css('width', 3*mm);
			
			var thumbsPanelBefore = thumbsPanel.clone(true).insertBefore(thumbsPanel),
			    thumbsPanelAfter = thumbsPanel.clone(true).insertAfter(thumbsPanel);
			
			thumbsPanel = $(options.thumbsPanel, thumbsNode);
			thumbsNode.css('width', 3*thumbsMM);
			
			_resetActive();
			
			prev.on('click.carouselle', function() {
				if (animated) {
					return false;
				}
				animated = true;
				
				_moveLeft();
				
				return false;
			});
			
			next.on('click.carouselle', function() {
				if (animated) {
					return false;
				}
				animated = true;
				
				_moveRight();
				
				return false;
			});
			
			$('a', panel).on('click.carouselle', function() {
				var _index = $(this).closest('div.panel').find('a').index(this);
				// call gallery popup
				if(typeof thumbsPopupApi !== 'undefined') {
					thumbsPopupApi.set(_index);
					thumbsPopupApi.show();
				}
				return false;
			});
			
			// thumbs
			thumbsPrev.on('click.carouselle', function() {
				if (animated) {
					return false;
				}
				animated = true;
				
				_moveLeft();
				
				return false;
			});
			
			thumbsNext.on('click.carouselle', function() {
				if (animated) {
					return false;
				}
				animated = true;
				
				_moveRight();
				
				return false;
			});
			
			$('a', thumbsPanel).on('click.carouselle', function() {
				var _index = $(this).closest('div.panel').find('a').index(this);
				// call gallery popup
				if(typeof thumbsPopupApi !== 'undefined') {
					thumbsPopupApi.set(_index);
					thumbsPopupApi.show();
				}
				return false;
			});
		}();
	};
	$.fn.carousElle = function(options) {
		return this.each(function() {
			var element = $(this);
			if (element.data('carousElle')) return;
			var carousElle = new CarousElle(this, options);
			element.data('carousElle', carousElle);
		});
	};
})(jQuery);
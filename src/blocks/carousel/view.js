( function () {
	const BLOCK_SELECTOR =
		".wp-block-lumen-carousel[data-lumen-component='carousel']";

	const toBoolean = ( value, fallback = false ) => {
		if ( value === 'true' || value === '1' ) {
			return true;
		}
		if ( value === 'false' || value === '0' ) {
			return false;
		}
		return fallback;
	};

	const toInteger = ( value, fallback = 0 ) => {
		const parsed = parseInt( String( value ), 10 );
		return Number.isNaN( parsed ) ? fallback : parsed;
	};

	const markError = ( root, reason ) => {
		root.dataset.lumenCarouselReady = 'error';
		if ( reason ) {
			root.dataset.lumenCarouselError = reason;
		}
	};

	const clearError = ( root ) => {
		delete root.dataset.lumenCarouselError;
	};

	const emit = ( node, type, detail, cancelable = false ) =>
		node.dispatchEvent(
			new CustomEvent( type, {
				bubbles: true,
				cancelable,
				detail,
			} )
		);

	const applyVisuallyHiddenStyle = ( node ) => {
		node.style.position = 'absolute';
		node.style.width = '1px';
		node.style.height = '1px';
		node.style.margin = '-1px';
		node.style.border = '0';
		node.style.padding = '0';
		node.style.whiteSpace = 'nowrap';
		node.style.clipPath = 'inset(50%)';
		node.style.clip = 'rect(0 0 0 0)';
		node.style.overflow = 'hidden';
	};

	const createLiveRegion = ( doc, rootId ) => {
		const region = doc.createElement( 'div' );
		region.id = `${ rootId }-announcer`;
		region.setAttribute( 'aria-live', 'polite' );
		region.setAttribute( 'aria-atomic', 'true' );
		region.dataset.lumenCarouselAnnouncer = rootId;
		applyVisuallyHiddenStyle( region );
		doc.body.appendChild( region );
		return region;
	};

	const announce = ( liveRegion, message ) => {
		if ( ! liveRegion || ! message ) {
			return;
		}

		liveRegion.textContent = '';
		window.requestAnimationFrame( () => {
			liveRegion.textContent = message;
		} );
	};

	const formatTemplate = ( template, replacements ) => {
		let output = String( template || '' );
		replacements.forEach( ( value, index ) => {
			const token = new RegExp( `%${ index + 1 }\\$[sd]`, 'g' );
			output = output.replace( token, String( value ) );
		} );
		return output;
	};

	const ensureIds = ( root, index ) => {
		if ( ! root.id ) {
			root.id = `lumen-carousel-runtime-${ index + 1 }`;
		}

		const controls = root.querySelector( '.lumen-carousel-controls' );
		if ( controls && ! controls.id ) {
			controls.id = `${ root.id }-controls`;
		}
	};

	const initCarousel = ( root ) => {
		if ( root.dataset.lumenCarouselReady === 'true' ) {
			return;
		}

		const slider = root.querySelector( '.my-slider' );
		const controls = root.querySelector( '.lumen-carousel-controls' );
		const prevButton = controls
			? controls.querySelector( '.previous' )
			: null;
		const nextButton = controls ? controls.querySelector( '.next' ) : null;
		const autoButton = controls ? controls.querySelector( '.auto' ) : null;

		if ( ! slider || ! controls || ! prevButton || ! nextButton ) {
			markError( root, 'missing-carousel-refs' );
			return;
		}

		const originalSlides = Array.from( slider.children ).filter(
			( child ) => child.classList.contains( 'slide' )
		);

		if ( ! originalSlides.length ) {
			markError( root, 'missing-carousel-slides' );
			return;
		}

		const mode = root.getAttribute( 'data-mode' ) || 'manual';
		const autoplay =
			toBoolean( root.getAttribute( 'data-autoplay' ), false ) ||
			mode === 'auto';
		const itemsDesktop = Math.max(
			1,
			Math.min(
				4,
				toInteger( root.getAttribute( 'data-items-desktop' ), 2 )
			)
		);
		const reduceMotion =
			window.matchMedia &&
			window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;

		const carouselLabel =
			root.getAttribute( 'data-carousel-label' ) || 'Carousel';
		const slideLabelTemplate =
			root.getAttribute( 'data-slide-label-template' ) ||
			'Slide %1$d of %2$d';
		const navLabel =
			root.getAttribute( 'data-nav-label' ) || 'Carousel pagination';
		const navButtonLabelTemplate =
			root.getAttribute( 'data-nav-button-label-template' ) ||
			'Go to slide page %1$d';
		const startLabel =
			root.getAttribute( 'data-boundary-start-label' ) ||
			'Start of carousel region.';
		const endLabel =
			root.getAttribute( 'data-boundary-end-label' ) ||
			'End of carousel region.';
		const manualAnnouncementTemplate =
			root.getAttribute( 'data-manual-announcement-template' ) ||
			'Slide page %1$d of %2$d';
		const autoplayStartLabel =
			root.getAttribute( 'data-autoplay-start-label' ) || 'Start';
		const autoplayStopLabel =
			root.getAttribute( 'data-autoplay-stop-label' ) || 'Stop';

		root.setAttribute( 'role', 'region' );
		root.setAttribute( 'aria-roledescription', 'carousel' );
		root.setAttribute( 'aria-label', carouselLabel );

		const liveRegion = createLiveRegion( root.ownerDocument, root.id );

		let track = slider.querySelector( '.lumen-carousel-track' );
		if ( ! track ) {
			track = document.createElement( 'div' );
			track.className = 'lumen-carousel-track';

			originalSlides.forEach( ( slide ) => {
				track.appendChild( slide );
			} );

			slider.innerHTML = '';
			slider.appendChild( track );
		}

		const slides = Array.from( track.children );
		slides.forEach( ( slide, index ) => {
			if ( ! slide.id ) {
				slide.id = `${ root.id }-slide-${ index + 1 }`;
			}
			slide.setAttribute( 'role', 'group' );
			slide.setAttribute(
				'aria-label',
				formatTemplate( slideLabelTemplate, [
					index + 1,
					slides.length,
				] )
			);
		} );

		let nav = root.querySelector( '.tns-nav' );
		if ( ! nav ) {
			nav = document.createElement( 'div' );
			nav.className = 'tns-nav';
			controls.insertAdjacentElement( 'beforebegin', nav );
		}
		nav.setAttribute( 'role', 'tablist' );
		nav.setAttribute( 'aria-label', navLabel );

		slider.style.overflow = 'hidden';
		track.style.display = 'flex';
		track.style.willChange = 'transform';
		track.style.transition = 'transform 260ms ease';
		if ( slider.tabIndex < 0 ) {
			slider.tabIndex = -1;
		}

		let currentIndex = 0;
		let itemsPerView = 1;
		let totalPages = 1;
		let autoplayTimer = 0;
		let isAutoplaying = false;
		let resizeTimer = 0;
		let navPageCount = 0;
		let focusWithin = false;

		const getItemsPerView = () => {
			if ( mode === 'gallery' ) {
				return 1;
			}

			if ( window.innerWidth >= 1000 ) {
				return itemsDesktop;
			}
			if ( window.innerWidth >= 800 ) {
				return Math.min( 2, itemsDesktop );
			}
			return 1;
		};

		const getMaxIndex = () => Math.max( 0, slides.length - itemsPerView );
		const getPageSize = () => Math.max( 1, itemsPerView );
		const getActivePage = () =>
			Math.floor( currentIndex / getPageSize() ) + 1;
		const isControlDisabled = ( button ) =>
			button.getAttribute( 'aria-disabled' ) === 'true';

		const setControlDisabled = ( button, disabled ) => {
			button.setAttribute( 'aria-disabled', disabled ? 'true' : 'false' );
			button.classList.toggle( 'is-disabled', disabled );
			if ( button.hasAttribute( 'disabled' ) ) {
				button.removeAttribute( 'disabled' );
			}
		};

		const announceManualSlide = ( source ) => {
			if ( source === 'autoplay' ) {
				return;
			}

			announce(
				liveRegion,
				formatTemplate( manualAnnouncementTemplate, [
					getActivePage(),
					totalPages,
				] )
			);
		};

		const stopAutoplay = () => {
			window.clearInterval( autoplayTimer );
			autoplayTimer = 0;
			isAutoplaying = false;
			if ( autoButton ) {
				autoButton.textContent = autoplayStartLabel;
				autoButton.setAttribute( 'aria-pressed', 'false' );
			}
			emit( root, 'lumen:carousel-autoplay-stop', {
				root,
			} );
		};

		const goToIndex = ( nextIndex, source = 'programmatic' ) => {
			const maxIndex = getMaxIndex();
			const safeIndex = Math.max( 0, Math.min( nextIndex, maxIndex ) );
			if ( safeIndex === currentIndex ) {
				return;
			}

			const detail = {
				root,
				source,
				fromIndex: currentIndex,
				toIndex: safeIndex,
			};

			if ( ! emit( root, 'lumen:carousel-before-slide', detail, true ) ) {
				return;
			}

			currentIndex = safeIndex;
			render();
			announceManualSlide( source );
			emit( root, 'lumen:carousel-after-slide', {
				...detail,
				activePage: getActivePage(),
			} );
		};

		const goToPage = ( page, source = 'programmatic' ) => {
			const safePage = Math.max( 1, Math.min( page, totalPages ) );
			goToIndex( ( safePage - 1 ) * getPageSize(), source );
		};

		const createNav = () => {
			totalPages = Math.max(
				1,
				Math.ceil( slides.length / getPageSize() )
			);

			if ( totalPages <= 1 ) {
				nav.hidden = true;
				nav.innerHTML = '';
				navPageCount = totalPages;
				return;
			}

			nav.hidden = false;
			if ( navPageCount === totalPages ) {
				return;
			}
			navPageCount = totalPages;
			nav.innerHTML = '';

			for ( let page = 1; page <= totalPages; page += 1 ) {
				const button = document.createElement( 'button' );
				button.type = 'button';
				button.setAttribute( 'role', 'tab' );
				button.setAttribute(
					'aria-label',
					formatTemplate( navButtonLabelTemplate, [ page ] )
				);
				button.dataset.page = String( page );
				button.addEventListener( 'click', () => {
					goToPage( page, 'nav' );
				} );
				button.addEventListener( 'keydown', ( event ) => {
					if ( event.key === 'ArrowRight' ) {
						event.preventDefault();
						goToPage( page + 1, 'nav-keyboard' );
					}
					if ( event.key === 'ArrowLeft' ) {
						event.preventDefault();
						goToPage( page - 1, 'nav-keyboard' );
					}
				} );
				nav.appendChild( button );
			}
		};

		const updateNav = () => {
			const activePage = getActivePage();
			Array.from( nav.children ).forEach( ( button, index ) => {
				const isActive = index + 1 === activePage;
				button.classList.toggle( 'tns-nav-active', isActive );
				button.setAttribute(
					'aria-current',
					isActive ? 'true' : 'false'
				);
				button.setAttribute(
					'aria-selected',
					isActive ? 'true' : 'false'
				);
				button.setAttribute( 'tabindex', isActive ? '0' : '-1' );
			} );
		};

		const render = () => {
			itemsPerView = getItemsPerView();
			const maxIndex = getMaxIndex();
			if ( currentIndex > maxIndex ) {
				currentIndex = maxIndex;
			}

			const slideWidth = 100 / itemsPerView;
			slides.forEach( ( slide, index ) => {
				const visible =
					index >= currentIndex &&
					index < currentIndex + itemsPerView;
				slide.style.flex = `0 0 ${ slideWidth }%`;
				slide.setAttribute( 'aria-hidden', visible ? 'false' : 'true' );
				if ( slide.hasAttribute( 'tabindex' ) ) {
					slide.removeAttribute( 'tabindex' );
				}
			} );

			track.style.transform = `translate3d(-${
				currentIndex * slideWidth
			}%, 0, 0)`;

			setControlDisabled( prevButton, currentIndex <= 0 );
			setControlDisabled( nextButton, currentIndex >= maxIndex );

			createNav();
			updateNav();
			root.dataset.lumenCarouselPage = String( getActivePage() );
		};

		const startAutoplay = () => {
			if ( ! autoplay || reduceMotion ) {
				return;
			}

			stopAutoplay();
			isAutoplaying = true;
			if ( autoButton ) {
				autoButton.textContent = autoplayStopLabel;
				autoButton.setAttribute( 'aria-pressed', 'true' );
			}

			autoplayTimer = window.setInterval( () => {
				const step = getPageSize();
				const maxIndex = getMaxIndex();
				const nextIndex = currentIndex + step;
				goToIndex( nextIndex > maxIndex ? 0 : nextIndex, 'autoplay' );
			}, 5000 );
			emit( root, 'lumen:carousel-autoplay-start', {
				root,
			} );
		};

		const pauseAutoplay = () => {
			if ( ! isAutoplaying ) {
				return;
			}
			stopAutoplay();
		};

		const activatePrev = ( source ) => {
			if ( isControlDisabled( prevButton ) ) {
				return;
			}
			goToIndex( currentIndex - getPageSize(), source );
		};

		const activateNext = ( source ) => {
			if ( isControlDisabled( nextButton ) ) {
				return;
			}
			goToIndex( currentIndex + getPageSize(), source );
		};

		const onControlArrowKey = ( event ) => {
			if ( event.key === 'ArrowLeft' ) {
				event.preventDefault();
				activatePrev( 'controls-keyboard' );
				prevButton.focus();
				return;
			}

			if ( event.key === 'ArrowRight' ) {
				event.preventDefault();
				activateNext( 'controls-keyboard' );
				nextButton.focus();
			}
		};

		const onMouseEnter = () => {
			pauseAutoplay();
		};

		const onFocusIn = () => {
			pauseAutoplay();
			if ( ! focusWithin ) {
				focusWithin = true;
				announce( liveRegion, startLabel );
			}
		};

		const onFocusOut = () => {
			window.setTimeout( () => {
				const activeElement = root.ownerDocument
					? root.ownerDocument.activeElement
					: null;

				if ( activeElement && root.contains( activeElement ) ) {
					return;
				}
				if ( focusWithin ) {
					focusWithin = false;
					announce( liveRegion, endLabel );
				}
			}, 0 );
		};

		const onResize = () => {
			window.clearTimeout( resizeTimer );
			resizeTimer = window.setTimeout( () => {
				render();
			}, 120 );
		};

		prevButton.addEventListener( 'click', ( event ) => {
			event.preventDefault();
			activatePrev( 'prev' );
		} );

		nextButton.addEventListener( 'click', ( event ) => {
			event.preventDefault();
			activateNext( 'next' );
		} );

		prevButton.addEventListener( 'keydown', onControlArrowKey );
		nextButton.addEventListener( 'keydown', onControlArrowKey );

		if ( autoButton ) {
			autoButton.setAttribute( 'aria-pressed', 'false' );
			autoButton.textContent = autoplayStartLabel;
			autoButton.addEventListener( 'click', ( event ) => {
				event.preventDefault();
				if ( isAutoplaying ) {
					stopAutoplay();
				} else {
					startAutoplay();
				}
			} );
		}

		root.addEventListener( 'mouseenter', onMouseEnter );
		root.addEventListener( 'focusin', onFocusIn );
		root.addEventListener( 'focusout', onFocusOut );
		window.addEventListener( 'resize', onResize );

		render();
		if ( autoplay ) {
			startAutoplay();
		}

		root.lumenCarousel = {
			next: () => goToIndex( currentIndex + getPageSize(), 'api' ),
			prev: () => goToIndex( currentIndex - getPageSize(), 'api' ),
			goToPage: ( page ) => goToPage( Number( page ), 'api' ),
			startAutoplay,
			stopAutoplay,
			getState: () => ( {
				currentIndex,
				itemsPerView,
				totalPages,
				isAutoplaying,
			} ),
			destroy: () => {
				stopAutoplay();
				window.clearTimeout( resizeTimer );
				window.removeEventListener( 'resize', onResize );
				root.removeEventListener( 'mouseenter', onMouseEnter );
				root.removeEventListener( 'focusin', onFocusIn );
				root.removeEventListener( 'focusout', onFocusOut );
				if ( liveRegion && liveRegion.parentNode ) {
					liveRegion.parentNode.removeChild( liveRegion );
				}
				delete root.lumenCarousel;
			},
		};

		root.dataset.lumenCarouselReady = 'true';
		clearError( root );
	};

	const boot = () => {
		const roots = Array.from( document.querySelectorAll( BLOCK_SELECTOR ) );
		roots.forEach( ( root, index ) => {
			ensureIds( root, index );
			initCarousel( root );
		} );
	};

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', boot );
	} else {
		boot();
	}
} )();

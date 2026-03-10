( function () {
	const BLOCK_SELECTOR =
		".wp-block-lumen-popup[data-lumen-component='popup']";

	const toBoolean = ( value, fallback = false ) => {
		if ( value === 'true' || value === '1' ) {
			return true;
		}
		if ( value === 'false' || value === '0' ) {
			return false;
		}
		return fallback;
	};

	const markError = ( root, reason ) => {
		root.dataset.lumenPopupReady = 'error';
		if ( reason ) {
			root.dataset.lumenPopupError = reason;
		}
	};

	const clearError = ( root ) => {
		delete root.dataset.lumenPopupError;
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
		region.id = `${ rootId }-popup-announcer`;
		region.setAttribute( 'aria-live', 'polite' );
		region.setAttribute( 'aria-atomic', 'true' );
		region.dataset.lumenPopupAnnouncer = rootId;
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

	const getFocusableElements = ( container ) => {
		if ( ! container || ! ( container instanceof window.HTMLElement ) ) {
			return [];
		}

		const selector =
			'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, audio[controls], video[controls], [contenteditable], [tabindex]:not([tabindex="-1"])';

		return Array.from( container.querySelectorAll( selector ) ).filter(
			( node ) =>
				node instanceof window.HTMLElement &&
				node.offsetParent !== null &&
				node.getAttribute( 'aria-hidden' ) !== 'true'
		);
	};

	const setExpandedState = ( root, trigger, expanded ) => {
		root.classList.toggle( 'is-open', expanded );
		if ( trigger ) {
			trigger.setAttribute(
				'aria-expanded',
				expanded ? 'true' : 'false'
			);
		}
	};

	const initPopup = ( root ) => {
		if ( root.dataset.lumenPopupReady === 'true' ) {
			return;
		}

		const trigger = root.querySelector( '.lumen-popup-trigger' );
		const panel = root.querySelector( '.lumen-popup-template' );

		if ( ! trigger || ! panel ) {
			markError( root, 'missing-popup-refs' );
			return;
		}

		if ( ! trigger.id ) {
			trigger.id = `${ root.id }-trigger`;
		}

		if ( ! panel.id ) {
			panel.id = `${ root.id }-panel`;
		}

		const roleLabel =
			root.getAttribute( 'data-popup-role-label' ) || 'Popup';
		const boundaryStartLabel =
			root.getAttribute( 'data-boundary-start-label' ) ||
			'Start of popup.';
		const boundaryEndLabel =
			root.getAttribute( 'data-boundary-end-label' ) || 'End of popup.';
		const isAlert = toBoolean(
			root.getAttribute( 'data-popup-alert' ),
			false
		);

		const liveRegion = createLiveRegion( root.ownerDocument, root.id );

		const title = panel.querySelector( '.lumen-popup-title' );
		const body = panel.querySelector( '.lumen-popup-body' );

		panel.setAttribute( 'role', isAlert ? 'alertdialog' : 'dialog' );
		panel.setAttribute( 'aria-label', roleLabel );
		panel.setAttribute( 'aria-modal', 'false' );
		panel.setAttribute( 'aria-hidden', 'true' );
		if ( title && title.id ) {
			panel.setAttribute( 'aria-labelledby', title.id );
		}
		if ( body && body.id ) {
			panel.setAttribute( 'aria-describedby', body.id );
		}

		let isOpen = false;
		let removeOutsideListener = null;

		const closePopup = ( restoreFocus, source = 'programmatic' ) => {
			if ( ! isOpen ) {
				return;
			}

			const detail = {
				root,
				trigger,
				panel,
				source,
			};

			if ( ! emit( root, 'lumen:popup-before-close', detail, true ) ) {
				return;
			}

			isOpen = false;
			panel.hidden = true;
			panel.setAttribute( 'aria-hidden', 'true' );
			panel.classList.remove( 'lumen-popup-runtime' );
			setExpandedState( root, trigger, false );
			document.removeEventListener( 'keydown', onDocumentKeydown );
			if ( removeOutsideListener ) {
				removeOutsideListener();
				removeOutsideListener = null;
			}
			announce( liveRegion, boundaryEndLabel );

			if (
				restoreFocus &&
				trigger &&
				typeof trigger.focus === 'function'
			) {
				trigger.focus();
			}

			emit( root, 'lumen:popup-after-close', detail );
		};

		const openPopup = ( source = 'programmatic' ) => {
			if ( isOpen ) {
				return;
			}

			const detail = {
				root,
				trigger,
				panel,
				source,
			};
			if ( ! emit( root, 'lumen:popup-before-open', detail, true ) ) {
				return;
			}

			isOpen = true;
			panel.hidden = false;
			panel.setAttribute( 'aria-hidden', 'false' );
			panel.classList.add( 'lumen-popup-runtime' );
			setExpandedState( root, trigger, true );
			document.addEventListener( 'keydown', onDocumentKeydown );

			const onOutsidePointer = ( event ) => {
				if ( ! isOpen ) {
					return;
				}
				if ( root.contains( event.target ) ) {
					return;
				}
				closePopup( false, 'outside' );
			};

			document.addEventListener( 'mousedown', onOutsidePointer );
			document.addEventListener( 'touchstart', onOutsidePointer, {
				passive: true,
			} );
			removeOutsideListener = () => {
				document.removeEventListener( 'mousedown', onOutsidePointer );
				document.removeEventListener( 'touchstart', onOutsidePointer );
			};

			const focusables = getFocusableElements( panel );
			if ( focusables.length > 0 ) {
				focusables[ 0 ].focus();
			}
			announce( liveRegion, boundaryStartLabel );

			emit( root, 'lumen:popup-after-open', detail );
		};

		const onDocumentKeydown = ( event ) => {
			if ( ! isOpen ) {
				return;
			}

			if ( event.key === 'Tab' ) {
				const focusables = getFocusableElements( panel );
				if ( ! focusables.length ) {
					event.preventDefault();
					panel.focus();
					return;
				}

				const first = focusables[ 0 ];
				const last = focusables[ focusables.length - 1 ];
				const active = panel.ownerDocument.activeElement;

				if ( event.shiftKey && active === first ) {
					event.preventDefault();
					last.focus();
					return;
				}

				if ( ! event.shiftKey && active === last ) {
					event.preventDefault();
					first.focus();
				}
				return;
			}

			if ( event.key === 'Escape' ) {
				event.preventDefault();
				closePopup( true, 'escape' );
			}
		};

		trigger.addEventListener( 'click', ( event ) => {
			event.preventDefault();
			if ( isOpen ) {
				closePopup( true, 'trigger' );
				return;
			}
			openPopup( 'trigger' );
		} );

		panel
			.querySelectorAll( '[data-popup-close="true"], .CloseDC' )
			.forEach( ( button ) => {
				button.addEventListener( 'click', ( event ) => {
					event.preventDefault();
					closePopup( true, 'button' );
				} );
			} );

		panel.hidden = true;
		if ( panel.tabIndex < 0 ) {
			panel.tabIndex = -1;
		}
		setExpandedState( root, trigger, false );
		root.lumenPopup = {
			open: () => openPopup( 'api' ),
			close: () => closePopup( true, 'api' ),
			toggle: () => {
				if ( isOpen ) {
					closePopup( true, 'api' );
				} else {
					openPopup( 'api' );
				}
			},
			getState: () => ( { isOpen } ),
			destroy: () => {
				document.removeEventListener( 'keydown', onDocumentKeydown );
				if ( removeOutsideListener ) {
					removeOutsideListener();
					removeOutsideListener = null;
				}
				if ( liveRegion && liveRegion.parentNode ) {
					liveRegion.parentNode.removeChild( liveRegion );
				}
				delete root.lumenPopup;
			},
		};
		root.dataset.lumenPopupReady = 'true';
		clearError( root );
	};

	const boot = () => {
		const roots = Array.from( document.querySelectorAll( BLOCK_SELECTOR ) );
		roots.forEach( ( root, index ) => {
			if ( ! root.id ) {
				root.id = `lumen-popup-runtime-${ index + 1 }`;
			}
			initPopup( root );
		} );
	};

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', boot );
	} else {
		boot();
	}
} )();

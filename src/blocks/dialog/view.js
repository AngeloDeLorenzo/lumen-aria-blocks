( function () {
	const BLOCK_SELECTOR =
		".wp-block-lumen-dialog[data-lumen-component='dialog']";
	const MASK_COUNT_KEY = 'lumenDialogMaskCount';
	const STORED_STATES = new WeakMap();

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
		root.dataset.lumenDialogReady = 'error';
		if ( reason ) {
			root.dataset.lumenDialogError = reason;
		}
	};

	const clearError = ( root ) => {
		delete root.dataset.lumenDialogError;
	};

	const emit = ( node, type, detail, cancelable = false ) =>
		node.dispatchEvent(
			new CustomEvent( type, {
				bubbles: true,
				cancelable,
				detail,
			} )
		);

	const setExpandedState = ( trigger, expanded ) => {
		if ( trigger ) {
			trigger.setAttribute(
				'aria-expanded',
				expanded ? 'true' : 'false'
			);
		}
	};

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
		region.id = `${ rootId }-dialog-announcer`;
		region.setAttribute( 'aria-live', 'polite' );
		region.setAttribute( 'aria-atomic', 'true' );
		region.dataset.lumenDialogAnnouncer = rootId;
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

	const setMaskedState = ( node, shouldMask ) => {
		if ( ! node || ! ( node instanceof window.HTMLElement ) ) {
			return;
		}

		const currentCount = toInteger( node.dataset[ MASK_COUNT_KEY ] || '0' );

		if ( shouldMask ) {
			if ( currentCount === 0 ) {
				STORED_STATES.set( node, {
					ariaHidden: node.getAttribute( 'aria-hidden' ),
					hadInert: node.hasAttribute( 'inert' ),
				} );
			}
			node.dataset[ MASK_COUNT_KEY ] = String( currentCount + 1 );
			node.setAttribute( 'aria-hidden', 'true' );
			node.setAttribute( 'inert', '' );
			return;
		}

		if ( currentCount <= 1 ) {
			delete node.dataset[ MASK_COUNT_KEY ];
			const stored = STORED_STATES.get( node );
			if ( stored && stored.ariaHidden !== null ) {
				node.setAttribute( 'aria-hidden', stored.ariaHidden );
			} else {
				node.removeAttribute( 'aria-hidden' );
			}

			if ( stored && stored.hadInert ) {
				node.setAttribute( 'inert', '' );
			} else {
				node.removeAttribute( 'inert' );
			}

			STORED_STATES.delete( node );
			return;
		}

		node.dataset[ MASK_COUNT_KEY ] = String( currentCount - 1 );
	};

	const toInteger = ( value, fallback = 0 ) => {
		const parsed = parseInt( String( value ), 10 );
		return Number.isNaN( parsed ) ? fallback : parsed;
	};

	const shouldSkipMaskNode = ( candidate, exceptions ) =>
		exceptions.some(
			( exception ) =>
				exception &&
				( candidate === exception ||
					candidate.contains( exception ) ||
					exception.contains( candidate ) )
		);

	const getFocusableElements = ( container ) => {
		const selector =
			'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, audio[controls], video[controls], [contenteditable], [tabindex]:not([tabindex="-1"])';

		return Array.from( container.querySelectorAll( selector ) ).filter(
			( node ) =>
				node instanceof window.HTMLElement &&
				node.offsetParent !== null &&
				node.getAttribute( 'aria-hidden' ) !== 'true'
		);
	};

	const initDialog = ( root ) => {
		if ( root.dataset.lumenDialogReady === 'true' ) {
			return;
		}

		const trigger = root.querySelector( '.lumen-dialog-trigger' );
		const panel = root.querySelector( '.lumen-dialog-template' );

		if ( ! trigger || ! panel ) {
			markError( root, 'missing-dialog-refs' );
			return;
		}

		if ( ! trigger.id ) {
			trigger.id = `${ root.id }-trigger`;
		}

		if ( ! panel.id ) {
			panel.id = `${ root.id }-panel`;
		}

		const isModal = toBoolean( root.getAttribute( 'data-is-modal' ), true );
		const isAlert = toBoolean(
			root.getAttribute( 'data-is-alert' ),
			false
		);
		const closeOnBackdrop = toBoolean(
			root.getAttribute( 'data-close-on-backdrop' ),
			true
		);
		const roleLabel =
			root.getAttribute( 'data-dialog-role-label' ) || 'Dialog';
		const boundaryStartLabel =
			root.getAttribute( 'data-boundary-start-label' ) ||
			'Start of dialog.';
		const boundaryEndLabel =
			root.getAttribute( 'data-boundary-end-label' ) || 'End of dialog.';

		const liveRegion = createLiveRegion( root.ownerDocument, root.id );

		const title = panel.querySelector( '.lumen-dialog-title' );
		const body = panel.querySelector( '.lumen-dialog-body' );

		if ( title && title.id ) {
			panel.setAttribute( 'aria-labelledby', title.id );
		}
		if ( body && body.id ) {
			panel.setAttribute( 'aria-describedby', body.id );
		}

		panel.setAttribute( 'role', isAlert ? 'alertdialog' : 'dialog' );
		panel.setAttribute( 'aria-label', roleLabel );
		panel.setAttribute( 'aria-hidden', 'true' );
		if ( isModal ) {
			panel.setAttribute( 'aria-modal', 'true' );
		} else {
			panel.removeAttribute( 'aria-modal' );
		}

		let isOpen = false;
		let backdrop = null;
		let previousFocus = null;
		let removeOutsideListener = null;
		let originalParent = panel.parentNode;
		let originalNextSibling = panel.nextSibling;
		let maskedNodes = [];

		const applyBackgroundMask = () => {
			if ( ! isModal ) {
				return;
			}
			const exceptions = [ panel, backdrop, liveRegion ];
			maskedNodes = Array.from( document.body.children ).filter(
				( node ) =>
					node instanceof window.HTMLElement &&
					! shouldSkipMaskNode( node, exceptions )
			);
			maskedNodes.forEach( ( node ) => setMaskedState( node, true ) );
		};

		const releaseBackgroundMask = () => {
			maskedNodes.forEach( ( node ) => setMaskedState( node, false ) );
			maskedNodes = [];
		};

		const movePanelToBody = () => {
			const docBody = panel.ownerDocument.body;
			if ( ! docBody || panel.parentNode === docBody ) {
				return;
			}

			originalParent = panel.parentNode;
			originalNextSibling = panel.nextSibling;
			docBody.appendChild( panel );
		};

		const restorePanelToOrigin = () => {
			if ( ! originalParent || panel.parentNode === originalParent ) {
				return;
			}

			if (
				originalNextSibling &&
				originalNextSibling.parentNode === originalParent
			) {
				originalParent.insertBefore( panel, originalNextSibling );
				return;
			}

			originalParent.appendChild( panel );
		};

		const onDocumentKeydown = ( event ) => {
			if ( ! isOpen ) {
				return;
			}

			if ( event.key === 'Escape' ) {
				event.preventDefault();
				closeDialog( true );
				return;
			}

			if ( ! isModal || event.key !== 'Tab' ) {
				return;
			}

			const focusables = getFocusableElements( panel );
			if ( ! focusables.length ) {
				event.preventDefault();
				if ( panel.tabIndex < 0 ) {
					panel.tabIndex = -1;
				}
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
		};

		const bindDocumentEvents = () => {
			document.addEventListener( 'keydown', onDocumentKeydown );
			const onOutsidePointer = ( event ) => {
				if ( ! isOpen ) {
					return;
				}

				if (
					panel.contains( event.target ) ||
					trigger.contains( event.target )
				) {
					return;
				}

				if ( closeOnBackdrop ) {
					closeDialog( false, 'outside' );
				}
			};

			document.addEventListener( 'mousedown', onOutsidePointer );
			document.addEventListener( 'touchstart', onOutsidePointer, {
				passive: true,
			} );
			removeOutsideListener = () => {
				document.removeEventListener( 'mousedown', onOutsidePointer );
				document.removeEventListener( 'touchstart', onOutsidePointer );
			};
		};

		const unbindDocumentEvents = () => {
			document.removeEventListener( 'keydown', onDocumentKeydown );
			if ( removeOutsideListener ) {
				removeOutsideListener();
				removeOutsideListener = null;
			}
		};

		const removeBackdrop = () => {
			if ( backdrop && backdrop.parentNode ) {
				backdrop.parentNode.removeChild( backdrop );
			}
			backdrop = null;
		};

		const closeDialog = ( restoreFocus, source = 'programmatic' ) => {
			if ( ! isOpen ) {
				return;
			}

			const detail = {
				root,
				trigger,
				panel,
				source,
			};
			if ( ! emit( root, 'lumen:dialog-before-close', detail, true ) ) {
				return;
			}

			isOpen = false;
			panel.hidden = true;
			panel.setAttribute( 'aria-hidden', 'true' );
			panel.classList.remove( 'modal', 'lumen-dialog-runtime' );
			root.classList.remove( 'is-open' );
			setExpandedState( trigger, false );
			releaseBackgroundMask();
			removeBackdrop();
			restorePanelToOrigin();
			unbindDocumentEvents();
			document.body.classList.remove( 'lumen-dialog-open' );
			announce( liveRegion, boundaryEndLabel );

			if (
				restoreFocus &&
				previousFocus &&
				typeof previousFocus.focus === 'function'
			) {
				previousFocus.focus();
			}

			emit( root, 'lumen:dialog-after-close', detail );
		};

		const openDialog = ( source = 'programmatic' ) => {
			if ( isOpen ) {
				return;
			}

			const detail = {
				root,
				trigger,
				panel,
				source,
			};
			if ( ! emit( root, 'lumen:dialog-before-open', detail, true ) ) {
				return;
			}

			isOpen = true;
			previousFocus = panel.ownerDocument.activeElement;
			panel.hidden = false;
			panel.setAttribute( 'aria-hidden', 'false' );
			panel.classList.add( 'lumen-dialog-runtime' );
			if ( isModal ) {
				document.body.classList.add( 'lumen-dialog-open' );

				backdrop = document.createElement( 'div' );
				backdrop.className = 'lumen-dialog-backdrop modalBackdrop';
				if ( closeOnBackdrop ) {
					backdrop.addEventListener( 'click', () =>
						closeDialog( false, 'backdrop' )
					);
				}
				document.body.appendChild( backdrop );

				movePanelToBody();
				panel.classList.add( 'modal' );
				applyBackgroundMask();
			}

			root.classList.add( 'is-open' );
			setExpandedState( trigger, true );
			bindDocumentEvents();

			const focusables = getFocusableElements( panel );
			if ( focusables.length ) {
				focusables[ 0 ].focus();
			} else {
				if ( panel.tabIndex < 0 ) {
					panel.tabIndex = -1;
				}
				panel.focus();
			}
			announce( liveRegion, boundaryStartLabel );

			emit( root, 'lumen:dialog-after-open', detail );
		};

		trigger.addEventListener( 'click', ( event ) => {
			event.preventDefault();
			if ( isOpen ) {
				closeDialog( true, 'trigger' );
				return;
			}
			openDialog( 'trigger' );
		} );

		panel
			.querySelectorAll( '[data-dialog-close="true"], .CloseDC' )
			.forEach( ( button ) => {
				button.addEventListener( 'click', ( event ) => {
					event.preventDefault();
					closeDialog( true, 'button' );
				} );
			} );

		panel.hidden = true;
		setExpandedState( trigger, false );
		if ( panel.tabIndex < 0 ) {
			panel.tabIndex = -1;
		}

		root.lumenDialog = {
			open: () => openDialog( 'api' ),
			close: () => closeDialog( true, 'api' ),
			toggle: () => {
				if ( isOpen ) {
					closeDialog( true, 'api' );
				} else {
					openDialog( 'api' );
				}
			},
			getState: () => ( { isOpen } ),
			destroy: () => {
				unbindDocumentEvents();
				releaseBackgroundMask();
				removeBackdrop();
				restorePanelToOrigin();
				panel.hidden = true;
				panel.setAttribute( 'aria-hidden', 'true' );
				panel.classList.remove( 'modal', 'lumen-dialog-runtime' );
				root.classList.remove( 'is-open' );
				setExpandedState( trigger, false );
				document.body.classList.remove( 'lumen-dialog-open' );
				if ( liveRegion && liveRegion.parentNode ) {
					liveRegion.parentNode.removeChild( liveRegion );
				}
				delete root.lumenDialog;
			},
		};
		root.dataset.lumenDialogReady = 'true';
		clearError( root );
	};

	const boot = () => {
		const roots = Array.from( document.querySelectorAll( BLOCK_SELECTOR ) );
		roots.forEach( ( root, index ) => {
			if ( ! root.id ) {
				root.id = `lumen-dialog-runtime-${ index + 1 }`;
			}
			initDialog( root );
		} );
	};

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', boot );
	} else {
		boot();
	}
} )();

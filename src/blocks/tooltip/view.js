( function () {
	const BLOCK_SELECTOR =
		".wp-block-lumen-tooltip[data-lumen-component='tooltip']";

	const OPEN_TOOLTIPS = new Set();

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
		root.dataset.lumenTooltipReady = 'error';
		if ( reason ) {
			root.dataset.lumenTooltipError = reason;
		}
	};

	const clearError = ( root ) => {
		delete root.dataset.lumenTooltipError;
	};

	const emit = ( node, type, detail, cancelable = false ) =>
		node.dispatchEvent(
			new CustomEvent( type, {
				bubbles: true,
				cancelable,
				detail,
			} )
		);

	const setExpandedState = ( root, trigger, expanded ) => {
		root.classList.toggle( 'is-open', expanded );
		if ( trigger ) {
			trigger.setAttribute(
				'aria-expanded',
				expanded ? 'true' : 'false'
			);
		}
	};

	const initTooltip = ( root ) => {
		if ( root.dataset.lumenTooltipReady === 'true' ) {
			return;
		}

		const trigger = root.querySelector( '.lumen-tooltip-trigger' );
		const tooltip = root.querySelector( '.lumen-tooltip-template' );

		if ( ! trigger || ! tooltip ) {
			markError( root, 'missing-tooltip-refs' );
			return;
		}

		if ( ! root.id ) {
			root.id = `lumen-tooltip-runtime-${ Math.random()
				.toString( 36 )
				.slice( 2, 8 ) }`;
		}

		if ( ! trigger.id ) {
			trigger.id = `${ root.id }-trigger`;
		}

		if ( ! tooltip.id ) {
			tooltip.id = `${ root.id }-content`;
		}

		tooltip.classList.add( 'lumen-tooltip-popup-fallback' );
		tooltip.setAttribute( 'role', 'tooltip' );
		tooltip.setAttribute( 'aria-hidden', 'true' );
		trigger.setAttribute( 'aria-controls', tooltip.id );
		trigger.setAttribute( 'aria-haspopup', 'true' );

		const mode = root.getAttribute( 'data-tooltip-mode' ) || 'hover';
		const delay = Math.max(
			0,
			toInteger( root.getAttribute( 'data-delay' ), 0 )
		);
		const delayTimeout = Math.max(
			0,
			toInteger( root.getAttribute( 'data-delay-timeout' ), 0 )
		);
		const manualClose = toBoolean(
			root.getAttribute( 'data-manual-close' ),
			true
		);

		let openTimer = 0;
		let closeTimer = 0;
		let autoCloseTimer = 0;
		let isOpen = false;

		const clearTimers = () => {
			window.clearTimeout( openTimer );
			window.clearTimeout( closeTimer );
			window.clearTimeout( autoCloseTimer );
		};

		const closeTooltip = ( source = 'programmatic', force = false ) => {
			clearTimers();
			if ( ! isOpen ) {
				return;
			}

			if (
				! force &&
				mode === 'manual' &&
				! manualClose &&
				source !== 'trigger'
			) {
				return;
			}

			const detail = {
				root,
				trigger,
				tooltip,
				source,
			};
			if ( ! emit( root, 'lumen:tooltip-before-close', detail, true ) ) {
				return;
			}

			isOpen = false;
			tooltip.hidden = true;
			tooltip.setAttribute( 'aria-hidden', 'true' );
			trigger.removeAttribute( 'aria-describedby' );
			setExpandedState( root, trigger, false );
			OPEN_TOOLTIPS.delete( root );
			emit( root, 'lumen:tooltip-after-close', detail );
		};

		const openTooltip = ( source = 'programmatic' ) => {
			clearTimers();

			openTimer = window.setTimeout( () => {
				const detail = {
					root,
					trigger,
					tooltip,
					source,
				};
				if (
					! emit( root, 'lumen:tooltip-before-open', detail, true )
				) {
					return;
				}

				OPEN_TOOLTIPS.forEach( ( openRoot ) => {
					if ( openRoot === root ) {
						return;
					}
					if (
						openRoot.lumenTooltip &&
						typeof openRoot.lumenTooltip.close === 'function'
					) {
						openRoot.lumenTooltip.close( 'auto-close' );
					}
				} );

				isOpen = true;
				tooltip.hidden = false;
				tooltip.setAttribute( 'aria-hidden', 'false' );
				trigger.setAttribute( 'aria-describedby', tooltip.id );
				setExpandedState( root, trigger, true );
				OPEN_TOOLTIPS.add( root );

				if ( delayTimeout > 0 ) {
					autoCloseTimer = window.setTimeout( () => {
						closeTooltip( 'timeout', true );
					}, delayTimeout );
				}

				emit( root, 'lumen:tooltip-after-open', detail );
			}, delay );
		};

		const queueClose = ( timeout = 0, source = 'pointer' ) => {
			clearTimers();
			closeTimer = window.setTimeout(
				() => closeTooltip( source, false ),
				timeout
			);
		};

		const onOutsideClick = ( event ) => {
			if ( ! isOpen ) {
				return;
			}

			if ( root.contains( event.target ) ) {
				return;
			}

			closeTooltip( 'outside', false );
		};

		const onDocumentKeydown = ( event ) => {
			if ( event.key !== 'Escape' || ! isOpen ) {
				return;
			}

			if ( mode !== 'manual' || manualClose ) {
				event.preventDefault();
				closeTooltip( 'escape', true );
				trigger.focus();
			}
		};

		document.addEventListener( 'mousedown', onOutsideClick );
		document.addEventListener( 'touchstart', onOutsideClick, {
			passive: true,
		} );
		document.addEventListener( 'keydown', onDocumentKeydown );

		if ( mode === 'manual' ) {
			trigger.addEventListener( 'click', ( event ) => {
				event.preventDefault();
				if ( isOpen ) {
					closeTooltip( 'trigger', true );
				} else {
					openTooltip( 'trigger' );
				}
			} );

			trigger.addEventListener( 'keydown', ( event ) => {
				if ( event.key === 'Enter' || event.key === ' ' ) {
					event.preventDefault();
					if ( isOpen ) {
						closeTooltip( 'keyboard', true );
					} else {
						openTooltip( 'keyboard' );
					}
				}
			} );

			trigger.addEventListener( 'blur', () => queueClose( 0, 'blur' ) );
		} else if ( mode === 'focus' ) {
			trigger.addEventListener( 'focus', () => openTooltip( 'focus' ) );
			trigger.addEventListener( 'blur', () => queueClose( 0, 'blur' ) );
		} else {
			const closeDelay = mode === 'hover' ? 120 : 0;

			trigger.addEventListener( 'mouseenter', () =>
				openTooltip( 'hover' )
			);
			trigger.addEventListener( 'mouseleave', () =>
				queueClose( closeDelay, 'hover' )
			);
			tooltip.addEventListener( 'mouseenter', () =>
				openTooltip( 'hover' )
			);
			tooltip.addEventListener( 'mouseleave', () =>
				queueClose( closeDelay, 'hover' )
			);
			trigger.addEventListener( 'focus', () => openTooltip( 'focus' ) );
			trigger.addEventListener( 'blur', () =>
				queueClose( closeDelay, 'blur' )
			);
		}

		tooltip.hidden = true;
		setExpandedState( root, trigger, false );
		root.lumenTooltip = {
			open: () => openTooltip( 'api' ),
			close: ( source = 'api' ) => closeTooltip( source, true ),
			toggle: () => {
				if ( isOpen ) {
					closeTooltip( 'api-toggle', true );
				} else {
					openTooltip( 'api-toggle' );
				}
			},
			getState: () => ( { isOpen } ),
			destroy: () => {
				clearTimers();
				OPEN_TOOLTIPS.delete( root );
				document.removeEventListener( 'mousedown', onOutsideClick );
				document.removeEventListener( 'touchstart', onOutsideClick );
				document.removeEventListener( 'keydown', onDocumentKeydown );
				delete root.lumenTooltip;
			},
		};
		root.dataset.lumenTooltipReady = 'true';
		clearError( root );
	};

	const boot = () => {
		const roots = Array.from( document.querySelectorAll( BLOCK_SELECTOR ) );
		roots.forEach( ( root ) => {
			initTooltip( root );
		} );
	};

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', boot );
	} else {
		boot();
	}
} )();

( function () {
	const BLOCK_SELECTOR =
		".wp-block-lumen-button[data-lumen-component='button']";

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
		root.dataset.lumenButtonReady = 'error';
		if ( reason ) {
			root.dataset.lumenButtonError = reason;
		}
	};

	const clearError = ( root ) => {
		delete root.dataset.lumenButtonError;
	};

	const emit = ( node, type, detail, cancelable = false ) =>
		node.dispatchEvent(
			new CustomEvent( type, {
				bubbles: true,
				cancelable,
				detail,
			} )
		);

	const parseActionPayload = ( value ) => {
		if ( typeof value !== 'string' ) {
			return null;
		}

		const trimmed = value.trim();
		if ( ! trimmed ) {
			return null;
		}

		try {
			return JSON.parse( trimmed );
		} catch ( error ) {
			return trimmed;
		}
	};

	const initLinkMode = ( root, trigger ) => {
		if ( ! trigger ) {
			markError( root, 'missing-trigger' );
			return;
		}

		if ( trigger.dataset.lumenButtonLinkBound === 'true' ) {
			root.dataset.lumenButtonReady = 'true';
			clearError( root );
			return;
		}

		trigger.dataset.lumenButtonLinkBound = 'true';

		const isDisabled =
			trigger.getAttribute( 'aria-disabled' ) === 'true' ||
			trigger.classList.contains( 'is-disabled' );

		if ( isDisabled ) {
			trigger.addEventListener( 'click', ( event ) => {
				event.preventDefault();
				event.stopPropagation();
			} );
		}

		root.lumenButton = {
			getState: () => ( {
				mode: 'link',
				disabled: isDisabled,
			} ),
		};
		root.dataset.lumenButtonReady = 'true';
		clearError( root );
	};

	const initActionMode = ( root, trigger ) => {
		if ( ! trigger ) {
			markError( root, 'missing-trigger' );
			return;
		}

		if ( trigger.dataset.lumenButtonActionBound === 'true' ) {
			root.dataset.lumenButtonReady = 'true';
			clearError( root );
			return;
		}

		trigger.dataset.lumenButtonActionBound = 'true';

		trigger.addEventListener( 'click', ( event ) => {
			if (
				trigger.disabled ||
				trigger.getAttribute( 'aria-disabled' ) === 'true'
			) {
				event.preventDefault();
				return;
			}

			const action = trigger.getAttribute( 'data-action-value' ) || '';
			if ( ! action ) {
				return;
			}

			const payload = parseActionPayload(
				trigger.getAttribute( 'data-action-payload' ) || ''
			);
			const detail = {
				action,
				payload,
				trigger,
				root,
			};
			const accepted = emit(
				root,
				'lumen:button-before-action',
				detail,
				true
			);
			if ( ! accepted ) {
				event.preventDefault();
				return;
			}

			trigger.dispatchEvent(
				new CustomEvent( 'lumen:button-action', {
					bubbles: true,
					detail,
				} )
			);
			emit( root, 'lumen:button-after-action', detail );
		} );

		root.lumenButton = {
			getState: () => ( {
				mode: 'action',
				disabled:
					trigger.disabled ||
					trigger.getAttribute( 'aria-disabled' ) === 'true',
			} ),
		};
		root.dataset.lumenButtonReady = 'true';
		clearError( root );
	};

	const initToggleMode = ( root, trigger ) => {
		if ( ! trigger ) {
			markError( root, 'missing-trigger' );
			return;
		}

		if ( trigger.dataset.lumenButtonToggleBound === 'true' ) {
			root.dataset.lumenButtonReady = 'true';
			clearError( root );
			return;
		}

		trigger.dataset.lumenButtonToggleBound = 'true';

		const isRequired = toBoolean(
			root.getAttribute( 'data-required' ),
			false
		);
		const toggleClassName =
			root.getAttribute( 'data-toggle-class' ) || 'pressed';
		const nativeInput = trigger.querySelector( '.lumen-button-native' );

		const isDisabled = () =>
			trigger.getAttribute( 'aria-disabled' ) === 'true' ||
			trigger.classList.contains( 'is-disabled' ) ||
			( nativeInput && nativeInput.disabled );

		const isPressed = () =>
			trigger.getAttribute( 'aria-pressed' ) === 'true' ||
			trigger.getAttribute( 'data-toggle' ) === 'true';

		const setPressed = ( pressed ) => {
			trigger.setAttribute( 'aria-pressed', pressed ? 'true' : 'false' );
			trigger.setAttribute( 'data-toggle', pressed ? 'true' : 'false' );
			trigger.classList.toggle( toggleClassName, pressed );
			root.dataset.lumenButtonPressed = pressed ? 'true' : 'false';

			if ( nativeInput ) {
				const wasChecked = nativeInput.checked;
				nativeInput.checked = pressed;
				if ( wasChecked !== pressed ) {
					nativeInput.dispatchEvent(
						new Event( 'change', {
							bubbles: true,
						} )
					);
				}
			}
		};

		const togglePressed = ( event ) => {
			if ( isDisabled() ) {
				event.preventDefault();
				return;
			}

			const nextState = ! isPressed();
			const detail = {
				root,
				trigger,
				pressed: isPressed(),
				nextPressed: nextState,
			};
			const accepted = emit(
				root,
				'lumen:button-before-toggle',
				detail,
				true
			);
			if ( ! accepted ) {
				event.preventDefault();
				return;
			}

			if ( isRequired && ! nextState ) {
				event.preventDefault();
				setPressed( true );
				return;
			}

			event.preventDefault();
			setPressed( nextState );
			emit( root, 'lumen:button-after-toggle', {
				...detail,
				pressed: nextState,
			} );
		};

		trigger.addEventListener( 'click', togglePressed );
		trigger.addEventListener( 'keydown', ( event ) => {
			if ( event.key === 'Enter' || event.key === ' ' ) {
				togglePressed( event );
			}
		} );

		setPressed( isPressed() );
		root.lumenButton = {
			toggle: () => {
				const nextState = ! isPressed();
				if ( isRequired && ! nextState ) {
					return;
				}
				setPressed( nextState );
			},
			getState: () => ( {
				mode: 'toggle',
				pressed: isPressed(),
				disabled: isDisabled(),
			} ),
		};
		root.dataset.lumenButtonReady = 'true';
		clearError( root );
	};

	const initBlock = ( root ) => {
		const mode = root.getAttribute( 'data-button-mode' ) || 'unconfigured';
		const trigger = root.querySelector( '.lumen-button-trigger' );

		if ( mode === 'link' ) {
			initLinkMode( root, trigger );
			return;
		}

		if ( mode === 'action' ) {
			initActionMode( root, trigger );
			return;
		}

		if ( mode === 'toggle' ) {
			initToggleMode( root, trigger );
			return;
		}

		root.lumenButton = {
			getState: () => ( {
				mode,
			} ),
		};
		root.dataset.lumenButtonReady = 'true';
		clearError( root );
	};

	const boot = () => {
		document.querySelectorAll( BLOCK_SELECTOR ).forEach( initBlock );
	};

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', boot );
	} else {
		boot();
	}
} )();

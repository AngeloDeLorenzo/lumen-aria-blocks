( function () {
	const BLOCK_SELECTOR =
		".wp-block-lumen-accordion[data-lumen-component='accordion']";
	const TRIGGER_SELECTOR = '.aria-accordion-trigger';

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
		root.dataset.lumenAccordionReady = 'error';
		if ( reason ) {
			root.dataset.lumenAccordionError = reason;
		}
	};

	const clearError = ( root ) => {
		delete root.dataset.lumenAccordionError;
	};

	const emit = ( node, type, detail, cancelable = false ) =>
		node.dispatchEvent(
			new CustomEvent( type, {
				bubbles: true,
				cancelable,
				detail,
			} )
		);

	const getHashValue = () => {
		const hash = window.location.hash || '';
		return hash.startsWith( '#' ) ? hash.slice( 1 ) : hash;
	};

	const setHashValue = ( id, historyMode ) => {
		if ( ! id ) {
			return;
		}

		const hash = `#${ id }`;
		if ( window.location.hash === hash ) {
			return;
		}

		if (
			window.history &&
			typeof window.history.pushState === 'function' &&
			typeof window.history.replaceState === 'function'
		) {
			if ( historyMode === 'push' ) {
				window.history.pushState( null, '', hash );
			} else {
				window.history.replaceState( null, '', hash );
			}
			return;
		}

		window.location.hash = id;
	};

	const initAccordion = ( root ) => {
		if ( root.dataset.lumenAccordionReady === 'true' ) {
			return;
		}

		const triggerNodes = Array.from(
			root.querySelectorAll( TRIGGER_SELECTOR )
		);
		if ( ! triggerNodes.length ) {
			markError( root, 'missing-accordion-triggers' );
			return;
		}

		const items = triggerNodes
			.map( ( trigger, index ) => {
				const panelId =
					trigger.getAttribute( 'data-controls' ) ||
					trigger.getAttribute( 'aria-controls' ) ||
					'';
				if ( ! panelId ) {
					return null;
				}
				const panel = document.getElementById( panelId );
				if ( ! panel ) {
					return null;
				}
				if ( ! trigger.id ) {
					trigger.id = `${ root.id }-trigger-${ index + 1 }`;
				}
				trigger.setAttribute( 'aria-controls', panelId );
				panel.setAttribute( 'aria-labelledby', trigger.id );
				panel.setAttribute(
					'aria-hidden',
					panel.hidden ? 'true' : 'false'
				);

				return {
					index,
					trigger,
					panel,
					panelId,
				};
			} )
			.filter( Boolean );

		if ( ! items.length ) {
			markError( root, 'missing-accordion-panels' );
			return;
		}

		const allowMultiple = toBoolean(
			root.getAttribute( 'data-allow-multiple' ),
			false
		);
		const openFirst = toBoolean(
			root.getAttribute( 'data-open-first' ),
			true
		);
		const isToggle = toBoolean(
			root.getAttribute( 'data-is-toggle' ),
			false
		);
		const singleTabStop = toBoolean(
			root.getAttribute( 'data-single-tab-stop' ),
			false
		);
		const trackPage = toBoolean(
			root.getAttribute( 'data-track-page' ),
			false
		);
		const historyMode =
			root.getAttribute( 'data-track-page-mode' ) === 'push'
				? 'push'
				: 'replace';

		const disabledIndexes = new Set();
		let focusedIndex = 0;
		let syncingDisabledState = false;

		const isDisabled = ( item ) =>
			item.trigger.hasAttribute( 'disabled' ) ||
			item.trigger.getAttribute( 'aria-disabled' ) === 'true' ||
			item.trigger.classList.contains( 'is-disabled' ) ||
			item.trigger.getAttribute( 'data-disabled' ) === 'true';

		const updateDisabled = () => {
			if ( syncingDisabledState ) {
				return;
			}

			syncingDisabledState = true;
			try {
				disabledIndexes.clear();
				items.forEach( ( item, index ) => {
					const disabled = isDisabled( item );
					const nextAriaDisabled = disabled ? 'true' : 'false';
					if (
						item.trigger.getAttribute( 'aria-disabled' ) !==
						nextAriaDisabled
					) {
						item.trigger.setAttribute(
							'aria-disabled',
							nextAriaDisabled
						);
					}
					if ( disabled ) {
						disabledIndexes.add( index );
					}
				} );

				if ( disabledIndexes.size === items.length ) {
					disabledIndexes.clear();
					items.forEach( ( item ) => {
						if ( item.trigger.hasAttribute( 'aria-disabled' ) ) {
							item.trigger.removeAttribute( 'aria-disabled' );
						}
						if ( item.trigger.hasAttribute( 'disabled' ) ) {
							item.trigger.removeAttribute( 'disabled' );
						}
					} );
				}
			} finally {
				syncingDisabledState = false;
			}
		};

		const resolveEnabledIndex = ( start, direction = 1 ) => {
			if ( items.length === 0 ) {
				return null;
			}

			const normalizedDirection = direction >= 0 ? 1 : -1;
			let candidate = start;
			if ( candidate < 0 ) {
				candidate = normalizedDirection > 0 ? 0 : items.length - 1;
			}
			if ( candidate >= items.length ) {
				candidate = normalizedDirection > 0 ? 0 : items.length - 1;
			}

			for ( let step = 0; step < items.length; step += 1 ) {
				const nextIndex =
					( candidate + normalizedDirection * step + items.length ) %
					items.length;
				if ( ! disabledIndexes.has( nextIndex ) ) {
					return nextIndex;
				}
			}

			return null;
		};

		const isOpen = ( index ) => {
			const item = items[ index ];
			if ( ! item ) {
				return false;
			}
			const { trigger, panel } = item;
			if ( ! trigger || ! panel ) {
				return false;
			}

			return (
				trigger.hasAttribute( 'data-active' ) ||
				trigger.getAttribute( 'aria-expanded' ) === 'true' ||
				panel.hidden === false
			);
		};

		const setOpen = ( index, open ) => {
			const item = items[ index ];
			if ( ! item ) {
				return;
			}
			const { trigger, panel } = item;

			trigger.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
			trigger.classList.toggle( 'open', open );
			if ( open ) {
				trigger.setAttribute( 'data-active', '' );
			} else {
				trigger.removeAttribute( 'data-active' );
			}

			panel.hidden = ! open;
			panel.setAttribute( 'aria-hidden', open ? 'false' : 'true' );
		};

		const closeAllExcept = ( keepIndex ) => {
			items.forEach( ( item, index ) => {
				if ( index !== keepIndex ) {
					setOpen( index, false );
				}
			} );
		};

		const getOpenIndexes = () =>
			items
				.map( ( item, index ) => ( isOpen( index ) ? index : -1 ) )
				.filter( ( index ) => index >= 0 );

		const syncTabindex = () => {
			if ( ! singleTabStop ) {
				items.forEach( ( item, index ) => {
					item.trigger.setAttribute(
						'tabindex',
						disabledIndexes.has( index ) ? '-1' : '0'
					);
				} );
				return;
			}

			const candidate = resolveEnabledIndex( focusedIndex, 1 );
			const activeFocus = candidate === null ? 0 : candidate;

			items.forEach( ( item, index ) => {
				if ( disabledIndexes.has( index ) ) {
					item.trigger.setAttribute( 'tabindex', '-1' );
					return;
				}
				item.trigger.setAttribute(
					'tabindex',
					index === activeFocus ? '0' : '-1'
				);
			} );
		};

		const focusTrigger = ( index ) => {
			const safeIndex = resolveEnabledIndex( index, 1 );
			if ( safeIndex === null ) {
				return;
			}
			focusedIndex = safeIndex;
			syncTabindex();
			items[ safeIndex ].trigger.focus();
		};

		const toggle = ( index, triggerType = 'programmatic' ) => {
			if ( disabledIndexes.has( index ) ) {
				return;
			}

			const item = items[ index ];
			if ( ! item ) {
				return;
			}

			const beforeDetail = {
				index,
				trigger: item.trigger,
				panel: item.panel,
				isOpen: isOpen( index ),
				source: triggerType,
				root,
			};

			if (
				! emit(
					root,
					'lumen:accordion-before-toggle',
					beforeDetail,
					true
				)
			) {
				return;
			}

			const currentlyOpen = isOpen( index );

			if ( allowMultiple ) {
				if ( currentlyOpen && ! isToggle ) {
					return;
				}
				setOpen( index, ! currentlyOpen );
			} else if ( currentlyOpen ) {
				if ( ! isToggle ) {
					return;
				}
				setOpen( index, false );
			} else {
				closeAllExcept( index );
				setOpen( index, true );
			}

			const opened = getOpenIndexes();
			if ( ! allowMultiple && opened.length === 0 && ! isToggle ) {
				const fallback = resolveEnabledIndex( 0, 1 );
				if ( fallback !== null ) {
					setOpen( fallback, true );
				}
			}

			const activePanelId = items[ index ].panelId || '';
			if ( trackPage && activePanelId && isOpen( index ) ) {
				setHashValue( activePanelId, historyMode );
			}

			root.dataset.lumenAccordionOpen = getOpenIndexes().join( ',' );
			emit( root, 'lumen:accordion-after-toggle', {
				...beforeDetail,
				isOpen: isOpen( index ),
				openIndexes: getOpenIndexes(),
			} );
		};

		const initiallyOpen = getOpenIndexes();

		if ( allowMultiple ) {
			const openSet = new Set( initiallyOpen );
			if ( openSet.size === 0 && openFirst ) {
				const fallback = resolveEnabledIndex( 0, 1 );
				if ( fallback !== null ) {
					openSet.add( fallback );
				}
			}
			items.forEach( ( item, index ) => {
				setOpen( index, openSet.has( index ) );
			} );
		} else {
			let targetIndex = null;
			if ( initiallyOpen.length > 0 ) {
				targetIndex = initiallyOpen[ 0 ];
			} else if ( openFirst ) {
				targetIndex = resolveEnabledIndex( 0, 1 );
			}
			items.forEach( ( item, index ) => {
				setOpen( index, index === targetIndex );
			} );
		}

		const hashValue = getHashValue();
		if ( hashValue ) {
			const hashIndex = items.findIndex(
				( item ) =>
					item.panelId === hashValue || item.trigger.id === hashValue
			);
			if ( hashIndex >= 0 ) {
				if ( ! allowMultiple ) {
					closeAllExcept( hashIndex );
				}
				setOpen( hashIndex, true );
				focusedIndex = hashIndex;
			}
		}

		updateDisabled();
		focusedIndex = resolveEnabledIndex( focusedIndex, 1 ) || 0;
		syncTabindex();

		const onHashChange = () => {
			const nextHash = getHashValue();
			if ( ! nextHash ) {
				return;
			}
			const hashIndex = items.findIndex(
				( item ) =>
					item.panelId === nextHash || item.trigger.id === nextHash
			);
			if ( hashIndex < 0 || disabledIndexes.has( hashIndex ) ) {
				return;
			}
			if ( ! allowMultiple ) {
				closeAllExcept( hashIndex );
			}
			setOpen( hashIndex, true );
			focusedIndex = hashIndex;
			syncTabindex();
		};

		items.forEach( ( item, index ) => {
			const { trigger } = item;
			trigger.addEventListener( 'click', ( event ) => {
				event.preventDefault();
				toggle( index, 'pointer' );
			} );

			trigger.addEventListener( 'keydown', ( event ) => {
				if ( disabledIndexes.has( index ) ) {
					return;
				}

				if ( event.key === 'Enter' || event.key === ' ' ) {
					event.preventDefault();
					toggle( index, 'keyboard' );
					return;
				}

				if ( singleTabStop && event.key === 'ArrowDown' ) {
					event.preventDefault();
					focusTrigger( index + 1 );
					return;
				}

				if ( singleTabStop && event.key === 'ArrowUp' ) {
					event.preventDefault();
					focusTrigger( index - 1 );
					return;
				}

				if ( singleTabStop && event.key === 'Home' ) {
					event.preventDefault();
					focusTrigger( 0 );
					return;
				}

				if ( singleTabStop && event.key === 'End' ) {
					event.preventDefault();
					focusTrigger( items.length - 1 );
				}
			} );

			trigger.addEventListener( 'focus', () => {
				focusedIndex = index;
				syncTabindex();
			} );
		} );

		const MutationObserverClass = window.MutationObserver;
		const observer =
			typeof MutationObserverClass === 'function'
				? new MutationObserverClass( ( mutations ) => {
						if ( syncingDisabledState ) {
							return;
						}

						if (
							! mutations.some( ( mutation ) =>
								[
									'disabled',
									'aria-disabled',
									'class',
									'data-disabled',
								].includes( mutation.attributeName )
							)
						) {
							return;
						}

						updateDisabled();
						syncTabindex();
				  } )
				: null;

		if ( observer ) {
			items.forEach( ( item ) => {
				observer.observe( item.trigger, {
					attributes: true,
					attributeFilter: [
						'disabled',
						'aria-disabled',
						'class',
						'data-disabled',
					],
				} );
			} );
		}

		window.addEventListener( 'hashchange', onHashChange );

		root.lumenAccordion = {
			toggle: ( index ) => toggle( Number( index ), 'api' ),
			open: ( index ) => {
				const safeIndex = Number( index );
				if ( Number.isNaN( safeIndex ) ) {
					return;
				}
				if ( ! allowMultiple ) {
					closeAllExcept( safeIndex );
				}
				setOpen( safeIndex, true );
				syncTabindex();
			},
			close: ( index ) => {
				const safeIndex = Number( index );
				if ( Number.isNaN( safeIndex ) ) {
					return;
				}
				if ( ! isToggle && ! allowMultiple ) {
					return;
				}
				setOpen( safeIndex, false );
				syncTabindex();
			},
			updateDisabled,
			getState: () => ( {
				openIndexes: getOpenIndexes(),
				focusedIndex,
				total: items.length,
			} ),
			destroy: () => {
				if ( observer ) {
					observer.disconnect();
				}
				window.removeEventListener( 'hashchange', onHashChange );
				delete root.lumenAccordion;
			},
		};

		root.dataset.lumenAccordionOpen = getOpenIndexes().join( ',' );
		root.dataset.lumenAccordionReady = 'true';
		clearError( root );
	};

	const boot = () => {
		document
			.querySelectorAll( BLOCK_SELECTOR )
			.forEach( ( root, index ) => {
				if ( ! root.id ) {
					root.id = `lumen-accordion-runtime-${ index + 1 }`;
				}
				initAccordion( root );
			} );
	};

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', boot );
	} else {
		boot();
	}
} )();

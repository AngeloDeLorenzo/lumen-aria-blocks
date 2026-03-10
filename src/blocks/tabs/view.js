( function () {
	const BLOCK_SELECTOR = ".wp-block-lumen-tabs[data-lumen-component='tabs']";
	const TAB_SELECTOR = '.aria-tab';
	const PANEL_SELECTOR = '.aria-tabpanel';

	const toBoolean = ( value, fallback = false ) => {
		if (
			value === true ||
			value === 1 ||
			value === '1' ||
			value === 'true'
		) {
			return true;
		}
		if (
			value === false ||
			value === 0 ||
			value === '0' ||
			value === 'false'
		) {
			return false;
		}
		return fallback;
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

	const markError = ( root, reason ) => {
		root.dataset.lumenTabsReady = 'error';
		root.dataset.lumenTabsError = reason;
	};

	const clearError = ( root ) => {
		delete root.dataset.lumenTabsError;
	};

	const getInitialIndex = ( items ) => {
		const byDataActive = items.findIndex( ( item ) =>
			item.tab.hasAttribute( 'data-active' )
		);
		if ( byDataActive >= 0 ) {
			return byDataActive;
		}

		const byAriaSelected = items.findIndex(
			( item ) => item.tab.getAttribute( 'aria-selected' ) === 'true'
		);
		if ( byAriaSelected >= 0 ) {
			return byAriaSelected;
		}

		return 0;
	};

	const initTabs = ( root ) => {
		if ( root.dataset.lumenTabsReady === 'true' ) {
			return;
		}

		const tabs = Array.from( root.querySelectorAll( TAB_SELECTOR ) );
		const panels = Array.from( root.querySelectorAll( PANEL_SELECTOR ) );

		if ( ! tabs.length || ! panels.length ) {
			markError( root, 'missing-tab-refs' );
			return;
		}

		const orientation =
			root.getAttribute( 'data-orientation' ) === 'vertical'
				? 'vertical'
				: 'horizontal';
		const manualActivation =
			root.getAttribute( 'data-activation-mode' ) === 'manual';

		const items = tabs
			.map( ( tab, index ) => {
				let panelId =
					tab.getAttribute( 'data-controls' ) ||
					tab.getAttribute( 'aria-controls' ) ||
					'';
				let panel = panelId ? document.getElementById( panelId ) : null;

				if ( ! panel ) {
					panel = panels[ index ] || null;
					if ( panel ) {
						panelId =
							panel.id || `${ root.id }-panel-${ index + 1 }`;
						if ( ! panel.id ) {
							panel.id = panelId;
						}
					}
				}

				if ( ! panel || ! panelId ) {
					return null;
				}

				if ( ! tab.id ) {
					tab.id = `${ root.id }-tab-${ index + 1 }`;
				}

				tab.setAttribute( 'role', 'tab' );
				tab.setAttribute( 'aria-controls', panelId );
				tab.setAttribute( 'data-controls', panelId );
				tab.setAttribute( 'aria-expanded', 'false' );

				panel.setAttribute( 'role', 'tabpanel' );
				panel.setAttribute( 'aria-labelledby', tab.id );
				panel.setAttribute(
					'aria-hidden',
					panel.hidden ? 'true' : 'false'
				);

				return {
					index,
					tab,
					panel,
					panelId,
				};
			} )
			.filter( Boolean );

		if ( ! items.length ) {
			markError( root, 'missing-tab-panels' );
			return;
		}

		const trackPage = toBoolean(
			root.getAttribute( 'data-track-page' ),
			false
		);
		const historyMode =
			root.getAttribute( 'data-track-page-mode' ) === 'push'
				? 'push'
				: 'replace';

		const disabledIndexes = new Set();
		let activeIndex = -1;
		let focusedIndex = -1;
		let syncingDisabledState = false;

		const isDisabled = ( item ) =>
			item.tab.hasAttribute( 'disabled' ) ||
			item.tab.getAttribute( 'aria-disabled' ) === 'true' ||
			item.tab.classList.contains( 'is-disabled' ) ||
			item.tab.getAttribute( 'data-disabled' ) === 'true';

		const resolveEnabledIndex = ( index ) => {
			const length = items.length;
			if ( length === 0 ) {
				return -1;
			}

			let safe = index;
			if ( safe < 0 ) {
				safe = length - 1;
			}
			if ( safe >= length ) {
				safe = 0;
			}

			for ( let offset = 0; offset < length; offset += 1 ) {
				const candidate = ( safe + offset ) % length;
				if ( ! disabledIndexes.has( candidate ) ) {
					return candidate;
				}
			}

			return -1;
		};

		const resolveEnabledIndexReverse = ( index ) => {
			const length = items.length;
			if ( length === 0 ) {
				return -1;
			}

			let safe = index;
			if ( safe < 0 ) {
				safe = length - 1;
			}
			if ( safe >= length ) {
				safe = 0;
			}

			for ( let offset = 0; offset < length; offset += 1 ) {
				const candidate = ( safe - offset + length ) % length;
				if ( ! disabledIndexes.has( candidate ) ) {
					return candidate;
				}
			}

			return -1;
		};

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
						item.tab.getAttribute( 'aria-disabled' ) !==
						nextAriaDisabled
					) {
						item.tab.setAttribute(
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
						if ( item.tab.hasAttribute( 'aria-disabled' ) ) {
							item.tab.removeAttribute( 'aria-disabled' );
						}
						if ( item.tab.hasAttribute( 'disabled' ) ) {
							item.tab.removeAttribute( 'disabled' );
						}
					} );
				}
			} finally {
				syncingDisabledState = false;
			}
		};

		const syncState = () => {
			items.forEach( ( item, index ) => {
				const isActive = index === activeIndex;
				const isFocused = index === focusedIndex;
				const isItemDisabled = disabledIndexes.has( index );

				item.tab.setAttribute(
					'aria-selected',
					isActive ? 'true' : 'false'
				);
				item.tab.setAttribute(
					'aria-expanded',
					isActive ? 'true' : 'false'
				);

				if ( isItemDisabled ) {
					item.tab.setAttribute( 'tabindex', '-1' );
				} else {
					item.tab.setAttribute(
						'tabindex',
						isFocused || isActive ? '0' : '-1'
					);
				}

				if ( isActive ) {
					item.tab.setAttribute( 'data-active', '' );
					item.tab.classList.add( 'active' );
				} else {
					item.tab.removeAttribute( 'data-active' );
					item.tab.classList.remove( 'active' );
				}

				item.panel.hidden = ! isActive;
				item.panel.setAttribute(
					'aria-hidden',
					isActive ? 'false' : 'true'
				);
			} );

			root.dataset.lumenTabsActiveIndex = String( activeIndex );
		};

		const getIndexFromHash = () => {
			const hashValue = getHashValue();
			if ( ! hashValue ) {
				return -1;
			}

			return items.findIndex(
				( item ) =>
					item.panelId === hashValue ||
					item.panel.id === hashValue ||
					item.tab.id === hashValue
			);
		};

		const activate = ( nextIndex, options = {} ) => {
			const safeIndex = resolveEnabledIndex( nextIndex );
			if ( safeIndex < 0 ) {
				return false;
			}

			const trigger = options.trigger || 'programmatic';
			const item = items[ safeIndex ];
			const detail = {
				index: safeIndex,
				trigger,
				tab: item.tab,
				panel: item.panel,
				root,
			};

			if ( safeIndex !== activeIndex ) {
				const accepted = emit(
					root,
					'lumen:tabs-before-activate',
					detail,
					true
				);
				if ( ! accepted ) {
					return false;
				}
			}

			activeIndex = safeIndex;
			if ( options.preserveFocus !== true ) {
				focusedIndex = safeIndex;
			}

			syncState();

			if ( options.moveFocus ) {
				item.tab.focus();
			}

			if ( trackPage && options.skipHash !== true ) {
				setHashValue( item.panelId, historyMode );
			}

			emit( root, 'lumen:tabs-after-activate', detail );
			return true;
		};

		const focusIndex = ( nextIndex ) => {
			const safeIndex = resolveEnabledIndex( nextIndex );
			if ( safeIndex < 0 ) {
				return;
			}

			focusedIndex = safeIndex;
			syncState();
			items[ safeIndex ].tab.focus();

			if ( ! manualActivation ) {
				activate( safeIndex, {
					trigger: 'keyboard',
					preserveFocus: true,
				} );
			}
		};

		const moveFocus = ( delta ) => {
			const from = focusedIndex >= 0 ? focusedIndex : activeIndex;
			let candidate = from;

			for ( let step = 0; step < items.length; step += 1 ) {
				candidate += delta;
				if ( candidate < 0 ) {
					candidate = items.length - 1;
				}
				if ( candidate >= items.length ) {
					candidate = 0;
				}
				if ( ! disabledIndexes.has( candidate ) ) {
					focusIndex( candidate );
					return;
				}
			}
		};

		const onHashChange = () => {
			const hashIndex = getIndexFromHash();
			if ( hashIndex >= 0 ) {
				activate( hashIndex, {
					trigger: 'hash',
					moveFocus: false,
				} );
			}
		};

		items.forEach( ( item, index ) => {
			item.tab.addEventListener( 'focus', () => {
				focusedIndex = index;
				syncState();
			} );

			item.tab.addEventListener( 'click', ( event ) => {
				if ( disabledIndexes.has( index ) ) {
					event.preventDefault();
					return;
				}

				event.preventDefault();
				activate( index, {
					trigger: 'pointer',
				} );
			} );

			item.tab.addEventListener( 'keydown', ( event ) => {
				const key = event.key;
				const previousKey =
					orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
				const nextKey =
					orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';

				if ( key === previousKey ) {
					event.preventDefault();
					moveFocus( -1 );
					return;
				}

				if ( key === nextKey ) {
					event.preventDefault();
					moveFocus( 1 );
					return;
				}

				if ( key === 'Home' ) {
					event.preventDefault();
					focusIndex( resolveEnabledIndex( 0 ) );
					return;
				}

				if ( key === 'End' ) {
					event.preventDefault();
					focusIndex(
						resolveEnabledIndexReverse( items.length - 1 )
					);
					return;
				}

				if ( key === 'Enter' || key === ' ' || key === 'Spacebar' ) {
					if ( disabledIndexes.has( index ) ) {
						event.preventDefault();
						return;
					}

					event.preventDefault();
					activate( focusedIndex >= 0 ? focusedIndex : index, {
						trigger: 'keyboard',
						preserveFocus: true,
					} );
				}
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

						if ( disabledIndexes.has( activeIndex ) ) {
							const fallback = resolveEnabledIndex(
								activeIndex + 1
							);
							if ( fallback >= 0 ) {
								activate( fallback, {
									trigger: 'disabled-update',
									skipHash: true,
								} );
							}
						}

						if ( disabledIndexes.has( focusedIndex ) ) {
							focusedIndex = resolveEnabledIndex(
								focusedIndex + 1
							);
							syncState();
						}
				  } )
				: null;

		if ( observer ) {
			items.forEach( ( item ) => {
				observer.observe( item.tab, {
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

		updateDisabled();

		let initialIndex = getIndexFromHash();
		if ( initialIndex < 0 ) {
			initialIndex = getInitialIndex( items );
		}

		initialIndex = resolveEnabledIndex( initialIndex );
		if ( initialIndex < 0 ) {
			markError( root, 'no-enabled-tabs' );
			if ( observer ) {
				observer.disconnect();
			}
			return;
		}

		activeIndex = initialIndex;
		focusedIndex = initialIndex;
		syncState();
		activate( initialIndex, {
			trigger: 'init',
			skipHash: getIndexFromHash() >= 0,
			preserveFocus: true,
		} );

		window.addEventListener( 'hashchange', onHashChange );

		root.lumenTabs = {
			activate: ( index ) =>
				activate( Number( index ), {
					trigger: 'api',
				} ),
			updateDisabled,
			getState: () => ( {
				activeIndex,
				focusedIndex,
				total: items.length,
			} ),
			destroy: () => {
				if ( observer ) {
					observer.disconnect();
				}
				window.removeEventListener( 'hashchange', onHashChange );
				delete root.lumenTabs;
			},
		};

		root.dataset.lumenTabsReady = 'true';
		clearError( root );
	};

	const boot = () => {
		const roots = Array.from( document.querySelectorAll( BLOCK_SELECTOR ) );

		roots.forEach( ( root, index ) => {
			if ( ! root.id ) {
				root.id = `lumen-tabs-runtime-${ index + 1 }`;
			}
			initTabs( root );
		} );
	};

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', boot );
	} else {
		boot();
	}
} )();

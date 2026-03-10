( function ( wp ) {
	if (
		! wp ||
		! wp.blocks ||
		! wp.blockEditor ||
		! wp.components ||
		! wp.element ||
		! wp.i18n
	) {
		return;
	}

	const { registerBlockType } = wp.blocks;
	const { __ } = wp.i18n;
	const { useBlockProps, InspectorControls } = wp.blockEditor;
	const {
		PanelBody,
		SelectControl,
		ToggleControl,
		TextControl,
		TextareaControl,
		Button,
		Notice,
	} = wp.components;
	const { createElement: el, Fragment } = wp.element;

	const DEFAULT_ITEMS = [
		{ label: 'Tab One', content: 'Tab Panel One Content' },
		{ label: 'Tab Two', content: 'Tab Panel Two Content' },
		{ label: 'Tab Three', content: 'Tab Panel Three Content' },
	];

	const normalizeItems = ( items ) => {
		if ( ! Array.isArray( items ) || items.length === 0 ) {
			return DEFAULT_ITEMS.slice();
		}

		return items.map( ( item, index ) => ( {
			label:
				item && typeof item.label === 'string' && item.label.trim()
					? item.label
					: `Tab ${ index + 1 }`,
			content:
				item && typeof item.content === 'string' ? item.content : '',
		} ) );
	};

	const toBoolean = ( value, fallback = false ) => {
		if ( typeof value === 'boolean' ) {
			return value;
		}
		if ( typeof value === 'number' ) {
			return value === 1;
		}
		if ( typeof value === 'string' ) {
			const normalized = value.trim().toLowerCase();
			if ( [ '1', 'true', 'yes', 'on' ].includes( normalized ) ) {
				return true;
			}
			if ( [ '0', 'false', 'no', 'off', '' ].includes( normalized ) ) {
				return false;
			}
		}
		return Boolean( fallback );
	};

	const Edit = ( { attributes, setAttributes } ) => {
		const items = normalizeItems( attributes.items );
		const activeIndex =
			Number( attributes.activeIndex ) >= 0
				? Number( attributes.activeIndex )
				: 0;
		const clampedActiveIndex = Math.min(
			activeIndex,
			Math.max( 0, items.length - 1 )
		);
		const trackPage = toBoolean( attributes.trackPage, false );

		const blockProps = useBlockProps( {
			className: 'lumen-block-editor lumen-block-editor-tabs',
		} );

		const updateItem = ( index, key, value ) => {
			const next = items.map( ( item, i ) =>
				i === index ? { ...item, [ key ]: value } : item
			);
			setAttributes( { items: next } );
		};

		const addItem = () => {
			const nextIndex = items.length + 1;
			setAttributes( {
				items: [
					...items,
					{ label: `Tab ${ nextIndex }`, content: '' },
				],
			} );
		};

		const removeItem = ( index ) => {
			if ( items.length <= 1 ) {
				return;
			}

			const next = items.filter( ( _, i ) => i !== index );
			const nextActiveIndex = Math.min(
				clampedActiveIndex,
				Math.max( 0, next.length - 1 )
			);
			setAttributes( { items: next, activeIndex: nextActiveIndex } );
		};

		return el(
			Fragment,
			{},
			el(
				InspectorControls,
				{},
				el(
					PanelBody,
					{
						title: __( 'Tabs Settings', 'lumen-aria-blocks' ),
						initialOpen: true,
					},
					el( SelectControl, {
						label: __( 'Orientation', 'lumen-aria-blocks' ),
						value: attributes.orientation || 'horizontal',
						options: [
							{
								label: __( 'Horizontal', 'lumen-aria-blocks' ),
								value: 'horizontal',
							},
							{
								label: __( 'Vertical', 'lumen-aria-blocks' ),
								value: 'vertical',
							},
						],
						onChange: ( value ) =>
							setAttributes( {
								orientation: value || 'horizontal',
							} ),
					} ),
					el( SelectControl, {
						label: __( 'Activation mode', 'lumen-aria-blocks' ),
						value: attributes.activationMode || 'manual',
						options: [
							{
								label: __(
									'Automatic (on focus)',
									'lumen-aria-blocks'
								),
								value: 'auto',
							},
							{
								label: __(
									'Manual (Enter/Space)',
									'lumen-aria-blocks'
								),
								value: 'manual',
							},
						],
						onChange: ( value ) =>
							setAttributes( {
								activationMode: value || 'manual',
							} ),
					} ),
					el( ToggleControl, {
						label: __(
							'Update URL hash on activation',
							'lumen-aria-blocks'
						),
						checked: trackPage,
						onChange: ( value ) =>
							setAttributes( {
								trackPage: Boolean( value ),
							} ),
					} ),
					el( SelectControl, {
						label: __( 'Hash history mode', 'lumen-aria-blocks' ),
						value:
							attributes.trackPageMode === 'push'
								? 'push'
								: 'replace',
						options: [
							{
								label: __(
									'Replace current URL',
									'lumen-aria-blocks'
								),
								value: 'replace',
							},
							{
								label: __(
									'Push browser history',
									'lumen-aria-blocks'
								),
								value: 'push',
							},
						],
						disabled: ! trackPage,
						onChange: ( value ) =>
							setAttributes( {
								trackPageMode:
									value === 'push' ? 'push' : 'replace',
							} ),
					} ),
					el( SelectControl, {
						label: __(
							'Initially active tab',
							'lumen-aria-blocks'
						),
						value: String( clampedActiveIndex ),
						options: items.map( ( item, index ) => ( {
							label: item.label || `Tab ${ index + 1 }`,
							value: String( index ),
						} ) ),
						onChange: ( value ) =>
							setAttributes( {
								activeIndex: Number( value ) || 0,
							} ),
					} )
				)
			),
			el(
				'div',
				blockProps,
				el(
					'h3',
					{ className: 'lumen-block-editor-title' },
					__( 'Tabs', 'lumen-aria-blocks' )
				),
				el(
					'p',
					{ className: 'lumen-block-editor-help' },
					__(
						'Configure labels and panel content. Frontend markup is server-rendered for SEO and robust ARIA semantics.',
						'lumen-aria-blocks'
					)
				),
				items.length < 1
					? el(
							Notice,
							{ status: 'warning', isDismissible: false },
							__( 'Add at least one tab.', 'lumen-aria-blocks' )
					  )
					: null,
				items.map( ( item, index ) =>
					el(
						'div',
						{
							className: 'lumen-block-editor-item',
							key: `tab-item-${ index }`,
						},
						el(
							'div',
							{
								className: 'lumen-block-editor-item-toolbar',
							},
							el(
								'strong',
								{},
								`${ __( 'Tab', 'lumen-aria-blocks' ) } ${
									index + 1
								}`
							),
							el(
								Button,
								{
									isDestructive: true,
									isSmall: true,
									onClick: () => removeItem( index ),
									disabled: items.length <= 1,
								},
								__( 'Remove', 'lumen-aria-blocks' )
							)
						),
						el( TextControl, {
							label: __( 'Label', 'lumen-aria-blocks' ),
							value: item.label,
							onChange: ( value ) =>
								updateItem( index, 'label', value ),
						} ),
						el( TextareaControl, {
							label: __( 'Panel content', 'lumen-aria-blocks' ),
							value: item.content,
							onChange: ( value ) =>
								updateItem( index, 'content', value ),
							help: __(
								'Supports basic HTML when rendered.',
								'lumen-aria-blocks'
							),
						} )
					)
				),
				el(
					Button,
					{
						variant: 'primary',
						onClick: addItem,
					},
					__( 'Add tab', 'lumen-aria-blocks' )
				)
			)
		);
	};

	registerBlockType( 'lumen/tabs', {
		edit: Edit,
		save: () => null,
	} );
} )( window.wp );

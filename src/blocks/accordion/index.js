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
		ToggleControl,
		RangeControl,
		SelectControl,
		TextControl,
		TextareaControl,
		Button,
		Notice,
	} = wp.components;
	const { createElement: el, Fragment } = wp.element;

	const DEFAULT_ITEMS = [
		{ title: 'Section One', content: 'Section One Content' },
		{ title: 'Section Two', content: 'Section Two Content' },
		{ title: 'Section Three', content: 'Section Three Content' },
	];

	const normalizeItems = ( items ) => {
		if ( ! Array.isArray( items ) || items.length === 0 ) {
			return DEFAULT_ITEMS.slice();
		}

		return items.map( ( item, index ) => ( {
			title:
				item && typeof item.title === 'string' && item.title.trim()
					? item.title
					: `Section ${ index + 1 }`,
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
		const trackPage = toBoolean( attributes.trackPage, false );
		const blockProps = useBlockProps( {
			className: 'lumen-block-editor lumen-block-editor-accordion',
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
					{ title: `Section ${ nextIndex }`, content: '' },
				],
			} );
		};

		const removeItem = ( index ) => {
			if ( items.length <= 1 ) {
				return;
			}

			setAttributes( {
				items: items.filter( ( _, i ) => i !== index ),
			} );
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
						title: __( 'Accordion Settings', 'lumen-aria-blocks' ),
						initialOpen: true,
					},
					el( ToggleControl, {
						label: __(
							'Allow multiple open sections',
							'lumen-aria-blocks'
						),
						checked: toBoolean( attributes.allowMultiple, false ),
						onChange: ( value ) =>
							setAttributes( {
								allowMultiple: Boolean( value ),
							} ),
					} ),
					el( ToggleControl, {
						label: __(
							'Open first section by default',
							'lumen-aria-blocks'
						),
						checked: toBoolean( attributes.openFirst, true ),
						onChange: ( value ) =>
							setAttributes( {
								openFirst: Boolean( value ),
							} ),
					} ),
					el( ToggleControl, {
						label: __(
							'Single tab stop navigation',
							'lumen-aria-blocks'
						),
						checked: toBoolean( attributes.singleTabStop, false ),
						onChange: ( value ) =>
							setAttributes( {
								singleTabStop: Boolean( value ),
							} ),
					} ),
					el( ToggleControl, {
						label: __(
							'Allow closing current section',
							'lumen-aria-blocks'
						),
						checked: toBoolean( attributes.isToggle, false ),
						onChange: ( value ) =>
							setAttributes( {
								isToggle: Boolean( value ),
							} ),
					} ),
					el( ToggleControl, {
						label: __(
							'Update URL hash on open',
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
					el( RangeControl, {
						label: __( 'Heading level', 'lumen-aria-blocks' ),
						value: Number( attributes.headingLevel ) || 3,
						onChange: ( value ) =>
							setAttributes( { headingLevel: value || 3 } ),
						min: 2,
						max: 6,
					} )
				)
			),
			el(
				'div',
				blockProps,
				el(
					'h3',
					{ className: 'lumen-block-editor-title' },
					__( 'Accordion', 'lumen-aria-blocks' )
				),
				el(
					'p',
					{ className: 'lumen-block-editor-help' },
					__(
						'Configure sections and content. Frontend rendering is server-side for SEO and ARIA integrity.',
						'lumen-aria-blocks'
					)
				),
				items.length < 1
					? el(
							Notice,
							{ status: 'warning', isDismissible: false },
							__(
								'Add at least one section.',
								'lumen-aria-blocks'
							)
					  )
					: null,
				items.map( ( item, index ) =>
					el(
						'div',
						{
							className: 'lumen-block-editor-item',
							key: `accordion-item-${ index }`,
						},
						el(
							'div',
							{
								className: 'lumen-block-editor-item-toolbar',
							},
							el(
								'strong',
								{},
								`${ __( 'Section', 'lumen-aria-blocks' ) } ${
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
							label: __( 'Title', 'lumen-aria-blocks' ),
							value: item.title,
							onChange: ( value ) =>
								updateItem( index, 'title', value ),
						} ),
						el( TextareaControl, {
							label: __( 'Content', 'lumen-aria-blocks' ),
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
					__( 'Add section', 'lumen-aria-blocks' )
				)
			)
		);
	};

	registerBlockType( 'lumen/accordion', {
		edit: Edit,
		save: () => null,
	} );
} )( window.wp );

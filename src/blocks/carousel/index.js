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
		TextControl,
		SelectControl,
		ToggleControl,
		RangeControl,
		Button,
		TextareaControl,
	} = wp.components;
	const { createElement: el, Fragment } = wp.element;

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

	const DEFAULT_SLIDES = [
		{ title: 'Slide One', content: 'First slide content' },
		{ title: 'Slide Two', content: 'Second slide content' },
		{ title: 'Slide Three', content: 'Third slide content' },
		{ title: 'Slide Four', content: 'Fourth slide content' },
	];

	const normalizeSlides = ( slides ) => {
		const source =
			Array.isArray( slides ) && slides.length ? slides : DEFAULT_SLIDES;
		return source.map( ( slide, index ) => ( {
			title:
				slide && typeof slide.title === 'string' && slide.title.trim()
					? slide.title
					: `Slide ${ index + 1 }`,
			content:
				slide &&
				typeof slide.content === 'string' &&
				slide.content.trim()
					? slide.content
					: `Content ${ index + 1 }`,
		} ) );
	};

	const Edit = ( { attributes, setAttributes } ) => {
		const slides = normalizeSlides( attributes.slides );
		const blockProps = useBlockProps( {
			className: 'lumen-block-editor lumen-block-editor-carousel',
		} );

		const updateSlide = ( index, key, value ) => {
			const next = slides.map( ( slide, slideIndex ) =>
				slideIndex === index
					? {
							...slide,
							[ key ]: value,
					  }
					: slide
			);
			setAttributes( { slides: next } );
		};

		const addSlide = () => {
			const nextIndex = slides.length + 1;
			setAttributes( {
				slides: [
					...slides,
					{
						title: `Slide ${ nextIndex }`,
						content: `Content ${ nextIndex }`,
					},
				],
			} );
		};

		const removeSlide = ( index ) => {
			if ( slides.length <= 1 ) {
				return;
			}

			setAttributes( {
				slides: slides.filter(
					( _, slideIndex ) => slideIndex !== index
				),
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
						title: __( 'Carousel Settings', 'lumen-aria-blocks' ),
						initialOpen: true,
					},
					el( TextControl, {
						label: __( 'Title', 'lumen-aria-blocks' ),
						value: attributes.title || '',
						onChange: ( value ) =>
							setAttributes( { title: value } ),
					} ),
					el( SelectControl, {
						label: __( 'Mode', 'lumen-aria-blocks' ),
						value: attributes.mode || 'manual',
						options: [
							{
								label: __( 'Manual', 'lumen-aria-blocks' ),
								value: 'manual',
							},
							{
								label: __( 'Auto rotate', 'lumen-aria-blocks' ),
								value: 'auto',
							},
							{
								label: __( 'Gallery', 'lumen-aria-blocks' ),
								value: 'gallery',
							},
						],
						onChange: ( value ) =>
							setAttributes( { mode: value || 'manual' } ),
					} ),
					el( ToggleControl, {
						label: __( 'Autoplay', 'lumen-aria-blocks' ),
						checked: toBoolean( attributes.autoplay, false ),
						onChange: ( value ) =>
							setAttributes( { autoplay: Boolean( value ) } ),
					} ),
					el( RangeControl, {
						label: __( 'Items on desktop', 'lumen-aria-blocks' ),
						value: Number( attributes.itemsDesktop ) || 2,
						onChange: ( value ) =>
							setAttributes( {
								itemsDesktop: Number( value ) || 2,
							} ),
						min: 1,
						max: 4,
					} )
				)
			),
			el(
				'div',
				blockProps,
				el(
					'h3',
					{ className: 'lumen-block-editor-title' },
					__( 'Carousel', 'lumen-aria-blocks' )
				),
				el(
					'p',
					{ className: 'lumen-block-editor-help' },
					__(
						'runtime carousel with manual or auto-rotate behavior.',
						'lumen-aria-blocks'
					)
				),
				el(
					'div',
					{ className: 'lumen-block-editor-carousel-preview' },
					el(
						'strong',
						{},
						attributes.title ||
							__( 'Featured Slides', 'lumen-aria-blocks' )
					),
					el(
						'ul',
						{},
						slides.map( ( slide, index ) =>
							el(
								'li',
								{ key: `carousel-preview-${ index }` },
								slide.title
							)
						)
					)
				),
				slides.map( ( slide, index ) =>
					el(
						'div',
						{
							className: 'lumen-block-editor-item',
							key: `carousel-slide-${ index }`,
						},
						el(
							'div',
							{
								className: 'lumen-block-editor-item-toolbar',
							},
							el(
								'strong',
								{},
								`${ __( 'Slide', 'lumen-aria-blocks' ) } ${
									index + 1
								}`
							),
							el(
								Button,
								{
									isDestructive: true,
									isSmall: true,
									onClick: () => removeSlide( index ),
									disabled: slides.length <= 1,
								},
								__( 'Remove', 'lumen-aria-blocks' )
							)
						),
						el( TextControl, {
							label: __( 'Title', 'lumen-aria-blocks' ),
							value: slide.title,
							onChange: ( value ) =>
								updateSlide( index, 'title', value ),
						} ),
						el( TextareaControl, {
							label: __( 'Content', 'lumen-aria-blocks' ),
							value: slide.content,
							onChange: ( value ) =>
								updateSlide( index, 'content', value ),
						} )
					)
				),
				el(
					Button,
					{
						variant: 'secondary',
						onClick: addSlide,
					},
					__( 'Add Slide', 'lumen-aria-blocks' )
				)
			)
		);
	};

	registerBlockType( 'lumen/carousel', {
		edit: Edit,
		save: () => null,
	} );
} )( window.wp );

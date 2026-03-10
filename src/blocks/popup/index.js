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
	const { PanelBody, TextControl, TextareaControl, ToggleControl } =
		wp.components;
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

	const Edit = ( { attributes, setAttributes } ) => {
		const blockProps = useBlockProps( {
			className: 'lumen-block-editor lumen-block-editor-popup',
		} );

		const triggerLabel = attributes.triggerLabel || 'Open Popup';
		const popupTitle = attributes.popupTitle || 'Popup Title';
		const popupContent =
			attributes.popupContent || 'Popup content goes here.';
		const closeLabel = attributes.closeLabel || 'Close';

		return el(
			Fragment,
			{},
			el(
				InspectorControls,
				{},
				el(
					PanelBody,
					{
						title: __( 'Popup Settings', 'lumen-aria-blocks' ),
						initialOpen: true,
					},
					el( TextControl, {
						label: __( 'Trigger label', 'lumen-aria-blocks' ),
						value: attributes.triggerLabel || '',
						onChange: ( value ) =>
							setAttributes( { triggerLabel: value } ),
					} ),
					el( TextControl, {
						label: __( 'Popup title', 'lumen-aria-blocks' ),
						value: attributes.popupTitle || '',
						onChange: ( value ) =>
							setAttributes( { popupTitle: value } ),
					} ),
					el( TextareaControl, {
						label: __( 'Popup content', 'lumen-aria-blocks' ),
						value: attributes.popupContent || '',
						onChange: ( value ) =>
							setAttributes( { popupContent: value } ),
						help: __(
							'Supports basic HTML when rendered.',
							'lumen-aria-blocks'
						),
					} ),
					el( TextControl, {
						label: __( 'Popup role label', 'lumen-aria-blocks' ),
						value: attributes.popupRoleLabel || '',
						onChange: ( value ) =>
							setAttributes( { popupRoleLabel: value } ),
						help: __(
							'Accessible purpose announced to assistive technologies.',
							'lumen-aria-blocks'
						),
					} ),
					el( TextControl, {
						label: __( 'Close button label', 'lumen-aria-blocks' ),
						value: attributes.closeLabel || '',
						onChange: ( value ) =>
							setAttributes( { closeLabel: value } ),
					} ),
					el( ToggleControl, {
						label: __( 'Alert popup', 'lumen-aria-blocks' ),
						checked: toBoolean( attributes.isAlert, false ),
						onChange: ( value ) =>
							setAttributes( { isAlert: Boolean( value ) } ),
					} )
				)
			),
			el(
				'div',
				blockProps,
				el(
					'h3',
					{ className: 'lumen-block-editor-title' },
					__( 'Popup', 'lumen-aria-blocks' )
				),
				el(
					'p',
					{ className: 'lumen-block-editor-help' },
					__(
						'Frontend output is server-rendered and enhanced by runtime Popup when available.',
						'lumen-aria-blocks'
					)
				),
				el(
					'button',
					{
						type: 'button',
						className: 'lumen-popup-trigger-preview',
						disabled: true,
					},
					triggerLabel
				),
				el(
					'div',
					{ className: 'lumen-popup-preview' },
					el(
						'h4',
						{ className: 'lumen-popup-preview-title' },
						popupTitle
					),
					el(
						'p',
						{ className: 'lumen-popup-preview-content' },
						popupContent
					),
					el(
						'button',
						{
							type: 'button',
							className: 'lumen-popup-close-preview',
							disabled: true,
						},
						closeLabel
					)
				)
			)
		);
	};

	registerBlockType( 'lumen/popup', {
		edit: Edit,
		save: () => null,
	} );
} )( window.wp );

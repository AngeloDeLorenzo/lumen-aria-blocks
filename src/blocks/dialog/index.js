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
	const { PanelBody, TextControl, TextareaControl, ToggleControl, Notice } =
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
			className: 'lumen-block-editor lumen-block-editor-dialog',
		} );

		const triggerLabel = attributes.triggerLabel || 'Open Dialog';
		const title = attributes.title || 'Dialog Title';
		const content = attributes.content || 'Dialog content goes here.';
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
						title: __( 'Dialog Settings', 'lumen-aria-blocks' ),
						initialOpen: true,
					},
					el( TextControl, {
						label: __( 'Trigger label', 'lumen-aria-blocks' ),
						value: attributes.triggerLabel || '',
						onChange: ( value ) =>
							setAttributes( { triggerLabel: value } ),
					} ),
					el( TextControl, {
						label: __( 'Dialog title', 'lumen-aria-blocks' ),
						value: attributes.title || '',
						onChange: ( value ) =>
							setAttributes( { title: value } ),
					} ),
					el( TextareaControl, {
						label: __( 'Dialog content', 'lumen-aria-blocks' ),
						value: attributes.content || '',
						onChange: ( value ) =>
							setAttributes( { content: value } ),
						help: __(
							'Supports basic HTML when rendered.',
							'lumen-aria-blocks'
						),
					} ),
					el( TextControl, {
						label: __( 'Close button label', 'lumen-aria-blocks' ),
						value: attributes.closeLabel || '',
						onChange: ( value ) =>
							setAttributes( { closeLabel: value } ),
					} ),
					el( TextControl, {
						label: __(
							'Accessible role label',
							'lumen-aria-blocks'
						),
						value: attributes.roleLabel || '',
						onChange: ( value ) =>
							setAttributes( { roleLabel: value } ),
						help: __(
							'Used by the runtime dialog profile as an accessible label.',
							'lumen-aria-blocks'
						),
					} ),
					el( ToggleControl, {
						label: __( 'Modal dialog', 'lumen-aria-blocks' ),
						checked: toBoolean( attributes.isModal, true ),
						onChange: ( value ) =>
							setAttributes( { isModal: Boolean( value ) } ),
					} ),
					el( ToggleControl, {
						label: __( 'Alert dialog', 'lumen-aria-blocks' ),
						checked: toBoolean( attributes.isAlert, false ),
						onChange: ( value ) =>
							setAttributes( { isAlert: Boolean( value ) } ),
					} ),
					el( ToggleControl, {
						label: __(
							'Close on backdrop click',
							'lumen-aria-blocks'
						),
						checked: toBoolean( attributes.closeOnBackdrop, true ),
						onChange: ( value ) =>
							setAttributes( {
								closeOnBackdrop: Boolean( value ),
							} ),
						disabled: ! toBoolean( attributes.isModal, true ),
					} )
				)
			),
			el(
				'div',
				blockProps,
				el(
					'h3',
					{ className: 'lumen-block-editor-title' },
					__( 'Dialog', 'lumen-aria-blocks' )
				),
				el(
					'p',
					{ className: 'lumen-block-editor-help' },
					__(
						'Frontend output is server-rendered and progressively enhanced by runtime when available.',
						'lumen-aria-blocks'
					)
				),
				! triggerLabel || ! title
					? el(
							Notice,
							{ status: 'warning', isDismissible: false },
							__(
								'Trigger label and title should not be empty.',
								'lumen-aria-blocks'
							)
					  )
					: null,
				el(
					'button',
					{
						type: 'button',
						className: 'lumen-dialog-trigger-preview',
						disabled: true,
					},
					triggerLabel
				),
				el(
					'div',
					{ className: 'lumen-dialog-preview' },
					el(
						'h4',
						{ className: 'lumen-dialog-preview-title' },
						title
					),
					el(
						'p',
						{ className: 'lumen-dialog-preview-content' },
						content
					),
					el(
						'button',
						{
							type: 'button',
							className: 'lumen-dialog-close-preview',
							disabled: true,
						},
						closeLabel
					)
				)
			)
		);
	};

	registerBlockType( 'lumen/dialog', {
		edit: Edit,
		save: () => null,
	} );
} )( window.wp );

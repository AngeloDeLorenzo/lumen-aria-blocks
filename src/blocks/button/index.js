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

	const hasValue = ( value ) =>
		typeof value === 'string' && value.trim() !== '';

	const resolveMode = ( attributes ) => {
		if ( hasValue( attributes.url ) ) {
			return 'link';
		}
		if ( hasValue( attributes.actionValue ) ) {
			return 'action';
		}
		if ( toBoolean( attributes.isToggle, false ) ) {
			return 'toggle';
		}
		return 'unconfigured';
	};

	const Edit = ( { attributes, setAttributes } ) => {
		const blockProps = useBlockProps( {
			className: 'lumen-block-editor lumen-block-editor-button',
		} );

		const label = attributes.label || __( 'Action', 'lumen-aria-blocks' );
		const isPressed = toBoolean( attributes.pressed, false );
		const isDisabled = toBoolean( attributes.disabled, false );
		const isToggle = toBoolean( attributes.isToggle, false );
		const mode = resolveMode( attributes );

		const modeLabelMap = {
			link: __( 'Link mode', 'lumen-aria-blocks' ),
			action: __( 'Action mode', 'lumen-aria-blocks' ),
			toggle: __( 'Toggle mode', 'lumen-aria-blocks' ),
			unconfigured: __( 'Not configured', 'lumen-aria-blocks' ),
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
						title: __( 'Button Settings', 'lumen-aria-blocks' ),
						initialOpen: true,
					},
					el( TextControl, {
						label: __( 'Visible label', 'lumen-aria-blocks' ),
						value: attributes.label || '',
						onChange: ( value ) =>
							setAttributes( { label: value } ),
					} ),
					el( TextControl, {
						label: __(
							'ARIA label (optional)',
							'lumen-aria-blocks'
						),
						value: attributes.ariaLabel || '',
						onChange: ( value ) =>
							setAttributes( { ariaLabel: value } ),
					} ),
					el( TextControl, {
						label: __( 'URL (Link mode)', 'lumen-aria-blocks' ),
						value: attributes.url || '',
						onChange: ( value ) => setAttributes( { url: value } ),
					} ),
					el( ToggleControl, {
						label: __( 'Open in new tab', 'lumen-aria-blocks' ),
						checked: toBoolean( attributes.openInNewTab, false ),
						onChange: ( value ) =>
							setAttributes( {
								openInNewTab: Boolean( value ),
							} ),
					} ),
					el( TextControl, {
						label: __( 'rel (optional)', 'lumen-aria-blocks' ),
						value: attributes.rel || '',
						onChange: ( value ) => setAttributes( { rel: value } ),
					} ),
					el( TextControl, {
						label: __(
							'Action value (Action mode)',
							'lumen-aria-blocks'
						),
						value: attributes.actionValue || '',
						onChange: ( value ) =>
							setAttributes( { actionValue: value } ),
					} ),
					el( TextareaControl, {
						label: __(
							'Action payload JSON (optional)',
							'lumen-aria-blocks'
						),
						value: attributes.actionPayload || '',
						help: __(
							'Example: {"id":123,"source":"hero"}',
							'lumen-aria-blocks'
						),
						onChange: ( value ) =>
							setAttributes( { actionPayload: value } ),
					} ),
					el( ToggleControl, {
						label: __( 'Toggle button', 'lumen-aria-blocks' ),
						checked: isToggle,
						onChange: ( value ) =>
							setAttributes( { isToggle: Boolean( value ) } ),
					} ),
					isToggle
						? el( ToggleControl, {
								label: __(
									'Pressed by default',
									'lumen-aria-blocks'
								),
								checked: isPressed,
								onChange: ( value ) =>
									setAttributes( {
										pressed: Boolean( value ),
									} ),
						  } )
						: null,
					isToggle
						? el( TextControl, {
								label: __( 'Field name', 'lumen-aria-blocks' ),
								value: attributes.fieldName || '',
								onChange: ( value ) =>
									setAttributes( { fieldName: value } ),
						  } )
						: null,
					isToggle
						? el( TextControl, {
								label: __(
									'Pressed CSS class',
									'lumen-aria-blocks'
								),
								value: attributes.toggleClassName || 'pressed',
								onChange: ( value ) =>
									setAttributes( {
										toggleClassName: value || 'pressed',
									} ),
						  } )
						: null,
					el( ToggleControl, {
						label: __( 'Required', 'lumen-aria-blocks' ),
						checked: toBoolean( attributes.required, false ),
						onChange: ( value ) =>
							setAttributes( { required: Boolean( value ) } ),
					} ),
					el( ToggleControl, {
						label: __( 'Disabled', 'lumen-aria-blocks' ),
						checked: isDisabled,
						onChange: ( value ) =>
							setAttributes( { disabled: Boolean( value ) } ),
					} ),
					mode === 'unconfigured'
						? el(
								Notice,
								{
									status: 'warning',
									isDismissible: false,
								},
								__(
									'Configura link o action',
									'lumen-aria-blocks'
								)
						  )
						: null
				)
			),
			el(
				'div',
				blockProps,
				el(
					'h3',
					{ className: 'lumen-block-editor-title' },
					__( 'Button', 'lumen-aria-blocks' )
				),
				el(
					'p',
					{ className: 'lumen-block-editor-help' },
					`${ __( 'Current mode:', 'lumen-aria-blocks' ) } ${
						modeLabelMap[ mode ]
					}`
				),
				el(
					'div',
					{
						className:
							'lumen-block-editor-button-preview' +
							( mode === 'toggle' && isPressed
								? ' is-pressed'
								: '' ) +
							( isDisabled ? ' is-disabled' : '' ),
					},
					label
				)
			)
		);
	};

	registerBlockType( 'lumen/button', {
		edit: Edit,
		save: () => null,
	} );
} )( window.wp );

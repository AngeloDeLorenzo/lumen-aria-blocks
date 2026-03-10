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
		TextareaControl,
		SelectControl,
		ToggleControl,
		RangeControl,
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

	const Edit = ( { attributes, setAttributes } ) => {
		const blockProps = useBlockProps( {
			className: 'lumen-block-editor lumen-block-editor-tooltip',
		} );

		const mode = attributes.mode || 'hover';
		const triggerText = attributes.triggerText || 'What is this?';
		const tooltipText =
			attributes.tooltipText ||
			'Use this field to provide extra context about the current action.';
		const delayTimeout = Number.isFinite(
			Number( attributes.delayTimeout )
		)
			? Number( attributes.delayTimeout )
			: 3000;

		return el(
			Fragment,
			{},
			el(
				InspectorControls,
				{},
				el(
					PanelBody,
					{
						title: __( 'Tooltip Settings', 'lumen-aria-blocks' ),
						initialOpen: true,
					},
					el( TextControl, {
						label: __( 'Trigger text', 'lumen-aria-blocks' ),
						value: attributes.triggerText || '',
						onChange: ( value ) =>
							setAttributes( { triggerText: value } ),
					} ),
					el( TextControl, {
						label: __( 'Trigger ARIA label', 'lumen-aria-blocks' ),
						value: attributes.triggerAriaLabel || '',
						onChange: ( value ) =>
							setAttributes( { triggerAriaLabel: value } ),
						help: __(
							'Optional. If empty, trigger text is used.',
							'lumen-aria-blocks'
						),
					} ),
					el( TextareaControl, {
						label: __( 'Tooltip text', 'lumen-aria-blocks' ),
						value: attributes.tooltipText || '',
						onChange: ( value ) =>
							setAttributes( { tooltipText: value } ),
						help: __(
							'Supports basic HTML when rendered.',
							'lumen-aria-blocks'
						),
					} ),
					el( SelectControl, {
						label: __( 'Open mode', 'lumen-aria-blocks' ),
						value: mode,
						options: [
							{
								label: __(
									'Hover + Focus',
									'lumen-aria-blocks'
								),
								value: 'hover',
							},
							{
								label: __( 'Focus Only', 'lumen-aria-blocks' ),
								value: 'focus',
							},
							{
								label: __(
									'Manual (click toggle)',
									'lumen-aria-blocks'
								),
								value: 'manual',
							},
						],
						onChange: ( value ) =>
							setAttributes( { mode: value || 'hover' } ),
					} ),
					el( ToggleControl, {
						label: __( 'Manual close', 'lumen-aria-blocks' ),
						checked: toBoolean( attributes.manualClose, true ),
						onChange: ( value ) =>
							setAttributes( {
								manualClose: Boolean( value ),
							} ),
						help: __(
							'Applied in manual mode. Hover/focus mode closes on pointer leave or blur.',
							'lumen-aria-blocks'
						),
					} ),
					el( RangeControl, {
						label: __( 'Open delay (ms)', 'lumen-aria-blocks' ),
						value: Number( attributes.delay ) || 0,
						onChange: ( value ) =>
							setAttributes( {
								delay: Number( value ) || 0,
							} ),
						min: 0,
						max: 2000,
					} ),
					el( RangeControl, {
						label: __(
							'Auto-close timeout (ms)',
							'lumen-aria-blocks'
						),
						value: delayTimeout,
						onChange: ( value ) =>
							setAttributes( {
								delayTimeout: Number( value ) || 0,
							} ),
						min: 0,
						max: 6000,
					} )
				)
			),
			el(
				'div',
				blockProps,
				el(
					'h3',
					{ className: 'lumen-block-editor-title' },
					__( 'Tooltip', 'lumen-aria-blocks' )
				),
				el(
					'p',
					{ className: 'lumen-block-editor-help' },
					__(
						'Frontend uses runtime Tooltip when available and a keyboard-accessible fallback otherwise.',
						'lumen-aria-blocks'
					)
				),
				el(
					'div',
					{ className: 'lumen-block-editor-tooltip-preview' },
					el(
						'button',
						{
							type: 'button',
							disabled: true,
							className: 'lumen-block-editor-tooltip-trigger',
						},
						triggerText
					),
					el(
						'span',
						{ className: 'lumen-block-editor-tooltip-badge' },
						mode
					),
					el(
						'div',
						{ className: 'lumen-block-editor-tooltip-box' },
						tooltipText
					)
				)
			)
		);
	};

	registerBlockType( 'lumen/tooltip', {
		edit: Edit,
		save: () => null,
	} );
} )( window.wp );

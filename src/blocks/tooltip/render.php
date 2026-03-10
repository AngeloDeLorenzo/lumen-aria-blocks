<?php
if (!defined('ABSPATH')) {
    exit;
}

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound

lumen_aria_blocks_enqueue_view_script_for_block('lumen/tooltip');

$defaults = array(
    'triggerText' => __('What is this?', 'lumen-aria-blocks'),
    'triggerAriaLabel' => '',
    'tooltipText' => __('Use this field to provide extra context about the current action.', 'lumen-aria-blocks'),
    'mode' => 'hover',
    'manualClose' => true,
    'delay' => 250,
    'delayTimeout' => 3000,
);

$attributes = wp_parse_args(is_array($attributes) ? $attributes : array(), $defaults);
$noscript_message = __('This interactive feature requires JavaScript.', 'lumen-aria-blocks');

$trigger_text = isset($attributes['triggerText']) && is_string($attributes['triggerText']) && trim($attributes['triggerText']) !== ''
    ? sanitize_text_field($attributes['triggerText'])
    : $defaults['triggerText'];

$trigger_aria_label = isset($attributes['triggerAriaLabel']) && is_string($attributes['triggerAriaLabel']) && trim($attributes['triggerAriaLabel']) !== ''
    ? sanitize_text_field($attributes['triggerAriaLabel'])
    : $trigger_text;

$tooltip_text = isset($attributes['tooltipText']) && is_string($attributes['tooltipText']) && trim($attributes['tooltipText']) !== ''
    ? $attributes['tooltipText']
    : $defaults['tooltipText'];

$mode = isset($attributes['mode']) && is_string($attributes['mode']) ? $attributes['mode'] : 'hover';
if (!in_array($mode, array('hover', 'focus', 'manual'), true)) {
    $mode = 'hover';
}

$manual_close = lumen_aria_blocks_to_bool($attributes['manualClose'] ?? $defaults['manualClose'], $defaults['manualClose']);
$delay = isset($attributes['delay']) ? (int) $attributes['delay'] : 250;
$delay = max(0, min(3000, $delay));
$delay_timeout = isset($attributes['delayTimeout']) ? (int) $attributes['delayTimeout'] : 0;
$delay_timeout = max(0, min(10000, $delay_timeout));

$instance_id = lumen_aria_blocks_resolve_instance_id($attributes, 'lumen-tooltip-', $block ?? null);
$trigger_id = sprintf('%s-trigger', $instance_id);
$content_id = sprintf('%s-content', $instance_id);

$wrapper_attributes = get_block_wrapper_attributes(
    array(
        'id' => $instance_id,
        'class' => 'lumen-tooltip',
        'data-lumen-component' => 'tooltip',
        'data-tooltip-mode' => $mode,
        'data-manual-close' => $manual_close ? 'true' : 'false',
        'data-delay' => (string) $delay,
        'data-delay-timeout' => (string) $delay_timeout,
    )
);

ob_start();
?>
<div <?php echo wp_kses_data($wrapper_attributes); ?>>
  <button
    type="button"
    id="<?php echo esc_attr($trigger_id); ?>"
    class="lumen-tooltip-trigger aria-tooltip"
    aria-label="<?php echo esc_attr($trigger_aria_label); ?>"
    aria-expanded="false"
    data-tooltip="#<?php echo esc_attr($content_id); ?>"
  >
    <?php echo esc_html($trigger_text); ?>
  </button>
  <div id="<?php echo esc_attr($content_id); ?>" class="lumen-tooltip-template" hidden>
    <div class="lumen-tooltip-text"><?php echo wp_kses_post($tooltip_text); ?></div>
  </div>
  <noscript>
    <p class="lumen-noscript-note" data-lumen-noscript="true"><?php echo esc_html($noscript_message); ?></p>
  </noscript>
</div>
<?php
return ob_get_clean();

// phpcs:enable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound

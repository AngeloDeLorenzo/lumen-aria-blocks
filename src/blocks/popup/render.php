<?php
if (!defined('ABSPATH')) {
    exit;
}

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound

lumen_aria_blocks_enqueue_view_script_for_block('lumen/popup');

$defaults = array(
    'triggerLabel' => __('Open popup', 'lumen-aria-blocks'),
    'popupTitle' => __('Popup title', 'lumen-aria-blocks'),
    'popupContent' => __('Popup content goes here.', 'lumen-aria-blocks'),
    'popupRoleLabel' => __('Popup details', 'lumen-aria-blocks'),
    'closeLabel' => __('Close', 'lumen-aria-blocks'),
    'isAlert' => false,
);

$attributes = wp_parse_args(is_array($attributes) ? $attributes : array(), $defaults);
$noscript_message = __('This interactive feature requires JavaScript.', 'lumen-aria-blocks');

$trigger_label = isset($attributes['triggerLabel']) && is_string($attributes['triggerLabel']) && trim($attributes['triggerLabel']) !== ''
    ? sanitize_text_field($attributes['triggerLabel'])
    : $defaults['triggerLabel'];

$popup_title = isset($attributes['popupTitle']) && is_string($attributes['popupTitle']) && trim($attributes['popupTitle']) !== ''
    ? sanitize_text_field($attributes['popupTitle'])
    : $defaults['popupTitle'];

$popup_content = isset($attributes['popupContent']) && is_string($attributes['popupContent']) && trim($attributes['popupContent']) !== ''
    ? $attributes['popupContent']
    : $defaults['popupContent'];

$popup_role_label = isset($attributes['popupRoleLabel']) && is_string($attributes['popupRoleLabel']) && trim($attributes['popupRoleLabel']) !== ''
    ? sanitize_text_field($attributes['popupRoleLabel'])
    : $defaults['popupRoleLabel'];

$close_label = isset($attributes['closeLabel']) && is_string($attributes['closeLabel']) && trim($attributes['closeLabel']) !== ''
    ? sanitize_text_field($attributes['closeLabel'])
    : $defaults['closeLabel'];

$is_alert = lumen_aria_blocks_to_bool($attributes['isAlert'] ?? $defaults['isAlert'], $defaults['isAlert']);

$instance_id = lumen_aria_blocks_resolve_instance_id($attributes, 'lumen-popup-', $block ?? null);
$trigger_id = sprintf('%s-trigger', $instance_id);
$popup_id = sprintf('%s-content', $instance_id);
$title_id = sprintf('%s-title', $instance_id);
$body_id = sprintf('%s-body', $instance_id);

/* translators: %s: popup role label (for example, "Popup details"). */
$boundary_start_label = sprintf(__('Start of %s.', 'lumen-aria-blocks'), $popup_role_label);
/* translators: %s: popup role label (for example, "Popup details"). */
$boundary_end_label = sprintf(__('End of %s.', 'lumen-aria-blocks'), $popup_role_label);

$wrapper_attributes = get_block_wrapper_attributes(
    array(
        'id' => $instance_id,
        'class' => 'lumen-popup',
        'data-lumen-component' => 'popup',
        'data-popup-role-label' => $popup_role_label,
        'data-popup-alert' => $is_alert ? 'true' : 'false',
        'data-boundary-start-label' => $boundary_start_label,
        'data-boundary-end-label' => $boundary_end_label,
    )
);

ob_start();
?>
<div <?php echo wp_kses_data($wrapper_attributes); ?>>
  <button
    type="button"
    id="<?php echo esc_attr($trigger_id); ?>"
    class="lumen-popup-trigger aria-popup"
    data-controls="<?php echo esc_attr($popup_id); ?>"
    aria-controls="<?php echo esc_attr($popup_id); ?>"
    aria-expanded="false"
  >
    <?php echo esc_html($trigger_label); ?>
  </button>

  <div
    id="<?php echo esc_attr($popup_id); ?>"
    class="lumen-popup-template"
    hidden
  >
    <div class="lumen-popup-surface">
      <div class="lumen-popup-header">
        <h3 id="<?php echo esc_attr($title_id); ?>" class="lumen-popup-title"><?php echo esc_html($popup_title); ?></h3>
        <button
          type="button"
          class="lumen-popup-close CloseDC"
          data-popup-close="true"
          aria-label="<?php echo esc_attr($close_label); ?>"
        >
          <?php echo esc_html($close_label); ?>
        </button>
      </div>
      <div id="<?php echo esc_attr($body_id); ?>" class="lumen-popup-body">
        <?php echo wp_kses_post(wpautop($popup_content)); ?>
      </div>
    </div>
  </div>
  <noscript>
    <p class="lumen-noscript-note" data-lumen-noscript="true"><?php echo esc_html($noscript_message); ?></p>
  </noscript>
</div>
<?php
return ob_get_clean();

// phpcs:enable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound

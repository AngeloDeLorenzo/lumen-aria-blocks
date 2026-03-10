<?php
if (!defined('ABSPATH')) {
    exit;
}

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound

lumen_aria_blocks_enqueue_view_script_for_block('lumen/dialog');

$defaults = array(
    'triggerLabel' => __('Open dialog', 'lumen-aria-blocks'),
    'title' => __('Dialog title', 'lumen-aria-blocks'),
    'content' => __('Dialog content goes here.', 'lumen-aria-blocks'),
    'closeLabel' => __('Close', 'lumen-aria-blocks'),
    'roleLabel' => __('Dialog', 'lumen-aria-blocks'),
    'isModal' => true,
    'isAlert' => false,
    'closeOnBackdrop' => true,
);

$attributes = wp_parse_args(is_array($attributes) ? $attributes : array(), $defaults);
$noscript_message = __('This interactive feature requires JavaScript.', 'lumen-aria-blocks');

$trigger_label = isset($attributes['triggerLabel']) && is_string($attributes['triggerLabel']) && trim($attributes['triggerLabel']) !== ''
    ? sanitize_text_field($attributes['triggerLabel'])
    : $defaults['triggerLabel'];
$title = isset($attributes['title']) && is_string($attributes['title']) && trim($attributes['title']) !== ''
    ? sanitize_text_field($attributes['title'])
    : $defaults['title'];
$content = isset($attributes['content']) && is_string($attributes['content']) && trim($attributes['content']) !== ''
    ? $attributes['content']
    : $defaults['content'];
$close_label = isset($attributes['closeLabel']) && is_string($attributes['closeLabel']) && trim($attributes['closeLabel']) !== ''
    ? sanitize_text_field($attributes['closeLabel'])
    : $defaults['closeLabel'];
$role_label = isset($attributes['roleLabel']) && is_string($attributes['roleLabel']) && trim($attributes['roleLabel']) !== ''
    ? sanitize_text_field($attributes['roleLabel'])
    : $defaults['roleLabel'];

$is_modal = lumen_aria_blocks_to_bool($attributes['isModal'] ?? $defaults['isModal'], $defaults['isModal']);
$is_alert = lumen_aria_blocks_to_bool($attributes['isAlert'] ?? $defaults['isAlert'], $defaults['isAlert']);
$close_on_backdrop = lumen_aria_blocks_to_bool($attributes['closeOnBackdrop'] ?? $defaults['closeOnBackdrop'], $defaults['closeOnBackdrop']);

$instance_id = lumen_aria_blocks_resolve_instance_id($attributes, 'lumen-dialog-', $block ?? null);
$trigger_id = sprintf('%s-trigger', $instance_id);
$panel_id = sprintf('%s-panel', $instance_id);
$title_id = sprintf('%s-title', $instance_id);
$body_id = sprintf('%s-body', $instance_id);

/* translators: %s: dialog role label (for example, "Dialog"). */
$boundary_start_label = sprintf(__('Start of %s.', 'lumen-aria-blocks'), $role_label);
/* translators: %s: dialog role label (for example, "Dialog"). */
$boundary_end_label = sprintf(__('End of %s.', 'lumen-aria-blocks'), $role_label);

$wrapper_attributes = get_block_wrapper_attributes(
    array(
        'id' => $instance_id,
        'class' => 'lumen-dialog',
        'data-lumen-component' => 'dialog',
        'data-is-modal' => $is_modal ? 'true' : 'false',
        'data-is-alert' => $is_alert ? 'true' : 'false',
        'data-close-on-backdrop' => $close_on_backdrop ? 'true' : 'false',
        'data-dialog-role-label' => $role_label,
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
    class="lumen-dialog-trigger aria-dialog"
    data-controls="<?php echo esc_attr($panel_id); ?>"
    aria-controls="<?php echo esc_attr($panel_id); ?>"
    aria-haspopup="dialog"
    aria-expanded="false"
  >
    <?php echo esc_html($trigger_label); ?>
  </button>

  <div
    id="<?php echo esc_attr($panel_id); ?>"
    class="lumen-dialog-template"
    hidden
  >
    <div class="lumen-dialog-surface" role="document">
      <h2 id="<?php echo esc_attr($title_id); ?>" class="lumen-dialog-title"><?php echo esc_html($title); ?></h2>
      <div id="<?php echo esc_attr($body_id); ?>" class="lumen-dialog-body">
        <?php echo wp_kses_post(wpautop($content)); ?>
      </div>
      <div class="lumen-dialog-actions">
        <button type="button" class="lumen-dialog-close CloseDC" data-dialog-close="true" aria-label="<?php echo esc_attr($close_label); ?>">
          <?php echo esc_html($close_label); ?>
        </button>
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

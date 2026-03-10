<?php
if (!defined('ABSPATH')) {
    exit;
}

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound

lumen_aria_blocks_enqueue_view_script_for_block('lumen/button');

$defaults = array(
    'label' => 'Action',
    'ariaLabel' => '',
    'url' => '',
    'openInNewTab' => false,
    'rel' => '',
    'actionValue' => '',
    'actionPayload' => '',
    'isToggle' => false,
    'pressed' => false,
    'required' => false,
    'disabled' => false,
    'fieldName' => 'lumen-button-toggle',
    'toggleClassName' => 'pressed',
);

$attributes = wp_parse_args(is_array($attributes) ? $attributes : array(), $defaults);

$label = isset($attributes['label']) && is_string($attributes['label']) && trim($attributes['label']) !== ''
    ? $attributes['label']
    : $defaults['label'];

$aria_label = isset($attributes['ariaLabel']) && is_string($attributes['ariaLabel']) && trim($attributes['ariaLabel']) !== ''
    ? $attributes['ariaLabel']
    : $label;

$url = isset($attributes['url']) && is_string($attributes['url']) && trim($attributes['url']) !== ''
    ? esc_url_raw(trim($attributes['url']))
    : '';

$open_in_new_tab = lumen_aria_blocks_to_bool($attributes['openInNewTab'] ?? $defaults['openInNewTab'], $defaults['openInNewTab']);

$rel = isset($attributes['rel']) && is_string($attributes['rel']) && trim($attributes['rel']) !== ''
    ? sanitize_text_field($attributes['rel'])
    : '';

if ($open_in_new_tab) {
    $rel_tokens = preg_split('/\s+/', $rel);
    if (!is_array($rel_tokens)) {
        $rel_tokens = array();
    }

    if (!in_array('noopener', $rel_tokens, true)) {
        $rel_tokens[] = 'noopener';
    }

    if (!in_array('noreferrer', $rel_tokens, true)) {
        $rel_tokens[] = 'noreferrer';
    }

    $rel = implode(' ', array_filter($rel_tokens, static function ($token) {
        return is_string($token) && trim($token) !== '';
    }));
}

$action_value = isset($attributes['actionValue']) && is_string($attributes['actionValue']) && trim($attributes['actionValue']) !== ''
    ? trim($attributes['actionValue'])
    : '';

$action_payload = isset($attributes['actionPayload']) && is_string($attributes['actionPayload'])
    ? trim($attributes['actionPayload'])
    : '';

$is_toggle = lumen_aria_blocks_to_bool($attributes['isToggle'] ?? $defaults['isToggle'], $defaults['isToggle']);
$is_pressed = lumen_aria_blocks_to_bool($attributes['pressed'] ?? $defaults['pressed'], $defaults['pressed']);
$is_required = lumen_aria_blocks_to_bool($attributes['required'] ?? $defaults['required'], $defaults['required']);
$is_disabled = lumen_aria_blocks_to_bool($attributes['disabled'] ?? $defaults['disabled'], $defaults['disabled']);

$field_name = isset($attributes['fieldName']) && is_string($attributes['fieldName']) && trim($attributes['fieldName']) !== ''
    ? sanitize_key($attributes['fieldName'])
    : $defaults['fieldName'];

if ($field_name === '') {
    $field_name = $defaults['fieldName'];
}

$toggle_class_name = isset($attributes['toggleClassName']) && is_string($attributes['toggleClassName']) && trim($attributes['toggleClassName']) !== ''
    ? preg_replace('/[^a-zA-Z0-9_-]/', '', $attributes['toggleClassName'])
    : $defaults['toggleClassName'];

if ($toggle_class_name === '') {
    $toggle_class_name = $defaults['toggleClassName'];
}

$mode = 'unconfigured';
if ($url !== '') {
    $mode = 'link';
} elseif ($action_value !== '') {
    $mode = 'action';
} elseif ($is_toggle) {
    $mode = 'toggle';
}

$instance_id = lumen_aria_blocks_resolve_instance_id($attributes, 'lumen-button-', $block ?? null);
$trigger_id = sprintf('%s-trigger', $instance_id);

$wrapper_attributes = get_block_wrapper_attributes(
    array(
        'id' => $instance_id,
        'class' => 'lumen-button',
        'data-lumen-component' => 'button',
        'data-button-mode' => $mode,
        'data-is-toggle' => $is_toggle ? 'true' : 'false',
        'data-toggle-class' => $toggle_class_name,
        'data-required' => $is_required ? 'true' : 'false',
    )
);

$trigger_classes = array('lumen-button-trigger', 'aria-button');
if ($mode === 'toggle' && $is_pressed) {
    $trigger_classes[] = $toggle_class_name;
}
if ($is_disabled) {
    $trigger_classes[] = 'is-disabled';
}

$link_href = ($mode === 'link' && !$is_disabled) ? $url : '';

ob_start();
?>
<div <?php echo wp_kses_data($wrapper_attributes); ?>>
  <?php if ($mode === 'link') : ?>
    <a
      id="<?php echo esc_attr($trigger_id); ?>"
      class="<?php echo esc_attr(implode(' ', $trigger_classes)); ?>"
      role="button"
      aria-label="<?php echo esc_attr($aria_label); ?>"
      aria-disabled="<?php echo $is_disabled ? 'true' : 'false'; ?>"
      <?php echo $link_href !== '' ? 'href="' . esc_url($link_href) . '"' : ''; ?>
      <?php echo ($open_in_new_tab && $link_href !== '') ? 'target="_blank"' : ''; ?>
      <?php echo ($rel !== '' && $link_href !== '') ? 'rel="' . esc_attr($rel) . '"' : ''; ?>
      <?php echo $is_disabled ? 'tabindex="-1"' : ''; ?>
    >
      <span class="lumen-button-trigger__text"><?php echo esc_html($label); ?></span>
    </a>
  <?php elseif ($mode === 'action') : ?>
    <button
      id="<?php echo esc_attr($trigger_id); ?>"
      class="<?php echo esc_attr(implode(' ', $trigger_classes)); ?>"
      type="button"
      aria-label="<?php echo esc_attr($aria_label); ?>"
      <?php echo $is_disabled ? 'disabled' : ''; ?>
      data-action-value="<?php echo esc_attr($action_value); ?>"
      <?php echo $action_payload !== '' ? 'data-action-payload="' . esc_attr($action_payload) . '"' : ''; ?>
    >
      <span class="lumen-button-trigger__text"><?php echo esc_html($label); ?></span>
    </button>
  <?php elseif ($mode === 'toggle') : ?>
    <div
      id="<?php echo esc_attr($trigger_id); ?>"
      class="<?php echo esc_attr(implode(' ', $trigger_classes)); ?>"
      role="button"
      tabindex="<?php echo $is_disabled ? '-1' : '0'; ?>"
      aria-label="<?php echo esc_attr($aria_label); ?>"
      aria-disabled="<?php echo $is_disabled ? 'true' : 'false'; ?>"
      aria-pressed="<?php echo $is_pressed ? 'true' : 'false'; ?>"
      data-toggle="<?php echo esc_attr($is_pressed ? 'true' : 'false'); ?>"
    >
      <span class="lumen-button-trigger__text"><?php echo esc_html($label); ?></span>
      <input
        class="lumen-button-native"
        hidden
        type="checkbox"
        name="<?php echo esc_attr($field_name); ?>"
        value="1"
        <?php echo $is_pressed ? 'checked' : ''; ?>
        <?php echo $is_required ? 'required' : ''; ?>
        <?php echo $is_disabled ? 'disabled' : ''; ?>
      />
    </div>
  <?php else : ?>
    <button
      id="<?php echo esc_attr($trigger_id); ?>"
      class="<?php echo esc_attr(implode(' ', $trigger_classes)); ?>"
      type="button"
      aria-label="<?php echo esc_attr($aria_label); ?>"
      <?php echo $is_disabled ? 'disabled' : ''; ?>
      data-unconfigured="true"
    >
      <span class="lumen-button-trigger__text"><?php echo esc_html($label); ?></span>
    </button>
  <?php endif; ?>
</div>
<?php
return ob_get_clean();

// phpcs:enable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound

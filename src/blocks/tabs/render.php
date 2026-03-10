<?php
if (!defined('ABSPATH')) {
    exit;
}

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound

lumen_aria_blocks_enqueue_view_script_for_block('lumen/tabs');

$defaults = array(
    'orientation' => 'horizontal',
    'activationMode' => 'manual',
    'trackPage' => false,
    'trackPageMode' => 'replace',
    'activeIndex' => 0,
    'items' => array(
        array('label' => __('Tab One', 'lumen-aria-blocks'), 'content' => __('Tab Panel One Content', 'lumen-aria-blocks')),
        array('label' => __('Tab Two', 'lumen-aria-blocks'), 'content' => __('Tab Panel Two Content', 'lumen-aria-blocks')),
        array('label' => __('Tab Three', 'lumen-aria-blocks'), 'content' => __('Tab Panel Three Content', 'lumen-aria-blocks')),
    ),
);

$attributes = wp_parse_args(is_array($attributes) ? $attributes : array(), $defaults);
$items = is_array($attributes['items']) ? $attributes['items'] : $defaults['items'];
$items = array_values(
    array_filter(
        $items,
        static function ($item) {
            return is_array($item);
        }
    )
);

if (!$items) {
    $items = $defaults['items'];
}

$orientation = isset($attributes['orientation']) && $attributes['orientation'] === 'vertical' ? 'vertical' : 'horizontal';
$activation_mode = isset($attributes['activationMode']) && $attributes['activationMode'] === 'auto' ? 'auto' : 'manual';
$track_page = lumen_aria_blocks_to_bool($attributes['trackPage'] ?? $defaults['trackPage'], $defaults['trackPage']);
$track_page_mode = isset($attributes['trackPageMode']) && $attributes['trackPageMode'] === 'push' ? 'push' : 'replace';
$active_index = isset($attributes['activeIndex']) ? (int) $attributes['activeIndex'] : 0;
$active_index = max(0, min($active_index, count($items) - 1));

$instance_id = lumen_aria_blocks_resolve_instance_id($attributes, 'lumen-tabs-', $block ?? null);
$tab_root_id = sprintf('%s-panels', $instance_id);
$wrapper_attributes = get_block_wrapper_attributes(
    array(
        'id' => $instance_id,
        'class' => 'lumen-tabs',
        'data-lumen-component' => 'tabs',
        'data-orientation' => $orientation,
        'data-activation-mode' => $activation_mode,
        'data-track-page' => $track_page ? 'true' : 'false',
        'data-track-page-mode' => $track_page_mode,
    )
);

ob_start();
?>
<div <?php echo wp_kses_data($wrapper_attributes); ?>>
  <div class="lumen-tablist aria-tablist" role="tablist" aria-orientation="<?php echo esc_attr($orientation); ?>">
    <?php foreach ($items as $index => $item) : ?>
      <?php
      /* translators: %d: tab number. */
      $fallback_label = sprintf(__('Tab %d', 'lumen-aria-blocks'), $index + 1);
      $label = isset($item['label']) && is_string($item['label']) && trim($item['label']) !== '' ? sanitize_text_field($item['label']) : $fallback_label;
      $tab_id = sprintf('%s-tab-%d', $instance_id, $index + 1);
      $panel_id = sprintf('%s-panel-%d', $instance_id, $index + 1);
      $is_active = $index === $active_index;
      ?>
      <button
        type="button"
        id="<?php echo esc_attr($tab_id); ?>"
        class="lumen-tab-trigger aria-tab<?php echo $is_active ? ' active' : ''; ?>"
        data-controls="<?php echo esc_attr($panel_id); ?>"
        data-root="<?php echo esc_attr($tab_root_id); ?>"
        role="tab"
        aria-controls="<?php echo esc_attr($panel_id); ?>"
        aria-selected="<?php echo $is_active ? 'true' : 'false'; ?>"
        tabindex="<?php echo $is_active ? '0' : '-1'; ?>"
        <?php echo $is_active ? 'data-active' : ''; ?>
      >
        <?php echo esc_html($label); ?>
      </button>
    <?php endforeach; ?>
  </div>

  <div class="lumen-tabs__panels content" id="<?php echo esc_attr($tab_root_id); ?>">
    <?php foreach ($items as $index => $item) : ?>
      <?php
      $panel_id = sprintf('%s-panel-%d', $instance_id, $index + 1);
      $tab_id = sprintf('%s-tab-%d', $instance_id, $index + 1);
      $is_active = $index === $active_index;
      $content = isset($item['content']) && is_string($item['content']) ? $item['content'] : '';
      ?>
      <div
        id="<?php echo esc_attr($panel_id); ?>"
        class="lumen-tabpanel aria-tabpanel content"
        role="tabpanel"
        aria-labelledby="<?php echo esc_attr($tab_id); ?>"
        tabindex="0"
        <?php echo $is_active ? '' : 'hidden'; ?>
      >
        <?php echo wp_kses_post(wpautop($content)); ?>
      </div>
    <?php endforeach; ?>
  </div>
</div>
<?php
return ob_get_clean();

// phpcs:enable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound

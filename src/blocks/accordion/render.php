<?php
if (!defined('ABSPATH')) {
    exit;
}

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound

lumen_aria_blocks_enqueue_view_script_for_block('lumen/accordion');

$defaults = array(
    'allowMultiple' => false,
    'openFirst' => true,
    'singleTabStop' => false,
    'isToggle' => false,
    'trackPage' => false,
    'trackPageMode' => 'replace',
    'headingLevel' => 3,
    'items' => array(
        array('title' => __('Section One', 'lumen-aria-blocks'), 'content' => __('Section One Content', 'lumen-aria-blocks')),
        array('title' => __('Section Two', 'lumen-aria-blocks'), 'content' => __('Section Two Content', 'lumen-aria-blocks')),
        array('title' => __('Section Three', 'lumen-aria-blocks'), 'content' => __('Section Three Content', 'lumen-aria-blocks')),
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

$heading_level = isset($attributes['headingLevel']) ? (int) $attributes['headingLevel'] : 3;
$heading_level = max(2, min(6, $heading_level));
$heading_tag = tag_escape('h' . $heading_level);
$allow_multiple = lumen_aria_blocks_to_bool($attributes['allowMultiple'] ?? $defaults['allowMultiple'], $defaults['allowMultiple']);
$open_first = lumen_aria_blocks_to_bool($attributes['openFirst'] ?? $defaults['openFirst'], $defaults['openFirst']);
$single_tab_stop = lumen_aria_blocks_to_bool($attributes['singleTabStop'] ?? $defaults['singleTabStop'], $defaults['singleTabStop']);
$is_toggle = lumen_aria_blocks_to_bool($attributes['isToggle'] ?? $defaults['isToggle'], $defaults['isToggle']);
$track_page = lumen_aria_blocks_to_bool($attributes['trackPage'] ?? $defaults['trackPage'], $defaults['trackPage']);
$track_page_mode = isset($attributes['trackPageMode']) && $attributes['trackPageMode'] === 'push' ? 'push' : 'replace';

$instance_id = lumen_aria_blocks_resolve_instance_id($attributes, 'lumen-accordion-', $block ?? null);
$wrapper_attributes = get_block_wrapper_attributes(
    array(
        'id' => $instance_id,
        'class' => 'lumen-accordion',
        'data-lumen-component' => 'accordion',
        'data-allow-multiple' => $allow_multiple ? 'true' : 'false',
        'data-open-first' => $open_first ? 'true' : 'false',
        'data-single-tab-stop' => $single_tab_stop ? 'true' : 'false',
        'data-is-toggle' => $is_toggle ? 'true' : 'false',
        'data-track-page' => $track_page ? 'true' : 'false',
        'data-track-page-mode' => $track_page_mode,
        'data-heading-level' => (string) $heading_level,
    )
);

ob_start();
?>
<div <?php echo wp_kses_data($wrapper_attributes); ?>>
<?php foreach ($items as $index => $item) : ?>
<?php
    /* translators: %d: accordion section number. */
    $fallback_title = sprintf(__('Section %d', 'lumen-aria-blocks'), $index + 1);
    $title = isset($item['title']) && is_string($item['title']) && trim($item['title']) !== '' ? sanitize_text_field($item['title']) : $fallback_title;
    $content = isset($item['content']) && is_string($item['content']) ? $item['content'] : '';
    $is_active = $open_first && $index === 0;

    $trigger_id = sprintf('%s-trigger-%d', $instance_id, $index + 1);
    $panel_id = sprintf('%s-panel-%d', $instance_id, $index + 1);
    $root_id = sprintf('%s-root-%d', $instance_id, $index + 1);
    ?>
    <<?php echo esc_html($heading_tag); ?> class="lumen-accordion__heading">
      <button
        type="button"
        id="<?php echo esc_attr($trigger_id); ?>"
        class="lumen-accordion-trigger aria-accordion-trigger<?php echo $is_active ? ' open' : ''; ?>"
        data-controls="<?php echo esc_attr($panel_id); ?>"
        data-root="<?php echo esc_attr($root_id); ?>"
        aria-controls="<?php echo esc_attr($panel_id); ?>"
        aria-expanded="<?php echo $is_active ? 'true' : 'false'; ?>"
        <?php echo $is_active ? 'data-active' : ''; ?>
      >
        <?php echo esc_html($title); ?>
      </button>
    </<?php echo esc_html($heading_tag); ?>>
    <div id="<?php echo esc_attr($root_id); ?>" class="lumen-accordion__root insertContent">
      <div
        id="<?php echo esc_attr($panel_id); ?>"
        class="lumen-accordion__panel content"
        role="region"
        aria-labelledby="<?php echo esc_attr($trigger_id); ?>"
        <?php echo $is_active ? '' : 'hidden'; ?>
      >
        <?php echo wp_kses_post(wpautop($content)); ?>
      </div>
    </div>
<?php endforeach; ?>
</div>
<?php
return ob_get_clean();

// phpcs:enable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound

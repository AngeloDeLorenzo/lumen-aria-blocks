<?php
if (!defined('ABSPATH')) {
    exit;
}

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound

lumen_aria_blocks_enqueue_view_script_for_block('lumen/carousel');

$defaults = array(
    'title' => __('Featured slides', 'lumen-aria-blocks'),
    'mode' => 'manual',
    'autoplay' => false,
    'itemsDesktop' => 2,
    'slides' => array(
        array('title' => __('Slide one', 'lumen-aria-blocks'), 'content' => __('First slide content', 'lumen-aria-blocks')),
        array('title' => __('Slide two', 'lumen-aria-blocks'), 'content' => __('Second slide content', 'lumen-aria-blocks')),
        array('title' => __('Slide three', 'lumen-aria-blocks'), 'content' => __('Third slide content', 'lumen-aria-blocks')),
        array('title' => __('Slide four', 'lumen-aria-blocks'), 'content' => __('Fourth slide content', 'lumen-aria-blocks')),
    ),
);

$attributes = wp_parse_args(is_array($attributes) ? $attributes : array(), $defaults);

$title = isset($attributes['title']) && is_string($attributes['title']) && trim($attributes['title']) !== ''
    ? sanitize_text_field($attributes['title'])
    : $defaults['title'];

$mode = isset($attributes['mode']) && in_array($attributes['mode'], array('manual', 'auto', 'gallery'), true)
    ? $attributes['mode']
    : 'manual';

$autoplay = lumen_aria_blocks_to_bool($attributes['autoplay'] ?? $defaults['autoplay'], $defaults['autoplay']);
$items_desktop = isset($attributes['itemsDesktop']) ? (int) $attributes['itemsDesktop'] : 2;
$items_desktop = max(1, min(4, $items_desktop));

$raw_slides = is_array($attributes['slides']) ? $attributes['slides'] : $defaults['slides'];
$slides = array();

foreach ($raw_slides as $index => $slide) {
    if (!is_array($slide)) {
        continue;
    }

    /* translators: %d: slide number. */
    $fallback_slide_title = sprintf(__('Slide %d', 'lumen-aria-blocks'), $index + 1);
    $slide_title = isset($slide['title']) && is_string($slide['title']) && trim($slide['title']) !== ''
        ? sanitize_text_field($slide['title'])
        : $fallback_slide_title;

    /* translators: %d: slide content fallback number. */
    $fallback_slide_content = sprintf(__('Content %d', 'lumen-aria-blocks'), $index + 1);
    $slide_content = isset($slide['content']) && is_string($slide['content']) && trim($slide['content']) !== ''
        ? $slide['content']
        : $fallback_slide_content;

    $slides[] = array(
        'title' => $slide_title,
        'content' => $slide_content,
    );
}

if (!$slides) {
    $slides = $defaults['slides'];
}

$instance_id = lumen_aria_blocks_resolve_instance_id($attributes, 'lumen-carousel-', $block ?? null);
$controls_id = sprintf('%s-controls', $instance_id);

/* translators: 1: current slide page number, 2: total slide pages. */
$slide_label_template = __('Slide %1$d of %2$d', 'lumen-aria-blocks');
/* translators: 1: target slide page number. */
$nav_button_label_template = __('Go to slide page %1$d', 'lumen-aria-blocks');
/* translators: 1: current slide page number, 2: total slide pages. */
$manual_announcement_template = __('Slide page %1$d of %2$d', 'lumen-aria-blocks');

$wrapper_attributes = get_block_wrapper_attributes(
    array(
        'id' => $instance_id,
        'class' => 'lumen-carousel',
        'data-lumen-component' => 'carousel',
        'data-mode' => $mode,
        'data-autoplay' => $autoplay ? 'true' : 'false',
        'data-items-desktop' => (string) $items_desktop,
        'data-carousel-label' => $title,
        'data-slide-label-template' => $slide_label_template,
        'data-nav-label' => __('Carousel pagination', 'lumen-aria-blocks'),
        'data-nav-button-label-template' => $nav_button_label_template,
        'data-boundary-start-label' => __('Start of carousel region.', 'lumen-aria-blocks'),
        'data-boundary-end-label' => __('End of carousel region.', 'lumen-aria-blocks'),
        'data-manual-announcement-template' => $manual_announcement_template,
        'data-autoplay-start-label' => __('Start', 'lumen-aria-blocks'),
        'data-autoplay-stop-label' => __('Stop', 'lumen-aria-blocks'),
    )
);

ob_start();
?>
<div <?php echo wp_kses_data($wrapper_attributes); ?>>
  <h3 class="lumen-carousel-title"><?php echo esc_html($title); ?></h3>

  <div class="lumen-carousel-wrapper">
    <div class="my-slider">
      <?php foreach ($slides as $index => $slide) : ?>
        <div class="slide slide-<?php echo esc_attr((string) ($index + 1)); ?>">
          <article class="lumen-carousel-slide-card">
            <h4><?php echo esc_html($slide['title']); ?></h4>
            <p><?php echo wp_kses_post($slide['content']); ?></p>
          </article>
        </div>
      <?php endforeach; ?>
    </div>

    <div id="<?php echo esc_attr($controls_id); ?>" class="lumen-carousel-controls">
      <button type="button" class="previous"><?php esc_html_e('Previous', 'lumen-aria-blocks'); ?></button>
      <button type="button" class="next"><?php esc_html_e('Next', 'lumen-aria-blocks'); ?></button>
      <?php if ($autoplay || $mode === 'auto') : ?>
        <button type="button" class="auto"><?php esc_html_e('Start', 'lumen-aria-blocks'); ?></button>
      <?php endif; ?>
    </div>
  </div>
</div>
<?php
return ob_get_clean();

// phpcs:enable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound

<?php
/**
 * Plugin Name: Lumen ARIA Blocks
 * Description: Accessibility-oriented Gutenberg blocks and runtime integrations.
 * Version: 0.4.0
 * Requires at least: 6.5
 * Requires PHP: 7.4
 * Author: Angelo De Lorenzo
 * Author URI: https://angelodelorenzo.it
 * Text Domain: lumen-aria-blocks
 * License: GPL-2.0-or-later
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!defined('LUMEN_ARIA_BLOCKS_VERSION')) {
    define('LUMEN_ARIA_BLOCKS_VERSION', '0.4.0');
}

if (!defined('LUMEN_ARIA_BLOCKS_PATH')) {
    define('LUMEN_ARIA_BLOCKS_PATH', plugin_dir_path(__FILE__));
}

if (!defined('LUMEN_ARIA_BLOCKS_URL')) {
    define('LUMEN_ARIA_BLOCKS_URL', plugin_dir_url(__FILE__));
}

if (!function_exists('lumen_aria_blocks_to_bool')) {
    function lumen_aria_blocks_to_bool($value, $fallback = false) {
        if (is_bool($value)) {
            return $value;
        }

        if (is_int($value) || is_float($value)) {
            return (int) $value === 1;
        }

        if (is_string($value)) {
            $normalized = strtolower(trim($value));
            if (in_array($normalized, array('1', 'true', 'yes', 'on'), true)) {
                return true;
            }
            if (in_array($normalized, array('0', 'false', 'no', 'off', ''), true)) {
                return false;
            }
        }

        return (bool) $fallback;
    }
}

if (!function_exists('lumen_aria_blocks_resolve_instance_id')) {
    function lumen_aria_blocks_resolve_instance_id($attributes, $fallback_prefix = 'lumen-block-', $block = null) {
        $prefix = is_string($fallback_prefix) && $fallback_prefix !== ''
            ? $fallback_prefix
            : 'lumen-block-';

        $anchor = '';
        if (is_array($attributes) && isset($attributes['anchor']) && is_string($attributes['anchor'])) {
            $anchor = sanitize_title($attributes['anchor']);
        }

        if ($anchor === '' && $block instanceof WP_Block) {
            $parsed_attrs = $block->parsed_block['attrs'] ?? null;
            if (is_array($parsed_attrs) && isset($parsed_attrs['anchor']) && is_string($parsed_attrs['anchor'])) {
                $anchor = sanitize_title($parsed_attrs['anchor']);
            }
        }

        if ($anchor === '' && is_array($block) && isset($block['attrs']) && is_array($block['attrs'])) {
            if (isset($block['attrs']['anchor']) && is_string($block['attrs']['anchor'])) {
                $anchor = sanitize_title($block['attrs']['anchor']);
            }
        }

        if ($anchor !== '') {
            return $anchor;
        }

        return wp_unique_id($prefix);
    }
}

if (!function_exists('lumen_aria_blocks_get_view_script_handle')) {
    function lumen_aria_blocks_get_view_script_handle($block_name) {
        if (!is_string($block_name) || strpos($block_name, '/') === false) {
            return '';
        }

        list($namespace, $slug) = array_pad(explode('/', $block_name, 2), 2, '');

        if ($namespace !== 'lumen') {
            return '';
        }

        $slug = sanitize_key(str_replace('/', '-', $slug));

        if ($slug === '') {
            return '';
        }

        return sprintf('lumen-%s-view-script', $slug);
    }
}

if (!function_exists('lumen_aria_blocks_enqueue_view_script_for_block')) {
    function lumen_aria_blocks_enqueue_view_script_for_block($block_name) {
        $handle = lumen_aria_blocks_get_view_script_handle($block_name);
        if ($handle === '') {
            return;
        }

        if (wp_script_is($handle, 'registered')) {
            wp_enqueue_script($handle);
        }
    }
}

function lumen_aria_blocks_register_category($categories) {
    if (!is_array($categories)) {
        return $categories;
    }

    foreach ($categories as $category) {
        if (isset($category['slug']) && $category['slug'] === 'lumen-accessibility') {
            return $categories;
        }
    }

    $categories[] = array(
        'slug' => 'lumen-accessibility',
        'title' => __('Lumen Accessibility', 'lumen-aria-blocks'),
        'icon' => null,
    );

    return $categories;
}
add_filter('block_categories_all', 'lumen_aria_blocks_register_category', 10, 1);

function lumen_aria_blocks_get_asset_version($relative_path) {
    $absolute_path = LUMEN_ARIA_BLOCKS_PATH . ltrim((string) $relative_path, '/');
    if (is_readable($absolute_path)) {
        $modified = filemtime($absolute_path);
        if ($modified !== false) {
            return (string) $modified;
        }
    }

    return LUMEN_ARIA_BLOCKS_VERSION;
}

function lumen_aria_blocks_register_from_metadata() {
    $metadata_files = glob(LUMEN_ARIA_BLOCKS_PATH . 'src/blocks/*/block.json');

    if (!$metadata_files) {
        return;
    }

    sort($metadata_files);

    foreach ($metadata_files as $metadata_file) {
        if (!is_readable($metadata_file)) {
            continue;
        }

        $block_dir = dirname($metadata_file);
        $args = array();

        $render_file = $block_dir . '/render.php';
        if (file_exists($render_file)) {
            $args['render_callback'] = static function ($attributes = array(), $content = '', $block = null) use ($render_file) {
                $lumen_attributes = is_array($attributes) ? $attributes : array();
                $lumen_content = is_string($content) ? $content : '';
                $lumen_block = $block;

                ob_start();
                $result = include $render_file;
                $buffer = ob_get_clean();

                if (is_string($result) && $result !== '') {
                    return $result . (is_string($buffer) ? $buffer : '');
                }

                return is_string($buffer) ? $buffer : '';
            };
        }

        register_block_type($block_dir, $args);
    }
}
add_action('init', 'lumen_aria_blocks_register_from_metadata', 20);

function lumen_aria_blocks_get_runtime_accessibility_style_url() {
    $build_rel = 'build/runtime/lumen-accessibility.css';
    $src_rel = 'src/runtime/lumen-accessibility.css';

    if (file_exists(LUMEN_ARIA_BLOCKS_PATH . $build_rel)) {
        return array(
            'url' => LUMEN_ARIA_BLOCKS_URL . $build_rel,
            'relative' => $build_rel,
        );
    }

    if (file_exists(LUMEN_ARIA_BLOCKS_PATH . $src_rel)) {
        return array(
            'url' => LUMEN_ARIA_BLOCKS_URL . $src_rel,
            'relative' => $src_rel,
        );
    }

    return null;
}

function lumen_aria_blocks_register_accessibility_style() {
    $style_data = lumen_aria_blocks_get_runtime_accessibility_style_url();
    if (!is_array($style_data) || empty($style_data['url']) || empty($style_data['relative'])) {
        return;
    }

    wp_register_style(
        'lumen-aria-accessibility',
        $style_data['url'],
        array(),
        lumen_aria_blocks_get_asset_version($style_data['relative'])
    );
}
add_action('init', 'lumen_aria_blocks_register_accessibility_style', 6);

function lumen_aria_blocks_enqueue_accessibility_style() {
    if (wp_style_is('lumen-aria-accessibility', 'registered')) {
        wp_enqueue_style('lumen-aria-accessibility');
    }
}
add_action('wp_enqueue_scripts', 'lumen_aria_blocks_enqueue_accessibility_style', 6);

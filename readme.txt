=== Lumen ARIA Blocks ===
Contributors: angelo_de_lorenzo
Tags: accessibility, aria, gutenberg, wcag, blocks
Requires at least: 6.5
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 0.5.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Keyboard-first, accessibility-focused Gutenberg blocks with SSR output and progressive enhancement.

== Description ==

Lumen ARIA Blocks helps you publish interactive content that stays usable for keyboard and assistive technology users, while remaining practical for editorial teams in Gutenberg.

Why teams use Lumen ARIA Blocks:

- Better accessibility defaults out of the box (roles, states, keyboard behavior, focus handling).
- SSR-first output for robust rendering and content continuity.
- Theme-agnostic integration (works with any WordPress theme).
- Privacy-friendly runtime (no telemetry, no tracking scripts).

How it works:

- SSR-first dynamic blocks (content remains server-rendered).
- Progressive enhancement with block-specific frontend scripts, enqueued only when the related block is rendered.
- Runtime assets are served from your own WordPress site.
- No third-party runtime libraries are bundled in this release.

Available blocks in this release:

- Accordion
- Button (action/link/toggle)
- Carousel
- Dialog
- Popup
- Tabs
- Tooltip

This plugin is designed to work across themes and does not require coupling to a specific theme implementation.

Demo page: https://lumen.angelodelorenzo.it/lumen-aria-blocks

== Accessibility Contract ==

Lumen ARIA Blocks targets WCAG 2.2 AA intent with:

- keyboard-first interactions
- ARIA roles/state mapping per component
- focus-visible support
- reduced-motion baseline (`prefers-reduced-motion`)
- no-JS SSR fallback behavior for content continuity

ARIA contracts and QA checks are maintained in the release workflow and are not bundled in the plugin package.

== Privacy ==

- No analytics or telemetry are included.
- No third-party tracking requests are sent by the plugin.
- Runtime assets are loaded from your own WordPress site.

== Third-Party Libraries ==

- No third-party runtime libraries are bundled in this plugin release.
- `THIRD_PARTY_NOTICES.txt` remains included as distribution metadata.

== Installation ==

1. Upload the plugin folder to `/wp-content/plugins/lumen-aria-blocks`.
2. Activate **Lumen ARIA Blocks** from the Plugins screen.
3. In the block editor, open category **Lumen Accessibility**.
4. Insert blocks and configure attributes from block settings.

== Frequently Asked Questions ==

= Does this plugin work without JavaScript? =
Core content is server-rendered. Interactive enhancements require JavaScript, but the main content remains present in the markup.

= Does this plugin load external CDNs? =
No. Runtime assets are served from your WordPress site.

= Is third-party code bundled? =
No. This release does not bundle third-party runtime libraries. See `THIRD_PARTY_NOTICES.txt` for distribution details.

= Which blocks are included? =
Accordion, Button, Carousel, Dialog, Popup, Tabs, and Tooltip.

== Screenshots ==

1. Accordion block in frontend output with accessible disclosure behavior and clear section structure.
2. Accordion block in the editor with configurable items and settings for structured editorial content.
3. Dialog block in frontend output showing a focused modal interaction for task-bound content.
4. Button block in the editor with support for action, link, and toggle use cases.
5. Carousel block in frontend output with keyboard-operable controls and visible slide navigation.
6. Tooltip block in the editor with settings for concise contextual help and controlled interaction behavior.

== Changelog ==

= 0.5.0 =
* Refined popup behavior to keep it contextual and non-modal in normal keyboard flow.
* Narrowed tooltip runtime semantics and limited expanded-controls state to manual mode.
* Improved carousel autoplay behavior for reduced-motion users and keyboard interaction with controls.
* Strengthened modal dialog guarantees around focus trapping, background masking, and focus return.
* Expanded release-grade keyboard coverage for popup, tooltip, carousel, and dialog behavior.

= 0.4.0 =
* Introduced the first WordPress.org-ready public release.
* Added seven stable accessibility-focused blocks for editorial use.
* Strengthened keyboard, focus, and no-JS behavior across the block set.
* Improved runtime reliability and release validation for production use.
* Included release compliance metadata and third-party notices.

= 0.3.0 =
* Replaced full module preload strategy with block-scoped runtime initialization.
* Added deterministic runtime initialization safeguards.
* Hardened dialog/popup/tabs/tooltip behavior for interaction parity.

= 0.2.18 =
* Split scope to editorial/content blocks only.

== Upgrade Notice ==

= 0.5.0 =
Behavioral maturity update for Popup, Tooltip, Carousel, and Dialog, with stronger keyboard and reduced-motion handling.

= 0.4.0 =
First public WordPress.org release with the current stable block set and accessibility baseline.

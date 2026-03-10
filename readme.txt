=== Lumen ARIA Blocks ===
Contributors: angelo_de_lorenzo
Tags: accessibility, aria, gutenberg, wcag, blocks
Requires at least: 6.5
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 0.4.0
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
Core content is server-rendered. Interactive enhancements require JS, but SSR content remains present and release docs define fallback expectations.

= Does this plugin load external CDNs? =
No. Runtime assets are served from your WordPress site.

= Is third-party code bundled? =
No. This release does not bundle third-party runtime libraries. See `THIRD_PARTY_NOTICES.txt` for distribution details.

= Which blocks are included? =
Accordion, Button, Carousel, Dialog, Popup, Tabs, and Tooltip.

== Screenshots ==

1. Accordion block with keyboard-operable disclosure panels.
2. Tabs block showing active state and panel relationships.
3. Dialog block trigger and modal content surface.
4. Tooltip block in manual mode with explicit trigger state.
5. Carousel block with previous/next controls and pagination dots.
6. Popup block with close control and role labeling.

== Changelog ==

= 0.4.0 =
* Productized WordPress.org release workflow and packaging guidance.
* Added stable component contracts and practical implementation recipes.
* Added Playwright + axe-core QA suite with keyboard journeys and no-JS smoke tests.
* Added CI workflow with QA artifact upload.
* Added top-level third-party notices metadata for release compliance.

= 0.3.0 =
* Replaced full module preload strategy with block-scoped runtime initialization.
* Added deterministic runtime initialization safeguards.
* Hardened dialog/popup/tabs/tooltip behavior for interaction parity.

= 0.2.18 =
* Split scope to editorial/content blocks only.

== Upgrade Notice ==

= 0.4.0 =
This release introduces QA and release governance artifacts. Rebuild deployment payloads to exclude development artifacts before publishing.

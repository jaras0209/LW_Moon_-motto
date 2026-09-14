# Test report

Date: 2026-09-14

## Scope

44 checks passed against the local HTML/CSS/JavaScript source in headless Chromium. Tests render supplied source in memory without navigating to a hosted website. JSON responses, native share, and clipboard calls use controlled fixtures/stubs. A PNG download was actually emitted by the browser and its dimensions verified. Screenshots are real renders of the modified source with system font fallbacks.

This is not a live GitHub deployment test, a physical iPhone/Android/LINE test, a real native-share-target test, or a complete accessibility certification. Embedded layout was checked via a search-parameter stub, not a production cross-origin iframe permissions test.

## Results

- PASS: Initial title and one explicit draw action
- PASS: About section and redundant explanations removed
- PASS: Ready state does not display loading/help text
- PASS: Relative JSON path resolves under repository subfolder
- PASS: Keyboard draw and focus management
- PASS: Black rabbit silhouette, no eyes or separate facial details
- PASS: Reduced motion renders result immediately
- PASS: Requested card title and footer are painted
- PASS: PNG export is 1080 x 1350
- PASS: Actual browser download emits a valid PNG file
- PASS: Image-save fallback opens real image dialog
- PASS: Image dialog closes with Escape
- PASS: No browser runtime errors in primary flow
- PASS: Legacy reference hidden from DOM, accessible label, canvas, clipboard, share payload and filename
- PASS: Copied text contains only the selected message
- PASS: Share uses pre-generated PNG and text only
- PASS: Single available message can be drawn repeatedly
- PASS: Repeatable pool with avoidImmediateRepeat=True
- PASS: Repeatable pool with avoidImmediateRepeat=False
- PASS: Blank/null/disabled entries filtered, string entries supported
- PASS: Identical texts do not cause an empty draw pool
- PASS: Recoverable data failure http
- PASS: Retry successfully restores draw action after http
- PASS: Recoverable data failure invalid
- PASS: Retry successfully restores draw action after invalid
- PASS: Recoverable data failure ok empty
- PASS: Retry successfully restores draw action after ok
- PASS: Long and multiline text fits card without dropping content
- PASS: Responsive layout without horizontal overflow 320
- PASS: Responsive layout without horizontal overflow 375
- PASS: Responsive layout without horizontal overflow 390
- PASS: Download action in first result viewport at 390 x 844
- PASS: Responsive layout without horizontal overflow 768
- PASS: Responsive layout without horizontal overflow 1440
- PASS: Embedded layout hides own header/footer
- PASS: Embedded layout preserves all result actions
- PASS: Moon motion is enabled in normal mode
- PASS: Rabbit settles as an opaque silhouette after reveal
- PASS: Optional white silhouette is pure white
- PASS: Old branding and reference access removed from index.html
- PASS: Old branding and reference access removed from app.js
- PASS: Old branding and reference access removed from style.css
- PASS: Old branding and reference access removed from config.js
- PASS: Sample and template JSON omit reference fields

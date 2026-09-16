# Centered reference edition - local verification

Version: centered-reference-2

Environment: Chromium, Playwright, offline fixture injection. The exact production
JavaScript was executed; local image bytes and JSON were supplied in memory rather
than over a live hosting service. No GitHub or LINE account was accessed.
Google Fonts were not downloaded for these tests; installed Noto CJK fallback fonts
were used. No font files are included in the deliverables.

Result: 81 assertions passed; 0 uncaught page errors.

## Scope

- Visible glyph bounds centered horizontally at x=540 for every body line.
- Whole message ink block centered vertically at y=808 within y=480..1136.
- Reference illustration, border, title badge and decorative separators retained.
- Short, long, mixed-language, emoji, explicit-line and invalid-line-hint cases.
- Original text retained; excessive content raises an error instead of truncation.
- Real browser PNG download: 1080x1350, byte-identical to the preview canvas export.
- No reference, category or removed footer sentence in canvas/share/accessibility.
- Widths 320, 390, 768 and 1440: no horizontal overflow; card preview centered.
- Repeatable draws, optional immediate-repeat avoidance and single-item behavior.
- Share and clipboard payloads checked using test doubles, not device-native dialogs.
- Image preview dialog, reduced-motion CSS and embedded layout class.
- Data-load failure and recovery.

## Not verified here

Live GitHub deployment, real third-party iframe permission policies, and native
LINE / iOS / Android sharing. These still need testing after upload. The embedded
layout was checked by activating its CSS mode locally; this is not a live Google
Sites iframe integration test.

## Assertions

- PASS: Renderer version
- PASS: No explanatory about section
- PASS: Manual line breaks preserved
- PASS: Reference six-line font size
- PASS: Centered ink row 1
- PASS: Centered ink row 2
- PASS: Centered ink row 3
- PASS: Centered ink row 4
- PASS: Centered ink row 5
- PASS: Centered ink row 6
- PASS: Entire block vertically centered
- PASS: Safe reading margins
- PASS: Actual canvas uses center alignment
- PASS: No hidden source in rendered text
- PASS: Footer sentence not painted
- PASS: Relative data path retains project prefix
- PASS: PNG is 1080 x 1350
- PASS: Preview PNG equals downloaded PNG
- PASS: Clipboard preserves original text
- PASS: Sharing preserves text and PNG
- PASS: No hidden source in share or accessible label
- PASS: No hidden source in filename
- PASS: Image-saving dialog works
- PASS: Single item can be drawn repeatedly
- PASS: one_line preserves text
- PASS: one_line horizontal centering
- PASS: one_line vertical centering
- PASS: one_line safe area
- PASS: two_lines preserves text
- PASS: two_lines horizontal centering
- PASS: two_lines vertical centering
- PASS: two_lines safe area
- PASS: auto preserves text
- PASS: auto horizontal centering
- PASS: auto vertical centering
- PASS: auto safe area
- PASS: punctuation preserves text
- PASS: punctuation horizontal centering
- PASS: punctuation vertical centering
- PASS: punctuation safe area
- PASS: english preserves text
- PASS: english horizontal centering
- PASS: english vertical centering
- PASS: english safe area
- PASS: emoji preserves text
- PASS: emoji horizontal centering
- PASS: emoji vertical centering
- PASS: emoji safe area
- PASS: long preserves text
- PASS: long horizontal centering
- PASS: long vertical centering
- PASS: long safe area
- PASS: bad_lines preserves text
- PASS: bad_lines horizontal centering
- PASS: bad_lines vertical centering
- PASS: bad_lines safe area
- PASS: newlines preserves text
- PASS: newlines horizontal centering
- PASS: newlines vertical centering
- PASS: newlines safe area
- PASS: Very long content reports an error without truncation
- PASS: 320 initial no horizontal overflow
- PASS: 320 result no horizontal overflow
- PASS: 320 preview centered in viewport
- PASS: 390 initial no horizontal overflow
- PASS: 390 result no horizontal overflow
- PASS: 390 preview centered in viewport
- PASS: 768 initial no horizontal overflow
- PASS: 768 result no horizontal overflow
- PASS: 768 preview centered in viewport
- PASS: 1440 initial no horizontal overflow
- PASS: 1440 result no horizontal overflow
- PASS: 1440 preview centered in viewport
- PASS: Embed hides header
- PASS: Embed retains download
- PASS: Reduced motion respected
- PASS: Repeatable pool, immediate repeat avoided
- PASS: Consecutive repeats when configured
- PASS: Error state offers retry
- PASS: Retry recovers to drawable card
- PASS: No JavaScript page errors

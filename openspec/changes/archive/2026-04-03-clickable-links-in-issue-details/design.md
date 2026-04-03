## Context

The current item detail experience uses plain text for issue descriptions during both editing and display. That keeps storage and validation simple, but it means any URL included in a description is inert and cannot be opened directly from the detail view. The requested improvement is narrowly scoped: users want clickable links from the issue details page, not a broader markdown or rich-text system.

## Goals / Non-Goals

**Goals:**
- Make explicit URLs in issue descriptions clickable from the detail view.
- Preserve plain-text item description editing and storage.
- Keep the implementation local to the web UI without changing API or persistence contracts.
- Avoid introducing unsafe HTML rendering.

**Non-Goals:**
- Add markdown support, embedded previews, or general rich-text formatting.
- Change how descriptions are entered, validated, or stored in the database.
- Linkify all freeform text across the application outside the intended detail-view presentation.

## Decisions

### Detect and render only explicit URLs
The detail view should parse plain-text descriptions for explicit URLs such as `http://` and `https://` and render those substrings as anchor elements. Non-URL text should remain plain text. This solves the usability issue without implying support for richer formatting.

Alternative considered: support markdown-style links or full markdown rendering. This was rejected because it expands the scope from link usability into content formatting, sanitization, and authoring complexity.

### Keep editing as a textarea and improve only the read path
The edit form can remain a plain textarea, while the non-editing presentation in detail view becomes a rendered text block with linkified URLs. This keeps the current editing workflow intact and confines the behavior change to the display layer.

Alternative considered: replace the textarea with a rich preview or live-rendered editor. This was rejected because the request is specifically about clickable links from the detail page, not about changing authoring.

### Avoid unsafe HTML injection
The implementation should construct React nodes directly from parsed text segments instead of using `dangerouslySetInnerHTML`. Link rendering should use safe attributes for external navigation such as opening in a new tab with the appropriate rel values.

Alternative considered: sanitize and inject HTML. This was rejected because there is no need to introduce HTML rendering to support basic linkification.

## Risks / Trade-offs

- [URL detection misses edge cases] → Start with explicit URL detection and cover common punctuation boundaries in tests.
- [Users expect markdown after seeing links render] → Keep surrounding text presentation plain and avoid any other formatting affordances.
- [Malformed links produce awkward output] → Render only URLs that match the accepted detection pattern and leave the rest as plain text.
- [External links create a navigation surprise] → Open links in a new tab/window and keep the current detail context intact.

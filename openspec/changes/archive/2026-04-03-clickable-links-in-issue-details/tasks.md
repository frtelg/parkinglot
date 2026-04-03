## 1. Detail View Rendering

- [x] 1.1 Add a small UI helper that detects explicit `http://` and `https://` URLs in item description text and returns safe React nodes without using HTML injection.
- [x] 1.2 Update the item detail presentation in `src/components/parking-lot-app.tsx` so read-only issue descriptions render clickable links while editing remains a plain textarea.

## 2. Visual Polish

- [x] 2.1 Add any minimal styling needed so rendered description links are readable and clearly interactive in the detail view.
- [x] 2.2 Ensure link rendering preserves normal surrounding text and line breaks rather than turning the whole description into rich formatted content.

## 3. Verification

- [x] 3.1 Add or update component tests to cover clickable links in issue details, mixed plain text plus URLs, and safe external-link attributes.
- [x] 3.2 Run the relevant test coverage for the detail-view behavior and confirm item descriptions still save and render correctly.

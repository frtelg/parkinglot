## Why

Issue descriptions can already contain useful URLs, but the detail view currently presents that text in a way that does not let users open those links directly. This is worth fixing because issue detail is where users inspect context, and forcing copy-paste breaks the flow for linked references.

## What Changes

- Update the issue detail experience so URLs in an issue description can be opened directly from the details view.
- Preserve plain-text editing for issue descriptions while improving the read path in detail view.
- Limit linkification to safe, explicit URL detection rather than introducing general rich-text rendering.
- Keep item storage, APIs, and schema validation unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `parking-lot-items`: extend the item detail workflow so issue descriptions render detected URLs as clickable links when the user is viewing item details.

## Impact

- Affected code: `src/components/parking-lot-app.tsx`, related styling, and component tests
- Affected behavior: issue description rendering in the item detail view
- No API, database, persistence, or dependency changes expected

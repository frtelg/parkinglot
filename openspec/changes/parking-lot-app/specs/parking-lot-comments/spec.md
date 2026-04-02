## ADDED Requirements

### Requirement: Users can add comments to items
The system SHALL allow comments to be created on an individual parking lot item.

#### Scenario: Add comment to item
- **WHEN** a user submits a comment from an item's detail view
- **THEN** the system stores the comment on that item and shows it in the item's comment history

### Requirement: Users can edit existing comments
The system SHALL allow an existing comment to be edited without changing which item it belongs to.

#### Scenario: Edit comment
- **WHEN** a user updates the body of an existing comment
- **THEN** the system persists the new comment body and shows the updated comment in the item's history

### Requirement: Users can soft-delete comments
The system SHALL allow comments to be soft-deleted without destroying the underlying record.

#### Scenario: Soft-delete comment
- **WHEN** a user deletes an existing comment
- **THEN** the system removes it from the normal comment flow while retaining a recoverable internal record

### Requirement: Item comments are presented as persistent context
The system SHALL display comments in chronological order so item context is preserved over time.

#### Scenario: View comment timeline
- **WHEN** a user opens an item's detail view
- **THEN** the system shows the item's existing comments in chronological order with enough metadata to understand the sequence of updates

### Requirement: Comments include structured authorship metadata
The system SHALL store comment authorship as a structured author type and MAY include an optional display label.

#### Scenario: Record human or agent author
- **WHEN** a human or agent creates a comment
- **THEN** the system stores the comment with its author type and includes a display label when one is provided

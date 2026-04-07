## MODIFIED Requirements

### Requirement: The system exposes REST endpoints for item management
The system SHALL expose REST API endpoints to create, read, update, snooze, and list parking lot items.

#### Scenario: Create item through API
- **WHEN** a client sends a valid request to create an item
- **THEN** the system returns the created item with its identifier and initial lifecycle state

#### Scenario: Read item through API
- **WHEN** a client requests an existing item by identifier
- **THEN** the system returns the item details including status, snooze metadata when present, and comments summary or embedded comments

#### Scenario: Update item through API
- **WHEN** a client sends a valid request to update an existing item
- **THEN** the system persists the changes and returns the updated representation

#### Scenario: Snooze item through API
- **WHEN** a client sends a valid snooze request for an active item with a future wake-up time
- **THEN** the system stores the snooze period and returns the updated item in a representation that identifies it as snoozed until that time

#### Scenario: List items through API
- **WHEN** a client requests the item collection
- **THEN** the system returns parking lot items in a representation that supports overview display and status filtering

#### Scenario: Filter items by lifecycle view
- **WHEN** a client requests items for active, snoozed, resolved, or archived views
- **THEN** the system supports lifecycle-based filtering without requiring client-side search

### Requirement: The system exposes REST endpoints for lifecycle transitions
The system SHALL expose REST API endpoints to snooze, resolve, archive, and unarchive items.

#### Scenario: Snooze item through lifecycle API
- **WHEN** a client sends a valid snooze request for an active item
- **THEN** the system stores the snooze timing and removes the item from the active lifecycle view until the snooze expires

#### Scenario: Resolve item through API
- **WHEN** a client sends a valid resolve request for an item
- **THEN** the system stores the resolved state and returns the updated item

#### Scenario: Archive item through API
- **WHEN** a client sends a valid archive request for an item
- **THEN** the system stores the archived state and returns the updated item

#### Scenario: Unarchive item through API
- **WHEN** a client sends a valid unarchive request for an item
- **THEN** the system restores the item to a non-archived state and returns the updated item

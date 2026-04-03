# parking-lot-api Specification

## Purpose
TBD - created by archiving change parking-lot-app. Update Purpose after archive.
## Requirements
### Requirement: The system exposes REST endpoints for item management
The system SHALL expose REST API endpoints to create, read, update, and list parking lot items.

#### Scenario: Create item through API
- **WHEN** a client sends a valid request to create an item
- **THEN** the system returns the created item with its identifier and initial lifecycle state

#### Scenario: Read item through API
- **WHEN** a client requests an existing item by identifier
- **THEN** the system returns the item details including status and comments summary or embedded comments

#### Scenario: Update item through API
- **WHEN** a client sends a valid request to update an existing item
- **THEN** the system persists the changes and returns the updated representation

#### Scenario: List items through API
- **WHEN** a client requests the item collection
- **THEN** the system returns parking lot items in a representation that supports overview display and status filtering

#### Scenario: Filter items by lifecycle view
- **WHEN** a client requests items for active, resolved, or archived views
- **THEN** the system supports lifecycle-based filtering without requiring client-side search

### Requirement: The system exposes REST endpoints for lifecycle transitions
The system SHALL expose REST API endpoints to resolve, archive, and unarchive items.

#### Scenario: Resolve item through API
- **WHEN** a client sends a valid resolve request for an item
- **THEN** the system stores the resolved state and returns the updated item

#### Scenario: Archive item through API
- **WHEN** a client sends a valid archive request for an item
- **THEN** the system stores the archived state and returns the updated item

#### Scenario: Unarchive item through API
- **WHEN** a client sends a valid unarchive request for an item
- **THEN** the system restores the item to a non-archived state and returns the updated item

### Requirement: The system exposes REST endpoints for comments
The system SHALL expose REST API endpoints to add, edit, and soft-delete comments on an item.

#### Scenario: Add comment through API
- **WHEN** a client sends a valid request to add a comment to an item
- **THEN** the system stores the comment and returns the updated comment representation

#### Scenario: Edit comment through API
- **WHEN** a client sends a valid request to edit an existing comment
- **THEN** the system persists the updated comment body and returns the updated comment representation

#### Scenario: Soft-delete comment through API
- **WHEN** a client sends a valid request to delete an existing comment
- **THEN** the system soft-deletes the comment and returns a response that reflects the updated comment state

### Requirement: The REST API remains reusable beyond the web client
The system SHALL expose item and comment contracts that are reusable by future hosted and native clients without depending on the web UI implementation.

#### Scenario: Alternate client uses the same contracts
- **WHEN** a future macOS, iOS, Android, or hosted client consumes the parking lot API
- **THEN** the client can perform item and comment operations through the same stable resource and action contracts used by the web application


## ADDED Requirements

### Requirement: Users can manage parking lot items
The system SHALL allow users to create, edit, read, resolve, archive, and unarchive parking lot items from the application.

#### Scenario: Create an item
- **WHEN** a user submits a new item with a title and optional details
- **THEN** the system stores the item and shows it in the overview as an active item

#### Scenario: Edit an item
- **WHEN** a user updates an existing item's title or details
- **THEN** the system persists the changes and shows the updated content in the overview and detail view

#### Scenario: Resolve an item
- **WHEN** a user marks an item as resolved
- **THEN** the system stores the resolved state and visually distinguishes the item from active items

#### Scenario: Archive an item
- **WHEN** a user archives an unresolved or resolved item
- **THEN** the system stores the archived state and removes the item from the default active overview

#### Scenario: Unarchive an item
- **WHEN** a user unarchives an archived item
- **THEN** the system restores the item to the appropriate non-archived status without losing its details or comment history

### Requirement: Users do not permanently delete items in v1
The system SHALL not require or expose hard deletion of parking lot items in the first version.

#### Scenario: User wants to remove an item from active work
- **WHEN** a user no longer wants an item to appear in their active work list
- **THEN** the system provides archive and resolve workflows instead of permanently deleting the item

### Requirement: Users can browse items through an overview and detail workflow
The system SHALL provide a visual overview of items and open a detailed item view when a user selects an item.

#### Scenario: View overview list
- **WHEN** the user opens the parking lot application
- **THEN** the system shows a scannable list of items with enough summary information to identify current work quickly

#### Scenario: Open item details
- **WHEN** the user selects an item from the overview
- **THEN** the system opens a detail view containing the item's full information, status, and comments

### Requirement: The overview prioritizes clarity for parallel work
The system SHALL present item states and actions in a way that reduces cognitive load for users tracking multiple tasks at once.

#### Scenario: Default to active work
- **WHEN** the user opens the application
- **THEN** the system shows the Active view by default and hides resolved and archived items until the user switches views

#### Scenario: Order active work by recency
- **WHEN** the Active view displays multiple items
- **THEN** the system orders them by most recently updated first

#### Scenario: Separate lifecycle views
- **WHEN** the user wants to inspect resolved or archived work
- **THEN** the system provides separate Resolved and Archived views without mixing them into the default Active view

### Requirement: The application supports local-first operation
The system SHALL run as a single-user local application without requiring external network services for normal operation.

#### Scenario: Start and use app offline
- **WHEN** the user starts the application in an offline environment after local setup
- **THEN** the user can create, edit, resolve, archive, unarchive, and read items using local persistence only

#### Scenario: Persist local data across restarts
- **WHEN** the user closes and reopens the application on the same machine
- **THEN** previously created items, lifecycle state, and comments remain available locally

### Requirement: The application tolerates multiple local windows for one user
The system SHALL preserve item and comment data integrity when the same local user opens the application in multiple windows or tabs.

#### Scenario: Update item in another window
- **WHEN** a user updates an item in one local window and later views that item from another local window
- **THEN** the system presents the persisted latest state without corrupting the item or its comments

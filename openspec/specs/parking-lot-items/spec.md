# parking-lot-items Specification

## Purpose
TBD - created by archiving change parking-lot-app. Update Purpose after archive.
## Requirements
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
The system SHALL provide a visual overview of items and open a detailed item view only when a user explicitly selects an item.

#### Scenario: Initial load shows overview before detail
- **WHEN** the user opens the parking lot application
- **THEN** the system shows the current overview without automatically opening the first item's detail view

#### Scenario: Open item details from the list
- **WHEN** the user selects an item from the overview
- **THEN** the system opens a detail view above the overview containing the item's full information, status, comments, and a readable description presentation

#### Scenario: URLs in item details are clickable
- **WHEN** an item's description shown in the detail view contains explicit URLs
- **THEN** the system renders those URLs as clickable links without requiring the user to copy and paste them manually

#### Scenario: Non-link text remains plain text
- **WHEN** an item's description includes normal prose alongside URLs
- **THEN** the system preserves the surrounding text as plain text rather than treating the description as rich formatted content

#### Scenario: Switching lifecycle views does not auto-open detail
- **WHEN** the user switches between Active, Resolved, and Archived views
- **THEN** the system clears the current detail selection until the user explicitly selects another item in that view

### Requirement: The overview prioritizes clarity for parallel work
The system SHALL present item states and actions in a way that keeps the list visually primary, reduces unnecessary interface noise, preserves a user-controlled working order for active items, and makes the add-item entry point clearly distinguishable from item rows.

#### Scenario: List-first initial layout
- **WHEN** the user opens the application
- **THEN** the overview list is the most visually prominent workspace element, ahead of onboarding or creation chrome

#### Scenario: Detail overlays the list instead of splitting the screen
- **WHEN** the user opens an item from the overview
- **THEN** the system presents item detail as an overlay layered over the full-width list view instead of reserving a persistent side-by-side detail pane

#### Scenario: Progressive disclosure for item creation
- **WHEN** the user is scanning the overview but is not actively creating a new item
- **THEN** the system shows a compact add-item affordance instead of an always-expanded creation form

#### Scenario: Add-item affordance does not resemble a list item
- **WHEN** the user views the collapsed add-item control in the overview
- **THEN** the system presents it as a button-first call to action instead of a card-like surface that could be mistaken for an item in the list

#### Scenario: Add-item action stands out visually
- **WHEN** the user scans the overview for where to create a new item
- **THEN** the system uses accent styling on the add-item control so the creation action is easier to find than surrounding neutral controls

#### Scenario: Quieter supporting chrome
- **WHEN** the user scans the page shell and overview surfaces
- **THEN** the hero and supporting panels use restrained sizing and quieter visual treatment so they do not compete with the item list

#### Scenario: User reorders active items by drag and drop
- **WHEN** the user drags an item to a new position within the Active overview
- **THEN** the system updates the visible Active item order to match the dropped position

#### Scenario: Active item order persists across reloads
- **WHEN** the user has previously rearranged active items and later reloads or restarts the application
- **THEN** the system restores the same active-item order instead of recomputing it from recent activity timestamps

#### Scenario: Later activity does not override manual active ordering
- **WHEN** an active item receives later edits or comments after the user has arranged the Active overview
- **THEN** the system preserves the user-defined Active order instead of moving that item based on recency alone

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

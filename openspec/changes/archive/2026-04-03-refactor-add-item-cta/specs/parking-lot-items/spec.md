## MODIFIED Requirements

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

## MODIFIED Requirements

### Requirement: Users can browse items through an overview and detail workflow
The system SHALL provide a visual overview of items and open a detailed item view only when a user explicitly selects an item.

#### Scenario: Initial load shows overview before detail
- **WHEN** the user opens the parking lot application
- **THEN** the system shows the current overview without automatically opening the first item's detail view

#### Scenario: Open item details from the list
- **WHEN** the user selects an item from the overview
- **THEN** the system opens a detail view above the overview containing the item's full information, status, and comments

#### Scenario: Switching lifecycle views does not auto-open detail
- **WHEN** the user switches between Active, Resolved, and Archived views
- **THEN** the system clears the current detail selection until the user explicitly selects another item in that view

### Requirement: The overview prioritizes clarity for parallel work
The system SHALL present item states and actions in a way that keeps the list visually primary and reduces unnecessary interface noise.

#### Scenario: List-first initial layout
- **WHEN** the user opens the application
- **THEN** the overview list is the most visually prominent workspace element, ahead of onboarding or creation chrome

#### Scenario: Detail overlays the list instead of splitting the screen
- **WHEN** the user opens an item from the overview
- **THEN** the system presents item detail as an overlay layered over the full-width list view instead of reserving a persistent side-by-side detail pane

#### Scenario: Progressive disclosure for item creation
- **WHEN** the user is scanning the overview but is not actively creating a new item
- **THEN** the system shows a compact add-item affordance instead of an always-expanded creation form

#### Scenario: Quieter supporting chrome
- **WHEN** the user scans the page shell and overview surfaces
- **THEN** the hero and supporting panels use restrained sizing and quieter visual treatment so they do not compete with the item list

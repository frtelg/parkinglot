## MODIFIED Requirements

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

## MODIFIED Requirements

### Requirement: The overview prioritizes clarity for parallel work
The system SHALL present item states and actions in a way that reduces cognitive load for users tracking multiple tasks at once.

#### Scenario: New active item appears after external API creation
- **WHEN** a new active item is created through the API by another local client or process while the user is viewing the Active overview
- **THEN** the system refreshes the overview automatically so the new item appears without requiring a manual page refresh or view switch

#### Scenario: External creation does not force-open detail
- **WHEN** an externally-created item appears in the overview through automatic refresh
- **THEN** the system keeps the current detail state unchanged and does not automatically open the new item's detail view

#### Scenario: External creation in other lifecycle views does not disrupt the current view
- **WHEN** a new item is created through the API while the user is viewing Resolved or Archived items
- **THEN** the system may refresh in the background, but it does not navigate the user away from the current lifecycle view

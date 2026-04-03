## ADDED Requirements

### Requirement: Users can dismiss item detail with the keyboard
The system SHALL allow the user to close an open item detail overlay by pressing the `Escape` key.

#### Scenario: Escape closes the open detail view
- **WHEN** the user has an item detail view open and presses the `Escape` key
- **THEN** the system closes the detail view and returns the user to the overview

#### Scenario: Keyboard dismissal uses the existing close workflow
- **WHEN** the user closes an item detail view with the `Escape` key
- **THEN** the system clears the current detail selection and applies the same post-close state as the existing close controls

#### Scenario: Escape does nothing when no detail view is open
- **WHEN** the user presses the `Escape` key while no item detail view is open
- **THEN** the system leaves the overview state unchanged

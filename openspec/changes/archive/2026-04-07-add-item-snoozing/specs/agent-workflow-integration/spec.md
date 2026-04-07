## MODIFIED Requirements

### Requirement: Agents can interact with the parking lot through shared workflows
The system SHALL provide agent-agnostic skills or equivalent workflow definitions so AI agents can create, inspect, update, snooze, resolve, archive, and comment on parking lot items without relying on agent-specific prompt conventions.

#### Scenario: Agent creates or updates an item
- **WHEN** a supported AI agent invokes the shared parking lot workflow
- **THEN** the workflow maps the agent request to the correct parking lot API operation and returns a structured result

#### Scenario: Agent snoozes an item
- **WHEN** a supported AI agent invokes the shared parking lot workflow to snooze an active item until a future time
- **THEN** the workflow applies the snooze, returns the updated item state, and exposes the item through the Snoozed lifecycle view until expiry

#### Scenario: Agent comments on an item
- **WHEN** a supported AI agent invokes the shared comment workflow for an existing item
- **THEN** the workflow adds the comment to the target item and returns confirmation with the updated item context

### Requirement: Agent integrations support read and write operations by default
The system SHALL allow supported local agent integrations to create, edit, comment on, snooze, resolve, archive, and unarchive items by default.

#### Scenario: Agent performs write action
- **WHEN** a supported local agent invokes a valid write workflow against the parking lot
- **THEN** the system executes the requested mutation and returns the updated structured result

### Requirement: Agent integrations reuse the same core contracts as the application
The system SHALL align skill-driven and MCP-driven operations with the same item and comment behaviors exposed through the primary application API, including the Snoozed lifecycle view and automatic return to Active after snooze expiry.

#### Scenario: Agent and UI observe consistent behavior
- **WHEN** a user or agent performs the same logical operation through different integration paths
- **THEN** the system applies the same lifecycle rules, comment rules, snooze expiry behavior, and returned data semantics

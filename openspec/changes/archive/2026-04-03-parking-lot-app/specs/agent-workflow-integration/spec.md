## ADDED Requirements

### Requirement: Agents can interact with the parking lot through shared workflows
The system SHALL provide agent-agnostic skills or equivalent workflow definitions so AI agents can create, inspect, update, resolve, archive, and comment on parking lot items without relying on agent-specific prompt conventions.

#### Scenario: Agent creates or updates an item
- **WHEN** a supported AI agent invokes the shared parking lot workflow
- **THEN** the workflow maps the agent request to the correct parking lot API operation and returns a structured result

#### Scenario: Agent comments on an item
- **WHEN** a supported AI agent invokes the shared comment workflow for an existing item
- **THEN** the workflow adds the comment to the target item and returns confirmation with the updated item context

### Requirement: Agent integrations support read and write operations by default
The system SHALL allow supported local agent integrations to create, edit, comment on, resolve, archive, and unarchive items by default.

#### Scenario: Agent performs write action
- **WHEN** a supported local agent invokes a valid write workflow against the parking lot
- **THEN** the system executes the requested mutation and returns the updated structured result

### Requirement: MCP support is available when agents require tool transport
The system SHALL provide MCP-compatible integration when direct REST access is not sufficient for the target agent environment.

#### Scenario: MCP-backed agent integration
- **WHEN** an agent runtime requires MCP to access external tools
- **THEN** the system exposes parking lot operations through an MCP-compatible interface that preserves the same item and comment behaviors as the REST API

### Requirement: Agent integrations reuse the same core contracts as the application
The system SHALL align skill-driven and MCP-driven operations with the same item and comment behaviors exposed through the primary application API.

#### Scenario: Agent and UI observe consistent behavior
- **WHEN** a user or agent performs the same logical operation through different integration paths
- **THEN** the system applies the same lifecycle rules, comment rules, and returned data semantics

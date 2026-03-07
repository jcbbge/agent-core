---
name: prd
description: Create detailed Product Requirement Documents with full scope and specifications for agent implementation
license: MIT
compatibility: opencode
metadata:
  version: "1.0"
  category: documentation
---

# PRD Generation Skill

Creates detailed Product Requirement Documents (PRDs) with full scope and specifications for implementation by other agents.

## Philosophy
- **Defer complexity - earn it through measurement**
- Use a Computer Science professor's perspicuity in explaining complex theories
- Make concepts easily understandable for non-science students
- Use a Senior Software engineer's perspicacity in navigating complex systems and identifying key connections.
- Focus on clarity, transparency, and direct expression

## Core Principles

### Development Approach
- **Project Context**: Always consider current project structure, technologies, and coding standards
- **Framework Specificity**: Tailor suggestions to specific frameworks (e.g., SolidJS)
- **Code Preservation**: Avoid unnecessary changes to existing code unless explicitly requested
- **Incremental Changes**: Suggest small, manageable changes rather than large rewrites
- **Performance Consideration**: Always consider performance implications
- **Accessibility Focus**: Ensure suggestions maintain or improve accessibility
- **Best Practices Adherence**: Follow current best practices for language and framework

### Quality Standards
- **Error Handling**: Consider robust error handling in all code suggestions
- **Responsive Design**: Ensure all UI suggestions are responsive across all devices
- **Security Awareness**: Keep security best practices in mind

### Architectural Considerations
- **Code Reusability**: Promote creation of reusable components and functions
- **Dependency Management**: Be aware of project dependencies and suggest updates when beneficial
- **Version Control Consideration**: Format suggestions in a way that's friendly for version control systems
- **Scalability Focus**: Consider how suggestions might impact application scalability
- **Consistency Enforcement**: Ensure suggestions maintain consistency with existing codebase style and patterns
- **User Experience Priority**: Consider the end-user experience in all suggestions

## Usage
```
create for me a detailed prd with full scope and specification. we will give this to another agent to implement. we will keep this thread open to handle any questions the agent may have and then i will report back to you with updates as the agent progresses.
```

## Output Structure
The PRD skill generates comprehensive documents including:
- Executive Summary
- Technical Requirements
- Implementation Phases
- Success Metrics
- Risk Assessment
- Dependencies and Constraints
- Testing Strategy
- Deployment Considerations

## Integration
Designed for collaborative workflows where:
- PRD is created for implementation by another agent
- Original thread remains open for questions
- Progress updates are reported back for iteration
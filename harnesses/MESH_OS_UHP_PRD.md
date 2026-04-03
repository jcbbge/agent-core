# PRD: Mesh-OS Universal Harness Protocol (UHP) v1.0

## Executive Summary
This document serves as the Primary Source of Truth (PSOT) for building **Mesh-OS**, a deterministic, portable, and autonomous operating system for AI agents and human developers. It is built on the **Universal Harness Protocol (UHP)**. The system is designed around event-driven state changes (stigmergy) rather than hierarchical agent calls, utilizing the **10x Atomic Contract Framework** to guide "Work-Artifacts" through recursive **IPIT** (Ideate, Plan, Implement, Test) loops.

This framework ensures 10x Developer Experience (DX), 10x User Experience (UX), and 10x Agentic Autonomy.

## The Fractal Project Architecture (Domain-Agnostic Extension)

This system is explicitly designed to be **fractal and domain-agnostic**. A "Harness" is not just a container for software development; it is the universal wrapper for *any project in any industry* (e.g., a catering event, a real estate closing, a vendor migration). 

The 4-phase IPIT system scales fractally across the entire operational stack:
- **The Organization** executes a macro-IPIT loop (e.g., Yearly Operational Goal).
- **The Project/Team** executes a mid-IPIT loop (e.g., an 8-day Event Delivery or 30-day Client Onboarding).
- **The Agent/Individual** executes a micro-IPIT loop (e.g., Menu Item Prep or Database Schema Design).

Every project, regardless of its real-world domain, instantiates this exact same underlying Universal Harness Protocol. The `Ideate -> Plan -> Implement -> Test` transformation remains identical whether the "Artifact" is a software feature or a physical catering service.

---

## 0. First Principles (The Axioms)

1. **Work is an Artifact, Not a Task:** A "task" is ephemeral; an "artifact" is a stateful object that mutates over time.
2. **Stigmergy over Hierarchy:** Agents do not take "orders"; they respond to "traces" (state changes) left in the environment (the blackboard).
3. **The Recursive Loop:** Every large goal is an **IPIT** loop comprised of smaller IPIT loops. The "Implement" phase of a high-level agent is the "Ideate" phase of a sub-agent.
4. **Deterministic Portability (The "USB Drive" Dream):** The system must be "Plug-and-Play". If the environment isn't codified as code, the system doesn't exist. Dependencies and runtimes are isolated per project.

---

## 1. The Filesystem Anatomy (The Physical Layer)

Every project (Harness) must adhere to this invariant directory structure to ensure agent-readiness and zero-state portability.

```text
/project-root
├── .harness/               # The "Brain" of the project
│   ├── protocol.md         # The System Constitution (UHP rules for this harness)
│   ├── dna.json            # High-level project metadata (The "Soul")
│   └── ledger/             # The Stigmergic Blackboard (State Store)
├── contracts/              # The 10x Atomic Contracts (Dual-format: MD + JSON)
│   ├── active/             # Currently mutating artifacts
│   └── archive/            # Validated/Historical contracts
├── artifacts/              # The actual work-products (Code, Docs, Media)
├── protocols/              # Agent-specific IPIT playbooks
└── setup/                  # Deterministic environment scripts (Nix/Devbox/Docker)
```

---

## 2. The Universal Atom: The "Work-Artifact" & IPIT Engine

In a mesh, agents mutate a **Work-Artifact**. The artifact flows through the mesh, and agents perform their IPIT loop on it, mutating its state, and placing it back in the mesh.

### The IPIT Primitive Map (Domain-Agnostic)

| Phase | Functional Goal | General Unit of Work | 
| :--- | :--- | :--- | 
| **Ideate** | Context Synthesis | Gathering constraints, goals, and possibilities. Mapping "What" to "Why". | 
| **Plan** | Resource Orchestration | Mapping "How" to "When". Identifying dependencies and logistics (Task DAG). | 
| **Implement** | State Transformation | Converting the plan into a tangible or digital output (The "Doing"). | 
| **Test** | Integrity Validation | Comparing the "Output" against the "Ideation" constraints. | 

---

## 3. The 10x Atomic Contract Framework

Contracts are the envelopes that carry the Artifact through the IPIT loop. They are the only way state is mutated.

Every contract must be **dual-format**:
1. **Premium Markdown:** For 10x human UX (scannable, delightful, visual hierarchy).
2. **Embedded JSON:** For 10x agentic DX (machine-parseable at the end of the file).

### The Single Master 10x Meta-Prompt
*This prompt powers every atomic unit across all phases.*

> You are the 10x Atomic Contract Orchestrator — an elite AI Systems Architect that creates unbreakable, self-healing atomic units across the 4 planes: Ideation → Planning → Implementation → Validation.
> Your output must be **dual-format**:
> 1. Beautiful, scannable Markdown 
> 2. Embedded, perfectly valid JSON block at the very end
> 
> **PROJECT CONTEXT** [Insert project goal]
> **CURRENT PHASE** [Ideation / Planning / Implementation / Validation]
> **ATOMIC UNIT** [Description of work]
> **FULL LINEAGE** [Previous contract IDs or "START"]
> 
> Generate ONE precise **Atomic [PHASE] Contract** using this exact structure:
> [See Markdown Template Below]

### 3.1 Contract Markdown Structure Template

```markdown
**Atomic [PHASE] Contract** 
**Contract ID** `AC-[PHASE]-[YYYYMMDD]-[3-digit-sequence]`
**Project** [name] | **Plane** [emoji + name] | **Version** 1.0

📌 1. Unit Title: [crisp noun-phrase]
🎯 2. Phase Objective: [exact outcome]
🔗 3. Traceability Matrix: [Previous Contract | Next Expected Phase | Full Chain So Far]
📥 4. Pre-Conditions (Inputs Required): [machine-checkable list]
📤 5. Deliverables & Artifacts: [paths/formats]
✅ 6. Verifiable Success Criteria: [Droid-level verifiable list with 0-100 rubric]
🏁 7. Definition of Done + Post-Conditions: [what must be true to close]
🔄 8. Agentic Execution Playbook: [steps, self-reflection triggers, error-recovery]
🧪 9. Auto-Generated Validation Hooks: [tests, review checklist, metrics]
⚠️ 10. Risks, Assumptions & Mitigations: [list]
🔥 11. Completion Trigger & Next Action: [signal for 100% done]

🤖 Agent Reflection Section: (Filled after execution)
1. Did we meet every success criterion?
2. Score (0-100) + justification
3. What should the next atomic unit be?
```

### 3.2 Contract JSON Schema Definition (`contract.json`)

Appended at the absolute end of every contract file.

```json
{
  "contract_id": "AC-[PHASE]-[YYYYMMDD]-[SEQ]",
  "artifact_id": "Global identifier for the 'Work-Artifact'",
  "artifact_type": "System_Migration, Client_Contract, etc.",
  "ipit_phase": "IDEATE | PLAN | IMPLEMENT | TEST",
  "state_hash": "SHA-256 of the current artifact state",
  "lineage": ["ID of parent/preceding contracts"],
  "success_score": 0, // Assigned during Validation phase
  "mesh_subscription": {
    "prev_phase_trace": "AC-IDE-20260330-001",
    "next_phase_trigger": "IMPLEMENTATION_READY",
    "required_agents": ["Agent1", "Agent2"]
  },
  "stigmergy_trace": "Summary of state mutation left for next agent"
}
```

---

## 4. The Recursive Mesh (The Orchestration Layer)

The system scales recursively. The mesh logic replaces central controllers with **Stigmergic Handshakes**.

### 4.1 Stigmergic Triggers & Blackboard
- **The Blackboard:** Every project uses a central ledger (e.g., `/.harness/ledger/`, SurrealDB, or SQLite) where the Artifact lives.
- **The Subscription Model:** Agents "subscribe" to artifacts in specific states. (e.g., *“I am looking for any Artifact where Status == 'Planned'”*).
- **The Trigger:** When a Validation Contract (AC-VAL) reaches a Success Score > 90, the Artifact's state mutates to `COMPLETED`.
- **The Loop:** The `COMPLETED` state for a micro-artifact automatically becomes the `IDEATE` input for the subsequent mid-level artifact.

### 4.2 Scaling Strategy: The Inlet/Outlet Model
To remain a Platform Architect (and not a custom dev shop), the framework uses Inlets and Outlets:
- **Inlet:** A sensor (e.g., a webhook) injects a new ambiguous "Artifact" into the Mesh.
- **Mesh:** Agents pick up the Artifact and run the IPIT loop using standardized Atomic Contracts.
- **Outlet:** Once the Artifact hits the "Verified Value" (Test/Validate) phase, it triggers a real-world action (e.g., API call, invoice generation, code deployment).

---

## 5. The Portability Layer (The "USB" Sequence)

To plug into any client business or developer machine effortlessly:
- **Host OS:** Agnostic (Mac/Linux/WSL).
- **Environment Manager:** Devbox (Nix-based). `devbox.json` defines exact CLI tools, Node/Bun versions, databases.
- **Boot Sequence:** A single command (e.g., `devbox shell` followed by `./setup/boot.sh`) that:
  1. Validates `dna.json`.
  2. Ensures runtimes are isolated.
  3. Hydrates the ledger from the last known `state_hash`.

---

## 6. Ambiguity Triage & Roadblock Prevention

To guarantee an agent can build and operate this infrastructure without stalling:

1. **The "Half-Baked" Failsafe:** If an agent encounters friction or a roadblock, it is forbidden from idling. It must immediately issue an **AC-VAL (Validation)** contract with a Success Score < 50 and a **REASONING_LOG** explaining the blocker.
2. **Context Window Limits:** All 10x Contracts must fit within a standard LLM context window. If an artifact/contract exceeds ~20kb, it must be **Atomized** (split into smaller sub-contracts).
3. **Agnosticism Enforcement:** The "Work-Artifact" must never contain hard-coded vendor logic. Integrations (Stripe, HubSpot) must be abstracted via Adapters during the Implementation phase.
4. **Agent Handoffs:** Each agent gets ONLY its specific plane's JSON block, ensuring perfect isolation and preventing context pollution.

---
**End of Specification.**
*To begin implementation: Initialize the directory structure in Section 1 and generate the first AC-IDE contract.*
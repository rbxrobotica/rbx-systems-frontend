# Writing Style Guide

## Purpose

This guide defines the editorial voice for RBX Systems blog posts. The goal is to sound institutional, precise, and human, not AI-generated.

---

## Core Rules

### Never use em-dashes (—)

AI models overuse em-dashes. They make text sound algorithmic and stilted.

**Bad:**

```
The system is resilient — it self-heals automatically.
```

**Good:**

```
The system is resilient. It self-heals automatically.
```

Or use a comma when appropriate:

```
The system is resilient, self-healing automatically when pods crash.
```

### Never use arrows (→, ↓, ⇒)

Arrows are a visual crutch that LLMs use to show progression. Use proper prose instead.

**Bad:**

```
SUBMITTED → VALIDATING → CONSENSUS_PENDING → CANONICAL
                                           ↓
                                        REJECTED
```

**Good:**

```
A parameter moves through four states: SUBMITTED, VALIDATING, CONSENSUS_PENDING, and CANONICAL. If consensus fails, it becomes REJECTED.
```

Or use a simple bulleted list when describing flows:

```
State transitions follow this order:
- SUBMITTED (initial state)
- VALIDATING (being checked)
- CONSENSUS_PENDING (waiting for approval)
- CANONICAL (approved and active) or REJECTED (denied)
```

### Write like a human engineer

Use the tone of a Cursor or Anthropic blog post: clear, direct, technical but not pedantic.

- Prefer active voice
- Use short sentences when possible
- Avoid filler words ("essentially", "basically", "actually")
- Don't over-explain obvious things
- Trust the reader's technical competence

**Bad:**

```
It's worth noting that the system essentially provides a way to manage configuration parameters in a distributed manner, which is basically important because it allows for better consistency across services.
```

**Good:**

```
The system manages configuration parameters across services with guaranteed consistency.
```

---

## Formatting

### Code blocks

Use fenced code blocks with language tags:

```yaml
apiVersion: v1
kind: Service
```

### Lists

Use Markdown lists, not pseudo-graphical structures:

**Bad:**

```
Services ┬─ Robson
        ├─ TruthMetal
        └─ Strategos
```

**Good:**

```
Services:
- Robson
- TruthMetal
- Strategos
```

### Tables

Use Markdown tables when comparing data:

| Service    | Status  |
| ---------- | ------- |
| Robson     | Healthy |
| TruthMetal | Healthy |

---

## Tone

- **Institutional but not corporate**: Write as "RBX Systems" or "the RBX engineering team", not as a faceless brand.
- **Confident but not arrogant**: State facts clearly without hedging ("is", not "seems to be"), but acknowledge trade-offs.
- **Technical but not academic**: Use precise terminology, but don't write like a research paper.

---

## Security

Never include:

- IP addresses (internal or external)
- Credentials or API keys
- Internal hostnames or network topology
- Ongoing security incidents

---

## Language

Blog posts may be published in **English** and **pt-BR**.

- Prefer English for `rbxsystems.ch`
- Prefer pt-BR for `rbx.ia.br`
- When both variants exist, keep them semantically aligned instead of writing two unrelated articles under the same slug
- In `pt-BR`, use standard Portuguese orthography with UTF-8 accents and cedilha
- Never replace Portuguese diacritics with ASCII approximations such as `nao`, `producao`, `configuracao`, or `execucao`

# Skill Authoring Guide

How to write Claude Skills that are discoverable, effective, and production-ready.

**Source:** [Official Claude Skill Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)

---

## Skill Structure

```text
skill-name/
├── SKILL.md        # Required. Main instructions (<500 lines)
├── REFERENCE.md    # Optional. API details, loaded on demand
├── EXAMPLES.md     # Optional. Usage patterns, loaded on demand
└── scripts/        # Optional. Utility scripts
    └── helper.py
```

**How loading works:**

1. **Startup:** Only `name` and `description` from frontmatter are loaded (~100 tokens)
2. **Activation:** Full SKILL.md loads when skill is triggered (<5k tokens ideal)
3. **On-demand:** Referenced files load only when Claude needs them

---

## Naming

Use **gerund form** (verb + -ing). This clearly describes the activity.

| Form       | Examples                                      | Status     |
| ---------- | --------------------------------------------- | ---------- |
| Gerund     | `brainstorming`, `debugging`, `enforcing-tdd` | Preferred  |
| Noun-agent | `debugger`, `tdd-enforcer`                    | Acceptable |
| Vague      | `helper`, `utils`, `tools`                    | Avoid      |

**Rules:**

- Lowercase letters, numbers, hyphens only
- Max 64 characters
- No reserved words: `anthropic`, `claude`

---

## Description

The description is critical for discovery. Claude uses it to choose from 100+ available skills.

**Requirements:**

- Write in **third person** (not "I help you..." or "You can use this...")
- Include **what it does** AND **when to use it**
- Max 1024 characters

```yaml
# BAD - First person
description: I help you process PDFs

# BAD - Missing triggers
description: Processes PDF files

# GOOD - Third person + triggers
description: Extracts text from PDFs, fills forms, merges documents. Use when working with PDF files or when user mentions PDFs, forms, or document extraction.
```

---

## SKILL.md Body

### Size Limits

- Keep under **500 lines** for optimal performance
- If larger, split into referenced files

### Progressive Disclosure

Show just enough to help Claude decide what to do next. Reference details.

```markdown
# PDF Processing

## Quick Start

[Essential instructions here]

## Advanced Features

See [FORMS.md](FORMS.md) for form filling
See [REFERENCE.md](REFERENCE.md) for API details
```

**Key rules:**

- References **one level deep only** (no nested references)
- Long reference files need **table of contents** at top
- Use **forward slashes** in paths (`reference/guide.md`, not `reference\guide.md`)

### Conciseness

Claude is already smart. Only add context it doesn't have.

```markdown
# BAD - Over-explaining (~150 tokens)

PDF (Portable Document Format) files are a common file format that
contains text, images, and other content. To extract text from a PDF,
you'll need to use a library. There are many libraries available...

# GOOD - Concise (~50 tokens)

Use pdfplumber for text extraction:
\`\`\`python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
text = pdf.pages[0].extract_text()
\`\`\`
```

---

## Workflows

For complex tasks, provide checklists Claude can track.

```markdown
## Form Filling Workflow

Copy this checklist:

- [ ] Step 1: Analyze form (run analyze_form.py)
- [ ] Step 2: Create field mapping
- [ ] Step 3: Validate mapping
- [ ] Step 4: Fill form
- [ ] Step 5: Verify output

**Step 1: Analyze form**
Run: `python scripts/analyze_form.py input.pdf`
...
```

### Feedback Loops

For quality-critical operations, include validation steps:

```markdown
1. Make edits
2. **Validate immediately**: `python scripts/validate.py`
3. If validation fails → fix and validate again
4. **Only proceed when validation passes**
```

---

## Degrees of Freedom

Match specificity to task fragility:

| Freedom | When                      | Example                                           |
| ------- | ------------------------- | ------------------------------------------------- |
| High    | Multiple valid approaches | "Analyze code structure and suggest improvements" |
| Medium  | Preferred pattern exists  | Template with customization options               |
| Low     | Operations are fragile    | "Run exactly this script. Do not modify."         |

---

## Anti-Patterns

| Don't                     | Do                                        |
| ------------------------- | ----------------------------------------- |
| Windows paths (`\`)       | Forward slashes (`/`)                     |
| Offer too many options    | Provide default with escape hatch         |
| Assume packages installed | List dependencies explicitly              |
| Deeply nested references  | One level deep from SKILL.md              |
| Time-sensitive info       | Use "old patterns" section for deprecated |
| Inconsistent terminology  | Pick one term, use throughout             |

---

## Quality Checklist

Before publishing a skill:

- [ ] Name uses gerund form
- [ ] Description includes what + when (third person)
- [ ] SKILL.md under 500 lines
- [ ] References one level deep
- [ ] No time-sensitive information
- [ ] Consistent terminology throughout
- [ ] Concrete examples provided
- [ ] Tested with Haiku, Sonnet, and Opus

Run an architecture review on staged or recent changes.

## Steps:

1. Get changed files:
```bash
git diff --cached --name-only --diff-filter=ACM 2>/dev/null || git diff HEAD~1 --name-only
```

2. Read the project's `ARCHITECTURE.md` if it exists

3. Read the changed files

4. Review for these issues:
   - **Misplaced logic** - Business rules in wrong layer?
   - **God module** - Too many responsibilities (>10 dependents or >500 lines)?
   - **Leaky abstraction** - Implementation details exposed to callers?
   - **Tight coupling** - Changes would cascade unnecessarily?
   - **Boundary violation** - Import from disallowed layer?

5. Return verdict:
```json
{
  "issues": [],
  "verdict": "clean | minor | refactor_needed"
}
```

Verdicts:
- **clean**: No architectural issues
- **minor**: Small issues, doesn't block commit
- **refactor_needed**: Address before committing

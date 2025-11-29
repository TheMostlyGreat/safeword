# Planning

## Structure

- `user-stories/` - User stories for features (As a X / Given-When-Then)
  - `user-stories/archive/` - Completed/obsolete user stories
- `test-definitions/` - Test scenarios and acceptance criteria
  - `test-definitions/archive/` - Completed/obsolete test definitions
- `design/` - Design docs for complex features (>3 components, new data model, architectural decisions)
  - `design/archive/` - Completed/obsolete design docs
- `issues/` - Issue tracking and requirements
  - `issues/archive/` - Completed/obsolete issues

## Naming Convention

**Planning docs share the same prefix as their ticket:**

Example for ticket `001-user-authentication.md`:
- `user-stories/001-user-authentication.md`
- `test-definitions/001-user-authentication.md`
- `design/001-user-authentication.md`

This makes it easy to find all related docs: `ls **/001-user-authentication.md`

## Archiving

When planning docs are completed and no longer actively referenced:
- Move to corresponding `archive/` subfolder
- Preserves history while preventing bloat in active folders

## Workflow

1. **User stories** → Define what we're building
2. **Test definitions** → Define how we'll verify it works
3. **Design docs** (optional for complex features) → Plan implementation
4. **Implementation (TDD)** → RED → GREEN → REFACTOR
5. **Archive** → Move completed docs to archive/

See `@./.safeword/SAFEWORD.md` for full workflow.

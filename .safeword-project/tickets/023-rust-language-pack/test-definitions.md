# Test Definitions: Rust Language Pack

## Setup Scenarios

### [x] Scenario 1: Single-crate Rust project setup

```gherkin
Given a directory with Cargo.toml containing [package]
And no existing clippy.toml or rustfmt.toml
When I run `safeword setup`
Then .safeword/clippy.toml is created with complexity thresholds
And .safeword/rustfmt.toml is created with stable options
And clippy.toml is created at project root
And rustfmt.toml is created at project root
And Cargo.toml has [lints.clippy] section with pedantic enabled
And Cargo.toml has [lints.rust] section with unsafe_code = "deny"
```

### [x] Scenario 2: Workspace setup with member crates

```gherkin
Given a workspace with [workspace] in root Cargo.toml
And member crates in crates/core and crates/cli
And no existing lint configuration
When I run `safeword setup`
Then root Cargo.toml has [workspace.lints.clippy] section
And root Cargo.toml has [workspace.lints.rust] section
And crates/core/Cargo.toml has [lints] with workspace = true
And crates/cli/Cargo.toml has [lints] with workspace = true
```

### [x] Scenario 3: Virtual workspace setup (no root package)

```gherkin
Given a workspace with [workspace] but no [package] in root Cargo.toml
And member crates in crates/
When I run `safeword setup`
Then root Cargo.toml has [workspace.lints.clippy] section
And member crates inherit via lints.workspace = true
```

---

## Preservation Scenarios

### [x] Scenario 4: Existing clippy.toml is preserved

```gherkin
Given a Rust project with existing clippy.toml at project root
When I run `safeword setup`
Then project-root clippy.toml is NOT overwritten
And .safeword/clippy.toml IS created (for hooks)
```

### [x] Scenario 5: Existing Cargo.toml lints are skipped entirely (user owns)

```gherkin
Given a Rust project with existing [lints.clippy] section
When I run `safeword setup`
Then Cargo.toml lints section is NOT modified (user owns their config)
And .safeword/ configs are still created (for hooks)
```

**Design decision:** We skip entirely rather than merge because:

- TOML merging is complex and error-prone
- Users who configure lints know what they want
- Consistent with Scenario 6 (member skip) behavior

### [x] Scenario 6: Member with explicit [lints] section is skipped

```gherkin
Given a workspace with member crate having explicit [lints] section
When I run `safeword setup`
Then that member crate is NOT modified
And other members get lints.workspace = true
```

---

## Mixed Project Scenarios

### [x] Scenario 7: TypeScript + Rust polyglot project

```gherkin
Given a directory with package.json AND Cargo.toml
When I run `safeword setup`
Then eslint.config.mjs is created (TypeScript pack)
And clippy.toml is created (Rust pack)
And rustfmt.toml is created (Rust pack)
And both packs coexist without conflict
```

### [ ] Scenario 8: Add Rust to existing TypeScript project

```gherkin
Given an existing safeword TypeScript project
And I add a Cargo.toml to the project
When I run `safeword upgrade`
Then Rust pack is detected and installed
And clippy.toml and rustfmt.toml are created
And TypeScript configuration remains intact
```

---

## Lint Hook Scenarios

### [x] Scenario 9: Lint hook processes .rs files (rustfmt only)

```gherkin
Given a Rust project with safeword setup complete
And clippy and rustfmt are installed
When the lint hook is triggered for a .rs file
Then cargo clippy --fix runs on the file's package
And rustfmt formats the file using .safeword/rustfmt.toml
```

### [ ] Scenario 10: Lint hook uses package targeting in workspaces

```gherkin
Given a Rust workspace with crates/core and crates/cli
And safeword setup is complete
When the lint hook is triggered for crates/core/src/lib.rs
Then cargo clippy runs with -p core (not entire workspace)
And rustfmt formats only the changed file
```

### [ ] Scenario 11: Lint hook gracefully skips when tools missing

```gherkin
Given a Rust project with safeword setup complete
And clippy is NOT installed (rustup component not added)
When the lint hook is triggered for a .rs file
Then hook completes without error (nothrow)
And no crash or blocking error shown
```

---

## Pure Rust Scenarios

### [x] Scenario 12: Pure Rust project (no package.json)

```gherkin
Given a directory with only Cargo.toml (no package.json)
When I run `safeword setup`
Then Rust pack is installed
And NO package.json is created
And NO eslint.config.mjs is created
And .safeword directory is created with Rust configs
```

---

## Detection Scenarios

### [x] Scenario 13: Rust language detection

```gherkin
Given a directory with Cargo.toml
When detectLanguages() is called
Then languages.rust is true
```

### [ ] Scenario 14: Package detection for file mapping

```gherkin
Given a workspace with crates/core/src/lib.rs
When detectRustPackage('/workspace/crates/core/src/lib.rs') is called
Then it returns "core" (the package name)
```

### [ ] Scenario 15: Workspace root file detection

```gherkin
Given a workspace with build.rs at root (no [package] section)
When detectRustPackage('/workspace/build.rs') is called
Then it returns undefined (triggers whole-project clippy)
```

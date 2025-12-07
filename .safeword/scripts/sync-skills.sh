#!/usr/bin/env bash
#
# sync-skills.sh - Generate Claude Code and Cursor skill files from source
#
# Source:  .safeword/skills/*.md
# Targets: .claude/skills/safeword-*/SKILL.md
#          .cursor/rules/safeword-*.mdc
#
# Usage: ./.safeword/scripts/sync-skills.sh
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

SOURCE_DIR="$PROJECT_ROOT/.safeword/skills"
CLAUDE_DIR="$PROJECT_ROOT/.claude/skills"
CURSOR_DIR="$PROJECT_ROOT/.cursor/rules"

GENERATED_HEADER="# AUTO-GENERATED - DO NOT EDIT
# Source: .safeword/skills/%s.md
# Run: .safeword/scripts/sync-skills.sh
"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }

# Extract frontmatter value
get_frontmatter() {
    local file="$1"
    local key="$2"
    sed -n '/^---$/,/^---$/p' "$file" | grep "^$key:" | sed "s/^$key: *//"
}

# Extract body (everything after frontmatter)
# Skip first two --- lines (frontmatter delimiters), print everything after
get_body() {
    local file="$1"
    awk 'BEGIN{delim=0} /^---$/{delim++; if(delim<=2) next} delim>=2{print}' "$file"
}

# Generate Claude Code SKILL.md
generate_claude_skill() {
    local source_file="$1"
    local skill_name="$2"
    local target_dir="$CLAUDE_DIR/safeword-$skill_name"
    local target_file="$target_dir/SKILL.md"

    local name
    local description
    name=$(get_frontmatter "$source_file" "name")
    description=$(get_frontmatter "$source_file" "description")

    mkdir -p "$target_dir"

    # Write Claude format
    {
        # shellcheck disable=SC2059
        printf "$GENERATED_HEADER" "$skill_name"
        echo ""
        echo "---"
        echo "name: $name"
        echo "description: $description"
        echo "allowed-tools: '*'"
        echo "---"
        get_body "$source_file"
    } > "$target_file"

    log_info "Generated $target_file"
}

# Generate Cursor .mdc rule
generate_cursor_rule() {
    local source_file="$1"
    local skill_name="$2"
    local target_file="$CURSOR_DIR/safeword-$skill_name.mdc"

    local description
    description=$(get_frontmatter "$source_file" "description")

    mkdir -p "$CURSOR_DIR"

    # Write Cursor format
    {
        # shellcheck disable=SC2059
        printf "$GENERATED_HEADER" "$skill_name"
        echo ""
        echo "---"
        echo "description: $description"
        echo "alwaysApply: false"
        echo "---"
        get_body "$source_file"
    } > "$target_file"

    log_info "Generated $target_file"
}

# Main
main() {
    echo "Syncing skills from $SOURCE_DIR"
    echo ""

    if [[ ! -d "$SOURCE_DIR" ]]; then
        log_error "Source directory not found: $SOURCE_DIR"
        exit 1
    fi

    local count=0
    for source_file in "$SOURCE_DIR"/*.md; do
        if [[ ! -f "$source_file" ]]; then
            log_warn "No skill files found in $SOURCE_DIR"
            exit 0
        fi

        local skill_name
        skill_name=$(basename "$source_file" .md)

        generate_claude_skill "$source_file" "$skill_name"
        generate_cursor_rule "$source_file" "$skill_name"

        ((count++))
    done

    echo ""
    log_info "Synced $count skills to Claude Code and Cursor"
}

main "$@"

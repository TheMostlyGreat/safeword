#!/bin/bash
# Bisect test pollution: Find which test creates unwanted files or shared state
#
# Use when: Tests pass individually but fail together, tests leave files behind,
# tests affect each other, test isolation problems, shared state between tests
#
# Usage: ./bisect-test-pollution.sh <file_to_check> <test_pattern>
# Example: ./bisect-test-pollution.sh '.git' 'src/**/*.test.ts'

set -e

if [ $# -ne 2 ]; then
  echo "Usage: $0 <file_to_check> <test_pattern>"
  echo "Example: $0 '.git' 'src/**/*.test.ts'"
  echo ""
  echo "Runs tests one-by-one to find which creates <file_to_check>"
  exit 1
fi

POLLUTION_CHECK="$1"
TEST_PATTERN="$2"

echo "Searching for test that creates: $POLLUTION_CHECK"
echo "Test pattern: $TEST_PATTERN"
echo ""

# Get list of test files
TEST_FILES=$(find . -path "$TEST_PATTERN" 2>/dev/null | sort)
TOTAL=$(echo "$TEST_FILES" | grep -c . || echo 0)

if [ "$TOTAL" -eq 0 ]; then
  echo "No test files found matching: $TEST_PATTERN"
  exit 1
fi

echo "Found $TOTAL test files"
echo ""

COUNT=0
for TEST_FILE in $TEST_FILES; do
  COUNT=$((COUNT + 1))

  # Skip if pollution already exists
  if [ -e "$POLLUTION_CHECK" ]; then
    echo "Pollution already exists before test $COUNT/$TOTAL"
    echo "Clean it up first: rm -rf $POLLUTION_CHECK"
    exit 1
  fi

  echo "[$COUNT/$TOTAL] Testing: $TEST_FILE"

  # Run the test (adjust command for your test runner)
  npm test "$TEST_FILE" > /dev/null 2>&1 || true

  # Check if pollution appeared
  if [ -e "$POLLUTION_CHECK" ]; then
    echo ""
    echo "FOUND POLLUTER!"
    echo "  Test: $TEST_FILE"
    echo "  Created: $POLLUTION_CHECK"
    echo ""
    echo "To investigate:"
    echo "  npm test $TEST_FILE    # Run just this test"
    echo "  cat $TEST_FILE         # Review test code"
    exit 1
  fi
done

echo ""
echo "No polluter found - all tests clean!"
exit 0

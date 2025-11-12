# Testing Policy

## Overview

This is a **tech verification project** to evaluate Google Maps grounding capabilities. The goal is to move fast and verify functionality, not to build production-grade test coverage.

## Testing Principles

### ✅ DO

1. **Test main cases only (happy path)**
   - Verify endpoints return 200 OK
   - Check basic response structure
   - Confirm core functionality works

2. **Keep tests simple**
   - One assertion per test is often enough
   - Straightforward test names
   - Easy to read and understand

3. **Focus on speed**
   - Fast to write
   - Fast to run
   - Fast to understand

### ❌ DON'T

1. **No edge cases**
   - Don't test error scenarios
   - Don't test invalid inputs
   - Don't test boundary conditions

2. **No redundant tests**
   - Don't test middleware details (CORS, headers, etc.)
   - Don't test framework features (FastAPI/React already tested)
   - Don't test third-party libraries

3. **No complex scenarios**
   - No integration tests unless absolutely necessary
   - No end-to-end tests
   - No performance tests

## Examples

### ✅ Good Test (Simple)

```python
def test_health_check():
    """Test health endpoint returns success."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
```

### ❌ Bad Test (Too Complex)

```python
def test_health_check_with_headers_and_cors():
    """Test health endpoint with CORS and process time headers."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert "x-process-time" in response.headers  # Redundant
    assert "access-control-allow-origin" in response.headers  # Redundant
    assert float(response.headers["x-process-time"]) >= 0  # Redundant
```

## Test Coverage Guidelines

**Target:** ~30-50% coverage is fine

We don't need high test coverage. Just verify:
- Main endpoints work
- Core features function correctly
- No obvious breakage

## When to Write Tests

**Write tests for:**
- New API endpoints (just the happy path)
- Core business logic (main functionality only)
- Critical integrations (basic verification)

**Skip tests for:**
- Utility functions
- Configuration code
- Middleware
- Error handlers

## Test Structure

### Backend (Python/pytest)

```python
def test_feature_name():
    """Brief description of what's being tested."""
    # Arrange (if needed)
    # Act
    response = client.get("/endpoint")
    # Assert
    assert response.status_code == 200
```

### Frontend (if/when needed)

```javascript
test('component renders', () => {
  render(<Component />);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

## Running Tests

### Backend
```bash
cd backend
pytest                          # Run all tests
pytest tests/test_main.py       # Run specific file
pytest -v                       # Verbose output
```

### Frontend (future)
```bash
cd frontend
npm test                        # Run all tests
```

## Philosophy

> **"Good enough" is perfect for tech verification**

This project is about:
1. ✅ Testing Google Maps grounding quality
2. ✅ Building a working demo app
3. ✅ Writing a blog article about the experience

It's NOT about:
- ❌ Production-ready code
- ❌ 100% test coverage
- ❌ Enterprise-grade testing

## Summary

- **Keep it simple**
- **Main cases only**
- **No edge cases**
- **Fast and focused**

When in doubt: If the test feels complex or redundant, skip it.

---

**Last Updated**: 2025-11-12

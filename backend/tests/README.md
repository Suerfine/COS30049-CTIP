# Testing framework

Testing can be split into two different types, **Unit tests** and **integration test**.

1. **Unit tests,** tests isolated logic. It should have no HTTP and lots of logic. Tests should be for:

- Utility functions

2. **Intergration test,** tests actual API behavior by calling the actual HTTP route. its expected flow should be to seed the db, call the HTTP route and assert db to see if the expected behaviour is observed.

## Commands:

`npm test {test_filepath?}`

Runs the test suit. If a filepath is provided, it will only run the tests in that file. Otherwise, it will run all tests in the `tests/` directory.

`npm test {tests/integration|unit}`

Runs all tests in the specified directory. For example, `npm test unit` will run all tests in the `tests/unit/` directory.

# File Structure:

```
tests/
    helper/ # Helper functions for testing (Auth Middleware override, etc..)
    integration/ #All integration tests
        ...
    unit/ #All unit tests
        ...
    setup.ts #Setup file that runs before all tests (Seeding, etc..)
```

# Testing framework

Testing can be split into two different types, **Unit tests** and **integration test**.

1. **Unit tests,** tests isolated logic. It should have no HTTP and lots of logic. Tests should be for:

- Utility functions

2. **Intergration test,** tests actual API behavior by calling the actual HTTP route. its expected flow should be to seed the db, call the HTTP route and assert db to see if the expected behaviour is observed.

# Test Guide

## Backend - Python Unit Tests (pytest)

```
These tests only check the backend logic in isolation, without making real API calls to Supabase or AI providers. They use mocking to simulate external dependencies, ensuring that tests run quickly and reliably.
```

- To run all tests:
```bash
cd backend
source venv/bin/activate  # Activate the virtual environment
pytest tests/unit
```

- To run a specific test file:
```bash
pytest tests/unit/test_file.py
```

- To run a specific test class or function:
```bash
pytest tests/unit/test_file.py::TestClass
pytest tests/unit/test_file.py::test_function
pytest tests/unit/test_file.py::TestClass::test_method
```

## Backend - Python Integration Tests (pytest)

```These tests check the backend logic along with real API calls to Supabase. They require valid credentials in the .env file and may take longer to run due to network calls.
```

- Setting up the db locally for integration tests:
```bash
cd supabase
supabase start
```

- Copy the output from the above command and update the .env file with the local Supabase credentials (SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY).

- Adding the user for integration tests:
```bash
cd supabase
source venv/bin/activate  # Activate the virtual environment
python seed_test_user.py
```

- To run all integration tests:
```bash
cd backend
source venv/bin/activate  # Activate the virtual environment
pytest tests/integration
```
- To run a specific integration test file:
```bash
pytest tests/integration/test_file.py
```

- To run a specific integration test class or function:
```bash
pytest tests/integration/test_file.py::TestClass
pytest tests/integration/test_file.py::test_function
pytest tests/integration/test_file.py::TestClass::test_method
```

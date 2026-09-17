"""Unit tests for exponential backoff retry utilities."""

import asyncio
import time
from backend.core.retry import (
    ExponentialBackoffRetry,
    RetryConfig,
    execute_with_retry,
    with_exponential_backoff,
)


def test_retry_config_delay_calculation():
    config = RetryConfig(
        max_attempts=4,
        initial_delay_seconds=1.0,
        max_delay_seconds=10.0,
        backoff_multiplier=2.0,
        jitter=False,
    )
    assert config.calculate_delay(1) == 1.0
    assert config.calculate_delay(2) == 2.0
    assert config.calculate_delay(3) == 4.0
    assert config.calculate_delay(4) == 8.0
    assert config.calculate_delay(5) == 10.0  # Capped at max_delay_seconds


def test_execute_with_retry_eventual_success():
    attempts = 0

    def flaky_api_call():
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            raise ConnectionError("Temporary connection timeout")
        return "SUCCESS_DATA"

    result = execute_with_retry(
        flaky_api_call,
        max_attempts=5,
        initial_delay_seconds=0.01,
        backoff_multiplier=1.5,
    )
    assert result == "SUCCESS_DATA"
    assert attempts == 3


def test_execute_with_retry_exceeds_max_attempts():
    attempts = 0

    def failing_api_call():
        nonlocal attempts
        attempts += 1
        raise ValueError("Permanent invalid response")

    failed = False
    try:
        execute_with_retry(
            failing_api_call,
            max_attempts=3,
            initial_delay_seconds=0.01,
            backoff_multiplier=1.5,
        )
    except ValueError:
        failed = True

    assert failed is True
    assert attempts == 3


def test_async_exponential_backoff_decorator():
    attempts = 0

    @with_exponential_backoff(max_attempts=3, initial_delay_seconds=0.01)
    async def async_fetch():
        nonlocal attempts
        attempts += 1
        if attempts < 2:
            raise RuntimeError("Temporary async gateway error")
        return {"status": "ok"}

    result = asyncio.run(async_fetch())
    assert result == {"status": "ok"}
    assert attempts == 2


if __name__ == "__main__":
    test_retry_config_delay_calculation()
    test_execute_with_retry_eventual_success()
    test_execute_with_retry_exceeds_max_attempts()
    test_async_exponential_backoff_decorator()
    print("All retry tests passed successfully!")

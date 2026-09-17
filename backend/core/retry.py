"""Exponential backoff retry utilities for all external API calls.

Conforms to platform coding rules:
- PascalCase for classes
- snake_case for functions
- Automatic exponential backoff with jitter for all API calls
"""

import asyncio
import functools
import inspect
import logging
import random
import time
from typing import Any, Callable, Optional, Tuple, Type, TypeVar

logger = logging.getLogger(__name__)

T = TypeVar("T")


class RetryConfig:
    """Configuration class for exponential backoff parameters."""

    def __init__(
        self,
        max_attempts: int = 5,
        initial_delay_seconds: float = 1.0,
        max_delay_seconds: float = 30.0,
        backoff_multiplier: float = 2.0,
        jitter: bool = True,
        retryable_exceptions: Tuple[Type[Exception], ...] = (Exception,),
    ):
        self.max_attempts = max_attempts
        self.initial_delay_seconds = initial_delay_seconds
        self.max_delay_seconds = max_delay_seconds
        self.backoff_multiplier = backoff_multiplier
        self.jitter = jitter
        self.retryable_exceptions = retryable_exceptions

    def calculate_delay(self, attempt: int) -> float:
        """Calculates backoff delay with optional uniform jitter."""
        delay = min(
            self.max_delay_seconds,
            self.initial_delay_seconds * (self.backoff_multiplier ** (attempt - 1)),
        )
        if self.jitter:
            delay = delay * (0.5 + random.random() * 0.5)
        return delay


class ExponentialBackoffRetry:
    """PascalCase decorator class implementing resilient exponential backoff."""

    def __init__(
        self,
        max_attempts: int = 5,
        initial_delay_seconds: float = 1.0,
        max_delay_seconds: float = 30.0,
        backoff_multiplier: float = 2.0,
        jitter: bool = True,
        retryable_exceptions: Tuple[Type[Exception], ...] = (Exception,),
    ):
        self.config = RetryConfig(
            max_attempts=max_attempts,
            initial_delay_seconds=initial_delay_seconds,
            max_delay_seconds=max_delay_seconds,
            backoff_multiplier=backoff_multiplier,
            jitter=jitter,
            retryable_exceptions=retryable_exceptions,
        )

    def __call__(self, target_func: Callable[..., Any]) -> Callable[..., Any]:
        """Wraps synchronous or asynchronous callables with retry logic."""
        if inspect.iscoroutinefunction(target_func):
            @functools.wraps(target_func)
            async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
                return await self._execute_async(target_func, *args, **kwargs)

            return async_wrapper
        else:
            @functools.wraps(target_func)
            def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
                return self._execute_sync(target_func, *args, **kwargs)

            return sync_wrapper

    def _execute_sync(self, func: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
        attempt = 1
        while True:
            try:
                return func(*args, **kwargs)
            except self.config.retryable_exceptions as exc:
                if attempt >= self.config.max_attempts:
                    logger.error(
                        f"Failed after {attempt} attempts in {func.__name__}: {str(exc)}"
                    )
                    raise
                delay = self.config.calculate_delay(attempt)
                logger.warning(
                    f"API call {func.__name__} failed (attempt {attempt}/{self.config.max_attempts}). "
                    f"Retrying in {delay:.2f}s due to error: {exc}"
                )
                time.sleep(delay)
                attempt += 1

    async def _execute_async(
        self, func: Callable[..., Any], *args: Any, **kwargs: Any
    ) -> Any:
        attempt = 1
        while True:
            try:
                return await func(*args, **kwargs)
            except self.config.retryable_exceptions as exc:
                if attempt >= self.config.max_attempts:
                    logger.error(
                        f"Failed after {attempt} attempts in async {func.__name__}: {str(exc)}"
                    )
                    raise
                delay = self.config.calculate_delay(attempt)
                logger.warning(
                    f"Async API call {func.__name__} failed (attempt {attempt}/{self.config.max_attempts}). "
                    f"Retrying in {delay:.2f}s due to error: {exc}"
                )
                await asyncio.sleep(delay)
                attempt += 1


def with_exponential_backoff(
    max_attempts: int = 5,
    initial_delay_seconds: float = 1.0,
    max_delay_seconds: float = 30.0,
    backoff_multiplier: float = 2.0,
    jitter: bool = True,
    retryable_exceptions: Tuple[Type[Exception], ...] = (Exception,),
) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """Convenience factory function returning an ExponentialBackoffRetry decorator."""
    return ExponentialBackoffRetry(
        max_attempts=max_attempts,
        initial_delay_seconds=initial_delay_seconds,
        max_delay_seconds=max_delay_seconds,
        backoff_multiplier=backoff_multiplier,
        jitter=jitter,
        retryable_exceptions=retryable_exceptions,
    )


def execute_with_retry(
    func: Callable[..., T],
    *args: Any,
    max_attempts: int = 5,
    initial_delay_seconds: float = 1.0,
    max_delay_seconds: float = 30.0,
    backoff_multiplier: float = 2.0,
    jitter: bool = True,
    retryable_exceptions: Tuple[Type[Exception], ...] = (Exception,),
    **kwargs: Any,
) -> T:
    """Executes a callable synchronously with automatic exponential backoff."""
    retryer = ExponentialBackoffRetry(
        max_attempts=max_attempts,
        initial_delay_seconds=initial_delay_seconds,
        max_delay_seconds=max_delay_seconds,
        backoff_multiplier=backoff_multiplier,
        jitter=jitter,
        retryable_exceptions=retryable_exceptions,
    )
    return retryer(func)(*args, **kwargs)

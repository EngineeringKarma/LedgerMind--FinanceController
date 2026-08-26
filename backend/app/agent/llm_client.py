import logging

from openai import OpenAI, APIStatusError, APIConnectionError, APITimeoutError
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)

from app.config import settings

logger = logging.getLogger(__name__)

# Create client once at module level (connection pooling)
_client: OpenAI | None = None


def get_client() -> OpenAI:
    """Return the singleton OpenAI-compatible client instance."""
    global _client
    if _client is None:
        _client = OpenAI(
            api_key=settings.llm_api_key,
            base_url=settings.llm_base_url,
            timeout=settings.llm_request_timeout,
        )
    return _client


@retry(
    stop=stop_after_attempt(settings.llm_max_retries),
    wait=wait_exponential(
        multiplier=1,
        min=settings.llm_retry_min_wait,
        max=settings.llm_retry_max_wait,
    ),
    retry=retry_if_exception_type((
        APIStatusError,
        APIConnectionError,
        APITimeoutError,
        ConnectionError,
        TimeoutError,
    )),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True,
)
def chat_completion(messages: list[dict], temperature: float = 0.1) -> str:
    """
    Send a chat completion request to the LLM API with automatic retry.
    Returns the assistant's response content as a string.
    Retries on: APIStatusError, APIConnectionError, APITimeoutError, ConnectionError, TimeoutError.
    """
    client = get_client()
    response = client.chat.completions.create(
        model=settings.llm_model,
        messages=messages,
        temperature=temperature,
        max_tokens=4096,
        response_format={"type": "json_object"},
    )
    return response.choices[0].message.content

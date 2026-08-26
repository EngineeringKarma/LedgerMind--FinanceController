from groq import Groq
from app.config import settings


def get_client() -> Groq:
    """Create and return a Groq client instance."""
    return Groq(api_key=settings.groq_api_key)


def chat_completion(messages: list[dict], temperature: float = 0.1) -> str:
    """
    Send a chat completion request to the Groq API.
    Returns the assistant's response content as a string.
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

"""
OpenAI Client — Centralized LLM interface.
Exposes a reusable ask_llm() function.
"""

import os
import logging
from openai import OpenAI
from config import settings

logger = logging.getLogger("agents.openai_client")

# ---------------------------------------------------------------------------
# Client singleton (Lazy loading)
# ---------------------------------------------------------------------------
_client = None

def get_openai_client():
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        _client = OpenAI(api_key=api_key)
    return _client

# ---------------------------------------------------------------------------
# Model configuration
# ---------------------------------------------------------------------------
DEFAULT_MODEL = "gpt-4o-mini"
MAX_COMPLETION_TOKENS = 2048
SYSTEM_IDENTITY = (
    "You are MNH Hospital AI Assistant — an intelligent, autonomous agent "
    "embedded in a hospital management system. You provide precise, "
    "actionable medical and administrative guidance. Be concise and professional. "
    "If the query is conversational, respond in natural human language. "
    "Only use JSON if specifically instructed by the prompt or response_format."
)


# ---------------------------------------------------------------------------
# Core LLM function
# ---------------------------------------------------------------------------
def ask_llm(
    prompt: str,
    *,
    system_prompt: str | None = None,
    model: str = DEFAULT_MODEL,
    max_tokens: int = MAX_COMPLETION_TOKENS,
    temperature: float = 0.4,
    response_format: dict | None = None,
) -> str:
    """Send a prompt to OpenAI and return the assistant's reply text."""
    
    # CI/Testing safe fallback
    api_key = os.getenv("OPENAI_API_KEY") or settings.AZURE_OPENAI_KEY
    if not api_key:
        logger.warning("No OpenAI API key found. Returning mock response.")
        return "Mock response (CI): Please configure your OpenAI API Key."

    client = get_openai_client()
    messages = [
        {"role": "system", "content": system_prompt or SYSTEM_IDENTITY},
        {"role": "user", "content": prompt},
    ]

    try:
        kwargs: dict = {
            "model": model,
            "messages": messages,
            "max_completion_tokens": max_tokens,
            "temperature": temperature,
        }
        if response_format:
            kwargs["response_format"] = response_format

        response = client.chat.completions.create(**kwargs)
        return response.choices[0].message.content.strip()

    except Exception as exc:
        logger.exception("OpenAI API call failed: %s", exc)
        return f"[LLM Error] {exc}"

# Add a New LLM Provider

This guide shows how to extend Gnosis with a different LLM provider.

## Architecture Overview

The LLM integration uses LangChain, making it straightforward to swap providers. The key files are:

- `apps/api/core/clients.py` - Client initialization
- `apps/api/core/config.py` - Configuration settings
- `apps/api/services/inference.py` - LLM usage

## Step 1: Install the LangChain Integration

Most providers have a LangChain integration package:

```bash
cd apps/api

# OpenAI
uv add langchain-openai

# Anthropic
uv add langchain-anthropic

# Google
uv add langchain-google-genai

# Ollama (local)
uv add langchain-ollama
```

## Step 2: Add Configuration

Edit `apps/api/core/config.py`:

```python
class Settings(BaseSettings):
    # Existing settings...

    # Add your new provider key
    openai_api_key: str | None = None

    # Optionally make LLM provider configurable
    llm_provider: str = "cerebras"  # or "openai", "anthropic"
```

Update `.env`:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

## Step 3: Create the Client

Edit `apps/api/core/clients.py`:

```python
from functools import lru_cache
from langchain_openai import ChatOpenAI  # New import
from langchain_cerebras import ChatCerebras
from core.config import settings

@lru_cache()
def get_llm():
    """Get LLM client based on configured provider."""
    if settings.llm_provider == "openai":
        return ChatOpenAI(
            model="gpt-4o",
            api_key=settings.openai_api_key,
        )
    elif settings.llm_provider == "anthropic":
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(
            model="claude-sonnet-4-20250514",
            api_key=settings.anthropic_api_key,
        )
    else:  # Default to Cerebras
        return ChatCerebras(
            model=settings.llm_model,
            api_key=settings.cerebras_api_key,
        )
```

## Step 4: Update the Inference Service

The `InferenceService` uses `.with_structured_output()` which works with most LangChain chat models:

```python
# apps/api/services/inference.py
class InferenceService:
    def __init__(self, llm):
        # This works for OpenAI, Anthropic, and most providers
        self.llm = llm.with_structured_output(ExpansionOutput)
```

No changes needed if your provider supports structured output.

## Step 5: Update Dependencies

Edit `apps/api/api/v1/graph.py` to use the new client:

```python
from core.clients import get_llm  # Changed from get_cerebras_llm

# In the endpoint
llm = get_llm()
inference_service = InferenceService(llm)
```

## Provider-Specific Notes

### OpenAI

```python
ChatOpenAI(
    model="gpt-4o",  # or "gpt-4o-mini" for cost savings
    api_key=settings.openai_api_key,
    temperature=0.7,
)
```

### Anthropic

```python
ChatAnthropic(
    model="claude-sonnet-4-20250514",
    api_key=settings.anthropic_api_key,
    max_tokens=4096,
)
```

### Ollama (Local)

```python
ChatOllama(
    model="llama3.2",
    base_url="http://localhost:11434",
)
```

No API key needed for local Ollama.

## Testing

After making changes:

1. Restart the API server
2. Check the health endpoint
3. Try expanding a topic
4. Verify the response quality

## Structured Output Compatibility

Not all models support structured output equally. If you encounter issues:

```python
# Fallback: Parse JSON manually
class InferenceService:
    def __init__(self, llm):
        self.llm = llm  # Without structured output

    async def expand_topic(self, ...):
        result = await self.llm.ainvoke(prompt)
        # Parse JSON from result.content
        import json
        return ExpansionOutput(**json.loads(result.content))
```

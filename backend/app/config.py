from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    groq_api_key: str = Field(default="", description="Groq API key for LLM calls")
    allowed_origins: str = Field(
        default="http://localhost:3000",
        description="Comma-separated CORS allowed origins",
    )
    llm_model: str = Field(default="qwen/qwen3.6-27b", description="Groq model name")
    llm_batch_size: int = Field(default=15, description="Transactions per LLM batch call")
    confidence_threshold: float = Field(
        default=0.7, description="Below this confidence, flag for review"
    )

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

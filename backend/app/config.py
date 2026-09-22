from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    llm_api_key: str = Field(default="", description="API key for LLM calls (NVIDIA NIM, etc.)")
    llm_base_url: str = Field(
        default="https://integrate.api.nvidia.com/v1",
        description="LLM API base URL",
    )
    allowed_origins: str = Field(
        default="http://localhost:3000",
        description="Comma-separated CORS allowed origins",
    )
    llm_model: str = Field(default="meta/llama-3.3-70b-instruct", description="LLM model name")
    llm_batch_size: int = Field(default=100, description="Transactions per LLM batch call")
    confidence_threshold: float = Field(
        default=0.7, description="Below this confidence, flag for review"
    )
    database_path: str = Field(
        default="data/ledgermind.db", description="SQLite database file path"
    )
    # JWT Auth
    jwt_secret_key: str = Field(
        default="ledgermind-dev-secret-change-in-production",
        description="Secret key for JWT signing",
    )
    jwt_algorithm: str = Field(default="HS256", description="JWT signing algorithm")
    jwt_access_token_expire_minutes: int = Field(
        default=1440, description="Access token expiry in minutes (24 hours)"
    )
    # Retry
    llm_max_retries: int = Field(default=2, description="Max retries for LLM calls")
    llm_retry_min_wait: int = Field(default=1, description="Min wait between retries (seconds)")
    llm_retry_max_wait: int = Field(default=5, description="Max wait between retries (seconds)")
    llm_request_timeout: int = Field(default=10, description="LLM request timeout (seconds)")
    # Upload
    upload_max_size_mb: int = Field(default=10, description="Max upload file size in MB")

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

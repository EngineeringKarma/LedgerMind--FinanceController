import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    api_key=os.getenv("LLM_API_KEY", ""),
    base_url=os.getenv("LLM_BASE_URL", "https://integrate.api.nvidia.com/v1"),
)
try:
    models = client.models.list().data
    for m in models:
        print(m.id)
except Exception as e:
    print("Error listing models:", e)

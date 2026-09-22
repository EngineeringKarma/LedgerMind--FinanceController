import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    api_key=os.getenv("LLM_API_KEY", ""),
    base_url=os.getenv("LLM_BASE_URL", "https://integrate.api.nvidia.com/v1"),
)
model_name = os.getenv("LLM_MODEL", "meta/llama-3.3-70b-instruct")

try:
    resp = client.chat.completions.create(
        model=model_name,
        max_tokens=1000,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "Return valid json"},
            {"role": "user", "content": '{"test": 1}'},
        ],
    )
    print("SUCCESS JSON:", resp.choices[0].message.content)
except Exception as e:
    print("FAILED JSON:", e)

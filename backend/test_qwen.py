import os
from dotenv import load_dotenv
load_dotenv()
from groq import Groq
client = Groq()

try:
    resp = client.chat.completions.create(
        model="qwen/qwen3.6-27b",
        max_tokens=1000,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "Return valid json"},
            {"role": "user", "content": "{\"test\": 1}"}
        ]
    )
    print("SUCCESS JSON:", resp.choices[0].message.content)
except Exception as e:
    print("FAILED JSON:", e)

try:
    resp = client.chat.completions.create(
        model="qwen/qwen3.6-27b",
        max_tokens=1000,
        messages=[
            {"role": "system", "content": "Return valid json"},
            {"role": "user", "content": "{\"test\": 1}"}
        ]
    )
    print("SUCCESS RAW:", resp.choices[0].message.content)
except Exception as e:
    print("FAILED RAW:", e)

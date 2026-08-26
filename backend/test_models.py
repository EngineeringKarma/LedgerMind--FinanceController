import os
from dotenv import load_dotenv
load_dotenv()
from groq import Groq
client = Groq()
models = client.models.list().data
for m in models:
    if "llama" in m.id.lower() or "-8192" in m.id.lower() or "versatile" in m.id.lower() or "instant" in m.id.lower():
        print(m.id)

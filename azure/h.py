import os
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv()

endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")
api_key = os.getenv("AZURE_OPENAI_API_KEY")
api_version = os.getenv("AZURE_OPENAI_API_VERSION")

print("Endpoint:", endpoint)
print("Deployment:", deployment)

client = AzureOpenAI(
    api_key=api_key,
    api_version=api_version,
    azure_endpoint=endpoint
)

response = client.chat.completions.create(
    model=deployment,
    messages=[
        {"role": "system", "content": "You are a hospital AI assistant."},
        {"role": "user", "content": "I have fever and headache"}
    ]  # ✅ correct for your model
)

print("\nAI Response:\n")
print(response.choices[0].message.content)
import os

from dotenv import load_dotenv
from pymongo import AsyncMongoClient

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")

if not MONGODB_URL:
    raise RuntimeError("MONGODB_URL is not set")

client = AsyncMongoClient(MONGODB_URL)

db = client.get_database("PingStack")
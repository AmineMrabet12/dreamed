import os

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

import sqlite3
import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(__name__)

router = APIRouter()


class QueryRequest(BaseModel):
    question: str


# ── LLM ───────────────────────────────────────────────────────────────────
llm = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview",
    google_api_key=os.environ.get("GEMINI_API_KEY"),
    temperature=0.7,
)

# ── Prompt ────────────────────────────────────────────────────────────────
system_msg = (
    "You are an expert dream interpreter, specialized in analyzing symbols through "
    "psychological, spiritual, and cultural lenses.\n\n"
    "STRICT RULE: Only interpret a dream if the user has explicitly described one in their message. "
    "If the user sends a greeting, a question, or any message that does not contain a dream description, "
    "respond briefly and naturally WITHOUT inventing, assuming, or interpreting any dream. "
    "Never fabricate a dream scenario on your own.\n\n"
    "LANGUAGE RULE: Detect the language of the user's message and reply in that exact "
    "same language. If the user writes in French → answer in French. "
    "English → English. Arabic (العربية) → Arabic. Any other language → match it.\n\n"
    "When the user describes a dream: interpret it clearly and concisely (3-4 sentences max). "
    "If multiple interpretations exist, mention them briefly."
)

prompt = ChatPromptTemplate.from_messages([
    ("system", system_msg),
    ("human", "{question}"),
])

# ── Chain ─────────────────────────────────────────────────────────────────
chain = prompt | llm | StrOutputParser()

# ── DB ────────────────────────────────────────────────────────────────────
_DB = "bi.db"


def _init_db():
    with sqlite3.connect(_DB) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS chat_logs (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                question  TEXT NOT NULL,
                answer    TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )
        """)


_init_db()


# ── Endpoint ──────────────────────────────────────────────────────────────
@router.post("/chat")
def chat(request: QueryRequest):
    try:
        answer = chain.invoke({"question": request.question})

        with sqlite3.connect(_DB) as conn:
            conn.execute(
                "INSERT INTO chat_logs (question, answer, timestamp) VALUES (?, ?, ?)",
                (request.question, answer, datetime.utcnow().isoformat()),
            )

        return jsonable_encoder({"response": answer})

    except Exception as e:
        logger.error("Error processing request: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

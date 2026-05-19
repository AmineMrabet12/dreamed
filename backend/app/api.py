import re
import os

os.environ["ANONYMIZED_TELEMETRY"] = "False"  # disable chromadb telemetry

import sqlite3
import json
import logging
from datetime import datetime

import pandas as pd
from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel

from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_ollama import ChatOllama

logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(__name__)

router = APIRouter()


class QueryRequest(BaseModel):
    question: str


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def strip_thinking(text: str) -> str:
    """Remove <think>…</think> reasoning blocks that deepseek-r1 emits."""
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


# ── Documents ──────────────────────────────────────────────────────────────
csv_path = "app/documents/dreams_interpretations.csv"
if not os.path.exists(csv_path):
    raise FileNotFoundError(f"CSV not found: {csv_path}")

df = pd.read_csv(csv_path)
all_docs = [
    Document(
        page_content=clean_text(row["Interpretation"]),
        metadata={"symbol": row["Dream Symbol"]},
    )
    for _, row in df.iterrows()
]

splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
final_docs = [
    Document(page_content=chunk, metadata=doc.metadata)
    for doc in all_docs
    for chunk in splitter.split_text(doc.page_content)
]

# ── Embeddings + VectorStore ───────────────────────────────────────────────
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/multi-qa-MiniLM-L6-cos-v1"
)
vectorstore = Chroma.from_documents(
    final_docs, embeddings, persist_directory="MyDB1"
)
retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

# ── LLM ───────────────────────────────────────────────────────────────────
llm = ChatOllama(
    model="deepseek-r1:8b",
    base_url="http://localhost:11434",
    temperature=0.7,
)

# ── Prompt ────────────────────────────────────────────────────────────────
system_msg = (
    "You are an expert dream interpreter, specialized in analyzing symbols through "
    "psychological, spiritual, and cultural lenses.\n\n"
    "LANGUAGE RULE: Detect the language of the user's message and reply in that exact "
    "same language. If the user writes in French → answer in French. "
    "English → English. Arabic (العربية) → Arabic. Any other language → match it.\n\n"
    "Use the knowledge below to answer. Keep the response clear and concise (3-4 sentences max). "
    "If multiple interpretations exist, mention them briefly.\n\n"
    "Knowledge:\n{context}"
)

prompt = ChatPromptTemplate.from_messages([
    ("system", system_msg),
    ("human", "{question}"),
])


def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)


# ── LCEL chain ────────────────────────────────────────────────────────────
chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

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
        raw = chain.invoke(request.question)
        answer = strip_thinking(raw)

        with sqlite3.connect(_DB) as conn:
            conn.execute(
                "INSERT INTO chat_logs (question, answer, timestamp) VALUES (?, ?, ?)",
                (request.question, answer, datetime.utcnow().isoformat()),
            )

        return jsonable_encoder({"response": answer})

    except Exception as e:
        logger.error("Error processing request: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import FastAPI
from app.api import router
from fastapi.middleware.cors import CORSMiddleware

# Création de l'application FastAPI
app = FastAPI(title="API Chatbot Juridique", version="1.0")

# Inclusion du routeur
app.include_router(router)

# 🔹 Configuration CORS : Autoriser toutes les sources (*)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Autoriser toutes les sources
    allow_credentials=True,
    allow_methods=["*"],  # Autoriser toutes les méthodes (GET, POST, PUT, DELETE...)
    allow_headers=["*"],  # Autoriser tous les headers
)

# Si ce fichier est exécuté directement, lance le serveur avec uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
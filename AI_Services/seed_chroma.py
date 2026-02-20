import chromadb
from chromadb.config import Settings
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings # Updated import
from langchain_core.documents import Document
from config import settings # Updated to get the API key

def seed_database():
    print("Connecting to Google Cloud for embeddings...")
    api_key = settings.BACKUP_GEMINI_KEY or settings.GEMINI_API_KEY
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=api_key
    )
    
    print("Connecting to ChromaDB...")
    chroma_client = chromadb.HttpClient(
        host="chromadb",
        port=8000,
        settings=Settings(anonymized_telemetry=False)
    )
    
    vectorstore = Chroma(
        client=chroma_client,
        collection_name="mycalo_app_knowledge",
        embedding_function=embeddings,
    )

    knowledge_base = [
        Document(
            page_content="To change your password, open the MyCalo app, go to Settings, tap on your Profile, and select 'Change Password'. You will need your old password.", 
            metadata={"category": "navigation"}
        ),
        Document(
            page_content="To delete your account permanently, navigate to Settings > Privacy > Delete Account. Warning: This action is irreversible and deletes all your food logs.", 
            metadata={"category": "navigation"}
        ),
        Document(
            page_content="Privacy Policy: MyCalo AI stores your daily food and exercise logs securely. We strictly do not share or sell your dietary data to third-party advertisers.", 
            metadata={"category": "policy"}
        ),
        Document(
            page_content="If you want to log a new food item that isn't in the database, tap the '+' button on the Home screen and select 'Create Custom Food' or 'Analyze Image'.", 
            metadata={"category": "navigation"}
        ),
        Document(
            page_content="If you experience an app crash or bug, go to Settings > Help & Support and tap 'Report an Issue'.", 
            metadata={"category": "support"}
        ),
    ]

    print("Adding documents to Vector Database...")
    vectorstore.add_documents(knowledge_base)
    print("✅ Successfully seeded ChromaDB with App Knowledge using Google Embeddings!")

if __name__ == "__main__":
    seed_database()
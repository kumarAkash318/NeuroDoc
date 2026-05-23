import os
from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel
import pdfplumber
import io
import json
from schemas import InvoiceExtraction, ResumeExtraction
from typing import Type

base_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(base_dir, ".env"))

def get_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set.")
    return genai.Client(api_key=api_key)

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    text = ""
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

def parse_document_with_llm(raw_text: str, doc_type: str) -> dict:
    client = get_client()
        
    schema_cls: Type[BaseModel]
    if doc_type.lower() == "invoice":
        schema_cls = InvoiceExtraction
    elif doc_type.lower() == "resume":
        schema_cls = ResumeExtraction
    else:
        raise ValueError("Unsupported document type")
        
    prompt = f"Extract the requested data fields from the following document text and format it strictly as JSON according to the schema. Include a confidence score (high/medium/low) and a note if a field is missing (never hallucinate).\n\nDocument Text:\n{raw_text}"
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config={
            'response_mime_type': 'application/json',
            'response_schema': schema_cls,
            'temperature': 0.1,
        },
    )
    
    return json.loads(response.text)

from fastapi import FastAPI, Depends, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import json
import os

from database import get_db, ExtractionRecord, engine, Base
from schemas import ExtractionResponse
from extraction import extract_text_from_pdf, parse_document_with_llm

app = FastAPI(title="Document Extraction Engine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/extract", response_model=ExtractionResponse)
async def extract_document(
    document_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if document_type.lower() not in ["invoice", "resume"]:
        raise HTTPException(status_code=400, detail="Unsupported document type. Use 'invoice' or 'resume'.")
    
    # Process file
    try:
        content = await file.read()
        if file.filename.lower().endswith('.pdf'):
            text = extract_text_from_pdf(content)
        elif file.filename.lower().endswith('.txt'):
            text = content.decode('utf-8')
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF or TXT.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")
        
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from document.")
        
    try:
        extracted_json = parse_document_with_llm(text, document_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM extraction failed: {str(e)}")
        
    record = ExtractionRecord(
        filename=file.filename,
        document_type=document_type.lower(),
        extracted_data=json.dumps(extracted_json),
        raw_text=text
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    
    return {
        "id": record.id,
        "filename": record.filename,
        "document_type": record.document_type,
        "timestamp": record.timestamp,
        "data": extracted_json
    }

@app.get("/extractions", response_model=list[ExtractionResponse])
def get_extractions(db: Session = Depends(get_db)):
    records = db.query(ExtractionRecord).order_by(ExtractionRecord.timestamp.desc()).all()
    results = []
    for r in records:
        results.append({
            "id": r.id,
            "filename": r.filename,
            "document_type": r.document_type,
            "timestamp": r.timestamp,
            "data": json.loads(r.extracted_data)
        })
    return results

@app.get("/extractions/{id}", response_model=ExtractionResponse)
def get_extraction(id: int, db: Session = Depends(get_db)):
    record = db.query(ExtractionRecord).filter(ExtractionRecord.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Extraction not found")
        
    return {
        "id": record.id,
        "filename": record.filename,
        "document_type": record.document_type,
        "timestamp": record.timestamp,
        "data": json.loads(record.extracted_data)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

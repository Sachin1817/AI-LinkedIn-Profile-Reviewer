import pymupdf
import re
import logging

logger = logging.getLogger("uvicorn.error")

def extract_text_from_pdf(pdf_bytes: bytes) -> dict:
    """
    Extracts text page by page from PDF bytes.
    Cleans up duplicate whitespaces but preserves paragraph layout.
    """
    try:
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
        pages_text = []
        total_characters = 0
        
        for page in doc:
            text = page.get_text("text")
            # Clean text
            text = re.sub(r'[ \t]+', ' ', text)  # remove duplicate spaces/tabs
            # Collapse multiple consecutive newlines into double newlines to preserve paragraphs
            text = re.sub(r'\n{3,}', '\n\n', text)
            pages_text.append(text)
            total_characters += len(text)
            
        full_text = "\n--- Page Break ---\n".join(pages_text)
        word_count = len(full_text.split())
        # Estimate reading time (average speed is 200 words per minute)
        est_minutes = max(1, round(word_count / 200))
        est_reading_time = f"{est_minutes} min read"
        
        return {
            "text": full_text,
            "pages": len(doc),
            "characters": total_characters,
            "wordCount": word_count,
            "estimatedReadingTime": est_reading_time
        }
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        raise ValueError(f"Failed to parse PDF file: {str(e)}")

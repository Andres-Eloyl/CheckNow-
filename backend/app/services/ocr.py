"""
CheckNow! — OCR Service
Extracts payment reference numbers and amounts from Pago Movil / Zelle screenshots.
Uses AWS Textract / Google Cloud Vision (Placeholder for MVP).
"""

import logging
from typing import Optional, Dict

logger = logging.getLogger(__name__)

async def extract_payment_info_from_image(image_bytes: bytes, payment_method: str) -> Optional[Dict[str, str]]:
    """
    Mock implementation of OCR extraction.
    In production, this would send `image_bytes` to AWS Textract or GCP Vision
    and parse the bounding boxes to find "Reference", "Ref", "Amount", etc.
    """
    logger.info(f"Running OCR on uploaded image for method {payment_method}")
    
    # Placeholder Logic
    # Returns a dictionary with extracted data if successful, or None if unreadable.
    
    # Simulate a successful extraction 80% of the time
    # return {
    #     "reference": "00456189",
    #     "amount": "150.00",
    #     "raw_text": "Banco Mercantil... Ref: 00456189 Amount: Bs 150.00"
    # }
    
    logger.warning("OCR Service is in mock mode. Returning dummy extracted data.")
    return {
        "reference": "MOCK_REF_12345",
        "amount": "0.00",
        "raw_text": "Mock extracted text from image bypass"
    }


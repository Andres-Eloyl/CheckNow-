"""
CheckNow! — OCR Service (Placeholder)
Reservado para futura extracción automática de referencias de pago.
Por ahora, las referencias se ingresan manualmente por el comensal.
"""

import logging

logger = logging.getLogger(__name__)


async def extract_reference_from_text(raw_text: str) -> str | None:
    """
    Placeholder: en el futuro podría recibir texto OCR de una captura
    y extraer automáticamente el número de referencia.
    Actualmente no se usa — el comensal ingresa la referencia a mano.
    """
    logger.info("OCR service en modo placeholder — referencia manual requerida.")
    return None

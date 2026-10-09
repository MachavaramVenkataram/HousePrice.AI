from typing import Optional
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from ....schemas.prediction import PropertyFeatures, PredictionResponse
from ....services.prediction_service import PredictionService
from ....services.report_service import generate_property_valuation_pdf

router = APIRouter()


class GenerateReportRequest(BaseModel):
    features: PropertyFeatures
    prediction: Optional[PredictionResponse] = None


@router.post("/pdf", summary="Generate Valuation PDF Report")
def generate_pdf_report(request: GenerateReportRequest):
    """Generates and streams an executive PDF property valuation and explainability dossier."""
    try:
        pred = request.prediction
        if pred is None:
            pred = PredictionService.get_instance().predict(request.features)

        pdf_bytes = generate_property_valuation_pdf(request.features, pred)
        m_name = pred.model.name if hasattr(pred.model, "name") else (pred.model.get("name") if isinstance(pred.model, dict) else str(pred.model))
        safe_m_name = m_name.replace(" ", "_").replace("(", "").replace(")", "")
        filename = f"HousePrice_AI_Report_{safe_m_name}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compile PDF: {str(e)}")

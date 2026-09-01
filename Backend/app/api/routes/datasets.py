from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.dataset import (
    DatasetListResponse,
    DatasetResponse,
)
from app.services.dataset_service import DatasetService


router = APIRouter(
    prefix="/datasets",
    tags=["Datasets"],
)


DATASET_DIR = Path("data/datasets")
DATASET_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# =========================================================
# LIST DATASETS
# =========================================================

@router.get(
    "",
    response_model=DatasetListResponse,
)
async def list_datasets(
    db: AsyncSession = Depends(get_db),
):
    datasets = await DatasetService.get_all_datasets(db)

    return DatasetListResponse(
        datasets=datasets,
    )
# =========================================================
# GET DATASET BY ID
# =========================================================

@router.get(
    "/{dataset_id}",
    response_model=DatasetResponse,
)
async def get_dataset(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
):
    dataset = await DatasetService.get_dataset_by_id(
        db=db,
        dataset_id=dataset_id,
    )

    if dataset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found",
        )

    return dataset

# =========================================================
# UPLOAD DATASET
# =========================================================

@router.post(
    "/upload",
    response_model=DatasetResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_dataset(
    name: str = Form(...),
    description: str | None = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File name is required",
        )

    extension = Path(file.filename).suffix.lower()

    if extension != ".csv":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported",
        )

    unique_name = (
        f"{uuid4().hex}{extension}"
    )

    file_path = DATASET_DIR / unique_name

    try:
        content = await file.read()

        file_path.write_bytes(content)

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save dataset file",
        ) from exc

    dataset = await DatasetService.create_dataset(
        db=db,
        name=name,
        description=description,
        file_name=file.filename,
        file_path=str(file_path),
        file_type="csv",
    )

    return dataset
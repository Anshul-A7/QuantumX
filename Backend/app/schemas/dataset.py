from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DatasetResponse(BaseModel):
    id: int
    name: str
    description: str | None
    file_name: str
    file_type: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class DatasetListResponse(BaseModel):
    datasets: list[DatasetResponse]
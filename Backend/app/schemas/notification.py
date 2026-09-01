from datetime import datetime
from pydantic import BaseModel, Field


class NotificationCreate(BaseModel):
    id: str | None = None
    title: str
    category: str = "system"
    message: str
    actionUrl: str | None = Field(None, alias="action_url")

    model_config = {
        "populate_by_name": True,
    }


class NotificationResponse(BaseModel):
    id: str
    title: str
    category: str
    message: str
    isRead: bool = Field(..., serialization_alias="read", validation_alias="is_read")
    actionUrl: str | None = Field(None, serialization_alias="actionUrl", validation_alias="action_url")
    createdAt: datetime = Field(..., serialization_alias="createdAt", validation_alias="created_at")

    model_config = {
        "populate_by_name": True,
        "from_attributes": True,
    }

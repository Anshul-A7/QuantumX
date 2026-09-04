from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.auth import UserProfile
from app.services.auth_service import AuthService

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


class UpdateProfileRequest(BaseModel):
    fullName: str | None = Field(default=None, alias="fullName")
    profileImageUrl: str | None = Field(default=None, alias="profileImageUrl")

    model_config = {
        "populate_by_name": True,
    }


@router.get(
    "/me",
    response_model=UserProfile,
)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return AuthService.user_to_profile(current_user)


@router.patch(
    "/me",
    response_model=UserProfile,
)
async def update_my_profile(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.fullName is not None:
        current_user.full_name = payload.fullName.strip()
    if payload.profileImageUrl is not None:
        current_user.profile_image_url = payload.profileImageUrl
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return AuthService.user_to_profile(current_user)
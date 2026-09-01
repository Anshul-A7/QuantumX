from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import UserProfile
from app.services.auth_service import AuthService

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get(
    "/me",
    response_model=UserProfile,
)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return AuthService.user_to_profile(current_user)
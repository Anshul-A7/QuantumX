from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dataset import Dataset


class DatasetService:

    DATASET_DIR = Path("data/datasets")

    @staticmethod
    async def get_all_datasets(
        db: AsyncSession,
    ) -> list[Dataset]:

        result = await db.execute(
            select(Dataset).order_by(
                Dataset.created_at.desc()
            )
        )

        return list(result.scalars().all())
    
    @staticmethod
    async def get_dataset_by_id(
        db: AsyncSession,
        dataset_id: int,
    ) -> Dataset | None:

         result = await db.execute(
            select(Dataset).where(
              Dataset.id == dataset_id
            )
        )
         return result.scalar_one_or_none()
    @staticmethod
    async def create_dataset(
        db: AsyncSession,
        name: str,
        description: str | None,
        file_name: str,
        file_path: str,
        file_type: str,
    ) -> Dataset:

        dataset = Dataset(
            name=name,
            description=description,
            file_name=file_name,
            file_path=file_path,
            file_type=file_type,
        )

        db.add(dataset)

        await db.commit()
        await db.refresh(dataset)

        return dataset
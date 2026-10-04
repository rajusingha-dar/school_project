"""Database access for schools."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.school import School


class SchoolRepository:
    """CRUD operations for ``School``. Callers own the transaction."""

    def __init__(self, session: AsyncSession) -> None:
        """Create a repository bound to a session.

        Args:
            session: The active async database session.
        """
        self._session = session

    async def get_or_create(self, name: str) -> School:
        """Return the school with this name, creating it if it does not exist.

        Args:
            name: The school's name (matched exactly).

        Returns:
            The existing or newly created school.
        """
        result = await self._session.execute(select(School).where(School.name == name))
        school = result.scalars().first()
        if school is None:
            school = School(name=name)
            self._session.add(school)
            await self._session.flush()
        return school

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """All models inherit from this so Alembic can discover them."""
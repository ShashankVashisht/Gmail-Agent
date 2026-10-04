from typing import Literal

from pydantic import BaseModel


class ConnectResponse(BaseModel):
    redirect_url: str


class StatusResponse(BaseModel):
    status: Literal["not_connected", "pending", "active"]
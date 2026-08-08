from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    # Deliberately no `id` — nothing on the frontend needs the internal user UUID
    # (ownership is enforced server-side from the JWT), so it's not exposed.
    email: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

from pydantic import BaseModel, field_validator

TAG_CATEGORY_MAX_LENGTH = 32
TAG_NAME_MAX_LENGTH = 128


def _normalize_structured_tag_part(
    *, value: str, field_name: str, max_length: int
) -> str:
    normalized = value.strip()
    if not normalized:
        raise ValueError(f"{field_name} must not be empty")
    if ":" in normalized:
        raise ValueError(f"{field_name} must not contain ':'")
    if len(normalized) > max_length:
        raise ValueError(f"{field_name} must be at most {max_length} characters")
    return normalized


class StructuredTagInput(BaseModel):
    category: str
    name: str

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        return _normalize_structured_tag_part(
            value=value,
            field_name="category",
            max_length=TAG_CATEGORY_MAX_LENGTH,
        )

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return _normalize_structured_tag_part(
            value=value,
            field_name="name",
            max_length=TAG_NAME_MAX_LENGTH,
        )


class BatchTagMutation(BaseModel):
    image_ids: list[str]
    add: list[StructuredTagInput]
    remove: list[str]

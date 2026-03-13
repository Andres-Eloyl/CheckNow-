"""
CheckNow! — Menu Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["Bebidas"])
    display_order: int = Field(0, ge=0)
    icon: Optional[str] = Field(None, max_length=50, examples=["🍺"])


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    display_order: Optional[int] = Field(None, ge=0)
    icon: Optional[str] = None
    is_active: Optional[bool] = None


class CategoryResponse(BaseModel):
    id: str
    name: str
    display_order: int
    icon: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


class ModifierCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["Sin cebolla"])
    extra_price: float = Field(0.0, ge=0, examples=[0.50])


class ModifierResponse(BaseModel):
    id: str
    name: str
    extra_price: float
    is_active: bool

    model_config = {"from_attributes": True}


class MenuItemCreate(BaseModel):
    category_id: str
    name: str = Field(..., min_length=1, max_length=255, examples=["Pabellón Criollo"])
    description: Optional[str] = Field(None, examples=["Plato nacional venezolano"])
    price_usd: float = Field(..., gt=0, examples=[12.50])
    destination: str = Field("kitchen", examples=["kitchen"])
    prep_time_min: int = Field(15, ge=1, examples=[15])
    sku: Optional[str] = Field(None, max_length=50)
    display_order: int = Field(0, ge=0)
    is_featured: bool = False
    stock_count: Optional[int] = Field(None, ge=0)
    tags: Optional[List[str]] = Field(None, examples=[["venezolano", "tradicional"]])


class MenuItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    price_usd: Optional[float] = Field(None, gt=0)
    destination: Optional[str] = None
    prep_time_min: Optional[int] = Field(None, ge=1)
    sku: Optional[str] = None
    display_order: Optional[int] = None
    is_available: Optional[bool] = None
    is_featured: Optional[bool] = None
    stock_count: Optional[int] = None
    tags: Optional[List[str]] = None


class MenuItemResponse(BaseModel):
    id: str
    category_id: str
    name: str
    description: Optional[str] = None
    price_usd: float
    image_url: Optional[str] = None
    destination: str
    prep_time_min: int
    display_order: int
    is_available: bool
    is_featured: bool
    stock_count: Optional[int] = None
    tags: list = []
    modifiers: List[ModifierResponse] = []

    model_config = {"from_attributes": True}


class MenuResponse(BaseModel):
    """Full menu with categories and items."""
    categories: List["MenuCategoryFull"]


class MenuCategoryFull(BaseModel):
    id: str
    name: str
    display_order: int
    icon: Optional[str] = None
    items: List[MenuItemResponse] = []

    model_config = {"from_attributes": True}

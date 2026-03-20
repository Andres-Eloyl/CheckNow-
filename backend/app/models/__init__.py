"""
CheckNow! — Models Package
Imports all models so SQLAlchemy can discover them for migrations.
"""

from app.models.restaurant import Restaurant, RestaurantConfig
from app.models.subscription import SubscriptionPlan, SubscriptionTransaction
from app.models.staff import StaffUser
from app.models.table import Table
from app.models.session import TableSession, SessionUser
from app.models.menu import MenuCategory, MenuItem, MenuItemModifier
from app.models.order import OrderItem
from app.models.split import SplitAssignment
from app.models.payment import Payment, ExchangeRate
from app.models.notification import Notification
from app.models.loyalty import LoyaltyAccount
from app.models.analytics import AnalyticsEvent
from app.models.file_storage import FileStorage
from app.models.cross_sell import CrossSellRule

__all__ = [
    "Restaurant",
    "RestaurantConfig",
    "SubscriptionPlan",
    "SubscriptionTransaction",
    "StaffUser",
    "Table",
    "TableSession",
    "SessionUser",
    "MenuCategory",
    "MenuItem",
    "MenuItemModifier",
    "OrderItem",
    "SplitAssignment",
    "Payment",
    "ExchangeRate",
    "Notification",
    "LoyaltyAccount",
    "AnalyticsEvent",
    "FileStorage",
    "CrossSellRule",
]

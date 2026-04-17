from typing import Dict
import logging

from .base_strategy import BaseBomStrategy
from .netapp_strategy import NetAppBomStrategy
from .dell_strategy import DellBomStrategy
from .hpe_strategy import HpeBomStrategy
from .generic_strategy import GenericBomStrategy
from .cisco_strategy import CiscoBomStrategy

logger = logging.getLogger(__name__)


class BomStrategyFactory:
    """Factory to retrieve the correct BOM parsing strategy.

    Strategies are loaded from two sources:
    1. Hardcoded vendor strategies (backward-compatible fallback)
    2. Dynamic strategies loaded from the ``bom_templates`` MongoDB collection
    """

    _strategies: Dict[str, BaseBomStrategy] = {}
    _db_loaded: bool = False

    @classmethod
    def register_strategy(cls, strategy: BaseBomStrategy):
        cls._strategies[strategy.format_id] = strategy

    @classmethod
    def _ensure_hardcoded(cls):
        """Register the built-in strategies once."""
        if not cls._strategies:
            cls.register_strategy(NetAppBomStrategy())
            cls.register_strategy(DellBomStrategy())
            cls.register_strategy(HpeBomStrategy())
            cls.register_strategy(CiscoBomStrategy())
            cls.register_strategy(GenericBomStrategy())

    @classmethod
    async def load_templates_from_db(cls):
        """Load all active templates from MongoDB and register as DynamicBomStrategy."""
        try:
            from app.db.repositories.bom_template_repository import BomTemplateRepository
            from .dynamic_strategy import DynamicBomStrategy

            repo = BomTemplateRepository()
            templates = await repo.get_active_templates()
            for tmpl in templates:
                try:
                    strategy = DynamicBomStrategy(tmpl)
                    cls._strategies[strategy.format_id] = strategy
                    logger.debug("Loaded dynamic BOM strategy: %s", strategy.format_id)
                except Exception as exc:
                    logger.warning("Failed to load template %s: %s", tmpl.get("format_id"), exc)
            cls._db_loaded = True
            logger.info(
                "BOM strategies loaded: %d total (%d from DB)",
                len(cls._strategies), len(templates),
            )
        except Exception as exc:
            logger.warning("Could not load BOM templates from DB (will use hardcoded): %s", exc)

    @classmethod
    async def refresh(cls):
        """Reload all strategies (called after template CRUD)."""
        cls._strategies.clear()
        cls._db_loaded = False
        cls._ensure_hardcoded()
        await cls.load_templates_from_db()

    @classmethod
    def get_strategy(cls, format_id: str) -> BaseBomStrategy:
        cls._ensure_hardcoded()
        strategy = cls._strategies.get(format_id)
        if not strategy:
            return cls._strategies.get("generic_first_col") or GenericBomStrategy()
        return strategy

    @classmethod
    def get_supported_formats(cls) -> list[str]:
        cls._ensure_hardcoded()
        return list(cls._strategies.keys())
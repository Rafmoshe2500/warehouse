from typing import Dict, Type
from .base_strategy import BaseBomStrategy
from .netapp_strategy import NetAppBomStrategy
from .dell_strategy import DellBomStrategy
from .hpe_strategy import HpeBomStrategy
from .generic_strategy import GenericBomStrategy

class BomStrategyFactory:
    """Factory to retrieve the correct BOM parsing strategy."""
    
    _strategies: Dict[str, BaseBomStrategy] = {}

    @classmethod
    def register_strategy(cls, strategy: BaseBomStrategy):
        cls._strategies[strategy.format_id] = strategy

    @classmethod
    def get_strategy(cls, format_id: str) -> BaseBomStrategy:
        if not cls._strategies:
            # Lazy load the built-in strategies
            cls.register_strategy(NetAppBomStrategy())
            cls.register_strategy(DellBomStrategy())
            cls.register_strategy(HpeBomStrategy())
            cls.register_strategy(GenericBomStrategy())

        strategy = cls._strategies.get(format_id)
        if not strategy:
            # Fallback to generic if format is unknown
            return cls._strategies.get("generic_first_col") or GenericBomStrategy()
        return strategy

    @classmethod
    def get_supported_formats(cls) -> list[str]:
        if not cls._strategies:
            cls.get_strategy("netapp_pricing_template") # triggers lazy load
        return list(cls._strategies.keys())

"""
Tests for BOM Strategy Factory – registration, lookup, lazy-loading, fallback.
"""
import pytest
from app.services.bom_strategies.factory import BomStrategyFactory
from app.services.bom_strategies.netapp_strategy import NetAppBomStrategy
from app.services.bom_strategies.dell_strategy import DellBomStrategy
from app.services.bom_strategies.hpe_strategy import HpeBomStrategy
from app.services.bom_strategies.cisco_strategy import CiscoBomStrategy
from app.services.bom_strategies.generic_strategy import GenericBomStrategy


@pytest.fixture(autouse=True)
def reset_factory():
    """Reset factory strategies before each test to avoid cross-test pollution."""
    BomStrategyFactory._strategies = {}
    yield
    BomStrategyFactory._strategies = {}


class TestBomStrategyFactory:

    def test_register_strategy(self):
        strategy = NetAppBomStrategy()
        BomStrategyFactory.register_strategy(strategy)
        assert "netapp_pricing_template" in BomStrategyFactory._strategies
        assert BomStrategyFactory._strategies["netapp_pricing_template"] is strategy

    def test_get_strategy_lazy_loads_all(self):
        assert BomStrategyFactory._strategies == {}
        strategy = BomStrategyFactory.get_strategy("netapp_pricing_template")
        assert isinstance(strategy, NetAppBomStrategy)
        assert len(BomStrategyFactory._strategies) >= 5

    def test_get_strategy_returns_correct_type(self):
        assert isinstance(BomStrategyFactory.get_strategy("netapp_pricing_template"), NetAppBomStrategy)
        assert isinstance(BomStrategyFactory.get_strategy("dell_quote"), DellBomStrategy)
        assert isinstance(BomStrategyFactory.get_strategy("hpe_quote"), HpeBomStrategy)
        assert isinstance(BomStrategyFactory.get_strategy("cisco_quote"), CiscoBomStrategy)
        assert isinstance(BomStrategyFactory.get_strategy("generic_first_col"), GenericBomStrategy)

    def test_get_strategy_unknown_format_falls_back_to_generic(self):
        strategy = BomStrategyFactory.get_strategy("unknown_vendor_xyz")
        assert isinstance(strategy, GenericBomStrategy)

    def test_get_supported_formats(self):
        formats = BomStrategyFactory.get_supported_formats()
        assert isinstance(formats, list)
        assert "netapp_pricing_template" in formats
        assert "dell_quote" in formats
        assert "hpe_quote" in formats
        assert "cisco_quote" in formats
        assert "generic_first_col" in formats

    def test_get_supported_formats_lazy_loads(self):
        assert BomStrategyFactory._strategies == {}
        formats = BomStrategyFactory.get_supported_formats()
        assert len(formats) >= 5

    def test_register_overwrites_existing(self):
        s1 = NetAppBomStrategy()
        s2 = NetAppBomStrategy()
        BomStrategyFactory.register_strategy(s1)
        BomStrategyFactory.register_strategy(s2)
        assert BomStrategyFactory._strategies["netapp_pricing_template"] is s2

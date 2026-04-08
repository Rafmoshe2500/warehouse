"""
Unit tests for component_classifier.py extractor functions.
Covers cable type distinction (QSFP112-QSFP112 vs QSFP28-QSFP28),
transceiver form-factor ordering (OSFP, QSFP-DD, QSFP56, SFP+),
connector inclusion in transceiver description, and fiber in cable description.
"""

import pytest
from app.ai.component_classifier import _extract_cable, _extract_transceiver, _extract_nic


class TestExtractCable:

    def test_qsfp112_qsfp112_cable_type(self):
        attrs = _extract_cable("QSFP112-QSFP112 DAC 400GbE 1.5m")
        assert attrs["cable_type"] == "QSFP112-QSFP112"

    def test_qsfp28_qsfp28_cable_type(self):
        attrs = _extract_cable("QSFP28-QSFP28 100GbE DAC 3m")
        assert attrs["cable_type"] == "QSFP28-QSFP28"

    def test_qsfp_cu_fallback_is_qsfp_qsfp(self):
        attrs = _extract_cable("QSFP-Cu DAC 100G 1m")
        assert attrs["cable_type"] == "QSFP-QSFP"

    def test_sc_lc_cable_type(self):
        attrs = _extract_cable("SC-LC fiber patch 10m SMF")
        assert attrs["cable_type"] == "SC-LC"

    def test_sc_sc_cable_type(self):
        attrs = _extract_cable("SC-SC fiber cable 5m")
        assert attrs["cable_type"] == "SC-SC"

    def test_400g_speed_extracted(self):
        attrs = _extract_cable("QSFP112-QSFP112 400GbE AOC 3m")
        assert attrs["speed"] == "400G"

    def test_100g_speed_extracted(self):
        attrs = _extract_cable("LC-LC 100GbE SMF 10m")
        assert attrs["speed"] == "100G"

    def test_fiber_mmf_extracted(self):
        attrs = _extract_cable("LC-LC OM4/MMF 100GbE 3m")
        assert attrs.get("fiber") == "OM4/MMF"

    def test_fiber_smf_extracted(self):
        attrs = _extract_cable("MPO-LC SMF 100G 10m")
        assert attrs.get("fiber") == "SMF"

    def test_lc_lc_still_detected_before_sc_checks(self):
        attrs = _extract_cable("LC-LC OM4 50m")
        assert attrs["cable_type"] == "LC-LC"

    def test_mpo_mpo_still_detected(self):
        attrs = _extract_cable("MPO-MPO 8F OM4 100G 30m")
        assert attrs["cable_type"] == "MPO-MPO"


class TestExtractTransceiver:

    def test_osfp_form_factor(self):
        attrs = _extract_transceiver("OSFP 800G SR8 MMF")
        assert attrs["form_factor"] == "OSFP"

    def test_qsfp_dd_form_factor(self):
        attrs = _extract_transceiver("QSFP-DD 400GbE SR8")
        assert attrs["form_factor"] == "QSFP-DD"

    def test_qsfp_dd_variant_spelling(self):
        attrs = _extract_transceiver("QSFPdd 400G SR")
        assert attrs["form_factor"] == "QSFP-DD"

    def test_qsfp112_form_factor(self):
        attrs = _extract_transceiver("QSFP112 400G SR4")
        assert attrs["form_factor"] == "QSFP112"

    def test_qsfp56_form_factor(self):
        attrs = _extract_transceiver("QSFP56 200G SR4")
        assert attrs["form_factor"] == "QSFP56"

    def test_qsfp28_form_factor(self):
        attrs = _extract_transceiver("QSFP28 100GbE SR4 MMF")
        assert attrs["form_factor"] == "QSFP28"

    def test_sfp_plus_form_factor(self):
        attrs = _extract_transceiver("SFP+ 10GbE SR MMF")
        assert attrs["form_factor"] == "SFP+"

    def test_sfp28_form_factor(self):
        attrs = _extract_transceiver("SFP28 25GbE SR MMF")
        assert attrs["form_factor"] == "SFP28"

    def test_sfp_generic_form_factor(self):
        attrs = _extract_transceiver("SFP 1GbE LX SMF")
        assert attrs["form_factor"] == "SFP"

    def test_qsfp_dd_takes_priority_over_qsfp28(self):
        attrs = _extract_transceiver("QSFP-DD QSFP28 compatible 400G")
        assert attrs["form_factor"] == "QSFP-DD"

    def test_osfp_takes_priority_over_qsfp_dd(self):
        attrs = _extract_transceiver("OSFP QSFP-DD adapter 800G")
        assert attrs["form_factor"] == "OSFP"

    def test_mpo_connector_extracted(self):
        attrs = _extract_transceiver("QSFP28 100G SR4 MPO-12")
        assert attrs.get("connector") == "MPO"

    def test_lc_connector_extracted(self):
        attrs = _extract_transceiver("SFP28 25G SR duplex LC")
        assert attrs.get("connector") == "LC"


class TestExtractNicPorts:

    def test_2p_standalone_notation(self):
        """'2P' uppercase standalone should yield 2 ports."""
        attrs = _extract_nic("Intel X710-DA2 2P 10GbE SFP+")
        assert attrs["ports"] == "2 ports"

    def test_4p_standalone_notation(self):
        attrs = _extract_nic("Mellanox ConnectX-5 4P 25GbE")
        assert attrs["ports"] == "4 ports"

    def test_dual_port_word_form(self):
        attrs = _extract_nic("Dual Port 25GbE NIC SFP28")
        assert attrs["ports"] == "2 ports"

    def test_quad_port_word_form(self):
        attrs = _extract_nic("Quad Port 10GbE RJ45 NIC")
        assert attrs["ports"] == "4 ports"

    def test_numeric_port_dash(self):
        attrs = _extract_nic("4-Port 10GbE NIC")
        assert attrs["ports"] == "4 ports"

    def test_no_port_info_omitted(self):
        attrs = _extract_nic("10GbE NIC SFP+")
        assert "ports" not in attrs

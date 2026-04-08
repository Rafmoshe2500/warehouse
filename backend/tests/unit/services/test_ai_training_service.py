import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from app.services.ai_training_service import AITrainingService


@pytest.fixture
def training_service(mock_mongodb):
    return AITrainingService()


class TestAITrainingService:

    @pytest.mark.asyncio
    async def test_extract_training_data_returns_labeled_rows(self, training_service):
        """Verified catalog entries with excel_description + category are extracted."""
        # Seed data into the collection
        col = training_service.collection
        await col.insert_many([
            {"excel_description": "Drive Pack 2X15.3TB NVMe", "category": "disk", "part_number": "P1"},
            {"excel_description": "QSFP28 100GbE SR", "category": "sfp-qsfp", "part_number": "P2"},
            # Missing excel_description — should be excluded
            {"category": "cable", "part_number": "P3"},
            # Missing category — should be excluded
            {"excel_description": "Some Cable", "part_number": "P4"},
        ])

        rows = await training_service.extract_training_data()

        assert len(rows) == 2
        texts = [r["text"] for r in rows]
        assert "Drive Pack 2X15.3TB NVMe" in texts
        assert "QSFP28 100GbE SR" in texts
        # Labels should be Hebrew (reverse-mapped from category slug)
        labels = {r["label"] for r in rows}
        assert "דיסק" in labels
        assert "ג'יביק" in labels

    @pytest.mark.asyncio
    async def test_extract_training_data_skips_unknown_categories(self, training_service):
        """Unknown category slugs are skipped (no reverse mapping)."""
        col = training_service.collection
        await col.delete_many({})
        await col.insert_one(
            {"excel_description": "Mystery Part", "category": "nonexistent-slug", "part_number": "PX"}
        )
        rows = await training_service.extract_training_data()
        assert len(rows) == 0

    @pytest.mark.asyncio
    async def test_retrain_model_insufficient_data(self, training_service):
        """Retrain raises ValueError when not enough data (empty DB + no CSV)."""
        with patch.object(training_service, "_load_csv_data") as mock_csv:
            import pandas as pd
            mock_csv.return_value = pd.DataFrame(columns=["text", "label"])

            with pytest.raises(ValueError, match="Not enough training data"):
                await training_service.retrain_model()

    @pytest.mark.asyncio
    async def test_retrain_model_success(self, training_service, tmp_path):
        """Retrain completes successfully with adequate data."""
        import pandas as pd

        # Build a small but sufficient dataset (need enough per class for stratified split)
        rows = []
        for label in ["כבל", "דיסק", "מתג"]:
            for i in range(10):
                rows.append({"text": f"Sample {label} item {i}", "label": label})
        fake_csv = pd.DataFrame(rows)

        model_out = tmp_path / "model.pkl"

        with patch.object(training_service, "_load_csv_data", return_value=fake_csv), \
             patch("app.services.ai_training_service._MODEL_PATH", str(model_out)), \
             patch("app.ai.classifier.reload") as mock_reload:

            metrics = await training_service.retrain_model()

        assert metrics["total_samples"] == 30
        assert metrics["mongo_samples"] == 0
        assert metrics["test_accuracy"] > 0
        assert model_out.exists()
        mock_reload.assert_called_once()

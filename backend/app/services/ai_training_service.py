"""
ai_training_service.py — Service for retraining the BOM component classifier
from verified user-corrected data stored in MongoDB's bom_part_catalog collection.
"""

import os
import logging
from typing import List, Dict, Tuple

import pandas as pd
import joblib
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import accuracy_score

from app.db.mongodb import MongoDB
from app.ai.classifier import CATEGORY_TO_LABEL

logger = logging.getLogger(__name__)

_MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "ai", "component_classifier_v2.pkl"
)
_CSV_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "scripts", "train", "text_classify.csv"
)

MIN_SAMPLES_FOR_RETRAIN = 20


class AITrainingService:
    """Extracts training data from MongoDB, retrains the classifier, and reloads it."""

    def __init__(self):
        self.collection = MongoDB.get_collection("bom_part_catalog")

    async def extract_training_data(self) -> List[Dict]:
        """Pull verified parts from bom_part_catalog that have both
        excel_description (text) and category (label)."""
        cursor = self.collection.find(
            {
                "excel_description": {"$exists": True, "$ne": ""},
                "category": {"$exists": True, "$ne": ""},
            },
            {"excel_description": 1, "category": 1, "_id": 0},
        )
        rows = []
        async for doc in cursor:
            text = doc.get("excel_description", "").strip()
            category = doc.get("category", "").strip()
            if text and category:
                label = CATEGORY_TO_LABEL.get(category)
                if label:
                    rows.append({"text": text, "label": label})
        logger.info("Extracted %d verified training samples from bom_part_catalog", len(rows))
        return rows

    def _load_csv_data(self) -> pd.DataFrame:
        """Load the static CSV training set."""
        csv_path = os.path.normpath(_CSV_PATH)
        if not os.path.exists(csv_path):
            logger.warning("Static CSV not found at %s — using only MongoDB data", csv_path)
            return pd.DataFrame(columns=["text", "label"])
        df = pd.read_csv(csv_path, names=["text", "label"], header=0, encoding="utf-8-sig")
        df = df[df["label"].notna() & df["text"].notna()].copy()
        df["text"] = df["text"].str.strip()
        df["label"] = df["label"].str.strip()
        logger.info("Loaded %d samples from static CSV", len(df))
        return df

    async def retrain_model(self) -> Dict:
        """Full retrain pipeline: extract data → merge with CSV → train → save → reload.

        Returns a dict with training metrics.
        """
        logger.info("Starting model retrain...")

        mongo_rows = await self.extract_training_data()
        csv_df = self._load_csv_data()

        if mongo_rows:
            mongo_df = pd.DataFrame(mongo_rows)
            combined = pd.concat([csv_df, mongo_df], ignore_index=True)
            combined = combined.drop_duplicates(subset=["text"], keep="last")
        else:
            combined = csv_df

        if len(combined) < MIN_SAMPLES_FOR_RETRAIN:
            msg = f"Not enough training data ({len(combined)} samples, minimum {MIN_SAMPLES_FOR_RETRAIN})"
            logger.warning(msg)
            raise ValueError(msg)

        X = combined["text"].values
        y = combined["label"].values

        pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(
                analyzer="word",
                ngram_range=(1, 3),
                min_df=1,
                max_features=8000,
                sublinear_tf=True,
            )),
            ("clf", LogisticRegression(
                max_iter=2000,
                C=5.0,
                class_weight="balanced",
            )),
        ])

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        pipeline.fit(X_train, y_train)
        test_accuracy = accuracy_score(y_test, pipeline.predict(X_test))

        n_splits = min(5, min(pd.Series(y).value_counts()))
        if n_splits >= 2:
            cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
            cv_scores = cross_val_score(pipeline, X, y, cv=cv, scoring="accuracy")
            cv_mean = float(cv_scores.mean())
        else:
            cv_mean = None

        pipeline.fit(X, y)

        model_path = os.path.normpath(_MODEL_PATH)
        joblib.dump(pipeline, model_path)
        logger.info("New model saved to %s", model_path)

        from app.ai.classifier import reload
        reload()
        logger.info("Classifier cache reloaded")

        metrics = {
            "total_samples": len(combined),
            "mongo_samples": len(mongo_rows),
            "csv_samples": len(csv_df),
            "test_accuracy": round(test_accuracy, 4),
            "cv_accuracy": round(cv_mean, 4) if cv_mean is not None else None,
            "labels": sorted(combined["label"].unique().tolist()),
        }
        logger.info("Retrain complete: %s", metrics)
        return metrics

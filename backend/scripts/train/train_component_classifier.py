"""
train_component_classifier.py
===============================
אימון מודל Classification לסיווג רכיבי חומרה מתיאורי מוצרים.
קטגוריות: כבל, מתג, כרטיסיה, ג'יביק, מדף דיסקים, דיסק, שרת אחסון,
           מעבד, זכרונות, מאוורר, ספק כח, רישוי נפח, רישוי תוכנה, תמיכה, אחר
"""

import os
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_CSV_PATH = os.path.join(_SCRIPT_DIR, "text_classify.csv")
_MODEL_OUTPUT = os.path.join(_SCRIPT_DIR, "..", "..", "app", "ai", "component_classifier_v2.pkl")

# ─────────────────────────────────────────────
# 1. טעינת נתונים
# ─────────────────────────────────────────────
df = pd.read_csv(_CSV_PATH, names=["text", "label"], header=0, encoding="utf-8-sig")
df = df[df["label"].notna() & df["text"].notna()].copy()
df["text"] = df["text"].str.strip()
df["label"] = df["label"].str.strip()

X = df["text"].values
y = df["label"].values

print(f"Total samples: {len(df)}")
print(df["label"].value_counts())

# ─────────────────────────────────────────────
# 2. Train / Test Split
# ─────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ─────────────────────────────────────────────
# 3. Pipeline: TF-IDF + Logistic Regression
# ─────────────────────────────────────────────
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

pipeline.fit(X_train, y_train)

# ─────────────────────────────────────────────
# 4. הערכה
# ─────────────────────────────────────────────
y_pred = pipeline.predict(X_test)
print(f"\nTest Accuracy: {accuracy_score(y_test, y_pred):.3f}")
print()
print(classification_report(y_test, y_pred))

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(pipeline, X, y, cv=cv, scoring="accuracy")
print(f"CV Accuracy: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

# ─────────────────────────────────────────────
# 5. אימון מחדש על כל הנתונים + שמירה
# ─────────────────────────────────────────────
pipeline.fit(X, y)
_output = os.path.normpath(_MODEL_OUTPUT)
joblib.dump(pipeline, _output)
print(f"\nModel saved: {_output}")

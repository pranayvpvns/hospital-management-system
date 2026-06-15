import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib

# Step 1: Load dataset
df = pd.read_csv("Training.csv")

print("Dataset Loaded ✅")
print("Shape:", df.shape)

# Step 2: Features & Target
X = df.drop("prognosis", axis=1)

# Handle NaNs: Drop empty columns (e.g. 'Unnamed: 133' from trailing CSV commas) and fill others
X = X.dropna(axis=1, how='all')
X = X.fillna(0)

y = df["prognosis"]

# Step 3: Encode disease labels
le = LabelEncoder()
y_encoded = le.fit_transform(y)

print("Encoding Done ✅")

# Step 4: Train model
model = RandomForestClassifier(n_estimators=100)
model.fit(X, y_encoded)

print("Model Trained ✅")

# Step 5: Save files
joblib.dump(model, "disease_model.pkl")
joblib.dump(le, "label_encoder.pkl")
joblib.dump(X.columns.tolist(), "symptom_columns.pkl")

print("✅ All PKL files saved successfully!")
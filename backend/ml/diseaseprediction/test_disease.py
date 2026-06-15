import os
import joblib
import numpy as np

# Load model files with proper paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, "disease_model.pkl")
encoder_path = os.path.join(BASE_DIR, "label_encoder.pkl")
columns_path = os.path.join(BASE_DIR, "symptom_columns.pkl")

# Only load if files exist (prevents collection errors)
if os.path.exists(model_path):
    model = joblib.load(model_path)
    encoder = joblib.load(encoder_path)
    columns = joblib.load(columns_path)
else:
    model = None
    encoder = None
    columns = []

if __name__ == "__main__":
    if model is None:
        print("❌ Model files not found.")
    else:
        print("✅ Disease Model Loaded Successfully\n")

        # Show some symptoms
        print("Available symptoms (sample):")
        print(columns[:20])  # show first 20

        # Take input
        user_input = input("\nEnter symptoms (comma separated): ")

        # Convert to list
        symptoms = [s.strip() for s in user_input.split(",")]

        # Create input vector
        input_data = np.zeros(len(columns))

        # Set symptoms = 1
        for s in symptoms:
            if s in columns:
                input_data[columns.index(s)] = 1
            else:
                print(f"⚠️ Warning: '{s}' not found in dataset")

        # Predict
        prediction = model.predict([input_data])
        disease = encoder.inverse_transform(prediction)[0]

        print("\n🦠 Predicted Disease:", disease)
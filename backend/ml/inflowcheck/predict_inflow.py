# predict_inflow.py

import joblib
import pandas as pd

model = joblib.load("inflow_model.pkl")

# Example: predict for a date
date = pd.to_datetime("2024-05-01")
day = date.toordinal()

prediction = model.predict([[day]])

print("Predicted Patients:", int(prediction[0]))
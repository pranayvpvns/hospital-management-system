import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import joblib

# Step 1: Generate synthetic data (100 days)
dates = pd.date_range(start="2024-01-01", periods=100)

data = pd.DataFrame({
    "Date": dates,
    "Patient_Count": np.random.randint(80, 200, size=100)
})

# Step 2: Convert Date → numeric
data['Day'] = data['Date'].map(pd.Timestamp.toordinal)

X = data[['Day']]
y = data['Patient_Count']

# Step 3: Train model
model = LinearRegression()
model.fit(X, y)

# Step 4: Save model
joblib.dump(model, "inflow_model.pkl")

print("✅ inflow_model.pkl created successfully")
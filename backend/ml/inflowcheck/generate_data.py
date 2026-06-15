# generate_data.py

import pandas as pd
import numpy as np

dates = pd.date_range(start="2024-01-01", periods=100)

data = pd.DataFrame({
    "Date": dates,
    "Patient_Count": np.random.randint(80, 200, size=100)
})

data.to_csv("inflow_data.csv", index=False)

print("Generated inflow data ✅")
# inflow_preprocess.py

import pandas as pd

# Load dataset
df = pd.read_excel("hospital_data_sampleee.xlsx")

# Convert Entry Time
df['Entry Time'] = pd.to_datetime(df['Entry Time'], format='%H:%M:%S', errors='coerce')

# Create FAKE DATE (since your dataset has no date)
df['Date'] = pd.to_datetime('2024-01-01')

# Group → count patients per day
daily = df.groupby('Date').size().reset_index(name='Patient_Count')

print(daily)

# Save processed data
daily.to_csv("daily_patient_count.csv", index=False)
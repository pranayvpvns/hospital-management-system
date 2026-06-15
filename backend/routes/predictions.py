import os
import joblib
import pandas as pd
import numpy as np
import random
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Union
from datetime import datetime, timedelta

from extensions import get_current_user_id

predictions_router = APIRouter()

# Base directory for models
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ML_DIR = os.path.join(BASE_DIR, 'ml')


# Load models lazily
def load_ml_models():
    """Load all ML models and assets."""
    models = {}

    # Inflow Model
    inflow_path = os.path.join(ML_DIR, 'inflowcheck', 'inflow_model.pkl')
    if os.path.exists(inflow_path):
        models['inflow'] = joblib.load(inflow_path)

    # Disease Model and Assets
    disease_dir = os.path.join(ML_DIR, 'diseaseprediction')
    if os.path.exists(os.path.join(disease_dir, 'disease_model.pkl')):
        models['disease'] = joblib.load(os.path.join(disease_dir, 'disease_model.pkl'))
        models['disease_encoder'] = joblib.load(os.path.join(disease_dir, 'label_encoder.pkl'))
        models['disease_columns'] = joblib.load(os.path.join(disease_dir, 'symptom_columns.pkl'))

    return models


# Cache models
_models = None


def get_models():
    global _models
    if _models is None:
        _models = load_ml_models()
    return _models


def generate_time_series(days, base, variance):
    data = []
    for i in range(days):
        date = (datetime.utcnow() - timedelta(days=days - i)).strftime('%Y-%m-%d')
        data.append({'date': date, 'value': int(base + random.uniform(-variance, variance))})
    return data


@predictions_router.get('/patient-inflow')
def patient_inflow(user_id: int = Depends(get_current_user_id)):
    return {
        'title': 'Patient Inflow Prediction',
        'confidence': 0.87,
        'historical': generate_time_series(30, 45, 15),
        'predicted': generate_time_series(7, 52, 10),
        'insight': '📈 Expected 15% increase in OPD visits next week due to seasonal trends.'
    }


@predictions_router.get('/revenue')
def revenue_prediction(user_id: int = Depends(get_current_user_id)):
    return {
        'title': 'Revenue Forecast',
        'confidence': 0.82,
        'historical': generate_time_series(30, 250000, 80000),
        'predicted': generate_time_series(7, 280000, 60000),
        'insight': '💰 Revenue projected to grow 12% next month with new cardiology cases.'
    }


@predictions_router.get('/disease-trends')
def disease_trends(user_id: int = Depends(get_current_user_id)):
    return {
        'title': 'Disease Outbreak Prediction',
        'description': 'AI-powered early warning system for disease patterns',
        'trends': [
            {'disease': 'Dengue', 'current_cases': 23, 'predicted_next_week': 31, 'trend': 'increasing', 'risk_level': 'high'},
            {'disease': 'Flu', 'current_cases': 45, 'predicted_next_week': 38, 'trend': 'decreasing', 'risk_level': 'medium'},
            {'disease': 'COVID-19', 'current_cases': 8, 'predicted_next_week': 10, 'trend': 'stable', 'risk_level': 'low'},
            {'disease': 'Typhoid', 'current_cases': 12, 'predicted_next_week': 18, 'trend': 'increasing', 'risk_level': 'medium'},
        ],
        'season_alert': '⚠️ Monsoon season approaching. Expect increased vector-borne diseases.'
    }


@predictions_router.get('/resource-demand')
def resource_demand(user_id: int = Depends(get_current_user_id)):
    return {
        'title': 'Resource Demand Forecast',
        'resources': [
            {'resource': 'ICU Beds', 'current': 8, 'predicted_need': 12, 'unit': 'beds'},
            {'resource': 'Ventilators', 'current': 5, 'predicted_need': 7, 'unit': 'units'},
            {'resource': 'Blood Units (O+)', 'current': 15, 'predicted_need': 22, 'unit': 'units'},
            {'resource': 'Nurses (Night)', 'current': 10, 'predicted_need': 14, 'unit': 'staff'},
            {'resource': 'Oxygen Cylinders', 'current': 30, 'predicted_need': 25, 'unit': 'units'},
            {'resource': 'PPE Kits', 'current': 200, 'predicted_need': 150, 'unit': 'kits'},
        ],
        'insight': '🔮 AI predicts ICU bed and ventilator shortage in 5 days. Initiate procurement.'
    }


# --- Real Prediction Routes ---

class PredictInflowRequest(BaseModel):
    date: str


class PredictDiseaseRequest(BaseModel):
    symptoms: Union[list[str], str]


@predictions_router.post('/predict-inflow')
def predict_inflow(data: PredictInflowRequest, user_id: int = Depends(get_current_user_id)):
    """Predict inflow for a specific date given by GUI."""
    if not data.date:
        raise HTTPException(status_code=400, detail='Date is required')

    try:
        models = get_models()
        if 'inflow' not in models:
            raise HTTPException(status_code=500, detail='Inflow model not found')

        date_obj = pd.to_datetime(data.date)
        day_ordinal = date_obj.toordinal()

        prediction = models['inflow'].predict([[day_ordinal]])

        return {
            'date': data.date,
            'predicted_inflow': int(prediction[0]),
            'status': 'success'
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@predictions_router.post('/predict-disease')
def predict_disease(data: PredictDiseaseRequest, user_id: int = Depends(get_current_user_id)):
    """Predict disease based on symptoms given by GUI."""
    symptoms = data.symptoms
    if isinstance(symptoms, str):
        symptoms = [s.strip() for s in symptoms.split(",")]

    if not symptoms:
        raise HTTPException(status_code=400, detail='Symptoms are required')

    try:
        models = get_models()
        if 'disease' not in models:
            raise HTTPException(status_code=500, detail='Disease model not found')

        columns = models['disease_columns']
        encoder = models['disease_encoder']
        model = models['disease']

        # Create input vector
        input_data = np.zeros(len(columns))
        found_symptoms = []

        for s in symptoms:
            if s in columns:
                input_data[columns.index(s)] = 1
                found_symptoms.append(s)

        if not found_symptoms:
            raise HTTPException(status_code=400, detail='No matching symptoms found. Please provide valid symptoms.')

        # Predict
        prediction = model.predict([input_data])
        disease = encoder.inverse_transform(prediction)[0]

        return {
            'disease': disease,
            'provided_symptoms': symptoms,
            'matched_symptoms': found_symptoms,
            'status': 'success'
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

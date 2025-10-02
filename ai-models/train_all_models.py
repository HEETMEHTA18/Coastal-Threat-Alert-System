import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, mean_squared_error
import joblib
from feature_vector import create_feature_vector

# --- CONFIG ---
HISTORICAL_WEATHER_PATH = 'weather_data_with_rainfall.csv'  # For rain alert
CURRENTS_DATA_PATH = 'final_training_dataset.csv'           # For currents/sea-level
CHATBOT_DATA_PATH = 'Dataset_for_chatbot.csv'               # For additional features

# --- 1. Rain Alert Classifier ---
def train_rain_classifier():
    df = pd.read_csv(HISTORICAL_WEATHER_PATH)
    # Drop rows with missing rainfall
    df = df.dropna(subset=['rainfall'])
    # Binary rain label
    df['rain_label'] = (df['rainfall'] > 0.1).astype(int)
    features = ['temperature', 'humidity', 'wind_speed']
    X = df[features]
    y = df['rain_label']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)
    print('Rain Classifier Report:')
    print(classification_report(y_test, y_pred))
    joblib.dump(clf, 'rain_classifier.pkl')

# --- 2. Weather Regression (Temperature, Humidity) ---
def train_weather_regressors():
    df = pd.read_csv(HISTORICAL_WEATHER_PATH)
    df = df.dropna(subset=['temperature', 'humidity', 'wind_speed'])
    features = ['humidity', 'wind_speed']
    targets = ['temperature', 'humidity']
    for target in targets:
        X = df[features]
        y = df[target]
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        reg = RandomForestRegressor(n_estimators=100, random_state=42)
        reg.fit(X_train, y_train)
        y_pred = reg.predict(X_test)
        print(f'{target.capitalize()} Regressor RMSE:', np.sqrt(mean_squared_error(y_test, y_pred)))
        joblib.dump(reg, f'{target}_regressor.pkl')

# --- 3. Currents/Sea Level Regression ---
def train_currents_regressor():
    df = pd.read_csv(CURRENTS_DATA_PATH)
    df = df.dropna(subset=['water_level_m', 'wind_speed_m_s', 'air_pressure_hpa'])
    features = ['wind_speed_m_s', 'air_pressure_hpa', 'chlorophyll_mg_m3']
    target = 'water_level_m'
    X = df[features]
    y = df[target]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    reg = RandomForestRegressor(n_estimators=100, random_state=42)
    reg.fit(X_train, y_train)
    y_pred = reg.predict(X_test)
    print('Water Level Regressor RMSE:', np.sqrt(mean_squared_error(y_test, y_pred)))
    joblib.dump(reg, 'water_level_regressor.pkl')

if __name__ == '__main__':
    train_rain_classifier()
    train_weather_regressors()
    train_currents_regressor()
    print('All models trained and saved.')

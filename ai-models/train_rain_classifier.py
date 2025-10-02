import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

# Load your historical weather data
# Make sure the file path is correct
# You can adjust the filename if needed

df = pd.read_csv('weatherHistory.csv')

# Create a binary target: 1 if 'Precip Type' is 'rain', else 0
df['rain'] = (df['Precip Type'].str.lower() == 'rain').astype(int)

# Select features for prediction (add/remove as needed)
features = [
    'Temperature (C)', 'Apparent Temperature (C)', 'Humidity',
    'Wind Speed (km/h)', 'Wind Bearing (degrees)', 'Visibility (km)',
    'Pressure (millibars)'
]
df = df.dropna(subset=features + ['rain'])

X = df[features]
y = df['rain']

# Split and train
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)

# Evaluate (optional)
print("Train accuracy:", clf.score(X_train, y_train))
print("Test accuracy:", clf.score(X_test, y_test))

# Save the model
joblib.dump(clf, 'rain_classifier.pkl')
print("Model saved as rain_classifier.pkl")

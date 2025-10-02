import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib

# Load dataset
file_path = 'final_training_dataset.csv'  # Adjust path if needed
df = pd.read_csv(file_path)

# Select relevant features and target
features = [
    'water_level_m',
    'wind_speed_m_s',
    'air_pressure_hpa',
    'chlorophyll_mg_m3',
    'rainfall'
]
target = 'anomaly'


# Keep only relevant columns
df = df[features + [target]]

# Print initial row count
print(f"Initial rows: {len(df)}")

# Print missing value counts
print("Missing values per column:\n", df.isnull().sum())

# Fill missing values in features with mean
df[features] = df[features].fillna(df[features].mean())

# Drop rows where target is missing
df = df.dropna(subset=[target])

# Print row count after filling
print(f"Rows after filling missing values: {len(df)}")

X = df[features]
y = df[target]

# Split data for training and testing
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train RandomForest Classifier
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)

# Evaluate model
y_pred = clf.predict(X_test)
print('Accuracy:', accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred))

# Save the trained model
joblib.dump(clf, 'alert_model.pkl')
print('Model saved as alert_model.pkl')

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from generate_dataset import generate_polar_dataset

DATA_PATH = os.path.join(os.path.dirname(__file__), "polar_energy_data.csv")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

class PolarAIEngine:
    def __init__(self, data_path=DATA_PATH, models_dir=MODELS_DIR):
        self.data_path = data_path
        self.models_dir = models_dir
        self.demand_model = None
        self.solar_model = None
        self.wind_model = None
        self.metrics = {}
        
    def load_or_generate_data(self):
        if not os.path.exists(self.data_path):
            print("Dataset not found. Generating simulated Antarctic dataset...")
            generate_polar_dataset(self.data_path)
            
        df = pd.read_csv(self.data_path)
        df['dt'] = pd.to_datetime(df['timestamp'])
        df['hour'] = df['dt'].dt.hour
        df['month'] = df['dt'].dt.month
        df['day_of_year'] = df['dt'].dt.dayofyear
        df['lag_demand_1h'] = df['energy_demand'].shift(1).bfill()
        df['lag_demand_24h'] = df['energy_demand'].shift(24).bfill()
        return df

    def train_models(self):
        df = self.load_or_generate_data()
        
        # Feature matrix for demand
        feature_cols_demand = [
            'temperature', 'wind_speed', 'solar_irradiance', 
            'station_activity', 'hour', 'month', 'day_of_year',
            'lag_demand_1h', 'lag_demand_24h'
        ]
        
        X_demand = df[feature_cols_demand]
        y_demand = df['energy_demand']
        
        # Train-test split (80-20 sequential)
        split_idx = int(len(df) * 0.8)
        X_train_d, X_test_d = X_demand.iloc[:split_idx], X_demand.iloc[split_idx:]
        y_train_d, y_test_d = y_demand.iloc[:split_idx], y_demand.iloc[split_idx:]
        
        print("Training AI Demand Forecasting Model (Random Forest)...")
        self.demand_model = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1)
        self.demand_model.fit(X_train_d, y_train_d)
        
        preds_d = self.demand_model.predict(X_test_d)
        mae_d = float(mean_absolute_error(y_test_d, preds_d))
        rmse_d = float(np.sqrt(mean_squared_error(y_test_d, preds_d)))
        r2_d = float(r2_score(y_test_d, preds_d))
        
        # Renewable Solar Model
        feature_cols_solar = ['solar_irradiance', 'hour', 'month', 'temperature']
        X_solar = df[feature_cols_solar]
        y_solar = df['solar_generation']
        self.solar_model = RandomForestRegressor(n_estimators=60, max_depth=10, random_state=42, n_jobs=-1)
        self.solar_model.fit(X_solar.iloc[:split_idx], y_solar.iloc[:split_idx])
        preds_s = self.solar_model.predict(X_solar.iloc[split_idx:])
        mae_s = float(mean_absolute_error(y_solar.iloc[split_idx:], preds_s))
        
        # Renewable Wind Model
        feature_cols_wind = ['wind_speed', 'temperature', 'month', 'hour']
        X_wind = df[feature_cols_wind]
        y_wind = df['wind_generation']
        self.wind_model = RandomForestRegressor(n_estimators=60, max_depth=10, random_state=42, n_jobs=-1)
        self.wind_model.fit(X_wind.iloc[:split_idx], y_wind.iloc[:split_idx])
        preds_w = self.wind_model.predict(X_wind.iloc[split_idx:])
        mae_w = float(mean_absolute_error(y_wind.iloc[split_idx:], preds_w))
        
        self.metrics = {
            "demand": {"mae": round(mae_d, 2), "rmse": round(rmse_d, 2), "r2": round(r2_d, 4)},
            "solar": {"mae": round(mae_s, 2)},
            "wind": {"mae": round(mae_w, 2)},
            "feature_importance": dict(zip(feature_cols_demand, [round(x, 4) for x in self.demand_model.feature_importances_]))
        }
        
        # Save model artifacts
        os.makedirs(self.models_dir, exist_ok=True)
        joblib.dump(self.demand_model, os.path.join(self.models_dir, "demand_model.joblib"))
        joblib.dump(self.solar_model, os.path.join(self.models_dir, "solar_model.joblib"))
        joblib.dump(self.wind_model, os.path.join(self.models_dir, "wind_model.joblib"))
        print(f"AI Models trained successfully! Demand MAE: {mae_d:.2f} kW, R²: {r2_d:.4f}")
        return self.metrics

    def predict_24h_horizon(self, current_weather):
        """
        Generates 24-hour predictive forecast vectors based on ambient weather parameters.
        current_weather: dict with keys 'temperature', 'wind_speed', 'solar_irradiance', 'station_activity'
        """
        if self.demand_model is None:
            self.load_models_or_train()
            
        base_temp = current_weather.get('temperature', -15.0)
        base_wind = current_weather.get('wind_speed', 25.0)
        base_solar = current_weather.get('solar_irradiance', 150.0)
        activity_level = current_weather.get('station_activity', 70.0)
        
        predictions = []
        last_demand = 120.0
        
        for hour in range(24):
            # Diurnal temperature fluctuation
            temp_h = base_temp + np.sin(np.radians((hour - 14) * 15)) * 2.0
            
            # Diurnal solar profile
            if base_solar > 0:
                solar_h = max(0.0, np.sin(np.radians((hour - 6) * 15))) * (base_solar * 1.5)
            else:
                solar_h = 0.0
                
            wind_h = max(0.0, base_wind + np.random.normal(0, 3.0))
            act_h = activity_level if (8 <= hour <= 19) else activity_level * 0.5
            
            feat_d = pd.DataFrame([{
                'temperature': temp_h,
                'wind_speed': wind_h,
                'solar_irradiance': solar_h,
                'station_activity': act_h,
                'hour': hour,
                'month': 1,
                'day_of_year': 15,
                'lag_demand_1h': last_demand,
                'lag_demand_24h': last_demand * 0.95
            }])
            
            pred_demand = float(self.demand_model.predict(feat_d)[0])
            
            feat_s = pd.DataFrame([{
                'solar_irradiance': solar_h, 'hour': hour, 'month': 1, 'temperature': temp_h
            }])
            pred_solar = float(self.solar_model.predict(feat_s)[0])
            
            feat_w = pd.DataFrame([{
                'wind_speed': wind_h, 'temperature': temp_h, 'month': 1, 'hour': hour
            }])
            pred_wind = float(self.wind_model.predict(feat_w)[0])
            
            predictions.append({
                "hour": hour,
                "temperature": round(temp_h, 1),
                "wind_speed": round(wind_h, 1),
                "solar_irradiance": round(solar_h, 1),
                "predicted_demand": round(max(35.0, pred_demand), 2),
                "predicted_solar": round(max(0.0, pred_solar), 2),
                "predicted_wind": round(max(0.0, pred_wind), 2)
            })
            
            last_demand = pred_demand
            
        return predictions

    def load_models_or_train(self):
        demand_p = os.path.join(self.models_dir, "demand_model.joblib")
        solar_p = os.path.join(self.models_dir, "solar_model.joblib")
        wind_p = os.path.join(self.models_dir, "wind_model.joblib")
        
        if os.path.exists(demand_p) and os.path.exists(solar_p) and os.path.exists(wind_p):
            self.demand_model = joblib.load(demand_p)
            self.solar_model = joblib.load(solar_p)
            self.wind_model = joblib.load(wind_p)
            print("Loaded pre-trained AI models from disk.")
        else:
            self.train_models()

if __name__ == "__main__":
    ai = PolarAIEngine()
    metrics = ai.train_models()
    print("Metrics:", metrics)
    sample_fc = ai.predict_24h_horizon({"temperature": -20, "wind_speed": 30, "solar_irradiance": 100})
    print("Sample 24h prediction count:", len(sample_fc))

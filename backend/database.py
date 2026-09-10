import sqlite3
import os
import pandas as pd

DB_PATH = os.path.join(os.path.dirname(__file__), "polar_ems.db")

def init_db(db_path=DB_PATH):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Telemetry Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS telemetry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            temperature REAL,
            wind_speed REAL,
            solar_irradiance REAL,
            station_activity REAL,
            energy_demand REAL,
            solar_generation REAL,
            wind_generation REAL,
            battery_level REAL,
            diesel_generation REAL,
            fuel_consumption REAL
        )
    ''')
    
    # Simulation Event Log
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS simulation_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            scenario_name TEXT,
            temperature REAL,
            wind_speed REAL,
            solar_irradiance REAL,
            predicted_demand REAL,
            fuel_saved_liters REAL
        )
    ''')
    
    conn.commit()
    conn.close()
    print("SQLite Database initialized:", db_path)

def seed_db_from_csv(csv_path, db_path=DB_PATH):
    if not os.path.exists(csv_path):
        return
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT count(*) FROM telemetry")
    count = cursor.fetchone()[0]
    if count == 0:
        df = pd.read_csv(csv_path)
        df.to_sql("telemetry", conn, if_exists="append", index=False)
        print(f"Seeded {len(df)} rows into SQLite telemetry table.")
    conn.close()

if __name__ == "__main__":
    init_db()

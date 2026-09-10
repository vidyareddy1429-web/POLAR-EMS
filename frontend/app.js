/* ==========================================================================
   POLAR-EMS Interactive Frontend Logic & Backend API Integration
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const API_BASE_URL = "http://localhost:8000/api/v1";
    let isBlizzardSim = false;
    let forecastChart = null;

    let batteryState = {
        capacity: 500.0,
        soc: 68.5,
        minReserve: 20.0,
        rateKw: -45.0,
        health: 'HEALTHY'
    };

    let loads = {
        ev: { kw: 40.0, active: true },
        melter: { kw: 35.0, active: true },
        workshop: { kw: 20.4, active: true }
    };

    async function fetchForecastData(blizzard = false) {
        try {
            const response = await fetch(`${API_BASE_URL}/forecast?is_blizzard=${blizzard}`);
            if (response.ok) {
                const json = await response.json();
                const forecast = json.horizon;

                const hours = forecast.map(f => f.hour_label);
                const demand = forecast.map(f => f.predicted_demand_kw);
                const solar = forecast.map(f => f.predicted_solar_kw);
                const wind = forecast.map(f => f.predicted_wind_kw);
                const battery = [];
                const diesel = [];

                forecast.forEach(f => {
                    const netDef = f.predicted_demand_kw - (f.predicted_solar_kw + f.predicted_wind_kw);
                    if (netDef > 0) {
                        battery.push(Math.min(netDef, 120.0));
                        diesel.push(Math.max(0, netDef - 120.0));
                    } else {
                        battery.push(netDef);
                        diesel.push(0);
                    }
                });

                return { hours, demand, solar, wind, battery, diesel };
            }
        } catch (e) {
            console.log("Backend offline, fallback to local physics engine", e);
        }

        // Local Fallback Physics
        const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
        const demand = [], solar = [], wind = [], battery = [], diesel = [];

        const activeFlexKw = (loads.ev.active ? loads.ev.kw : 0) +
                             (loads.melter.active ? loads.melter.kw : 0) +
                             (loads.workshop.active ? loads.workshop.kw : 0);

        for (let h = 0; h < 24; h++) {
            let baseDemand = 190.0 + activeFlexKw;
            if (h >= 6 && h <= 10) baseDemand += 35.0;
            if (h >= 17 && h <= 21) baseDemand += 45.0;
            if (blizzard) baseDemand += 85.0;

            demand.push(Math.round(baseDemand * 10) / 10);

            let solarKw = 0;
            if (!blizzard && h >= 6 && h <= 18) {
                solarKw = Math.max(0, 65.0 * Math.sin(((h - 6) / 12) * Math.PI));
            }
            solar.push(Math.round(solarKw * 10) / 10);

            let windKw = blizzard ? 145.0 + Math.sin(h * 0.8) * 20.0 : 110.0 + Math.cos(h * 0.5) * 25.0;
            wind.push(Math.round(windKw * 10) / 10);

            const netDeficit = baseDemand - (solarKw + windKw);
            let battDischarge = 0, dieselGen = 0;

            if (netDeficit > 0) {
                if (h >= 16 && h <= 21 && blizzard) {
                    battDischarge = Math.min(netDeficit, 40.0);
                    dieselGen = netDeficit - battDischarge;
                } else {
                    battDischarge = Math.min(netDeficit, 120.0);
                    dieselGen = Math.max(0, netDeficit - battDischarge);
                }
            } else {
                battDischarge = netDeficit;
                dieselGen = 0;
            }

            battery.push(Math.round(battDischarge * 10) / 10);
            diesel.push(Math.round(dieselGen * 10) / 10);
        }

        return { hours, demand, solar, wind, battery, diesel };
    }

    async function initChart() {
        const ctx = document.getElementById('forecastChart').getContext('2d');
        const data = await fetchForecastData(isBlizzardSim);

        forecastChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.hours,
                datasets: [
                    {
                        label: 'Electricity Demand (kW)',
                        data: data.demand,
                        borderColor: '#8B5CF6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.3,
                        pointRadius: 2
                    },
                    {
                        label: 'Solar Availability (kW)',
                        data: data.solar,
                        borderColor: '#F59E0B',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0
                    },
                    {
                        label: 'Wind Availability (kW)',
                        data: data.wind,
                        borderColor: '#0EA5E9',
                        backgroundColor: 'rgba(14, 165, 233, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0
                    },
                    {
                        label: 'Battery Discharge (+) / Charge (-) (kW)',
                        data: data.battery,
                        borderColor: '#10B981',
                        borderWidth: 2,
                        borderDash: [4, 4],
                        fill: false,
                        tension: 0.3,
                        pointRadius: 0
                    },
                    {
                        label: 'Diesel Backup Dispatch (kW)',
                        data: data.diesel,
                        borderColor: '#EF4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.25)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.2,
                        pointRadius: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94A3B8', font: { family: 'JetBrains Mono', size: 10 } } },
                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94A3B8', font: { family: 'JetBrains Mono', size: 10 } } }
                }
            }
        });
    }

    async function updateChart() {
        if (!forecastChart) return;
        const data = await fetchForecastData(isBlizzardSim);

        forecastChart.data.labels = data.hours;
        forecastChart.data.datasets[0].data = data.demand;
        forecastChart.data.datasets[1].data = data.solar;
        forecastChart.data.datasets[2].data = data.wind;
        forecastChart.data.datasets[3].data = data.battery;
        forecastChart.data.datasets[4].data = data.diesel;

        forecastChart.update('active');
    }

    async function updateUI() {
        const activeFlex = (loads.ev.active ? loads.ev.kw : 0) +
                          (loads.melter.active ? loads.melter.kw : 0) +
                          (loads.workshop.active ? loads.workshop.kw : 0);

        const currentDemand = isBlizzardSim ? (365.0 + activeFlex) : (190.0 + activeFlex);
        const currentSolar = isBlizzardSim ? 0.0 : 42.1;
        const currentWind = isBlizzardSim ? 142.0 : 115.0;

        const totalRenewables = currentSolar + currentWind;
        const deficit = currentDemand - totalRenewables;

        let batteryRate = 0;
        let dieselKw = 0;

        if (isBlizzardSim) {
            batteryRate = 40.0;
            dieselKw = Math.max(0, deficit - batteryRate);
            batteryState.soc = 24.0;
        } else {
            batteryRate = Math.min(deficit, 120.0);
            dieselKw = Math.max(0, deficit - batteryRate);
            batteryState.soc = 68.5;
        }

        // Telemetry
        document.getElementById('val-temp').innerText = isBlizzardSim ? '-35.0°C' : '-24.2°C';
        document.getElementById('val-wind').innerText = isBlizzardSim ? '58.2 kt' : '38.4 kt';
        document.getElementById('val-irradiance').innerText = isBlizzardSim ? '0 W/m²' : '320 W/m²';

        // KPI Cards
        document.getElementById('kpi-demand').innerText = currentDemand.toFixed(1);
        document.getElementById('kpi-t2-load').innerText = `${activeFlex.toFixed(1)} kW`;
        document.getElementById('prog-demand').style.width = `${Math.min(100, (currentDemand / 450) * 100)}%`;

        document.getElementById('kpi-solar').innerText = currentSolar.toFixed(1);
        document.getElementById('prog-solar').style.width = `${(currentSolar / 65) * 100}%`;

        document.getElementById('kpi-wind').innerText = currentWind.toFixed(1);
        document.getElementById('prog-wind').style.width = `${(currentWind / 180) * 100}%`;

        document.getElementById('kpi-batt-soc').innerText = batteryState.soc.toFixed(1);
        document.getElementById('kpi-batt-kwh').innerText = `${((batteryState.soc / 100) * 500).toFixed(1)} kWh`;
        document.getElementById('kpi-batt-rate').innerText = `${batteryRate > 0 ? '-' : '+'}${Math.abs(batteryRate).toFixed(1)} kW`;
        document.getElementById('prog-batt').style.width = `${batteryState.soc}%`;

        document.getElementById('kpi-diesel').innerText = dieselKw.toFixed(1);
        document.getElementById('kpi-diesel-burn').innerText = `${(dieselKw * 0.25).toFixed(1)} L/h`;
        document.getElementById('prog-diesel').style.width = `${(dieselKw / 250) * 100}%`;

        // Battery Vessel Simulator
        document.getElementById('batt-liquid').style.height = `${batteryState.soc}%`;
        document.getElementById('vessel-soc').innerText = `${batteryState.soc.toFixed(1)}%`;
        document.getElementById('vessel-kwh').innerText = `${((batteryState.soc / 100) * 500).toFixed(1)} / 500 kWh`;
        document.getElementById('batt-strategy').innerText = batteryRate > 0 ? `DISCHARGING (-${batteryRate.toFixed(1)} kW)` : `CHARGING (+${Math.abs(batteryRate).toFixed(1)} kW)`;

        // Alert Panel
        const alertTitle = document.getElementById('alert-title-text');
        const causalList = document.getElementById('causal-list-items');
        const actionBox = document.getElementById('action-box-text');
        const badgeStatus = document.getElementById('badge-load-status');

        if (isBlizzardSim) {
            badgeStatus.innerText = 'EXTREME SURGE';
            badgeStatus.className = 'kpi-badge badge-red';

            alertTitle.innerText = `🔴 ${dieselKw.toFixed(0)} kW Critical Fuel Deficit Anticipated (Blizzard Condition)`;
            causalList.innerHTML = `
                <li><i data-lucide="arrow-right-circle"></i> Temp dropped to -35°C $\\rightarrow$ Thermal heating load spiked (+85 kW)</li>
                <li><i data-lucide="arrow-right-circle"></i> Solar Irradiance collapsed to 0 W/m²</li>
                <li><i data-lucide="arrow-right-circle"></i> Wind turbines operating near survival cut-out threshold (58 kt)</li>
                <li><i data-lucide="arrow-right-circle"></i> Battery hit 20% Safety Reserve limit (Discharge capped)</li>
            `;
            actionBox.innerHTML = `
                <strong>EMERGENCY DISPATCH:</strong> Start Diesel Generator #1 at <strong>${dieselKw.toFixed(0)} kW</strong>. Auto-shed Tier 2 Flexible Loads (${activeFlex.toFixed(0)} kW) to preserve 100% Tier 1 Life Support & SatComm.
            `;
        } else {
            badgeStatus.innerText = 'NOMINAL';
            badgeStatus.className = 'kpi-badge badge-purple';

            alertTitle.innerText = `🔴 70 kW Deficit Predicted at 18:00 (Horizon H+11)`;
            causalList.innerHTML = `
                <li><i data-lucide="arrow-right-circle"></i> Temp drops to -32°C $\\rightarrow$ Heating demand spikes (+45 kW)</li>
                <li><i data-lucide="arrow-right-circle"></i> Solar elevation decays $\\rightarrow$ Generation drops to 50 kW</li>
                <li><i data-lucide="arrow-right-circle"></i> Wind generation holds at 100 kW</li>
                <li><i data-lucide="arrow-right-circle"></i> Battery reserve reaches 20% limit (Max safe discharge: 80 kW)</li>
            `;
            actionBox.innerHTML = `
                <strong>ACTION PLAN:</strong> Dispatch Diesel Backup Gen #1 at <strong>70 kW</strong> from 17:45 to 20:00. Retain 100% Tier 1 Life Support. Shed Tier 2 EV Snowmobile Charging to save 12.4 L fuel.
            `;
        }
        lucide.createIcons();
        await updateChart();
    }

    const btnSim = document.getElementById('btn-weather-sim');
    btnSim.addEventListener('click', () => {
        isBlizzardSim = !isBlizzardSim;
        if (isBlizzardSim) {
            btnSim.classList.add('sim-active');
            btnSim.innerHTML = `<i data-lucide="sun"></i><span>Restore Nominal Weather</span>`;
        } else {
            btnSim.classList.remove('sim-active');
            btnSim.innerHTML = `<i data-lucide="cloud-lightning"></i><span>Blizzard Sim (-35°C)</span>`;
        }
        lucide.createIcons();
        updateUI();
    });

    document.getElementById('toggle-load-ev').addEventListener('change', (e) => {
        loads.ev.active = e.target.checked;
        updateUI();
    });

    document.getElementById('toggle-load-melter').addEventListener('change', (e) => {
        loads.melter.active = e.target.checked;
        updateUI();
    });

    document.getElementById('toggle-load-workshop').addEventListener('change', (e) => {
        loads.workshop.active = e.target.checked;
        updateUI();
    });

    document.getElementById('btn-reset-loads').addEventListener('click', () => {
        loads.ev.active = false;
        loads.melter.active = false;
        loads.workshop.active = false;

        document.getElementById('toggle-load-ev').checked = false;
        document.getElementById('toggle-load-melter').checked = false;
        document.getElementById('toggle-load-workshop').checked = false;

        updateUI();
    });

    initChart();
    updateUI();
});

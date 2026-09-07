export interface ImpactMetrics {
    powerKW: number;
    carbonKg: number;
    euroLossPerSecond: number;
    efficiency: number;
}

export function calculateImpact(status: string, rpm: number): ImpactMetrics {
    const isCritical = status === 'CRITICAL FAILURE';
    const isOptimal = rpm >= 2900 && rpm <= 3100;

    // Power calculation (kW)
    const basePower = 50;
    const powerKW = isCritical
        ? basePower + (Math.random() * 20)
        : basePower + (Math.abs(rpm - 3000) / 1000) * 5;

    // Carbon footprint (kg CO2)
    const gridFactor = 0.4; // kg CO2 per kWh
    const carbonKg = powerKW * gridFactor;

    // Financial loss (€ per second)
    const euroLossPerSecond = isCritical ? 14.0 : 0;

    // OEE (Overall Equipment Effectiveness)
    let efficiency = 95;
    if (isCritical) {
        efficiency = 30 + Math.random() * 20; // 30-50%
    } else if (!isOptimal) {
        efficiency = 70 + Math.random() * 15; // 70-85%
    } else {
        efficiency = 92 + Math.random() * 6; // 92-98%
    }

    return {
        powerKW: parseFloat(powerKW.toFixed(2)),
        carbonKg: parseFloat(carbonKg.toFixed(3)),
        euroLossPerSecond: parseFloat(euroLossPerSecond.toFixed(2)),
        efficiency: parseFloat(efficiency.toFixed(1))
    };
}

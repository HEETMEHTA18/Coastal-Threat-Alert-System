"""
Simple NOAA Current Data Analysis for CTAS - Cape Henry Data
Analysis of your real NOAA buoy data without external dependencies
"""

import xml.etree.ElementTree as ET
import json
import math
from datetime import datetime

def parse_cape_henry_data():
    """Parse and analyze your Cape Henry current data"""
    
    # Your XML data
    xml_data = """<?xml version="1.0" encoding="UTF-8"?>
<data>
<metadata id="cb0102" name="Cape Henry LB 2CH" lat="36.9594" lon="-76.0128"/>
<observations>
<cu t="2025-08-30 00:08" s="0.809" d="99" b="4"/>
<cu t="2025-08-30 00:14" s="0.848" d="104" b="4"/>
<cu t="2025-08-30 00:20" s="0.84" d="118" b="4"/>
<cu t="2025-08-30 00:26" s="0.89" d="98" b="4"/>
<cu t="2025-08-30 00:32" s="0.853" d="115" b="4"/>
<cu t="2025-08-30 00:38" s="0.826" d="110" b="4"/>
<cu t="2025-08-30 00:44" s="0.758" d="116" b="4"/>
<cu t="2025-08-30 00:50" s="0.768" d="115" b="4"/>
<cu t="2025-08-30 01:08" s="0.801" d="105" b="4"/>
<cu t="2025-08-30 01:14" s="0.686" d="120" b="4"/>
<cu t="2025-08-30 01:20" s="0.634" d="97" b="4"/>
<cu t="2025-08-30 01:26" s="0.484" d="102" b="4"/>
<cu t="2025-08-30 01:32" s="0.544" d="108" b="4"/>
<cu t="2025-08-30 01:38" s="0.5" d="104" b="4"/>
<cu t="2025-08-30 01:44" s="0.47" d="105" b="4"/>
<cu t="2025-08-30 01:50" s="0.568" d="119" b="4"/>
<cu t="2025-08-30 01:56" s="0.367" d="109" b="4"/>
<cu t="2025-08-30 02:02" s="0.334" d="102" b="4"/>
<cu t="2025-08-30 02:08" s="0.34" d="108" b="4"/>
<cu t="2025-08-30 02:14" s="0.383" d="105" b="4"/>
<cu t="2025-08-30 02:20" s="0.327" d="118" b="4"/>
<cu t="2025-08-30 02:26" s="0.284" d="121" b="4"/>
<cu t="2025-08-30 02:32" s="0.157" d="137" b="4"/>
<cu t="2025-08-30 02:38" s="0.189" d="139" b="4"/>
<cu t="2025-08-30 02:44" s="0.159" d="209" b="4"/>
</observations>
</data>"""
    
    try:
        root = ET.fromstring(xml_data)
        
        # Extract metadata
        metadata = root.find('metadata')
        station_id = metadata.get('id')
        station_name = metadata.get('name')
        lat = float(metadata.get('lat'))
        lon = float(metadata.get('lon'))
        
        # Extract observations
        observations = []
        obs_element = root.find('observations')
        
        for cu_element in obs_element.findall('cu'):
            observation = {
                'timestamp': cu_element.get('t'),
                'speed_knots': float(cu_element.get('s')),
                'direction_degrees': float(cu_element.get('d')),
                'bin_depth': int(cu_element.get('b'))
            }
            # Convert speed from knots to m/s
            observation['speed_ms'] = observation['speed_knots'] * 0.514444
            observations.append(observation)
        
        # Calculate statistics
        speeds_knots = [obs['speed_knots'] for obs in observations]
        speeds_ms = [obs['speed_ms'] for obs in observations]
        directions = [obs['direction_degrees'] for obs in observations]
        
        analysis = {
            'station_info': {
                'id': station_id,
                'name': station_name,
                'latitude': lat,
                'longitude': lon,
                'location': 'Chesapeake Bay entrance'
            },
            'data_summary': {
                'total_measurements': len(observations),
                'time_span': f"{observations[0]['timestamp']} to {observations[-1]['timestamp']}",
                'duration_minutes': 2.6 * len(observations),  # 6-minute intervals
            },
            'current_statistics': {
                'mean_speed_knots': sum(speeds_knots) / len(speeds_knots),
                'max_speed_knots': max(speeds_knots),
                'min_speed_knots': min(speeds_knots),
                'mean_speed_ms': sum(speeds_ms) / len(speeds_ms),
                'max_speed_ms': max(speeds_ms),
                'min_speed_ms': min(speeds_ms),
                'mean_direction': sum(directions) / len(directions),
            },
            'trend_analysis': analyze_current_trend(observations),
            'threat_assessment': assess_threats(observations),
            'tidal_indicators': analyze_tidal_pattern(observations)
        }
        
        return observations, analysis
        
    except Exception as e:
        print(f"Error parsing XML: {e}")
        return [], {}

def analyze_current_trend(observations):
    """Analyze the trend in current speed over time"""
    speeds = [obs['speed_ms'] for obs in observations]
    
    # Simple trend calculation
    n = len(speeds)
    sum_x = sum(range(n))
    sum_y = sum(speeds)
    sum_xy = sum(i * speeds[i] for i in range(n))
    sum_x2 = sum(i * i for i in range(n))
    
    # Linear regression slope
    slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)
    
    trend_description = "increasing" if slope > 0.001 else "decreasing" if slope < -0.001 else "stable"
    
    return {
        'trend_slope_ms_per_measurement': slope,
        'trend_description': trend_description,
        'speed_change_over_period': speeds[-1] - speeds[0],
        'largest_speed_jump': max(abs(speeds[i+1] - speeds[i]) for i in range(len(speeds)-1))
    }

def analyze_tidal_pattern(observations):
    """Analyze tidal patterns in the current data"""
    speeds = [obs['speed_ms'] for obs in observations]
    directions = [obs['direction_degrees'] for obs in observations]
    
    # Find speed peaks and troughs (simplified tidal analysis)
    peaks = []
    troughs = []
    
    for i in range(1, len(speeds)-1):
        if speeds[i] > speeds[i-1] and speeds[i] > speeds[i+1]:
            peaks.append(i)
        elif speeds[i] < speeds[i-1] and speeds[i] < speeds[i+1]:
            troughs.append(i)
    
    # Direction changes (flood vs ebb indication)
    direction_changes = []
    for i in range(1, len(directions)):
        change = directions[i] - directions[i-1]
        if change > 180:
            change -= 360
        elif change < -180:
            change += 360
        direction_changes.append(abs(change))
    
    avg_direction_change = sum(direction_changes) / len(direction_changes) if direction_changes else 0
    
    return {
        'speed_peaks_count': len(peaks),
        'speed_troughs_count': len(troughs),
        'avg_direction_change': avg_direction_change,
        'direction_stability': 'stable' if avg_direction_change < 20 else 'variable',
        'tidal_phase': determine_tidal_phase(speeds)
    }

def determine_tidal_phase(speeds):
    """Determine current tidal phase based on speed pattern"""
    recent_speeds = speeds[-5:]  # Last 5 measurements
    
    if len(recent_speeds) < 2:
        return 'insufficient_data'
    
    # Check if speeds are generally increasing or decreasing
    increasing = sum(1 for i in range(1, len(recent_speeds)) if recent_speeds[i] > recent_speeds[i-1])
    decreasing = sum(1 for i in range(1, len(recent_speeds)) if recent_speeds[i] < recent_speeds[i-1])
    
    if increasing > decreasing:
        return 'strengthening' if max(recent_speeds) > 0.5 else 'building'
    elif decreasing > increasing:
        return 'weakening' if min(recent_speeds) < 0.3 else 'slacking'
    else:
        return 'turning'

def assess_threats(observations):
    """Assess potential coastal threats based on current data"""
    latest = observations[-1]
    speeds = [obs['speed_ms'] for obs in observations]
    
    current_speed = latest['speed_ms']
    avg_speed = sum(speeds) / len(speeds)
    max_speed = max(speeds)
    
    threats = {
        'rip_current_risk': 'low',
        'erosion_potential': 'low',
        'navigation_hazard': 'low',
        'pollutant_transport': 'low'
    }
    
    # Assess threats based on current conditions
    if current_speed > 1.0:  # >1 m/s is strong
        threats['rip_current_risk'] = 'high'
        threats['navigation_hazard'] = 'moderate'
    elif current_speed > 0.6:
        threats['rip_current_risk'] = 'moderate'
    
    if max_speed > 1.2:
        threats['erosion_potential'] = 'high'
    elif avg_speed > 0.7:
        threats['erosion_potential'] = 'moderate'
    
    if current_speed > 0.8:
        threats['pollutant_transport'] = 'high'
    elif current_speed > 0.5:
        threats['pollutant_transport'] = 'moderate'
    
    # Strong persistent currents are navigation hazards
    strong_currents = sum(1 for s in speeds if s > 0.8)
    if strong_currents > len(speeds) * 0.5:
        threats['navigation_hazard'] = 'high'
    
    return threats

def print_analysis(observations, analysis):
    """Print formatted analysis results"""
    print("=" * 60)
    print("🌊 CAPE HENRY CURRENT DATA ANALYSIS")
    print("=" * 60)
    
    station = analysis['station_info']
    print(f"Station: {station['name']} ({station['id']})")
    print(f"Location: {station['latitude']:.4f}°N, {station['longitude']:.4f}°W")
    print(f"Area: {station['location']}")
    
    summary = analysis['data_summary']
    print(f"\nData Points: {summary['total_measurements']}")
    print(f"Time Period: {summary['time_span']}")
    print(f"Duration: {summary['duration_minutes']:.1f} minutes")
    
    stats = analysis['current_statistics']
    print(f"\n📊 CURRENT STATISTICS:")
    print(f"  Mean Speed: {stats['mean_speed_knots']:.3f} knots ({stats['mean_speed_ms']:.3f} m/s)")
    print(f"  Max Speed:  {stats['max_speed_knots']:.3f} knots ({stats['max_speed_ms']:.3f} m/s)")
    print(f"  Min Speed:  {stats['min_speed_knots']:.3f} knots ({stats['min_speed_ms']:.3f} m/s)")
    print(f"  Mean Direction: {stats['mean_direction']:.1f}°")
    
    trend = analysis['trend_analysis']
    print(f"\n📈 TREND ANALYSIS:")
    print(f"  Overall Trend: {trend['trend_description'].upper()}")
    print(f"  Speed Change: {trend['speed_change_over_period']:+.3f} m/s over period")
    print(f"  Largest Jump: {trend['largest_speed_jump']:.3f} m/s")
    
    tidal = analysis['tidal_indicators']
    print(f"\n🌊 TIDAL ANALYSIS:")
    print(f"  Current Phase: {tidal['tidal_phase'].replace('_', ' ').title()}")
    print(f"  Direction Stability: {tidal['direction_stability'].title()}")
    print(f"  Speed Peaks: {tidal['speed_peaks_count']}")
    print(f"  Speed Troughs: {tidal['speed_troughs_count']}")
    
    threats = analysis['threat_assessment']
    print(f"\n⚠️  THREAT ASSESSMENT:")
    for threat, level in threats.items():
        risk_emoji = "🔴" if level == "high" else "🟡" if level == "moderate" else "🟢"
        print(f"  {risk_emoji} {threat.replace('_', ' ').title()}: {level.upper()}")
    
    latest = observations[-1]
    print(f"\n🕐 LATEST MEASUREMENT:")
    print(f"  Time: {latest['timestamp']}")
    print(f"  Speed: {latest['speed_knots']:.3f} knots ({latest['speed_ms']:.3f} m/s)")
    print(f"  Direction: {latest['direction_degrees']:.0f}°")
    print(f"  Depth Bin: {latest['bin_depth']}")

def generate_ctas_integration():
    """Generate integration guidance for CTAS system"""
    print("\n" + "=" * 60)
    print("🔗 CTAS INTEGRATION RECOMMENDATIONS")
    print("=" * 60)
    
    print("\n1. API ENDPOINT INTEGRATION:")
    print("   Add to your backend apiService.js:")
    print("   - /api/currents/station/{station_id}")
    print("   - /api/currents/analysis/{station_id}")
    print("   - /api/currents/forecast/{station_id}")
    
    print("\n2. FRONTEND DASHBOARD COMPONENTS:")
    print("   - Current Speed Gauge (real-time)")
    print("   - Current Direction Compass")
    print("   - Threat Level Indicators")
    print("   - Tidal Phase Display")
    
    print("\n3. ALERT THRESHOLDS:")
    print("   - Speed > 1.0 m/s: High current warning")
    print("   - Direction change > 45°: Tidal turning alert")
    print("   - Speed anomaly: Equipment/weather alert")
    
    print("\n4. AI MODEL INTEGRATION:")
    print("   - Use current data as input for sea level anomaly detection")
    print("   - Integrate with pollution transport modeling")
    print("   - Feed into coastal erosion risk assessment")

if __name__ == "__main__":
    # Parse and analyze your data
    observations, analysis = parse_cape_henry_data()
    
    if observations:
        print_analysis(observations, analysis)
        generate_ctas_integration()
        
        # Save analysis to JSON
        with open('cape_henry_analysis.json', 'w') as f:
            json.dump({
                'observations': observations,
                'analysis': analysis
            }, f, indent=2)
        
        print(f"\n💾 Analysis saved to: cape_henry_analysis.json")
        print(f"📁 Location: d:\\HackOut\\CTAS\\Hackout\\ai-models\\")
    else:
        print("❌ Failed to parse current data")

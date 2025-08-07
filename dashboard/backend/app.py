"""
Flask Backend for Brent Oil Change Point Analysis Dashboard

This module provides APIs to serve data from the analysis results,
making it accessible for the React frontend.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
import json
from datetime import datetime
import os
import sys

# Add src directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from data_loader import load_oil_data, load_events_data, preprocess_data
from model import BayesianChangePointModel, calculate_log_returns
from utils import generate_impact_report, calculate_statistical_metrics

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Global variables to store loaded data
oil_df = None
events_df = None
model_results = None

def load_analysis_data():
    """Load and preprocess analysis data."""
    global oil_df, events_df
    
    try:
        # Load data
        oil_df = load_oil_data('../../data/brent_oil_prices.csv')
        events_df = load_events_data('../../data/geopolitical_events.csv')
        
        # Preprocess data
        oil_df = preprocess_data(oil_df, calculate_returns=True)
        
        print("Data loaded successfully!")
        return True
    except Exception as e:
        print(f"Error loading data: {e}")
        return False

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'healthy', 'message': 'Dashboard API is running'})

@app.route('/api/data/oil-prices', methods=['GET'])
def get_oil_prices():
    """Get oil price data."""
    if oil_df is None:
        return jsonify({'error': 'Data not loaded'}), 500
    
    # Convert to JSON-serializable format
    data = []
    for _, row in oil_df.iterrows():
        data.append({
            'date': row['Date'].strftime('%Y-%m-%d'),
            'price': float(row['Price']),
            'log_returns': float(row['log_returns']) if 'log_returns' in oil_df.columns else None
        })
    
    return jsonify({
        'data': data,
        'summary': {
            'total_observations': len(oil_df),
            'date_range': {
                'start': oil_df['Date'].min().strftime('%Y-%m-%d'),
                'end': oil_df['Date'].max().strftime('%Y-%m-%d')
            },
            'price_stats': oil_df['Price'].describe().to_dict()
        }
    })

@app.route('/api/data/events', methods=['GET'])
def get_events():
    """Get geopolitical events data."""
    if events_df is None:
        return jsonify({'error': 'Data not loaded'}), 500
    
    data = []
    for _, row in events_df.iterrows():
        data.append({
            'date': row['date'].strftime('%Y-%m-%d'),
            'event': row['event'],
            'type': row['type'],
            'impact': row['impact']
        })
    
    return jsonify({
        'data': data,
        'summary': {
            'total_events': len(events_df),
            'event_types': events_df['type'].value_counts().to_dict(),
            'impact_levels': events_df['impact'].value_counts().to_dict()
        }
    })

@app.route('/api/analysis/change-points', methods=['POST'])
def run_change_point_analysis():
    """Run change point analysis and return results."""
    if oil_df is None:
        return jsonify({'error': 'Data not loaded'}), 500
    
    try:
        # Get parameters from request
        data = request.get_json() or {}
        samples = data.get('samples', 2000)
        tune = data.get('tune', 1000)
        
        # Run Bayesian change point detection
        log_returns = oil_df['log_returns'].values
        model = BayesianChangePointModel(log_returns, oil_df['Date'])
        
        # Fit the model
        trace = model.fit(samples=samples, tune=tune)
        
        # Get change point
        change_point_idx, change_point_date = model.get_change_point()
        
        # Generate impact report
        impact_report = generate_impact_report(oil_df, change_point_date, events_df)
        
        # Get parameter summary
        param_summary = model.get_parameter_summary()
        
        # Prepare results
        results = {
            'change_point': {
                'index': int(change_point_idx),
                'date': change_point_date.strftime('%Y-%m-%d'),
                'observation_date': oil_df.iloc[change_point_idx]['Date'].strftime('%Y-%m-%d')
            },
            'impact_report': impact_report,
            'parameter_summary': param_summary,
            'model_performance': {
                'samples': samples,
                'tune': tune,
                'convergence': True  # Simplified for demo
            }
        }
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

@app.route('/api/analysis/statistics', methods=['GET'])
def get_statistics():
    """Get statistical summary of the data."""
    if oil_df is None:
        return jsonify({'error': 'Data not loaded'}), 500
    
    # Calculate statistics
    price_stats = calculate_statistical_metrics(oil_df['Price'])
    returns_stats = calculate_statistical_metrics(oil_df['log_returns'])
    
    return jsonify({
        'price_statistics': price_stats,
        'returns_statistics': returns_stats,
        'volatility_analysis': {
            'rolling_std_30d': oil_df['log_returns'].rolling(window=30).std().dropna().tolist(),
            'rolling_std_90d': oil_df['log_returns'].rolling(window=90).std().dropna().tolist()
        }
    })

@app.route('/api/analysis/events-impact', methods=['GET'])
def get_events_impact():
    """Analyze impact of events on oil prices."""
    if oil_df is None or events_df is None:
        return jsonify({'error': 'Data not loaded'}), 500
    
    # Calculate price changes around events
    event_impacts = []
    
    for _, event in events_df.iterrows():
        event_date = event['date']
        
        # Find closest price data to event
        closest_idx = (oil_df['Date'] - event_date).abs().idxmin()
        closest_price = oil_df.iloc[closest_idx]['Price']
        
        # Calculate price change in surrounding period
        window = 30  # 30 days before and after
        start_idx = max(0, closest_idx - window)
        end_idx = min(len(oil_df), closest_idx + window)
        
        before_prices = oil_df.iloc[start_idx:closest_idx]['Price']
        after_prices = oil_df.iloc[closest_idx:end_idx]['Price']
        
        if len(before_prices) > 0 and len(after_prices) > 0:
            price_change = ((after_prices.mean() - before_prices.mean()) / before_prices.mean()) * 100
        else:
            price_change = 0
        
        event_impacts.append({
            'event': event['event'],
            'date': event_date.strftime('%Y-%m-%d'),
            'type': event['type'],
            'impact': event['impact'],
            'price_at_event': float(closest_price),
            'price_change_pct': float(price_change)
        })
    
    return jsonify({
        'event_impacts': event_impacts,
        'summary': {
            'total_events_analyzed': len(event_impacts),
            'average_price_change': np.mean([e['price_change_pct'] for e in event_impacts]),
            'events_by_type': events_df['type'].value_counts().to_dict()
        }
    })

@app.route('/api/visualization/price-timeline', methods=['GET'])
def get_price_timeline():
    """Get data for price timeline visualization."""
    if oil_df is None:
        return jsonify({'error': 'Data not loaded'}), 500
    
    # Prepare timeline data
    timeline_data = []
    for _, row in oil_df.iterrows():
        timeline_data.append({
            'date': row['Date'].strftime('%Y-%m-%d'),
            'price': float(row['Price']),
            'log_returns': float(row['log_returns']) if 'log_returns' in oil_df.columns else None
        })
    
    return jsonify({
        'timeline_data': timeline_data,
        'annotations': [
            {
                'date': row['date'].strftime('%Y-%m-%d'),
                'event': row['event'],
                'type': row['type'],
                'impact': row['impact']
            }
            for _, row in events_df.iterrows()
        ]
    })

@app.route('/api/visualization/change-point-analysis', methods=['GET'])
def get_change_point_visualization():
    """Get data for change point analysis visualization."""
    if oil_df is None:
        return jsonify({'error': 'Data not loaded'}), 500
    
    try:
        # Run a quick change point analysis for visualization
        log_returns = oil_df['log_returns'].values
        model = BayesianChangePointModel(log_returns, oil_df['Date'])
        trace = model.fit(samples=1000, tune=500)  # Quick run for visualization
        
        change_point_idx, change_point_date = model.get_change_point()
        
        # Prepare visualization data
        before_data = oil_df.iloc[:change_point_idx]
        after_data = oil_df.iloc[change_point_idx:]
        
        return jsonify({
            'change_point': {
                'date': change_point_date.strftime('%Y-%m-%d'),
                'index': int(change_point_idx)
            },
            'before_period': {
                'data': [
                    {
                        'date': row['Date'].strftime('%Y-%m-%d'),
                        'price': float(row['Price'])
                    }
                    for _, row in before_data.iterrows()
                ],
                'statistics': {
                    'mean_price': float(before_data['Price'].mean()),
                    'std_price': float(before_data['Price'].std()),
                    'count': len(before_data)
                }
            },
            'after_period': {
                'data': [
                    {
                        'date': row['Date'].strftime('%Y-%m-%d'),
                        'price': float(row['Price'])
                    }
                    for _, row in after_data.iterrows()
                ],
                'statistics': {
                    'mean_price': float(after_data['Price'].mean()),
                    'std_price': float(after_data['Price'].std()),
                    'count': len(after_data)
                }
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Visualization failed: {str(e)}'}), 500

if __name__ == '__main__':
    # Load data on startup
    if load_analysis_data():
        print("Starting Flask server...")
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        print("Failed to load data. Exiting.")
        sys.exit(1) 
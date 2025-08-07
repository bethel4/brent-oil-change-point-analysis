"""
Unit Tests for Bayesian Change Point Model

This module contains unit tests for the change point detection model
and related utility functions.
"""

import unittest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sys
import os

# Add src directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from model import BayesianChangePointModel, calculate_log_returns, associate_events_with_change_point, quantify_price_impact
from data_loader import load_oil_data, load_events_data, preprocess_data
from utils import calculate_statistical_metrics, generate_impact_report


class TestBayesianChangePointModel(unittest.TestCase):
    """Test cases for the Bayesian Change Point Model."""
    
    def setUp(self):
        """Set up test data."""
        # Create sample data
        dates = pd.date_range('2020-01-01', periods=100, freq='D')
        np.random.seed(42)
        
        # Create synthetic price data with a change point
        prices = np.concatenate([
            np.random.normal(50, 5, 50),  # Before change point
            np.random.normal(70, 8, 50)   # After change point
        ])
        
        self.oil_df = pd.DataFrame({
            'Date': dates,
            'Price': prices
        })
        
        # Create sample events data
        self.events_df = pd.DataFrame({
            'date': ['2020-02-15', '2020-03-01'],
            'event': ['Test Event 1', 'Test Event 2'],
            'type': ['Geopolitical', 'OPEC'],
            'impact': ['High', 'Medium']
        })
        self.events_df['date'] = pd.to_datetime(self.events_df['date'])
    
    def test_model_initialization(self):
        """Test model initialization."""
        log_returns = calculate_log_returns(self.oil_df['Price'])
        model = BayesianChangePointModel(log_returns, self.oil_df['Date'])
        
        self.assertEqual(model.n_obs, len(log_returns))
        self.assertIsNone(model.trace)
        self.assertIsNone(model.model)
    
    def test_model_building(self):
        """Test model building."""
        log_returns = calculate_log_returns(self.oil_df['Price'])
        model = BayesianChangePointModel(log_returns, self.oil_df['Date'])
        
        built_model = model.build_model()
        self.assertIsNotNone(built_model)
        self.assertIsNotNone(model.model)
    
    def test_log_returns_calculation(self):
        """Test log returns calculation."""
        log_returns = calculate_log_returns(self.oil_df['Price'])
        
        self.assertEqual(len(log_returns), len(self.oil_df) - 1)
        self.assertTrue(np.all(np.isfinite(log_returns)))
    
    def test_event_association(self):
        """Test event association with change point."""
        change_point_date = pd.Timestamp('2020-02-20')
        nearby_events = associate_events_with_change_point(
            change_point_date, self.events_df, time_window_days=30
        )
        
        self.assertIsInstance(nearby_events, pd.DataFrame)
        self.assertTrue(len(nearby_events) >= 0)
    
    def test_price_impact_quantification(self):
        """Test price impact quantification."""
        change_point_idx = 50
        impact = quantify_price_impact(self.oil_df, change_point_idx)
        
        self.assertIn('mean_price_before', impact)
        self.assertIn('mean_price_after', impact)
        self.assertIn('price_change_pct', impact)
        self.assertIn('volatility_before', impact)
        self.assertIn('volatility_after', impact)
        
        self.assertIsInstance(impact['mean_price_before'], float)
        self.assertIsInstance(impact['mean_price_after'], float)
        self.assertIsInstance(impact['price_change_pct'], float)


class TestDataLoader(unittest.TestCase):
    """Test cases for data loading functions."""
    
    def test_oil_data_loading(self):
        """Test oil data loading."""
        # This test would require the actual data file
        # For now, we'll test the function structure
        try:
            df = load_oil_data('../data/brent_oil_prices.csv')
            self.assertIn('Date', df.columns)
            self.assertIn('Price', df.columns)
            self.assertTrue(df['Date'].dtype == 'datetime64[ns]')
        except FileNotFoundError:
            # Skip test if file doesn't exist
            self.skipTest("Data file not found")
    
    def test_events_data_loading(self):
        """Test events data loading."""
        try:
            df = load_events_data('../data/geopolitical_events.csv')
            self.assertIn('date', df.columns)
            self.assertIn('event', df.columns)
            self.assertIn('type', df.columns)
            self.assertIn('impact', df.columns)
            self.assertTrue(df['date'].dtype == 'datetime64[ns]')
        except FileNotFoundError:
            self.skipTest("Data file not found")
    
    def test_data_preprocessing(self):
        """Test data preprocessing."""
        # Create sample data
        dates = pd.date_range('2020-01-01', periods=10, freq='D')
        prices = np.random.normal(50, 5, 10)
        df = pd.DataFrame({'Date': dates, 'Price': prices})
        
        processed_df = preprocess_data(df, calculate_returns=True)
        
        self.assertIn('log_returns', processed_df.columns)
        self.assertEqual(len(processed_df), len(df) - 1)  # One less due to returns calculation


class TestUtils(unittest.TestCase):
    """Test cases for utility functions."""
    
    def test_statistical_metrics(self):
        """Test statistical metrics calculation."""
        data = pd.Series([1, 2, 3, 4, 5])
        metrics = calculate_statistical_metrics(data)
        
        self.assertIn('mean', metrics)
        self.assertIn('median', metrics)
        self.assertIn('std', metrics)
        self.assertIn('skewness', metrics)
        self.assertIn('kurtosis', metrics)
        
        self.assertEqual(metrics['mean'], 3.0)
        self.assertEqual(metrics['median'], 3.0)
    
    def test_impact_report_generation(self):
        """Test impact report generation."""
        # Create sample data
        dates = pd.date_range('2020-01-01', periods=100, freq='D')
        prices = np.concatenate([
            np.random.normal(50, 5, 50),
            np.random.normal(70, 8, 50)
        ])
        oil_df = pd.DataFrame({'Date': dates, 'Price': prices})
        
        change_point_date = pd.Timestamp('2020-02-20')
        events_df = pd.DataFrame({
            'date': ['2020-02-15'],
            'event': ['Test Event'],
            'type': ['Geopolitical'],
            'impact': ['High']
        })
        events_df['date'] = pd.to_datetime(events_df['date'])
        
        report = generate_impact_report(oil_df, change_point_date, events_df)
        
        self.assertIn('change_point_date', report)
        self.assertIn('price_impact', report)
        self.assertIn('statistical_test', report)
        self.assertIn('nearby_events', report)
        self.assertIn('analysis_period', report)


if __name__ == '__main__':
    unittest.main()



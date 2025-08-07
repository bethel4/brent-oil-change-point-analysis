"""
Utilities Module for Brent Oil Price Analysis

This module contains utility functions for analysis, visualization,
and reporting of change point detection results.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
from typing import Dict, List, Tuple, Any
import json
from datetime import datetime


def calculate_statistical_metrics(data: pd.Series) -> Dict[str, float]:
    """
    Calculate comprehensive statistical metrics for a time series.
    
    Parameters:
    -----------
    data : pd.Series
        Time series data
        
    Returns:
    --------
    Dict[str, float]
        Dictionary containing statistical metrics
    """
    metrics = {
        'mean': data.mean(),
        'median': data.median(),
        'std': data.std(),
        'skewness': data.skew(),
        'kurtosis': data.kurtosis(),
        'min': data.min(),
        'max': data.max(),
        'range': data.max() - data.min(),
        'cv': data.std() / data.mean() if data.mean() != 0 else 0
    }
    
    return metrics


def test_stationarity(data: pd.Series, alpha: float = 0.05) -> Dict[str, Any]:
    """
    Perform Augmented Dickey-Fuller test for stationarity.
    
    Parameters:
    -----------
    data : pd.Series
        Time series data
    alpha : float
        Significance level
        
    Returns:
    --------
    Dict[str, Any]
        Dictionary containing test results
    """
    from statsmodels.tsa.stattools import adfuller
    
    result = adfuller(data.dropna())
    
    return {
        'adf_statistic': result[0],
        'p_value': result[1],
        'critical_values': result[4],
        'is_stationary': result[1] < alpha
    }


def plot_change_point_analysis(oil_df: pd.DataFrame, 
                             change_point_date: pd.Timestamp,
                             events_df: pd.DataFrame = None,
                             title: str = "Change Point Analysis") -> None:
    """
    Create a comprehensive visualization of change point analysis.
    
    Parameters:
    -----------
    oil_df : pd.DataFrame
        DataFrame with oil price data
    change_point_date : pd.Timestamp
        Date of the detected change point
    events_df : pd.DataFrame, optional
        DataFrame with events data
    title : str
        Plot title
    """
    fig, axes = plt.subplots(2, 2, figsize=(16, 10))
    
    # Plot 1: Price series with change point
    axes[0, 0].plot(oil_df['Date'], oil_df['Price'], 'b-', label='Brent Oil Price')
    axes[0, 0].axvline(change_point_date, color='red', linestyle='--', linewidth=2,
                       label=f'Change Point: {change_point_date.strftime("%Y-%m-%d")}')
    
    if events_df is not None:
        for _, row in events_df.iterrows():
            color = 'orange' if row['type'] == 'Geopolitical' else 'green'
            axes[0, 0].axvline(row['date'], color=color, linestyle=':', alpha=0.7)
    
    axes[0, 0].set_title('Oil Prices with Detected Change Point')
    axes[0, 0].set_ylabel('Price (USD)')
    axes[0, 0].legend()
    
    # Plot 2: Log returns with change point
    if 'log_returns' in oil_df.columns:
        axes[0, 1].plot(oil_df['Date'], oil_df['log_returns'], 'g-', label='Log Returns')
        axes[0, 1].axvline(change_point_date, color='red', linestyle='--', linewidth=2)
        axes[0, 1].set_title('Log Returns with Change Point')
        axes[0, 1].set_ylabel('Log Returns')
        axes[0, 1].legend()
    
    # Plot 3: Price distribution before and after
    change_idx = oil_df[oil_df['Date'] >= change_point_date].index[0]
    before_prices = oil_df.iloc[:change_idx]['Price']
    after_prices = oil_df.iloc[change_idx:]['Price']
    
    axes[1, 0].hist(before_prices, bins=30, alpha=0.7, label='Before Change', color='blue')
    axes[1, 0].hist(after_prices, bins=30, alpha=0.7, label='After Change', color='red')
    axes[1, 0].set_title('Price Distribution Before vs After Change')
    axes[1, 0].set_xlabel('Price (USD)')
    axes[1, 0].set_ylabel('Frequency')
    axes[1, 0].legend()
    
    # Plot 4: Rolling statistics
    if 'log_returns' in oil_df.columns:
        rolling_mean = oil_df['log_returns'].rolling(window=30).mean()
        rolling_std = oil_df['log_returns'].rolling(window=30).std()
        
        axes[1, 1].plot(oil_df['Date'], rolling_mean, label='Rolling Mean (30d)', color='blue')
        axes[1, 1].plot(oil_df['Date'], rolling_std, label='Rolling Std (30d)', color='red')
        axes[1, 1].axvline(change_point_date, color='black', linestyle='--', linewidth=2)
        axes[1, 1].set_title('Rolling Statistics')
        axes[1, 1].set_ylabel('Value')
        axes[1, 1].legend()
    
    plt.tight_layout()
    plt.show()


def generate_impact_report(oil_df: pd.DataFrame,
                          change_point_date: pd.Timestamp,
                          events_df: pd.DataFrame = None,
                          time_window_days: int = 180) -> Dict[str, Any]:
    """
    Generate a comprehensive impact report for the detected change point.
    
    Parameters:
    -----------
    oil_df : pd.DataFrame
        DataFrame with oil price data
    change_point_date : pd.Timestamp
        Date of the detected change point
    events_df : pd.DataFrame, optional
        DataFrame with events data
    time_window_days : int
        Time window to search for nearby events
        
    Returns:
    --------
    Dict[str, Any]
        Dictionary containing the impact report
    """
    change_idx = oil_df[oil_df['Date'] >= change_point_date].index[0]
    
    # Price impact analysis
    before_prices = oil_df.iloc[:change_idx]['Price']
    after_prices = oil_df.iloc[change_idx:]['Price']
    
    price_impact = {
        'mean_before': before_prices.mean(),
        'mean_after': after_prices.mean(),
        'price_change_pct': ((after_prices.mean() - before_prices.mean()) / before_prices.mean()) * 100,
        'volatility_before': before_prices.std(),
        'volatility_after': after_prices.std(),
        'volatility_change_pct': ((after_prices.std() - before_prices.std()) / before_prices.std()) * 100
    }
    
    # Statistical significance test
    t_stat, p_value = stats.ttest_ind(before_prices, after_prices)
    
    # Event association
    nearby_events = []
    if events_df is not None:
        time_window = pd.Timedelta(days=time_window_days)
        nearby_events = events_df[
            (events_df['date'] >= change_point_date - time_window) &
            (events_df['date'] <= change_point_date + time_window)
        ].copy()
        
        if len(nearby_events) > 0:
            nearby_events['days_from_change'] = (nearby_events['date'] - change_point_date).dt.days
    
    # Return impact report
    report = {
        'change_point_date': change_point_date.strftime('%Y-%m-%d'),
        'price_impact': price_impact,
        'statistical_test': {
            't_statistic': t_stat,
            'p_value': p_value,
            'significant': p_value < 0.05
        },
        'nearby_events': nearby_events.to_dict('records') if len(nearby_events) > 0 else [],
        'analysis_period': {
            'before_period': f"{before_prices.index[0]} to {before_prices.index[-1]}",
            'after_period': f"{after_prices.index[0]} to {after_prices.index[-1]}",
            'before_obs': len(before_prices),
            'after_obs': len(after_prices)
        }
    }
    
    return report


def save_results_to_json(results: Dict[str, Any], filename: str) -> None:
    """
    Save analysis results to a JSON file.
    
    Parameters:
    -----------
    results : Dict[str, Any]
        Results dictionary to save
    filename : str
        Output filename
    """
    # Convert datetime objects to strings for JSON serialization
    def convert_datetime(obj):
        if isinstance(obj, pd.Timestamp):
            return obj.strftime('%Y-%m-%d')
        elif isinstance(obj, pd.DataFrame):
            return obj.to_dict('records')
        elif isinstance(obj, pd.Series):
            return obj.to_dict()
        return obj
    
    # Recursively convert datetime objects
    def recursive_convert(obj):
        if isinstance(obj, dict):
            return {key: recursive_convert(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [recursive_convert(item) for item in obj]
        else:
            return convert_datetime(obj)
    
    converted_results = recursive_convert(results)
    
    with open(filename, 'w') as f:
        json.dump(converted_results, f, indent=2, default=str)


def create_summary_table(oil_df: pd.DataFrame,
                        change_point_date: pd.Timestamp,
                        events_df: pd.DataFrame = None) -> pd.DataFrame:
    """
    Create a summary table for the analysis.
    
    Parameters:
    -----------
    oil_df : pd.DataFrame
        DataFrame with oil price data
    change_point_date : pd.Timestamp
        Date of the detected change point
    events_df : pd.DataFrame, optional
        DataFrame with events data
        
    Returns:
    --------
    pd.DataFrame
        Summary table
    """
    change_idx = oil_df[oil_df['Date'] >= change_point_date].index[0]
    
    before_prices = oil_df.iloc[:change_idx]['Price']
    after_prices = oil_df.iloc[change_idx:]['Price']
    
    summary_data = {
        'Metric': [
            'Change Point Date',
            'Mean Price Before',
            'Mean Price After',
            'Price Change (%)',
            'Volatility Before',
            'Volatility After',
            'Volatility Change (%)',
            'Observations Before',
            'Observations After'
        ],
        'Value': [
            change_point_date.strftime('%Y-%m-%d'),
            f"${before_prices.mean():.2f}",
            f"${after_prices.mean():.2f}",
            f"{((after_prices.mean() - before_prices.mean()) / before_prices.mean()) * 100:.2f}%",
            f"{before_prices.std():.2f}",
            f"{after_prices.std():.2f}",
            f"{((after_prices.std() - before_prices.std()) / before_prices.std()) * 100:.2f}%",
            len(before_prices),
            len(after_prices)
        ]
    }
    
    return pd.DataFrame(summary_data)



"""
Data Loader Module for Brent Oil Price Analysis

This module handles loading and preprocessing of Brent oil price data
and geopolitical events data for change point analysis.
"""

import pandas as pd
import numpy as np
from typing import Tuple, Optional
import matplotlib.pyplot as plt
import matplotlib.dates as mdates


def load_oil_data(file_path: str = '../data/brent_oil_prices.csv') -> pd.DataFrame:
    """
    Load Brent oil price data from CSV file.
    
    Parameters:
    -----------
    file_path : str
        Path to the CSV file containing oil price data
        
    Returns:
    --------
    pd.DataFrame
        DataFrame with 'Date' and 'Price' columns
    """
    df = pd.read_csv(file_path)
    df['Date'] = pd.to_datetime(df['Date'])
    return df


def load_events_data(file_path: str = '../data/geopolitical_events.csv') -> pd.DataFrame:
    """
    Load geopolitical events data from CSV file.
    
    Parameters:
    -----------
    file_path : str
        Path to the CSV file containing events data
        
    Returns:
    --------
    pd.DataFrame
        DataFrame with event information
    """
    df = pd.read_csv(file_path)
    df['date'] = pd.to_datetime(df['date'])
    return df


def preprocess_data(oil_df: pd.DataFrame, 
                   calculate_returns: bool = True) -> pd.DataFrame:
    """
    Preprocess oil price data for analysis.
    
    Parameters:
    -----------
    oil_df : pd.DataFrame
        DataFrame with oil price data
    calculate_returns : bool
        Whether to calculate log returns
        
    Returns:
    --------
    pd.DataFrame
        Preprocessed DataFrame
    """
    df = oil_df.copy()
    
    if calculate_returns:
        df['log_returns'] = np.log(df['Price'] / df['Price'].shift(1))
        df = df.dropna()
    
    return df


def plot_price_with_events(oil_df: pd.DataFrame, 
                          events_df: pd.DataFrame,
                          title: str = "Brent Oil Prices with Major Events",
                          figsize: Tuple[int, int] = (14, 6)) -> None:
    """
    Plot oil prices with annotated events.
    
    Parameters:
    -----------
    oil_df : pd.DataFrame
        DataFrame with oil price data
    events_df : pd.DataFrame
        DataFrame with events data
    title : str
        Plot title
    figsize : Tuple[int, int]
        Figure size
    """
    fig, ax = plt.subplots(figsize=figsize)
    
    # Plot oil prices
    ax.plot(oil_df['Date'], oil_df['Price'], label='Brent Oil Price', color='blue')
    
    # Annotate events
    for _, row in events_df.iterrows():
        color = 'red' if row['type'] == 'Geopolitical' else 'green'
        ax.axvline(row['date'], color=color, linestyle='--', alpha=0.7)
        ax.text(row['date'], ax.get_ylim()[1]*0.95, row['event'], 
                rotation=90, verticalalignment='top', fontsize=8)
    
    ax.set_title(title)
    ax.set_xlabel('Date')
    ax.set_ylabel('Price (USD)')
    ax.legend()
    ax.xaxis.set_major_locator(mdates.YearLocator(5))
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y'))
    plt.tight_layout()
    plt.show()


def plot_returns_with_events(oil_df: pd.DataFrame, 
                           events_df: pd.DataFrame,
                           title: str = "Log Returns with Major Events",
                           figsize: Tuple[int, int] = (14, 6)) -> None:
    """
    Plot log returns with annotated events.
    
    Parameters:
    -----------
    oil_df : pd.DataFrame
        DataFrame with oil price and log returns data
    events_df : pd.DataFrame
        DataFrame with events data
    title : str
        Plot title
    figsize : Tuple[int, int]
        Figure size
    """
    fig, ax = plt.subplots(figsize=figsize)
    
    # Plot log returns
    ax.plot(oil_df['Date'], oil_df['log_returns'], label='Log Returns', color='green')
    
    # Annotate events
    for _, row in events_df.iterrows():
        color = 'red' if row['type'] == 'Geopolitical' else 'blue'
        ax.axvline(row['date'], color=color, linestyle='--', alpha=0.7)
        ax.text(row['date'], ax.get_ylim()[1]*0.95, row['event'], 
                rotation=90, verticalalignment='top', fontsize=8)
    
    ax.set_title(title)
    ax.set_xlabel('Date')
    ax.set_ylabel('Log Returns')
    ax.legend()
    ax.xaxis.set_major_locator(mdates.YearLocator(5))
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y'))
    plt.tight_layout()
    plt.show()


def get_data_summary(oil_df: pd.DataFrame, events_df: pd.DataFrame) -> dict:
    """
    Get summary statistics for the datasets.
    
    Parameters:
    -----------
    oil_df : pd.DataFrame
        DataFrame with oil price data
    events_df : pd.DataFrame
        DataFrame with events data
        
    Returns:
    --------
    dict
        Dictionary containing summary statistics
    """
    summary = {
        'oil_data': {
            'shape': oil_df.shape,
            'date_range': (oil_df['Date'].min(), oil_df['Date'].max()),
            'price_stats': oil_df['Price'].describe().to_dict(),
            'missing_values': oil_df.isnull().sum().to_dict()
        },
        'events_data': {
            'shape': events_df.shape,
            'date_range': (events_df['date'].min(), events_df['date'].max()),
            'event_types': events_df['type'].value_counts().to_dict(),
            'impact_levels': events_df['impact'].value_counts().to_dict(),
            'missing_values': events_df.isnull().sum().to_dict()
        }
    }
    
    if 'log_returns' in oil_df.columns:
        summary['oil_data']['returns_stats'] = oil_df['log_returns'].describe().to_dict()
    
    return summary


def filter_data_by_date_range(oil_df: pd.DataFrame, 
                            start_date: Optional[str] = None,
                            end_date: Optional[str] = None) -> pd.DataFrame:
    """
    Filter oil price data by date range.
    
    Parameters:
    -----------
    oil_df : pd.DataFrame
        DataFrame with oil price data
    start_date : Optional[str]
        Start date in 'YYYY-MM-DD' format
    end_date : Optional[str]
        End date in 'YYYY-MM-DD' format
        
    Returns:
    --------
    pd.DataFrame
        Filtered DataFrame
    """
    df = oil_df.copy()
    
    if start_date:
        start_date = pd.to_datetime(start_date)
        df = df[df['Date'] >= start_date]
    
    if end_date:
        end_date = pd.to_datetime(end_date)
        df = df[df['Date'] <= end_date]
    
    return df


def get_events_in_period(events_df: pd.DataFrame,
                        start_date: str,
                        end_date: str) -> pd.DataFrame:
    """
    Get events that occurred within a specific time period.
    
    Parameters:
    -----------
    events_df : pd.DataFrame
        DataFrame with events data
    start_date : str
        Start date in 'YYYY-MM-DD' format
    end_date : str
        End date in 'YYYY-MM-DD' format
        
    Returns:
    --------
    pd.DataFrame
        Events within the specified period
    """
    start_date = pd.to_datetime(start_date)
    end_date = pd.to_datetime(end_date)
    
    return events_df[
        (events_df['date'] >= start_date) & 
        (events_df['date'] <= end_date)
    ].copy()



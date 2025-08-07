"""
Bayesian Change Point Detection Model for Brent Oil Prices

This module implements a Bayesian change point detection model using PyMC3
to identify structural breaks in Brent oil price time series.
"""

import pandas as pd
import numpy as np
import pymc3 as pm
import arviz as az
from scipy import stats
import matplotlib.pyplot as plt
from typing import Tuple, Dict, Any


class BayesianChangePointModel:
    """
    Bayesian Change Point Detection Model using PyMC3.
    
    This class implements a Bayesian model to detect structural breaks
    in time series data, specifically designed for Brent oil price analysis.
    """
    
    def __init__(self, data: pd.Series, dates: pd.Series):
        """
        Initialize the model with time series data.
        
        Parameters:
        -----------
        data : pd.Series
            Time series data (e.g., log returns of oil prices)
        dates : pd.Series
            Corresponding dates for the time series
        """
        self.data = data.values
        self.dates = dates
        self.n_obs = len(data)
        self.trace = None
        self.model = None
        
    def build_model(self) -> pm.Model:
        """
        Build the Bayesian change point model.
        
        Returns:
        --------
        pm.Model
            PyMC3 model object
        """
        with pm.Model() as model:
            # Prior for the change point (uniform over all possible days)
            tau = pm.DiscreteUniform('tau', lower=0, upper=self.n_obs-1)
            
            # Priors for the means before and after the change point
            mu_1 = pm.Normal('mu_1', mu=0, sigma=1)
            mu_2 = pm.Normal('mu_2', mu=0, sigma=1)
            
            # Prior for the standard deviation (same for both periods)
            sigma = pm.HalfNormal('sigma', sigma=1)
            
            # Expected value (mean) for each observation
            mu = pm.math.switch(tau >= np.arange(self.n_obs), mu_1, mu_2)
            
            # Likelihood
            likelihood = pm.Normal('likelihood', mu=mu, sigma=sigma, observed=self.data)
            
        self.model = model
        return model
    
    def fit(self, samples: int = 2000, tune: int = 1000) -> az.InferenceData:
        """
        Fit the model using MCMC sampling.
        
        Parameters:
        -----------
        samples : int
            Number of samples to draw from the posterior
        tune : int
            Number of tuning steps
            
        Returns:
        --------
        az.InferenceData
            Inference data object containing the trace
        """
        if self.model is None:
            self.build_model()
            
        with self.model:
            self.trace = pm.sample(samples, tune=tune, return_inferencedata=True)
            
        return self.trace
    
    def get_change_point(self) -> Tuple[int, pd.Timestamp]:
        """
        Get the most probable change point.
        
        Returns:
        --------
        Tuple[int, pd.Timestamp]
            (observation index, date) of the change point
        """
        if self.trace is None:
            raise ValueError("Model must be fitted before getting change point")
            
        tau_samples = self.trace.posterior['tau'].values.flatten()
        most_probable_tau = int(np.median(tau_samples))
        change_point_date = self.dates.iloc[most_probable_tau]
        
        return most_probable_tau, change_point_date
    
    def get_parameter_summary(self) -> Dict[str, Any]:
        """
        Get summary statistics for model parameters.
        
        Returns:
        --------
        Dict[str, Any]
            Dictionary containing parameter summaries
        """
        if self.trace is None:
            raise ValueError("Model must be fitted before getting parameter summary")
            
        summary = az.summary(self.trace)
        
        # Extract parameter statistics
        mu_1_samples = self.trace.posterior['mu_1'].values.flatten()
        mu_2_samples = self.trace.posterior['mu_2'].values.flatten()
        sigma_samples = self.trace.posterior['sigma'].values.flatten()
        
        return {
            'mu_1_mean': mu_1_samples.mean(),
            'mu_1_std': mu_1_samples.std(),
            'mu_2_mean': mu_2_samples.mean(),
            'mu_2_std': mu_2_samples.std(),
            'sigma_mean': sigma_samples.mean(),
            'sigma_std': sigma_samples.std(),
            'summary_table': summary
        }
    
    def plot_trace(self):
        """Plot trace plots for model diagnostics."""
        if self.trace is None:
            raise ValueError("Model must be fitted before plotting trace")
            
        az.plot_trace(self.trace)
        plt.tight_layout()
        plt.show()
    
    def plot_posterior_distributions(self):
        """Plot posterior distributions of model parameters."""
        if self.trace is None:
            raise ValueError("Model must be fitted before plotting posteriors")
            
        tau_samples = self.trace.posterior['tau'].values.flatten()
        mu_1_samples = self.trace.posterior['mu_1'].values.flatten()
        mu_2_samples = self.trace.posterior['mu_2'].values.flatten()
        sigma_samples = self.trace.posterior['sigma'].values.flatten()
        
        fig, axes = plt.subplots(2, 2, figsize=(12, 8))
        
        # Change point distribution
        axes[0, 0].hist(tau_samples, bins=50, alpha=0.7, color='blue')
        axes[0, 0].set_title('Posterior Distribution of Change Point')
        axes[0, 0].set_xlabel('Observation Index')
        axes[0, 0].set_ylabel('Frequency')
        
        # Mean distributions
        axes[0, 1].hist(mu_1_samples, bins=50, alpha=0.7, color='red', label='Before Change')
        axes[0, 1].hist(mu_2_samples, bins=50, alpha=0.7, color='green', label='After Change')
        axes[0, 1].set_title('Posterior Distributions of Means')
        axes[0, 1].set_xlabel('Mean')
        axes[0, 1].set_ylabel('Frequency')
        axes[0, 1].legend()
        
        # Sigma distribution
        axes[1, 0].hist(sigma_samples, bins=50, alpha=0.7, color='orange')
        axes[1, 0].set_title('Posterior Distribution of Standard Deviation')
        axes[1, 0].set_xlabel('Sigma')
        axes[1, 0].set_ylabel('Frequency')
        
        # Before vs After comparison
        axes[1, 1].scatter(mu_1_samples, mu_2_samples, alpha=0.5)
        axes[1, 1].plot([mu_1_samples.min(), mu_1_samples.max()], 
                        [mu_1_samples.min(), mu_1_samples.max()], 'r--')
        axes[1, 1].set_title('Before vs After Mean Comparison')
        axes[1, 1].set_xlabel('Mean Before Change')
        axes[1, 1].set_ylabel('Mean After Change')
        
        plt.tight_layout()
        plt.show()


def calculate_log_returns(prices: pd.Series) -> pd.Series:
    """
    Calculate log returns from price series.
    
    Parameters:
    -----------
    prices : pd.Series
        Price series
        
    Returns:
    --------
    pd.Series
        Log returns series
    """
    return np.log(prices / prices.shift(1)).dropna()


def associate_events_with_change_point(change_point_date: pd.Timestamp, 
                                    events_df: pd.DataFrame, 
                                    time_window_days: int = 180) -> pd.DataFrame:
    """
    Find events near a detected change point.
    
    Parameters:
    -----------
    change_point_date : pd.Timestamp
        Date of the detected change point
    events_df : pd.DataFrame
        DataFrame containing events with 'date' column
    time_window_days : int
        Number of days to look before and after the change point
        
    Returns:
    --------
    pd.DataFrame
        Events within the specified time window
    """
    time_window = pd.Timedelta(days=time_window_days)
    
    nearby_events = events_df[
        (events_df['date'] >= change_point_date - time_window) &
        (events_df['date'] <= change_point_date + time_window)
    ].copy()
    
    if len(nearby_events) > 0:
        nearby_events['days_from_change'] = (nearby_events['date'] - change_point_date).dt.days
        
    return nearby_events


def quantify_price_impact(oil_df: pd.DataFrame, change_point_idx: int) -> Dict[str, float]:
    """
    Quantify the price impact of a detected change point.
    
    Parameters:
    -----------
    oil_df : pd.DataFrame
        DataFrame with 'Price' column
    change_point_idx : int
        Index of the change point
        
    Returns:
    --------
    Dict[str, float]
        Dictionary containing price impact metrics
    """
    before_prices = oil_df.iloc[:change_point_idx]['Price']
    after_prices = oil_df.iloc[change_point_idx:]['Price']
    
    mean_before = before_prices.mean()
    mean_after = after_prices.mean()
    price_change_pct = ((mean_after - mean_before) / mean_before) * 100
    
    return {
        'mean_price_before': mean_before,
        'mean_price_after': mean_after,
        'price_change_pct': price_change_pct,
        'volatility_before': before_prices.std(),
        'volatility_after': after_prices.std()
    }



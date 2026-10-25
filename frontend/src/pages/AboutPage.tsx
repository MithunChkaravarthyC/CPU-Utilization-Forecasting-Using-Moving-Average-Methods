import React from 'react';
import { BookOpen, Calculator, Cpu, HelpCircle, Layers, CheckCircle2 } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-4">
        <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
          <BookOpen className="w-7 h-7 text-white" />
          <span>Mathematics & System Architecture Guide</span>
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Theoretical foundation, mathematical formulas, and presentation reference for Mathematics Micro Project
        </p>
      </div>

      {/* Problem Statement & Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-6 space-y-3">
          <span className="text-xs uppercase font-mono tracking-wider text-neutral-400 font-bold block">
            Industry Problem Statement
          </span>
          <h3 className="text-base font-bold text-white">Dynamic Operating System & Cloud Workloads</h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            In modern cloud computing (Kubernetes, AWS EC2, GCP Compute Engine), CPU utilization fluctuates heavily due to customer traffic, batch pipelines, and periodic background services.
          </p>
          <p className="text-xs text-neutral-300 leading-relaxed">
            <strong>The Problem with Reactive Autoscaling:</strong> Traditional threshold autoscaling only triggers <em>after</em> a node hits 80–90% CPU. By the time a new virtual machine boots (2–5 minutes), workloads experience latency spikes, packet loss, or cascading out-of-memory errors.
          </p>
        </div>

        <div className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-6 space-y-3">
          <span className="text-xs uppercase font-mono tracking-wider text-neutral-400 font-bold block">
            Proposed Mathematical Solution
          </span>
          <h3 className="text-base font-bold text-white">Proactive Time-Series Moving-Average Forecasting</h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            By applying deterministic mathematical moving averages (SMA, WMA, EMA), infrastructure operators can forecast future CPU utilization up to 24 hours in advance.
          </p>
          <p className="text-xs text-neutral-300 leading-relaxed">
            <strong>The Advantage:</strong> If the model predicts an overload condition (e.g., 78% CPU) hours ahead, instances are pre-provisioned seamlessly without service disruption. Historical backtesting dynamically selects the optimal method based on minimal MAE.
          </p>
        </div>
      </div>

      {/* SECTION: How the Mathematics Works */}
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center space-x-2 border-b border-neutral-800 pb-3">
          <Calculator className="w-6 h-6 text-white" />
          <h3 className="text-lg font-bold text-white">How the Mathematics Works</h3>
        </div>

        {/* 1. SMA */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              1. Simple Moving Average (SMA)
            </h4>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            The Simple Moving Average assigns equal weight to all $n$ past observations in the rolling window:
          </p>
          <div className="bg-black p-4 rounded-lg border border-neutral-800 font-mono text-xs text-neutral-200">
            {"SMA_t = (x_t + x_{t-1} + ... + x_{t-n+1}) / n = (1/n) * Σ x_{t-i}"}
          </div>
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-xs text-neutral-300 space-y-1">
            <strong className="text-white font-mono">Numerical Example (Window n = 3):</strong>
            <p>Recent 3 CPU observations: [42.0%, 46.0%, 50.0%]</p>
            <p className="font-mono text-white">SMA = (42.0 + 46.0 + 50.0) / 3 = 138.0 / 3 = 46.00%</p>
          </div>
        </div>

        {/* 2. WMA */}
        <div className="space-y-3 pt-3 border-t border-neutral-800">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              2. Weighted Moving Average (WMA)
            </h4>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            The Weighted Moving Average assigns linearly increasing weights to more recent observations:
          </p>
          <div className="bg-black p-4 rounded-lg border border-neutral-800 font-mono text-xs text-neutral-200">
            {"WMA_t = Σ(i * x_{t-n+i}) / Σ(i) = Σ(i * x_{t-n+i}) / [n(n+1)/2]"}
          </div>
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-xs text-neutral-300 space-y-1">
            <strong className="text-white font-mono">Numerical Example (Window n = 3, Sum of Weights = 1+2+3 = 6):</strong>
            <p>Recent 3 CPU observations: [42.0%, 46.0%, 50.0%]</p>
            <p className="font-mono text-white">
              WMA = (1×42.0 + 2×46.0 + 3×50.0) / 6 = (42.0 + 92.0 + 150.0) / 6 = 284.0 / 6 = 47.33%
            </p>
            <p className="text-neutral-400 text-[11px]">Notice how WMA (47.33%) is closer to the latest value (50.0%) than SMA (46.00%).</p>
          </div>
        </div>

        {/* 3. EMA */}
        <div className="space-y-3 pt-3 border-t border-neutral-800">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              3. Exponential Moving Average (EMA)
            </h4>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            The Exponential Moving Average applies an exponential decay smoothing factor (α):
          </p>
          <div className="bg-black p-4 rounded-lg border border-neutral-800 font-mono text-xs text-neutral-200">
            {"EMA_t = α * x_t + (1 - α) * EMA_{t-1}   where   α = 2 / (n + 1)"}
          </div>
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-xs text-neutral-300 space-y-1">
            <strong className="text-white font-mono">Numerical Example (Window n = 3, α = 2/(3+1) = 0.50):</strong>
            <p>Previous EMA = 45.0%, Current observation x_t = 50.0%</p>
            <p className="font-mono text-white">
              EMA = 0.50 × 50.0 + (1 - 0.50) × 45.0 = 25.0 + 22.5 = 47.50%
            </p>
          </div>
        </div>

        {/* Accuracy Metrics */}
        <div className="space-y-3 pt-3 border-t border-neutral-800">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Error Metrics: MAE, MSE, and RMSE
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-black p-3 rounded-lg border border-neutral-800 font-mono text-xs">
              <span className="font-bold text-white block mb-1">Mean Absolute Error (MAE)</span>
              <p className="text-neutral-300">MAE = (1/m) Σ |Actual - Forecast|</p>
              <p className="text-[11px] text-neutral-400 mt-1 font-sans">Linear penalty. Easy to interpret in percentage units.</p>
            </div>

            <div className="bg-black p-3 rounded-lg border border-neutral-800 font-mono text-xs">
              <span className="font-bold text-white block mb-1">Mean Squared Error (MSE)</span>
              <p className="text-neutral-300">MSE = (1/m) Σ (Actual - Forecast)²</p>
              <p className="text-[11px] text-neutral-400 mt-1 font-sans">Squares errors, heavily penalizing large outliers.</p>
            </div>

            <div className="bg-black p-3 rounded-lg border border-neutral-800 font-mono text-xs">
              <span className="font-bold text-white block mb-1">Root Mean Squared Error (RMSE)</span>
              <p className="text-neutral-300">RMSE = √(MSE)</p>
              <p className="text-[11px] text-neutral-400 mt-1 font-sans">Brings quadratic error back to the original percentage scale.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Defense / Presentation Questions */}
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center space-x-2 border-b border-neutral-800 pb-3">
          <HelpCircle className="w-6 h-6 text-white" />
          <h3 className="text-lg font-bold text-white">Student Defense Quick-Reference</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-black rounded-lg border border-neutral-800 space-y-1">
            <span className="font-bold text-white">Q: Does Qwen3 8B calculate the forecast?</span>
            <p className="text-neutral-300">
              <strong>No.</strong> The core mathematical forecasting engine is written in pure Python (NumPy). Qwen3 8B only acts as an AI explainability layer interpreting the calculated numbers.
            </p>
          </div>

          <div className="p-3 bg-black rounded-lg border border-neutral-800 space-y-1">
            <span className="font-bold text-white">Q: Why compare three methods?</span>
            <p className="text-neutral-300">
              Different methods excel under different workload patterns. SMA provides stability; WMA captures momentum; EMA dynamically adapts to sudden spikes with minimal lag.
            </p>
          </div>

          <div className="p-3 bg-black rounded-lg border border-neutral-800 space-y-1">
            <span className="font-bold text-white">Q: How does 24-hour forecasting work?</span>
            <p className="text-neutral-300">
              Through controlled recursive autoregression. One-step-ahead forecasts are recursively appended to the working series until the full 24-hour horizon is constructed.
            </p>
          </div>

          <div className="p-3 bg-black rounded-lg border border-neutral-800 space-y-1">
            <span className="font-bold text-white">Q: How is data leakage prevented?</span>
            <p className="text-neutral-300">
              Accuracy metrics (MAE, RMSE) are evaluated strictly on historical backtests where predictions at time $t$ use only observations from $t-1$ and earlier.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

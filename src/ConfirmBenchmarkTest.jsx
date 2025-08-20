import React, { useState } from "react";

// Import all the SVG icons as React components or URLs
const ICONS = {
  chevronDown: "https://app.codigma.com/api/uploads/assets/69b4d888-9709-4dd6-9f46-3e34941bce7e.svg",
  refresh: "https://app.codigma.com/api/uploads/assets/9f8830f1-b897-4261-93ee-9e154458fe81.svg",
  checkCircle: "https://app.codigma.com/api/uploads/assets/a8ffc971-b306-41ba-af53-53f9ea6c99a1.svg",
  status: "https://app.codigma.com/api/uploads/assets/e2962820-689c-408a-9400-cd1a9a61bd28.svg",
  edit: "https://app.codigma.com/api/uploads/assets/971ef22a-7448-4f0d-86b1-30149ae82c80.svg",
  minus: "https://app.codigma.com/api/uploads/assets/8fce904e-0be3-48b6-b52c-1f19f8773886.svg",
  bookOpen: "https://app.codigma.com/api/uploads/assets/cefe3f37-07f1-4443-bb63-12d46702877d.svg",
  pointer: "https://app.codigma.com/api/uploads/assets/6d864f14-2bf8-4b5f-bf79-d219cd3c3238.svg",
  chevronRight: "https://app.codigma.com/api/uploads/assets/43495f96-9bea-44ac-b881-33cc210523dc.svg"
};

const ConfirmBenchmarkTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [provider, setProvider] = useState("OpenAI");
  const [model, setModel] = useState("Support Team 2 (GPT4)");
  const [confidenceLevel, setConfidenceLevel] = useState(99);
  const [marginOfError, setMarginOfError] = useState(5);
  const [sampleSize, setSampleSize] = useState(658);
  const [sliderProgress, setSliderProgress] = useState(22); // px value for visual progress

  const handleBack = () => {
    // Handle back navigation - could be passed as prop or use window.history
    window.history.back();
  };

  const handleStartTest = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Implement start benchmark test logic
      console.log("Starting benchmark test...", {
        provider,
        model,
        confidenceLevel,
        marginOfError,
        sampleSize
      });
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Navigate to results page or show success message
    } catch (err) {
      setError(err.message || "Failed to start benchmark test");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSliderChange = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const maxWidth = rect.width;
    const progress = Math.min(Math.max(0, x), maxWidth);
    setSliderProgress(progress);
    
    // Calculate sample size based on slider position
    const maxSamples = 52952;
    const newSampleSize = Math.round((progress / maxWidth) * maxSamples);
    setSampleSize(newSampleSize);
  };

  return (
    <div className="confirm-benchmark">


      {/* Breadcrumbs */}
      <nav className="confirm-benchmark-breadcrumbs" aria-label="Breadcrumb navigation">
        <a href="#" onClick={(e) => { e.preventDefault(); }}>Create Benchmark Test</a>
        <img src={ICONS.chevronRight} alt="" aria-hidden="true" />
        <a href="#" onClick={(e) => { e.preventDefault(); }}>Select Endpoint</a>
        <img src={ICONS.chevronRight} alt="" aria-hidden="true" />
        <a href="#" onClick={(e) => { e.preventDefault(); }}>Select Tests</a>
        <img src={ICONS.chevronRight} alt="" aria-hidden="true" />
        <span className="breadcrumb-current" aria-current="page">Confirm Benchmark Test</span>
      </nav>

      <div className="confirm-benchmark-main">
        {/* Heading */}
        <section className="confirm-benchmark-heading">
          <h1>Confirm Benchmark Test</h1>
          <p>Review the benchmark test details before proceeding</p>
        </section>

        <div className="confirm-benchmark-content">
          {/* LEFT PANEL */}
          <div className="confirm-benchmark-left-panel">
            {/* Test Endpoint Popover */}
            <div className="confirm-benchmark-popover" role="region" aria-labelledby="endpoint-title">
              <div className="confirm-benchmark-popover-header">
                <h2 id="endpoint-title">Test Endpoint</h2>
                <p>Confirm the details of the endpoint tested below</p>
              </div>
              <div className="confirm-benchmark-endpoint-details">
                <div className="confirm-benchmark-select-wrapper" style={{ maxWidth: "230px" }} role="button" tabIndex="0">
                  <div className="confirm-benchmark-select-option">{provider}</div>
                  <img src={ICONS.chevronDown} alt="Open provider selection" />
                </div>
                <div className="confirm-benchmark-select-wrapper" style={{ maxWidth: "310px" }} role="button" tabIndex="0">
                  <div className="confirm-benchmark-select-option">{model}</div>
                  <img src={ICONS.chevronDown} alt="Open model selection" />
                </div>
              </div>
              <div className="confirm-benchmark-table-header">
                <span>Name</span>
                <span>Connection Type</span>
                <span>Model</span>
              </div>
              <div className="confirm-benchmark-table-row">
                <span>Support Team 2</span>
                <span>openai-connector</span>
                <div className="confirm-benchmark-model">
                  <span>gpt-4</span>
                  <img src={ICONS.status} alt="Status indicator" />
                  <button aria-label="Edit model"><img src={ICONS.edit} alt="" /></button>
                  <button aria-label="Remove model"><img src={ICONS.minus} alt="" /></button>
                </div>
              </div>
              <img src={ICONS.checkCircle} alt="Configuration confirmed" className="confirm-benchmark-confirmation-icon" />
            </div>

            {/* Tests Selected Popover */}
            <div className="confirm-benchmark-popover" role="region" aria-labelledby="tests-title">
              <div className="confirm-benchmark-popover-header">
                <h2 id="tests-title">Tests Selected</h2>
                <p>5 cookbooks and 12 recipes: {sampleSize} tokens required if {sampleSize}/52952 tests are run</p>
              </div>
              <div className="confirm-benchmark-results-header">
                <span>Name</span>
                <span>Prompts Sampled / Total</span>
                <span>Tokens Sampled / Total</span>
                <span>LLMaaJ</span>
              </div>
              <div className="confirm-benchmark-result-row">
                <div className="confirm-benchmark-result-name">
                  <img src={ICONS.bookOpen} alt="" />
                  <span>Hallucination</span>
                </div>
                <div className="confirm-benchmark-result-sample">
                  <span>656 <br /> /17763</span>
                  <span>329 <br /> /177630</span>
                </div>
                <div className="confirm-benchmark-result-model">
                  <span>2</span>
                  <img src={ICONS.status} alt="Status indicator" />
                  <button aria-label="Edit test"><img src={ICONS.edit} alt="" /></button>
                  <button aria-label="Remove test"><img src={ICONS.minus} alt="" /></button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="confirm-benchmark-right-panel">
            {/* Recommended Sample Size Calculator */}
            <div className="confirm-benchmark-popover" role="region" aria-labelledby="calculator-title">
              <div className="confirm-benchmark-popover-header">
                <h2 id="calculator-title">Recommended Sample Size Calculator</h2>
                <p>Select desired confidence level and margin of error to estimate sample size of tests</p>
              </div>
              <div className="confirm-benchmark-calculator">
                <div className="confirm-benchmark-input-wrapper">
                  <label htmlFor="confidence-level">Confidence level (%)</label>
                  <div className="confirm-benchmark-select-wrapper" style={{ maxWidth: "70px" }} role="button" tabIndex="0">
                    <span id="confidence-level">{confidenceLevel}</span>
                    <img src={ICONS.chevronDown} alt="Open confidence level selection" />
                  </div>
                </div>
                <div className="confirm-benchmark-input-wrapper">
                  <label htmlFor="margin-error">Margin of error (%)</label>
                  <div className="confirm-benchmark-numeric-input">
                    <span id="margin-error" role="spinbutton" aria-valuenow={marginOfError} tabIndex="0">{marginOfError}</span>
                  </div>
                </div>
              </div>
              <div className="confirm-benchmark-recommended-sample">
                Sample size of tests recommended: <strong>{sampleSize}</strong>
              </div>
            </div>

            {/* Test Sample Selection */}
            <div className="confirm-benchmark-popover" role="region" aria-labelledby="sample-title">
              <div className="confirm-benchmark-popover-header" style={{ position: "relative" }}>
                <h2 id="sample-title">Test Sample Selection</h2>
                <p>Choose sample size of tests to be run for benchmarking</p>
                <img src={ICONS.checkCircle} alt="Selection confirmed" className="confirm-benchmark-confirmation-icon" />
              </div>
              <div className="confirm-benchmark-sample-selection">
                <div className="confirm-benchmark-input-wrapper">
                  <label htmlFor="sample-size">Sample Size</label>
                  <div className="confirm-benchmark-select-wrapper" style={{ maxWidth: "90px" }} role="button" tabIndex="0">
                    <span id="sample-size">{sampleSize}</span>
                    <button aria-label="Refresh sample size"><img src={ICONS.refresh} alt="" /></button>
                  </div>
                </div>
                <div className="confirm-benchmark-slider" role="slider" aria-valuemin="0" aria-valuemax="52952" aria-valuenow={sampleSize} tabIndex="0" onClick={handleSliderChange}>
                  <div className="confirm-benchmark-slider-track" style={{ maxWidth: "370px" }}>
                    <div className="confirm-benchmark-slider-progress" style={{ width: `${sliderProgress}px` }}></div>
                    <img src={ICONS.pointer} alt="" className="confirm-benchmark-slider-indicator" style={{ left: `${sliderProgress}px` }} />
                  </div>
                </div>
              </div>
              <div className="confirm-benchmark-helper-text">
                {((sampleSize / 52952) * 100).toFixed(2)}% of total tests selected ({sampleSize} of 52,952) Estimated: {sampleSize} tokens, ~15 minutes to run
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="confirm-benchmark-error-message" role="alert">
            {error}
          </div>
        )}

        {/* Footer Button Section */}
        <footer className="confirm-benchmark-button-section">
          <button 
            className="confirm-benchmark-outline-button" 
            onClick={handleBack}
            disabled={isLoading}
          >
            Back
          </button>
          <button 
            className="confirm-benchmark-primary-button" 
            onClick={handleStartTest}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? "Starting..." : "Start Benchmark Test"}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ConfirmBenchmarkTest;

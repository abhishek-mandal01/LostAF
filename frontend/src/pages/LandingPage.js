import React from 'react';
import { Button } from '@/components/ui/button';

const LandingPage = () => {
  const handleLogin = () => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title" data-testid="landing-hero-title">
              Lost Something?
              <br />
              <span className="gradient-text">We'll Help You Find It</span>
            </h1>
            <p className="hero-subtitle" data-testid="landing-hero-subtitle">
              The smartest way to recover lost items on campus. Powered by AI image matching and instant notifications.
            </p>
            <div className="hero-actions">
              <Button
                data-testid="landing-login-button"
                onClick={handleLogin}
                size="lg"
                className="hero-btn-primary"
              >
                <i className="lucide lucide-log-in"></i>
                Get Started with CVRU Email
              </Button>
            </div>
            <p className="hero-note">Only @cvru.ac.in emails allowed</p>
          </div>
          <div className="hero-image">
            <div className="floating-card card-1">
              <div className="card-icon lost-icon">📱</div>
              <div className="card-text">Lost Items</div>
            </div>
            <div className="floating-card card-2">
              <div className="card-icon found-icon">🔍</div>
              <div className="card-text">AI Matching</div>
            </div>
            <div className="floating-card card-3">
              <div className="card-icon match-icon">✨</div>
              <div className="card-text">Found!</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">How LostAF Works</h2>
          <p className="section-subtitle">Three simple steps to recover your belongings</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
              <i className="lucide lucide-upload"></i>
            </div>
            <h3 className="feature-title">Post Your Item</h3>
            <p className="feature-description">
              Upload details and photos of lost or found items. Our system automatically categorizes and indexes them.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}}>
              <i className="lucide lucide-brain"></i>
            </div>
            <h3 className="feature-title">AI Image Matching</h3>
            <p className="feature-description">
              Our CLIP-powered AI analyzes images to find visually similar items with 70%+ accuracy.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}>
              <i className="lucide lucide-bell"></i>
            </div>
            <h3 className="feature-title">Instant Alerts</h3>
            <p className="feature-description">
              Get email notifications when potential matches are found. Connect directly with the finder.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-number">500+</div>
            <div className="stat-label">Items Recovered</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">85%</div>
            <div className="stat-label">Match Accuracy</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">24h</div>
            <div className="stat-label">Avg Recovery Time</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Find Your Lost Items?</h2>
          <p className="cta-subtitle">Join students across CVRU campus</p>
          <Button
            data-testid="landing-cta-button"
            onClick={handleLogin}
            size="lg"
            className="cta-btn"
          >
            Login with College Email
          </Button>
        </div>
      </section>

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        /* Hero Section */
        .hero-section {
          min-height: 90vh;
          display: flex;
          align-items: center;
          padding: 2rem;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
        }

        .hero-content {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }

        .hero-title {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 700;
          line-height: 1.2;
          margin-bottom: 1.5rem;
          color: #2d3748;
        }

        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: #4a5568;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .hero-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1rem 2rem;
          font-size: 1.1rem;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .hero-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }

        .hero-note {
          color: #718096;
          font-size: 0.9rem;
        }

        /* Floating Cards */
        .hero-image {
          position: relative;
          height: 400px;
        }

        .floating-card {
          position: absolute;
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 1rem;
          animation: float 3s ease-in-out infinite;
        }

        .card-1 {
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .card-2 {
          top: 40%;
          right: 10%;
          animation-delay: 1s;
        }

        .card-3 {
          bottom: 15%;
          left: 30%;
          animation-delay: 2s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .card-icon {
          font-size: 2rem;
        }

        .card-text {
          font-weight: 600;
          color: #2d3748;
        }

        /* Features Section */
        .features-section {
          padding: 6rem 2rem;
          background: white;
        }

        .section-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #2d3748;
        }

        .section-subtitle {
          font-size: 1.2rem;
          color: #718096;
        }

        .features-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 3rem;
        }

        .feature-card {
          text-align: center;
          padding: 2rem;
        }

        .feature-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 1.5rem;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          color: white;
        }

        .feature-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #2d3748;
        }

        .feature-description {
          color: #718096;
          line-height: 1.6;
        }

        /* Stats Section */
        .stats-section {
          padding: 4rem 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .stats-container {
          max-width: 1000px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
        }

        .stat-item {
          text-align: center;
          color: white;
        }

        .stat-number {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 1.1rem;
          opacity: 0.9;
        }

        /* CTA Section */
        .cta-section {
          padding: 6rem 2rem;
          background: white;
        }

        .cta-content {
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
        }

        .cta-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #2d3748;
        }

        .cta-subtitle {
          font-size: 1.2rem;
          color: #718096;
          margin-bottom: 2rem;
        }

        .cta-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1rem 2.5rem;
          font-size: 1.1rem;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }

        @media (max-width: 768px) {
          .hero-content {
            grid-template-columns: 1fr;
          }

          .hero-image {
            display: none;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .stats-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;

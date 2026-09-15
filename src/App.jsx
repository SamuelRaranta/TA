import React, { useState, useEffect } from 'react';
import GlassNavbar from './components/GlassNavbar';
import HeroSection from './components/HeroSection';
import MarketPriceTicker from './components/MarketPriceTicker';
import BindingFlowSection from './components/BindingFlowSection';
import CommodityShowcase from './components/CommodityShowcase';
import FeaturesSection from './components/FeaturesSection';
import PortalAccessSection from './components/PortalAccessSection';
import Footer from './components/Footer';
import BindingSimulationModal from './components/BindingSimulationModal';
import AuthModal from './components/AuthModal';
import AuthPage from './components/AuthPage';
import FarmerDashboard from './components/farmer/FarmerDashboard';
import BuyerDashboard from './components/buyer/BuyerDashboard';
import AdminDashboard from './components/admin/AdminDashboard';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Global Error Caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
          <div style={{ maxWidth: '480px', width: '100%', background: '#ffffff', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.75rem' }}>Terjadi Kendala Tampilan</h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {this.state.error?.message || 'Sistem mengalami kendala sementara saat merender tampilan.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button 
                type="button" 
                onClick={() => { window.location.hash = ''; window.location.reload(); }}
                style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', background: '#5452f6', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <GlobalErrorBoundary>
      <AppContent />
    </GlobalErrorBoundary>
  );
}

function AppContent() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('agriconnect_theme') || 'light';
  });
  const [currentView, setCurrentView] = useState(() => {
    const hash = window.location.hash;
    if (hash === '#/login') return 'login';
    if (hash === '#/signup' || hash === '#/register') return 'signup';
    if (hash === '#/dashboard/petani' || hash === '#/petani') return 'farmer-dashboard';
    if (hash === '#/dashboard/pembeli' || hash === '#/pembeli') return 'buyer-dashboard';
    if (hash === '#/dashboard/admin' || hash === '#/admin') return 'admin-dashboard';
    return 'home';
  });
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [selectedRole, setSelectedRole] = useState('petani');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('agriconnect_theme', theme);
  }, [theme]);

  // Sync with browser URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#/login') {
        setCurrentView('login');
      } else if (hash === '#/signup' || hash === '#/register') {
        setCurrentView('signup');
      } else if (hash === '#/dashboard/petani' || hash === '#/petani') {
        setCurrentView('farmer-dashboard');
      } else if (hash === '#/dashboard/pembeli' || hash === '#/pembeli') {
        setCurrentView('buyer-dashboard');
      } else if (hash === '#/dashboard/admin' || hash === '#/admin') {
        setCurrentView('admin-dashboard');
      } else if (hash === '' || hash === '#/' || hash === '#home') {
        setCurrentView('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleOpenLogin = () => {
    setCurrentView('login');
    window.location.hash = '#/login';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSignup = (role = 'petani') => {
    setSelectedRole(role);
    setCurrentView('signup');
    window.location.hash = '#/signup';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenFarmerDashboard = () => {
    setCurrentView('farmer-dashboard');
    window.location.hash = '#/dashboard/petani';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBuyerDashboard = () => {
    setCurrentView('buyer-dashboard');
    window.location.hash = '#/dashboard/pembeli';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAdminDashboard = () => {
    setCurrentView('admin-dashboard');
    window.location.hash = '#/dashboard/admin';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSimulation = (commodity = null) => {
    setSelectedCommodity(commodity);
    setSimulationOpen(true);
  };

  // If user is on the Login or Signup view, render dedicated AuthPage matching reference
  if (currentView === 'login' || currentView === 'signup') {
    return (
      <AuthPage 
        initialMode={currentView}
        initialRole={selectedRole}
        onBackToHome={handleBackToHome}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onNavigateToDashboard={() => handleOpenFarmerDashboard()}
        onNavigateToBuyerDashboard={() => handleOpenBuyerDashboard()}
      />
    );
  }

  // If user is on the Farmer Dashboard view
  if (currentView === 'farmer-dashboard') {
    return (
      <FarmerDashboard
        onBackToHome={handleBackToHome}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  // If user is on the Buyer Dashboard view
  if (currentView === 'buyer-dashboard') {
    return (
      <BuyerDashboard
        onBackToHome={handleBackToHome}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  // If user is on the Admin Dashboard view
  if (currentView === 'admin-dashboard') {
    return (
      <AdminDashboard
        onBackToHome={handleBackToHome}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas)', color: 'var(--text-primary)' }}>
      {/* Navbar with Dark/Light Toggle */}
      <GlassNavbar 
        onOpenLogin={handleOpenLogin}
        onOpenSignup={() => handleOpenSignup('petani')}
        onOpenFarmerDashboard={handleOpenFarmerDashboard}
        onOpenBuyerDashboard={handleOpenBuyerDashboard}
        onOpenAdminDashboard={handleOpenAdminDashboard}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Landing Sections */}
      <main style={{ flex: 1 }}>
        <HeroSection 
          onOpenSimulation={() => handleOpenSimulation(null)}
          onRoleSelect={(role) => {
            if (role === 'petani') {
              handleOpenFarmerDashboard();
            } else if (role === 'pembeli') {
              handleOpenBuyerDashboard();
            } else {
              handleOpenSignup(role);
            }
          }}
        />

        <MarketPriceTicker />

        <FeaturesSection 
          onOpenSimulation={() => handleOpenSimulation(null)}
        />

        <CommodityShowcase 
          onSelectCommodity={handleOpenSimulation}
        />

        <BindingFlowSection 
          onOpenSimulation={() => handleOpenSimulation(null)}
        />

        {/* Dedicated Portal Access Section at the bottom of the landing page */}
        <PortalAccessSection 
          onOpenFarmerDashboard={handleOpenFarmerDashboard}
          onOpenBuyerDashboard={handleOpenBuyerDashboard}
          onOpenAdminDashboard={handleOpenAdminDashboard}
        />
      </main>

      {/* Footer with portal links */}
      <Footer 
        onOpenFarmerDashboard={handleOpenFarmerDashboard}
        onOpenBuyerDashboard={handleOpenBuyerDashboard}
        onOpenAdminDashboard={handleOpenAdminDashboard}
      />

      {/* Interactive Binding Simulation Modal */}
      <BindingSimulationModal 
        isOpen={simulationOpen}
        onClose={() => setSimulationOpen(false)}
        commodity={selectedCommodity}
      />

      {/* Fallback In-page Modal if needed */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialRole={selectedRole}
      />
    </div>
  );
}



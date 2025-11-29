import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

// ✅ IMPORTS
import FaceCapture from './FaceCapture';
import FingerprintEnroll from './FingerprintEnroll';

// Import ABI
import VotingContract from './VotingABI.json';

// Contract Configuration
const CONTRACT_ADDRESS = "0x6B2230D8F872e06cF8A1a079acabe876198A3931";

// Data Configuration
const resultsConstituencies = ["Jalna", "Aurangabad", "Beed", "Ahmednagar"];

const resultsCandidates = {
  "Jalna": ["KALYAN VAIJINATHRAO KALE", "DANVE RAOSAHEB DADARAO", "MANGESH SANJAY SABLE"],
  "Aurangabad": ["BHUMARE SANDIPANRAO ASARAM", "IMTIAZ JALEEL SYED", "CHANDRAKANT KHAIRE"],
  "Beed": ["BAJRANG MANOHAR SONWANE", "PANKAJA GOPINATHRAO MUNDE", "ASHOK BHAGOJI THORAT"],
  "Ahmednagar": ["NILESH DNYANDEV LANKE", "DR. SUJAY RADHAKRISHNA VIKHEPATIL", "ALEKAR GORAKH DASHRATH"]
};

const CONSTITUENCY_INDEX = { "jalna": 0, "aurangabad": 1, "beed": 2, "ahmednagar": 3 };

// Modern UI Styles
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    marginBottom: '24px',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  heading1: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: '16px',
    lineHeight: '1.2',
  },
  heading2: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '24px',
  },
  button: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  buttonPrimary: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
  buttonSuccess: {
    background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
    color: 'white',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '8px',
    border: '2px solid #e2e8f0',
    fontSize: '15px',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#4a5568',
    fontSize: '14px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  alert: {
    padding: '16px 20px',
    borderRadius: '12px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '15px',
    fontWeight: '500',
  },
  alertSuccess: {
    background: '#f0fdf4',
    border: '2px solid #86efac',
    color: '#166534',
  },
  alertWarning: {
    background: '#fffbeb',
    border: '2px solid #fcd34d',
    color: '#92400e',
  },
  alertError: {
    background: '#fef2f2',
    border: '2px solid #fca5a5',
    color: '#991b1b',
  },
  progressBar: {
    height: '12px',
    backgroundColor: '#e2e8f0',
    borderRadius: '8px',
    overflow: 'hidden',
    marginTop: '12px',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '8px',
    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// ==================== HOME PAGE ====================
const HomePage = () => (
  <div style={styles.container}>
    <div style={{ ...styles.card, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
      <h1 style={{ ...styles.heading1, color: 'white', fontSize: '48px', marginBottom: '20px' }}>
        🔒 Blockchain Voting Portal
      </h1>
      <p style={{ fontSize: '20px', lineHeight: '1.8', opacity: 0.95, maxWidth: '700px', margin: '0 auto 32px' }}>
        Secure, transparent, and tamper-proof voting powered by Ethereum blockchain technology. 
        Every vote is immutable and verifiable in real-time.
      </p>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button style={{ ...styles.button, background: 'white', color: '#667eea', padding: '14px 32px' }}>
          📊 View Results
        </button>
        <button style={{ ...styles.button, background: 'rgba(255,255,255,0.2)', color: 'white', padding: '14px 32px', border: '2px solid white' }}>
          📖 Learn More
        </button>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginTop: '40px' }}>
      {[
        { icon: '📸', title: 'Face Recognition', desc: 'Advanced AI-powered face recognition ensures only verified citizens can participate.' },
        { icon: '👆', title: 'Fingerprint Biometric', desc: 'R307 fingerprint scanner with maximum security level for accurate matching.' },
        { icon: '⛓️', title: 'Blockchain Verified', desc: 'All votes are recorded on Sepolia testnet with full transparency and immutability.' },
        { icon: '📊', title: 'Real-time Results', desc: 'Live vote tallies fetched directly from smart contracts with instant updates.' }
      ].map((feature, idx) => (
        <div key={idx} style={{ ...styles.card, textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>{feature.icon}</div>
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#2d3748', marginBottom: '12px' }}>{feature.title}</h3>
          <p style={{ color: '#718096', lineHeight: '1.6' }}>{feature.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

// ==================== VOTER REGISTRATION ====================
const VoterRegistration = () => {
  const [formData, setFormData] = useState({ 
    fullName: '', 
    voterId: '', 
    faceData: '', 
    fingerprintTemplate: '',
    constituency: '' 
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const constituencies = [
    "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Baramati", "Beed", "Bhandara Gondiya", 
    "Bhiwandi", "Buldhana", "Chandrapur", "Dhule", "Dindori", "Gadchiroli - Chimur", 
    "Hatkanangale", "Hingoli", "Jalgaon", "Jalna", "Kalyan", "Kolhapur", "Latur", "Madha", 
    "Maval", "Mumbai North", "Mumbai North Central", "Mumbai North East", "Mumbai North West", 
    "Mumbai South", "Mumbai South Central", "Nanded", "Nandurbar", "Nashik", "Osmanabad", 
    "Palghar", "Parbhani", "Pune", "Raigad", "Ramtek", "Ratnagiri Sindhudurg", "Raver", 
    "Sangli", "Satara", "Shirdi", "Sinnar (Nashik)", "Solapur", "Thane", "Wardha", 
    "Yavatmal Washim", "Other"
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFaceCaptured = (imageData) => {
    console.log('✅ Face captured');
    setFormData(prevData => ({ ...prevData, faceData: imageData }));
  };

  const handleFingerprintCaptured = (templateData) => {
    console.log('✅ Fingerprint template captured');
    setFormData(prevData => ({ ...prevData, fingerprintTemplate: templateData }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.faceData) {
      setStatus({ type: 'error', message: '❌ Please capture your face image first!' });
      return;
    }

    if (!formData.fingerprintTemplate) {
      setStatus({ type: 'error', message: '❌ Please enroll your fingerprint first!' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          voter_id: formData.voterId,
          face_data: formData.faceData,
          fingerprint_template: formData.fingerprintTemplate,
          constituency: formData.constituency
        })
      });
      const result = await response.json();

      if (result.success) {
        setStatus({ 
          type: 'success', 
          message: '✅ Fingerprint and Face successfully scanned. You can REGISTER NOW.' 
        });
        
        setFormData({ 
          fullName: '', 
          voterId: '', 
          faceData: '', 
          fingerprintTemplate: '', 
          constituency: '' 
        });
      } else {
        setStatus({ type: 'error', message: result.error || 'Registration failed' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Connection error: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const isFormComplete = formData.faceData && formData.fingerprintTemplate;

  return (
    <div style={styles.container}>
      <div style={{ ...styles.card, maxWidth: '700px', margin: '0 auto' }}>
        <h2 style={styles.heading2}>👤 Voter Registration</h2>

        {status && (
          <div style={{ 
            ...styles.alert, 
            ...(status.type === 'success' ? styles.alertSuccess : styles.alertError) 
          }}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={styles.label}>Constituency</label>
            <select 
              name="constituency" 
              value={formData.constituency} 
              onChange={handleChange} 
              style={styles.input} 
              required
            >
              <option value="">Select your constituency</option>
              {constituencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={styles.label}>Full Name</label>
            <input 
              type="text" 
              name="fullName" 
              value={formData.fullName} 
              onChange={handleChange} 
              placeholder="Enter your full legal name" 
              style={styles.input} 
              required 
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={styles.label}>Voter ID Number</label>
            <input 
              type="text" 
              name="voterId" 
              value={formData.voterId} 
              onChange={handleChange} 
              placeholder="Enter your voter ID" 
              style={styles.input} 
              required 
            />
          </div>

          <FaceCapture onFaceCaptured={handleFaceCaptured} />

          <FingerprintEnroll onFingerprintCaptured={handleFingerprintCaptured} styles={styles} />

          {isFormComplete && (
            <div style={{
              padding: '16px 20px',
              background: '#d1fae5',
              border: '2px solid #10b981',
              borderRadius: '12px',
              color: '#065f46',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '24px' }}>✅</span>
              <div style={{ marginTop: '8px', fontWeight: '600' }}>Fingerprint and Face successfully scanned. You can REGISTER NOW</div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || !isFormComplete} 
            style={{ 
              ...styles.button, 
              ...styles.buttonSuccess, 
              width: '100%', 
              padding: '16px', 
              fontSize: '16px',
              justifyContent: 'center',
              opacity: (loading || !isFormComplete) ? 0.6 : 1,
              cursor: (loading || !isFormComplete) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Registering...' : '✅ Register Voter'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ==================== RESULTS ====================
const Results = () => {
  const [selectedConstituency, setSelectedConstituency] = useState('');
  const [votes, setVotes] = useState({});
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState(null);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask not detected. Please install MetaMask extension.');
      return;
    }

    try {
      setError('');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const votingContract = new ethers.Contract(CONTRACT_ADDRESS, VotingContract.abi, provider);
      
      setContract(votingContract);
      setWalletAddress(accounts[0]);
      setIsConnected(true);

      try {
        await votingContract.totalConstituencies();
      } catch {
        setError('Contract not found on Sepolia network. Please verify deployment.');
      }
    } catch (error) {
      setError('Failed to connect wallet: ' + error.message);
    }
  };

  useEffect(() => {
    if (selectedConstituency && contract && isConnected) {
      fetchResults(selectedConstituency);
    }
  }, [selectedConstituency, contract, isConnected]);

  const fetchResults = async (constituency) => {
    setLoading(true);
    setError('');

    try {
      const cIdx = CONSTITUENCY_INDEX[constituency.toLowerCase()];
      if (cIdx === undefined) {
        setError('Invalid constituency');
        setLoading(false);
        return;
      }

      const candidateNames = resultsCandidates[constituency] || [];
      const votesData = {};

      try {
        const rawResults = await contract.getResultsFor(cIdx);
        const counts = Array.isArray(rawResults) ? rawResults.map(v => Number(v)) 
          : Object.values(rawResults).filter(v => typeof v === 'bigint' || typeof v === 'number').map(v => Number(v));
        
        candidateNames.forEach((name, idx) => {
          votesData[name] = idx < counts.length ? counts[idx] : 0;
        });
      } catch {
        candidateNames.forEach(name => { votesData[name] = 0; });
        setError('Failed to fetch results from blockchain');
      }

      setVotes(votesData);
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalVotes = Object.values(votes).reduce((sum, v) => sum + v, 0);
  const candidateNames = resultsCandidates[selectedConstituency] || [];

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <h2 style={{ ...styles.heading2, margin: 0 }}>📊 Live Voting Results</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          {!isConnected && (
            <button onClick={connectWallet} style={{ ...styles.button, ...styles.buttonSuccess }}>
              🔗 Connect Wallet
            </button>
          )}
          {isConnected && (
            <button onClick={() => fetchResults(selectedConstituency)} disabled={!selectedConstituency || loading}
              style={{ ...styles.button, ...styles.buttonPrimary, opacity: (!selectedConstituency || loading) ? 0.5 : 1 }}>
              🔄 Refresh
            </button>
          )}
        </div>
      </div>

      {isConnected && walletAddress && (
        <div style={{ ...styles.alert, ...styles.alertSuccess }}>
          <span style={{ fontSize: '20px' }}>✅</span>
          <div>
            <strong>Wallet Connected</strong>
            <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>
              {walletAddress.substring(0, 8)}...{walletAddress.substring(36)}
            </div>
          </div>
        </div>
      )}

      {!isConnected && (
        <div style={{ ...styles.alert, ...styles.alertWarning }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          Please connect your MetaMask wallet to view results
        </div>
      )}

      {error && (
        <div style={{ ...styles.alert, ...styles.alertError }}>
          <span style={{ fontSize: '20px' }}>❌</span>
          {error}
        </div>
      )}

      <div style={{ ...styles.card }}>
        <label style={{ ...styles.label, marginBottom: '12px' }}>Select Constituency</label>
        <select value={selectedConstituency} onChange={e => setSelectedConstituency(e.target.value)}
          disabled={!isConnected} style={{ ...styles.input, maxWidth: '400px', opacity: isConnected ? 1 : 0.5 }}>
          <option value="">Choose a constituency</option>
          {resultsConstituencies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading && (
        <div style={{ ...styles.card, textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ fontSize: '18px', color: '#718096' }}>Loading results from blockchain...</p>
        </div>
      )}

      {selectedConstituency && !loading && isConnected && (
        <>
          <div style={{ ...styles.card, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
              {selectedConstituency} Constituency
            </h3>
            <p style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>
              {totalVotes} Total Votes
            </p>
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            {candidateNames.map((cand) => {
              const count = votes[cand] || 0;
              const percent = totalVotes === 0 ? 0 : ((count / totalVotes) * 100).toFixed(1);
              return (
                <div key={cand} style={styles.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#2d3748', margin: 0 }}>{cand}</h4>
                    <span style={{ fontSize: '20px', fontWeight: '700', color: '#667eea' }}>
                      {count} ({percent}%)
                    </span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ ...styles.card, background: '#f7fafc', padding: '20px', marginTop: '32px' }}>
            <p style={{ fontSize: '12px', color: '#718096', margin: '0 0 8px 0', fontWeight: '600', textTransform: 'uppercase' }}>
              Smart Contract
            </p>
            <p style={{ fontSize: '13px', color: '#2d3748', fontFamily: 'monospace', wordBreak: 'break-all', margin: 0 }}>
              {CONTRACT_ADDRESS}
            </p>
            <p style={{ fontSize: '12px', color: '#718096', marginTop: '8px' }}>
              Deployed on Sepolia Testnet • Real-time on-chain data
            </p>
          </div>
        </>
      )}
    </div>
  );
};

// ==================== OTHER PAGES ====================
const CandidateInfo = () => (
  <div style={styles.container}>
    <div style={styles.card}>
      <h2 style={styles.heading2}>👥 Candidate Information</h2>
      <p style={{ color: '#718096', fontSize: '16px' }}>
        View detailed candidate profiles by selecting a constituency in the Results page.
      </p>
    </div>
  </div>
);

const About = () => (
  <div style={styles.container}>
    <div style={styles.card}>
      <h2 style={styles.heading2}>ℹ️ About Our System</h2>
      <p style={{ color: '#4a5568', lineHeight: '1.8', marginBottom: '24px' }}>
        This blockchain-based voting system ensures complete transparency, security, and immutability 
        through Ethereum smart contracts deployed on the Sepolia testnet.
      </p>
      <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#2d3748', marginBottom: '16px' }}>Key Features</h3>
      <ul style={{ color: '#718096', lineHeight: '2', paddingLeft: '24px' }}>
        <li><strong>Face Recognition:</strong> Advanced AI-powered voter verification</li>
        <li><strong>Fingerprint Biometric:</strong> R307 hardware with maximum security level (5)</li>
        <li><strong>Dual Authentication:</strong> Both biometrics required for registration</li>
        <li><strong>Blockchain Technology:</strong> Immutable vote records on Ethereum</li>
        <li><strong>End-to-End Encryption:</strong> Secure data transmission</li>
        <li><strong>Real-time Results:</strong> Live vote tallies from smart contracts</li>
        <li><strong>Tamper-proof Records:</strong> Decentralized and auditable</li>
      </ul>
    </div>
  </div>
);

const Contact = () => (
  <div style={styles.container}>
    <div style={{ ...styles.card, maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={styles.heading2}>📞 Contact Us</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ padding: '16px', background: '#f7fafc', borderRadius: '8px' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#718096', margin: '0 0 4px 0' }}>EMAIL</p>
          <p style={{ fontSize: '16px', color: '#2d3748', margin: 0 }}>support@blockchainvoting.com</p>
        </div>
        <div style={{ padding: '16px', background: '#f7fafc', borderRadius: '8px' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#718096', margin: '0 0 4px 0' }}>PHONE</p>
          <p style={{ fontSize: '16px', color: '#2d3748', margin: 0 }}>+91-9876543210</p>
        </div>
        <div style={{ padding: '16px', background: '#f7fafc', borderRadius: '8px' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#718096', margin: '0 0 4px 0' }}>ADDRESS</p>
          <p style={{ fontSize: '16px', color: '#2d3748', margin: 0 }}>Aurangabad, Maharashtra, India</p>
        </div>
      </div>
    </div>
  </div>
);

// ==================== MAIN APP ====================
function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'home', name: 'Home', icon: '🏠' },
    { id: 'registration', name: 'Registration', icon: '👤' },
    { id: 'candidates', name: 'Candidates', icon: '👥' },
    { id: 'results', name: 'Results', icon: '📊' },
    { id: 'about', name: 'About', icon: 'ℹ️' },
    { id: 'contact', name: 'Contact', icon: '📞' }
  ];

  const renderPage = () => {
    switch(currentPage) {
      case 'home': return <HomePage />;
      case 'registration': return <VoterRegistration />;
      case 'candidates': return <CandidateInfo />;
      case 'results': return <Results />;
      case 'about': return <About />;
      case 'contact': return <Contact />;
      default: return <HomePage />;
    }
  };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', minHeight: '100vh', background: '#f7fafc' }}>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '72px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '0.5px', margin: 0 }}>
          🗳️ Blockchain Voting • Admin Portal
        </h1>
      </header>

      {!sidebarOpen && (
        <button onClick={() => setSidebarOpen(true)} style={{
          position: 'fixed', top: '90px', left: '20px', zIndex: 1150,
          background: 'white', border: 'none', borderRadius: '12px', padding: '14px 18px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)', cursor: 'pointer', fontSize: '24px',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.target.style.transform = 'scale(1)'}>
          ☰
        </button>
      )}

      <nav style={{
        position: 'fixed', top: '72px', left: sidebarOpen ? '0' : '-320px', width: '320px',
        height: 'calc(100vh - 72px)', background: 'white', paddingTop: '32px',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.08)', transition: 'left 0.3s ease', zIndex: 1100,
        overflowY: 'auto', borderRight: '1px solid #e2e8f0'
      }}>
        <button onClick={() => setSidebarOpen(false)} style={{
          position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none',
          fontSize: '24px', cursor: 'pointer', color: '#718096'
        }}>✕</button>

        <div style={{ padding: '0 24px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#2d3748', marginBottom: '4px' }}>Navigation</h2>
          <p style={{ fontSize: '13px', color: '#718096', margin: 0 }}>Admin Control Panel</p>
        </div>

        <ul style={{ listStyle: 'none', padding: '0 16px', margin: 0 }}>
          {menuItems.map((item) => (
            <li key={item.id} style={{ marginBottom: '8px' }}>
              <button onClick={() => { setCurrentPage(item.id); setSidebarOpen(false); }}
                style={{
                  width: '100%', background: currentPage === item.id ? '#f7fafc' : 'transparent',
                  color: currentPage === item.id ? '#667eea' : '#4a5568', border: 'none',
                  padding: '14px 16px', fontSize: '15px', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.2s', borderRadius: '8px', fontWeight: currentPage === item.id ? '600' : '500',
                  display: 'flex', alignItems: 'center', gap: '12px'
                }}
                onMouseEnter={e => { if (currentPage !== item.id) e.target.style.background = '#f7fafc'; }}
                onMouseLeave={e => { if (currentPage !== item.id) e.target.style.background = 'transparent'; }}>
                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <main style={{
        marginLeft: sidebarOpen ? '320px' : '0', marginTop: '72px',
        minHeight: 'calc(100vh - 72px)', transition: 'margin-left 0.3s ease',
        padding: '24px 0'
      }}>
        {renderPage()}
      </main>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', top: '72px', left: '320px', right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.3)', zIndex: 1090, backdropFilter: 'blur(2px)'
        }} />
      )}
    </div>
  );
}

export default App;

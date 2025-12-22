import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import VotingContract from './VotingABI.json';
import FaceAuth from './FaceAuth';
import FingerprintAuth from './FingerprintAuth';

const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS";

const candidatesByConstituency = {
  "jalna": ["KALYAN VAIJINATHRAO KALE", "DANVE RAOSAHEB DADARAO", "MANGESH SANJAY SABLE"],
  "aurangabad": ["BHUMARE SANDIPANRAO ASARAM", "IMTIAZ JALEEL SYED", "CHANDRAKANT KHAIRE"],
  "beed": ["BAJRANG MANOHAR SONWANE", "PANKAJA GOPINATHRAO MUNDE", "ASHOK BHAGOJI THORAT"],
  "ahmednagar": ["NILESH DNYANDEV LANKE", "DR. SUJAY RADHAKRISHNA VIKHEPATIL", "ALEKAR GORAKH DASHRATH"]
};

const CONSTITUENCY_INDEX = { 
  "jalna": 0, 
  "aurangabad": 1, 
  "beed": 2, 
  "ahmednagar": 3 
};

function BlockchainVoting() {
  const [contract, setContract] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [step, setStep] = useState('voter_id');
  const [voterId, setVoterId] = useState('');
  const [voterIdError, setVoterIdError] = useState('');
  const [checkingVoterId, setCheckingVoterId] = useState(false);
  const [authMethod, setAuthMethod] = useState(null);
  
  const [authenticatedVoter, setAuthenticatedVoter] = useState(null);
  const [voterHasVoted, setVoterHasVoted] = useState(false);
  const [justVoted, setJustVoted] = useState(false);
  const [votedCandidateName, setVotedCandidateName] = useState('');

  const autoConnectWallet = async () => {
    try {
      if (!window.ethereum) return null;
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const votingContract = new ethers.Contract(CONTRACT_ADDRESS, VotingContract.abi, signer);
      setContract(votingContract);
      return votingContract;
    } catch (error) {
      console.error('Wallet connection error:', error);
      return null;
    }
  };

  const checkVoterId = async () => {
    if (!voterId.trim()) {
      setVoterIdError('Please enter your Voter ID');
      return;
    }

    setCheckingVoterId(true);
    setVoterIdError('');

    try {
      const response = await fetch('http://localhost:5000/api/check_voter_id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voter_id: voterId.trim().toUpperCase() })
      });

      const result = await response.json();

      if (!result.exists) {
        setVoterIdError('❌ Voter ID not found. Please register first.');
        setCheckingVoterId(false);
        return;
      }

      if (result.has_voted) {
        setVoterHasVoted(true);
        setAuthenticatedVoter({ 
          name: result.name, 
          voter_id: voterId.trim().toUpperCase() 
        });
        setStep('voting');
        setTimeout(() => resetSystem(), 5000);
      } else {
        setStep('choose_auth');
      }
    } catch (error) {
      setVoterIdError('Connection error. Please check backend server.');
    } finally {
      setCheckingVoterId(false);
    }
  };

  const handleAuthSuccess = async (voterData) => {
    const normalizedVoterData = {
      ...voterData,
      voter_id: String(voterData.voter_id || ''),
      constituency: voterData.constituency ? voterData.constituency.trim().toLowerCase() : ''
    };
    
    setAuthenticatedVoter(normalizedVoterData);
    setStep('voting');
    setJustVoted(false);
    setVotedCandidateName('');
    
    await autoConnectWallet();
    await loadCandidates(normalizedVoterData);
  };

  const loadCandidates = async (voterData) => {
    try {
      const constituency = (voterData?.constituency || '').trim().toLowerCase();
      const candidateNames = candidatesByConstituency[constituency] || [];
      setResults(candidateNames.map(name => ({ name, votes: 0 })));
    } catch (error) {
      console.error('Error loading candidates:', error);
    }
  };

  const vote = async (localCandidateId) => {
    if (voterHasVoted || !contract || loading) {
      console.warn('⚠️ Vote blocked');
      return;
    }

    try {
      setLoading(true);
      
      const constituency = (authenticatedVoter?.constituency || '').trim().toLowerCase();
      const constituencyIndex = CONSTITUENCY_INDEX[constituency];
      
      if (constituencyIndex === undefined) throw new Error('Invalid constituency');
      
      const candidateName = results[localCandidateId]?.name || 'Unknown Candidate';
      
      const candidateIdBigInt = BigInt(localCandidateId);
      const constituencyIdBigInt = BigInt(constituencyIndex);
      
      let tx;
      try {
        tx = await contract['vote(uint256,uint256)'](constituencyIdBigInt, candidateIdBigInt, { gasLimit: 300000 });
      } catch {
        const voterIdBytes = ethers.keccak256(ethers.toUtf8Bytes(String(authenticatedVoter?.voter_id || '')));
        tx = await contract['vote(uint256,uint256,bytes32)'](constituencyIdBigInt, candidateIdBigInt, voterIdBytes, { gasLimit: 300000 });
      }
      
      console.log('📝 Transaction sent:', tx.hash);
      await tx.wait();
      console.log('✅ Vote confirmed');
      
      setVotedCandidateName(candidateName);
      
      await markVoterAsVoted();
      setVoterHasVoted(true);
      setJustVoted(true);
      
      setTimeout(() => resetSystem(), 5000);
      
    } catch (error) {
      console.error('❌ Vote error:', error);
      if (error.message.includes('already voted') || error.code === 'CALL_EXCEPTION') {
        setVoterHasVoted(true);
        await markVoterAsVoted();
      }
    } finally {
      setLoading(false);
    }
  };

  const markVoterAsVoted = async () => {
    try {
      if (authenticatedVoter?.voter_id) {
        await fetch('http://localhost:5000/api/mark_voted', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voter_id: authenticatedVoter.voter_id })
        });
      }
    } catch (error) {
      console.error('Error marking voter as voted:', error);
    }
  };

  const resetSystem = () => {
    setStep('voter_id');
    setVoterId('');
    setVoterIdError('');
    setAuthMethod(null);
    setAuthenticatedVoter(null);
    setContract(null);
    setVoterHasVoted(false);
    setResults([]);
    setJustVoted(false);
    setLoading(false);
    setVotedCandidateName('');
  };

  const getConstituencyDisplayName = () => {
    if (!authenticatedVoter?.constituency) return '';
    return authenticatedVoter.constituency.charAt(0).toUpperCase() + authenticatedVoter.constituency.slice(1);
  };

  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
      minHeight: '100vh', 
      width: '100vw',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      boxSizing: 'border-box'
    }}>
      
      <div style={{
        width: '100%',
        maxWidth: '900px',
        background: 'white',
        borderRadius: '24px',
        padding: '60px 80px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        boxSizing: 'border-box'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '700', color: '#2d3748', margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>
            🗳️ National Voting System
          </h1>
          <div style={{ height: '4px', width: '80px', background: 'linear-gradient(90deg, #667eea, #764ba2)', margin: '0 auto', borderRadius: '2px' }}></div>
        </div>

        {/* STEP 1: VOTER ID INPUT */}
        {step === 'voter_id' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🆔</div>
            
            <h2 style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              color: '#2d3748', 
              margin: '0 0 12px 0' 
            }}>
              Enter Your Voter ID
            </h2>
            
            <p style={{ 
              fontSize: '16px', 
              color: '#718096', 
              marginBottom: '32px' 
            }}>
              Please enter your registered Voter ID to continue
            </p>

            {voterIdError && (
              <div style={{
                background: '#fef2f2',
                border: '2px solid #fca5a5',
                padding: '16px 20px',
                borderRadius: '12px',
                marginBottom: '24px',
                color: '#991b1b',
                fontWeight: '500'
              }}>
                {voterIdError}
              </div>
            )}

            <div style={{ marginBottom: '32px' }}>
              <input
                type="text"
                value={voterId}
                onChange={(e) => setVoterId(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && checkVoterId()}
                placeholder="Enter Voter ID (e.g., ABC123)"
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  padding: '16px 20px',
                  fontSize: '18px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  textAlign: 'center',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              onClick={checkVoterId}
              disabled={checkingVoterId || !voterId.trim()}
              style={{
                padding: '16px 48px',
                fontSize: '18px',
                fontWeight: '600',
                background: (checkingVoterId || !voterId.trim())
                  ? '#94a3b8' 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: (checkingVoterId || !voterId.trim()) ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                opacity: (checkingVoterId || !voterId.trim()) ? 0.6 : 1
              }}
            >
              {checkingVoterId ? '⏳ Checking...' : '➡️ Continue'}
            </button>
          </div>
        )}

        {/* STEP 2: CHOOSE AUTHENTICATION METHOD */}
        {step === 'choose_auth' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔐</div>
            
            <h2 style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              color: '#2d3748', 
              margin: '0 0 12px 0' 
            }}>
              Choose Authentication Method
            </h2>
            
            <p style={{ 
              fontSize: '16px', 
              color: '#718096', 
              marginBottom: '40px' 
            }}>
              Select how you want to verify your identity
            </p>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '24px',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <button
                onClick={() => {
                  setAuthMethod('face');
                  setStep('authenticating');
                }}
                style={{
                  padding: '40px 20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>📸</div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }}>
                  Face Recognition
                </h3>
                <p style={{ fontSize: '14px', margin: 0, opacity: 0.9 }}>
                  Verify using your face
                </p>
              </button>

              <button
                onClick={() => {
                  setAuthMethod('fingerprint');
                  setStep('authenticating');
                }}
                style={{
                  padding: '40px 20px',
                  background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(72, 187, 120, 0.4)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>👆</div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }}>
                  Fingerprint
                </h3>
                <p style={{ fontSize: '14px', margin: 0, opacity: 0.9 }}>
                  Verify using fingerprint sensor
                </p>
              </button>
            </div>

            <button
              onClick={() => setStep('voter_id')}
              style={{
                marginTop: '32px',
                padding: '12px 32px',
                fontSize: '16px',
                background: 'transparent',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              ← Back
            </button>
          </div>
        )}

        {/* STEP 3: AUTHENTICATING */}
        {step === 'authenticating' && (
          <div>
            {authMethod === 'face' && (
              <FaceAuth 
                voterId={voterId.trim().toUpperCase()} 
                onAuthSuccess={handleAuthSuccess} 
              />
            )}

            {authMethod === 'fingerprint' && (
              <FingerprintAuth 
                voterId={voterId.trim().toUpperCase()} 
                onAuthSuccess={handleAuthSuccess} 
              />
            )}

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button
                onClick={() => setStep('choose_auth')}
                style={{
                  padding: '12px 32px',
                  fontSize: '16px',
                  background: 'transparent',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                ← Back to Authentication Methods
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: VOTING */}
        {step === 'voting' && (
          <div>
            {!voterHasVoted && !justVoted && (
              <div>
                <div style={{ 
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%)',
                  padding: '32px',
                  borderRadius: '16px',
                  marginBottom: '40px',
                  border: '2px solid #86efac'
                }}>
                  <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#166534', margin: '0', textAlign: 'center' }}>
                    {authenticatedVoter?.name}, you are eligible to vote!
                  </h2>
                </div>

                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: '600', color: '#2d3748', margin: '0 0 24px 0', textAlign: 'center' }}>
                    Available candidates in {getConstituencyDisplayName()} Constituency
                  </h3>

                  {results.length > 0 ? (
                    <div style={{ display: 'grid', gap: '16px' }}>
                      {results.map((candidate, index) => (
                        <button 
                          key={index} 
                          onClick={() => vote(index)} 
                          disabled={loading}
                          style={{
                            padding: '24px 32px',
                            fontSize: '18px',
                            fontWeight: '600',
                            background: loading ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                            opacity: loading ? 0.6 : 1
                          }}
                        >
                          {loading ? '⏳ Processing your vote...' : `Vote for ${candidate.name}`}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#718096', fontSize: '16px' }}>
                      ⏳ Loading candidates...
                    </div>
                  )}
                </div>
              </div>
            )}

            {justVoted && (
              <div>
                <div style={{ 
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%)',
                  padding: '48px',
                  borderRadius: '16px',
                  border: '2px solid #86efac',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '24px' }}>✅</div>
                  <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#166534', margin: '0 0 16px 0' }}>
                    Vote Successfully Cast!
                  </h2>
                  <p style={{ fontSize: '18px', color: '#166534', margin: '0 0 24px 0', opacity: 0.9 }}>
                    Thank you for participating in the democratic process
                  </p>
                  
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.6)',
                    padding: '20px',
                    borderRadius: '12px',
                    marginTop: '20px'
                  }}>
                    <p style={{ fontSize: '16px', color: '#166534', margin: '0 0 8px 0', fontWeight: '600' }}>
                      You have voted for:
                    </p>
                    <p style={{ fontSize: '22px', color: '#166534', margin: 0, fontWeight: '700' }}>
                      {votedCandidateName}
                    </p>
                  </div>
                  
                  <p style={{ fontSize: '15px', color: '#166534', margin: '20px 0 0 0', opacity: '0.8' }}>
                    Your vote has been securely recorded on the blockchain
                  </p>
                </div>

                <div style={{ 
                  marginTop: '32px', 
                  padding: '16px', 
                  background: '#fffbeb', 
                  border: '2px solid #fcd34d', 
                  borderRadius: '12px', 
                  textAlign: 'center', 
                  color: '#92400e', 
                  fontSize: '14px', 
                  fontWeight: '500' 
                }}>
                  ⏰ System will automatically log out in a few seconds...
                </div>
              </div>
            )}

            {voterHasVoted && !justVoted && (
              <div>
                <div style={{ 
                  background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                  padding: '48px',
                  borderRadius: '16px',
                  border: '2px solid #fca5a5',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '24px' }}>🚫</div>
                  <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#991b1b', margin: '0 0 16px 0' }}>
                    You have already voted!
                  </h2>
                  <p style={{ fontSize: '18px', color: '#991b1b', margin: 0, opacity: 0.9 }}>
                    {authenticatedVoter?.name}, you cannot vote multiple times in this election
                  </p>
                </div>

                <div style={{ 
                  marginTop: '32px', 
                  padding: '16px', 
                  background: '#fffbeb', 
                  border: '2px solid #fcd34d', 
                  borderRadius: '12px', 
                  textAlign: 'center', 
                  color: '#92400e', 
                  fontSize: '14px', 
                  fontWeight: '500' 
                }}>
                  ⏰ Returning to home screen in a few seconds...
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default BlockchainVoting;

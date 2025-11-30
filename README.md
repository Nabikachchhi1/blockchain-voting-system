# 🗳️ Blockchain-Based Voting System

A secure, transparent, and tamper-proof voting platform using Ethereum blockchain and dual biometric authentication (Face Recognition + Fingerprint).

![Project Banner](docs/architecture.png)

---

## 📋 Table of Contents

- [Features](#features)
- [System Architecture](#system-architecture)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Usage Guide](#usage-guide)
- [Project Structure](#project-structure)
- [Smart Contract Details](#smart-contract-details)
- [Security Features](#security-features)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## ✨ Features

### Core Functionality
- ✅ **Dual Biometric Authentication** - Face Recognition OR Fingerprint matching
- ✅ **Blockchain Vote Recording** - Immutable, transparent vote storage on Ethereum
- ✅ **One-Vote-Per-Voter** - Smart contract enforcement + backend validation
- ✅ **Real-time Results** - Live vote counting from blockchain
- ✅ **Constituency-based Voting** - Multi-region support (4 constituencies)
- ✅ **Duplicate Prevention** - Hardware + software fingerprint validation

### Security Features
- 🔐 Biometric enrollment with duplicate detection
- 🔐 Face encoding comparison (threshold: < 0.4)
- 🔐 Arduino R307 fingerprint slot matching
- 🔐 Smart contract vote validation
- 🔐 MetaMask wallet integration
- 🔐 CORS-protected Flask API

---

## 🏗️ System Architecture

┌─────────────┐       ┌──────────────┐      ┌─────────────────┐
│ Voter       │─────▶│ React UI     │─────▶│ Flask Backend   │
│ (Browser)   │       │ (Frontend)   │      │ (Biometrics)    │ 
└─────────────┘       └──────────────┘      └─────────────────┘
│ │
│ ▼
│ ┌─────────────────┐
│ │ R307 Fingerprint│
│ │ Sensor          │
│ └─────────────────┘
▼
┌──────────────┐
│ MetaMask     │
│ Wallet       │
└──────────────┘
│
▼
┌────────────────────┐
│ Ethereum Blockchain│
│ (Sepolia Testnet)  │
│ Smart Contract     │
└────────────────────┘


**Workflow:**
1. Voter registers with Voter ID + Face + Fingerprint
2. Backend stores biometric templates in database
3. During voting, voter authenticates via Face OR Fingerprint
4. Frontend sends vote to smart contract via MetaMask
5. Blockchain records immutable vote transaction
6. Results displayed in real-time

---

## 🛠️ Technologies Used

### Frontend
- **React 18+** - UI framework
- **Vite** - Build tool
- **ethers.js 6.x** - Blockchain interaction
- **MetaMask** - Web3 wallet

### Backend
- **Python 3.9+** - Backend language
- **Flask 2.3+** - Web framework
- **face_recognition 1.3.0** - Face encoding library
- **pySerial** - Arduino communication
- **Pillow** - Image processing

### Blockchain
- **Solidity 0.8+** - Smart contract language
- **Hardhat** - Development environment
- **Ethereum Sepolia** - Testnet blockchain

### Hardware
- **Arduino UNO** - Microcontroller
- **R307 Fingerprint Sensor** - Biometric scanner
- **USB Webcam** - Face capture

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Software Requirements
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.9+ ([Download](https://www.python.org/))
- **Git** ([Download](https://git-scm.com/))
- **Arduino IDE** 2.x ([Download](https://www.arduino.cc/))
- **MetaMask Browser Extension** ([Install](https://metamask.io/))

### Hardware Requirements
- Arduino UNO
- R307 Optical Fingerprint Sensor
- USB Webcam (or laptop camera)
- Jumper wires for Arduino connections

### Accounts Needed
- MetaMask wallet with Sepolia testnet setup
- Sepolia testnet ETH ([Get from faucet](https://www.alchemy.com/faucets/ethereum-sepolia))

---

## 📥 Installation

### 1️⃣ Clone Repository
git clone https://github.com/YOUR_USERNAME/blockchain-voting-system.git
cd blockchain-voting-system


### 2️⃣ Frontend Setup
cd frontend
npm install

**Create `frontend/.env` file:**

### 3️⃣ Backend Setup
cd backend
python -m venv venv

Windows
venv\Scripts\activate

Mac/Linux
source venv/bin/activate

pip install -r requirements.txt

**Create `backend/requirements.txt`:**
Flask==2.3.3
flask-cors==4.0.0
face-recognition==1.3.0
dlib==19.24.2
numpy==1.24.3
Pillow==10.0.0
pyserial==3.5

### 4️⃣ Blockchain Setup
cd blockchain
npm install

**Create `blockchain/.env` file:**
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=your_metamask_private_key_here


**Install Hardhat dependencies:**
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

### 5️⃣ Arduino Setup

1. Open **Arduino IDE**
2. Install **Adafruit Fingerprint Sensor Library**:
   - Go to `Sketch → Include Library → Manage Libraries`
   - Search "Adafruit Fingerprint"
   - Install latest version
3. Connect R307 sensor:
   - **VCC** → 5V
   - **GND** → GND
   - **TX** → Pin 2 (Arduino RX)
   - **RX** → Pin 3 (Arduino TX)
4. Upload `arduino/fingerprint_scanner.ino` to Arduino
5. Note the COM port (e.g., COM4 on Windows, `/dev/ttyUSB0` on Linux)

---

## 🚀 Running the Application

### Step 1: Deploy Smart Contract
cd blockchain
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia

**Copy the deployed contract address** and update:
- `frontend/.env` → `VITE_CONTRACT_ADDRESS`
- `frontend/src/App.jsx` → `CONTRACT_ADDRESS` constant

### Step 2: Start Backend Server
cd backend

Activate virtual environment first
python voter_auth_api.py

Server runs at: `http://localhost:5000`

**Expected output:**
======================================================================
🚀 BLOCKCHAIN VOTING API SERVER
📍 Server: http://localhost:5000
👆 Fingerprint: ✅ Connected
🔐 Face Auth Threshold: 0.4 (Strict)

### Step 3: Start Frontend

cd frontend
npm run dev

Frontend runs at: `http://localhost:5173`

### Step 4: Configure MetaMask

1. Open MetaMask extension
2. Switch to **Sepolia Test Network**
3. Ensure you have Sepolia ETH (get from [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia))

---

## 📖 Usage Guide

### Voter Registration

1. Navigate to `http://localhost:5173`
2. Click **"Register New Voter"**
3. Enter:
   - Voter ID (e.g., `Y1`, `Y2`, `Y3`)
   - Full Name
   - Select Constituency
4. **Capture Face:**
   - Allow camera access
   - Position face in frame
   - Click **"Capture"**
5. **Enroll Fingerprint:**
   - Place finger on R307 sensor (3 times)
   - Wait for "Enrollment Complete" message
6. Click **"Submit Registration"**

### Voting Process

1. **Enter Voter ID** on home screen
2. **Choose Authentication Method:**
   - **Face Recognition** → Capture face
   - **Fingerprint** → Scan finger
3. **Select Candidate** from your constituency
4. **Confirm MetaMask Transaction**
   - Review gas fees
   - Click "Confirm"
5. **Vote Recorded!** - See confirmation message

---

## 📂 Project Structure

blockchain-voting-system/
│
├── frontend/
│ ├── src/
│ │ ├── App.jsx # Main app logic
│ │ ├── FaceAuth.jsx # Face authentication component
│ │ ├── FingerprintAuth.jsx # Fingerprint authentication component
│ │ └── VotingABI.json # Smart contract ABI
│ ├── package.json
│ └── vite.config.js
│
├── backend/
│ ├── voter_auth_api.py # Flask REST API
│ ├── fingerprint_service.py # Arduino serial communication
│ ├── requirements.txt
│ └── voters_db.json # Voter database (auto-generated)
│
├── blockchain/
│ ├── contracts/Voting.sol # Solidity smart contract
│ ├── scripts/deploy.js # Deployment script
│ ├── hardhat.config.js
│ └── package.json
│
├── arduino/
│ └── fingerprint_scanner.ino # Arduino R307 code
│
└── README.md

---

## 🔐 Smart Contract Details

**Contract Address (Sepolia):** `0x6B2230D8F872e06cF8A1a079acabe876198A3931`

### Key Functions
function vote(uint256 constituencyId, uint256 candidateId) public
- Records vote for candidate in specified constituency
- Prevents double voting
- Emits `VoteCast` event

function getVotes(uint256 constituencyId, uint256 candidateId) public view returns (uint256)
- Returns vote count for a candidate

### Events
event VoteCast(address indexed voter, uint256 constituencyId, uint256 candidateId);

---

## 🛡️ Security Features

| Feature | Implementation |
|---------|---------------|
| **Biometric Verification** | Face distance < 0.4, Fingerprint slot matching |
| **Duplicate Prevention** | Hardware + database fingerprint check |
| **One-Vote Enforcement** | Smart contract + backend validation |
| **Immutable Records** | Ethereum blockchain storage |
| **Wallet Authentication** | MetaMask transaction signing |
| **API Security** | CORS protection, input validation |

---

## 🧪 Testing

### Test Voter Registration

se test Voter IDs: Y1, Y2, Y3
Constituencies: jalna, aurangabad, beed, ahmednagar

### Test Scenarios

1. ✅ Valid voter with correct biometrics → Vote succeeds
2. ❌ Unregistered fingerprint → Authentication fails
3. ❌ Already voted voter → Rejected
4. ❌ Duplicate fingerprint enrollment → Prevented
5. ❌ No Sepolia ETH → Transaction blocked

---

## 🐛 Troubleshooting

### Arduino Not Connecting

Check COM port in Device Manager (Windows)
Update in fingerprint_service.py:
FingerprintScanner('COM4') # Change COM port

### Face Recognition Errors

Install dlib dependencies (Windows)
pip install cmake
pip install dlib

Mac
brew install cmake
pip install dlib

### MetaMask Transaction Fails

1. Check Sepolia ETH balance
2. Increase gas limit in code (300000 → 500000)
3. Switch MetaMask network to Sepolia

### Backend CORS Error

- Ensure Flask server is running on `http://localhost:5000`
- Check CORS configuration in `voter_auth_api.py`

---

## 🚀 Future Enhancements

- [ ] Zero-knowledge proofs for voter privacy
- [ ] IPFS integration for decentralized storage
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Admin dashboard for result monitoring
- [ ] Iris/retina biometric option
- [ ] Gas optimization in smart contracts
- [ ] Layer-2 scaling (Polygon, Arbitrum)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📧 Contact

**Project Maintainer:** [Your Name]  
**Email:** your.email@example.com  
**Institution:** [Your College Name]  
**Project Guide:** [Guide Name]

**GitHub:** [https://github.com/YOUR_USERNAME/blockchain-voting-system](https://github.com/YOUR_USERNAME/blockchain-voting-system)

---

## 🙏 Acknowledgments

- Face Recognition Library by Adam Geitgey
- Adafruit Fingerprint Sensor Library
- Ethereum Foundation
- Hardhat Development Team
- Our Project Guide for continuous support

---

**⭐ If you find this project helpful, please star the repository!**


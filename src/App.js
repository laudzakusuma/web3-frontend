import React, { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import HelloWorldABI from './abi/HelloWorldABI.json';

const contractAddress = '0x9a36d7337a77e06584Fc3fB22948c430867f5A7b'; // ganti sesuai

function App() {
  const [greeting, setGreeting] = useState('');
  const [input, setInput] = useState('');
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);

  // Koneksi ke wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Metamask tidak ditemukan!');
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signerInstance = await provider.getSigner();
      setSigner(signerInstance);
      setAccount(accounts[0]);
    } catch (error) {
      console.error('Wallet connect error:', error);
    }
  };

  // Ambil instance kontrak
  const getContract = () => {
    if (!signer) return null;
    return new Contract(contractAddress, HelloWorldABI.abi, signer);
  };

  // Load greeting
  const fetchGreeting = async () => {
    try {
      const contract = getContract();
      if (!contract) return;
      const value = await contract.getGreeting();
      setGreeting(value);
    } catch (err) {
      console.error('Gagal fetch greeting:', err);
    }
  };

  // Update greeting
  const updateGreeting = async () => {
    try {
      const contract = getContract();
      if (!contract) return;
      const tx = await contract.setGreeting(input);
      await tx.wait();
      fetchGreeting();
      setInput('');
    } catch (err) {
      console.error('Gagal update greeting:', err);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      connectWallet();
    }
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🚀 DApp Greeting</h1>
      <button onClick={connectWallet} style={styles.button}>
        {account ? `Terkoneksi: ${account.slice(0, 6)}...` : 'Connect Wallet'}
      </button>

      <div style={styles.card}>
        <p style={styles.label}>Greeting dari Smart Contract:</p>
        <p style={styles.greeting}>{greeting}</p>
        <button onClick={fetchGreeting} style={styles.button}>Get Greeting</button>
      </div>

      <div style={styles.card}>
        <input
          type="text"
          placeholder="Tulis greeting baru..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={styles.input}
        />
        <button onClick={updateGreeting} style={styles.button}>Set Greeting</button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#0a0a23',
    color: '#ffffff',
    minHeight: '100vh',
    padding: '40px',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  card: {
    background: '#1a1a40',
    padding: '20px',
    borderRadius: '10px',
    marginTop: '20px',
    textAlign: 'center',
  },
  label: {
    fontSize: '1.2rem',
    marginBottom: '0.5rem',
  },
  greeting: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#00ffe5',
    marginBottom: '10px',
  },
  button: {
    padding: '10px 20px',
    marginTop: '10px',
    backgroundColor: '#00ffe5',
    color: '#0a0a23',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  input: {
    padding: '10px',
    width: '80%',
    borderRadius: '5px',
    border: '1px solid #ccc',
    marginTop: '10px',
  },
};

export default App;

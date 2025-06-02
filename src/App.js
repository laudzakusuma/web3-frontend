import React, { useEffect, useState, useCallback } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import HelloWorldABI from './abi/HelloWorldABI.json'; // Pastikan path ini benar

// Alamat kontrak pintar Anda (ganti jika perlu)
const contractAddress = '0x9a36d7337a77e06584Fc3fB22948c430867f5A7b';

function App() {
  const [greeting, setGreeting] = useState('');
  const [input, setInput] = useState('');
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [provider, setProvider] = useState(null); // Tetap ada jika diperlukan di masa mendatang
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // Efek untuk styling global dan animasi
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    // Menambahkan dan memperbarui keyframes untuk animasi yang lebih kaya
    styleSheet.innerText = `
      @keyframes fadeInEnhanced {
        from { opacity: 0; transform: translateY(25px) scale(0.97); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes pulseEnhanced {
        0% { text-shadow: 0 0 5px #00c6ff, 0 0 10px #00c6ff; transform: scale(1); }
        50% { text-shadow: 0 0 20px #00c6ff, 0 0 30px #00c6ff, 0 0 40px #00c6ff; transform: scale(1.08); }
        100% { text-shadow: 0 0 5px #00c6ff, 0 0 10px #00c6ff; transform: scale(1); }
      }
      @keyframes gradientBG {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes modalEnter { /* Animasi baru untuk modal */
        from { opacity: 0; transform: translateY(40px) scale(0.9); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes neonTextGlow { /* Animasi baru untuk teks judul */
        0%, 100% { text-shadow: 0 0 6px rgba(0,198,255,0.7), 0 0 12px rgba(0,198,255,0.5), 0 0 18px rgba(0,198,255,0.3); }
        50% { text-shadow: 0 0 12px rgba(0,198,255,0.9), 0 0 24px rgba(0,198,255,0.7), 0 0 36px rgba(0,198,255,0.5); }
      }
      @keyframes subtleShine { /* Animasi untuk efek kilau pada hover (jika diimplementasikan dengan class) */
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
      body {
        margin: 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #16213e, #1a1a2e); /* Gradient lebih halus */
        background-size: 600% 600%; /* Ukuran lebih besar untuk animasi gradient yang lebih lambat */
        animation: gradientBG 25s ease infinite; /* Durasi animasi gradient diperpanjang */
        color: #e8e8e8; /* Warna teks sedikit lebih terang */
        overflow-x: hidden;
      }
    `;
    document.head.appendChild(styleSheet);

    // Stylesheet untuk keyframes spin dan media query tetap ada
    const keyframesStyleSheet = document.createElement("style");
    keyframesStyleSheet.type = "text/css";
    keyframesStyleSheet.innerText = `
      @keyframes spin { /* Pastikan ini tidak duplikat jika sudah ada di atas, atau gabungkan */
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @media (min-width: 600px) {
        #root header { 
          flex-direction: row;
          text-align: left;
        }
        #root header h1 {
            margin-bottom: 0;
        }
      }
    `;
    document.head.appendChild(keyframesStyleSheet);

    return () => {
      if (styleSheet.parentNode) {
        document.head.removeChild(styleSheet);
      }
      if (keyframesStyleSheet.parentNode) {
        document.head.removeChild(keyframesStyleSheet);
      }
    };
  }, []);

  const connectWallet = useCallback(async () => {
    setError('');
    if (!window.ethereum) {
      setError('Metamask tidak ditemukan! Silakan install Metamask.');
      setIsWalletModalOpen(true);
      return;
    }
    setIsLoading(true);
    try {
      const web3Provider = new BrowserProvider(window.ethereum);
      await web3Provider.send('eth_requestAccounts', []);
      const signerInstance = await web3Provider.getSigner();
      const userAccount = await signerInstance.getAddress();
      
      setProvider(web3Provider);
      setSigner(signerInstance);
      setAccount(userAccount);
      
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          (async () => {
            if (web3Provider) {
              const newSigner = await web3Provider.getSigner();
              setSigner(newSigner);
            }
          })();
        } else {
          setAccount(null);
          setSigner(null);
          setError('Wallet terputus. Silakan hubungkan kembali.');
        }
      });
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

    } catch (err) {
      console.error('Wallet connect error:', err);
      setError('Gagal menghubungkan wallet. Pastikan Anda mengizinkan koneksi di Metamask.');
      setIsWalletModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getContract = useCallback(() => {
    if (!signer || !HelloWorldABI || !HelloWorldABI.abi) {
        console.error("Signer atau ABI tidak tersedia", {signer, HelloWorldABI});
        return null;
    }
    return new Contract(contractAddress, HelloWorldABI.abi, signer);
  }, [signer]);

  const fetchGreeting = useCallback(async () => {
    setError('');
    const contract = getContract();
    if (!contract) {
      setError('Kontrak tidak tersedia. Pastikan wallet terhubung.');
      return;
    }
    setIsLoading(true);
    try {
      const value = await contract.getGreeting();
      setGreeting(value);
    } catch (err) {
      console.error('Gagal fetch greeting:', err);
      setError('Gagal mengambil greeting dari smart contract.');
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  const updateGreeting = useCallback(async () => {
    if (!input.trim()) {
      setError('Input greeting tidak boleh kosong.');
      return;
    }
    setError('');
    const contract = getContract();
    if (!contract) {
      setError('Kontrak tidak tersedia. Pastikan wallet terhubung.');
      return;
    }
    setIsLoading(true);
    try {
      const tx = await contract.setGreeting(input);
      await tx.wait();
      fetchGreeting(); 
      setInput('');
    } catch (err) {
      console.error('Gagal update greeting:', err);
      let specificError = 'Gagal memperbarui greeting.';
      if (err.reason) {
        specificError += ` Penyebab: ${err.reason}`;
      } else if (err.message && err.message.includes("user rejected transaction")) {
        specificError = "Transaksi dibatalkan oleh pengguna.";
      }
      setError(specificError);
    } finally {
      setIsLoading(false);
    }
  }, [input, getContract, fetchGreeting]);
  
  useEffect(() => {
    if (window.ethereum && window.ethereum.selectedAddress) {
        connectWallet();
    }
  }, [connectWallet]);

  useEffect(() => {
    if (signer) {
      fetchGreeting();
    }
  }, [signer, fetchGreeting]);

  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modalContent}>
          <h3 style={styles.modalTitle}>{title}</h3>
          <div>{children}</div>
          <button onClick={onClose} style={{...styles.button, ...styles.modalButton}}>Tutup</button>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>
          <span style={styles.titleIcon}>🌌</span> {/* Menggunakan animasi pulseEnhanced */}
          <span style={styles.titleText}>DApp Greeting Interaktif</span> {/* Menggunakan animasi neonTextGlow */}
        </h1>
        <button 
          onClick={account ? null : connectWallet} 
          style={account ? {...styles.button, ...styles.buttonConnected} : {...styles.button, ...styles.buttonConnect}}
          disabled={isLoading || !!account}
          // Menambahkan transisi pada tombol untuk efek hover/active yang lebih halus dari browser
          onMouseEnter={(e) => {
            if (!account && !isLoading) e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            if (!account && !isLoading) e.currentTarget.style.transform = 'scale(1) translateY(0)';
          }}
          onMouseDown={(e) => {
            if (!account && !isLoading) e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            if (!account && !isLoading) e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
          }}
        >
          {isLoading && !account ? 'Menghubungkan...' : (account ? `🟢 Terhubung: ${account.slice(0, 6)}...${account.slice(-4)}` : '🔗 Hubungkan Wallet')}
        </button>
      </header>

      <Modal 
        isOpen={isWalletModalOpen && !!error} 
        onClose={() => {setIsWalletModalOpen(false); setError('');}} 
        title="Informasi Wallet"
      >
        <p>{error}</p>
        {!window.ethereum && <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" style={styles.link}>Install MetaMask</a>}
      </Modal>
      
      {error && !isWalletModalOpen && <p style={styles.errorMessage}>{error}</p>}

      {account ? (
        <>
          {/* Menggunakan animasi fadeInEnhanced */}
          <div style={{...styles.card, animation: 'fadeInEnhanced 1s ease-out'}}>
            <p style={styles.label}>Pesan Saat Ini dari Smart Contract:</p>
            {isLoading && !greeting ? (
                 <div style={styles.spinnerContainer}><div style={styles.spinner}></div>Memuat...</div>
            ) : (
                <p style={styles.greetingText}>{greeting || "Belum ada pesan."}</p>
            )}
            <button 
              onClick={fetchGreeting} 
              style={{...styles.button, ...styles.buttonAction}} 
              disabled={isLoading}
              onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.2)'}
              onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
            >
              {isLoading ? 'Memuat...' : '🔄 Segarkan Pesan'}
            </button>
          </div>

          {/* Menggunakan animasi fadeInEnhanced dengan delay */}
          <div style={{...styles.card, animation: 'fadeInEnhanced 1.2s ease-out 0.2s backwards'}}>
            <label htmlFor="greetingInput" style={styles.label}>Ubah Pesan:</label>
            <input
              id="greetingInput"
              type="text"
              placeholder="Tulis pesan baru di sini..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={styles.input}
              disabled={isLoading}
            />
            <button 
              onClick={updateGreeting} 
              style={{...styles.button, ...styles.buttonAction, ...styles.buttonPrimary}} 
              disabled={isLoading || !input.trim()}
              onMouseEnter={(e) => {
                if (!isLoading && input.trim()) e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                 if (!isLoading && input.trim()) e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {isLoading ? 'Mengirim...' : '✉️ Kirim Pesan Baru'}
            </button>
          </div>
        </>
      ) : (
        <div style={{...styles.card, ...styles.centeredMessage, animation: 'fadeInEnhanced 1s ease-out'}}>
          <p>Silakan hubungkan wallet MetaMask Anda untuk berinteraksi dengan DApp.</p>
          {!window.ethereum && <p>MetaMask sepertinya belum terinstal. <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" style={styles.link}>Klik di sini untuk menginstal</a>.</p>}
        </div>
      )}
      <footer style={styles.footer}>
        <p>&copy; {new Date().getFullYear()} DApp Greeting Interaktif. Dibuat dengan <span style={{color: '#ff7b7b', animation: 'pulseEnhanced 1.5s infinite ease-in-out'}}>❤️</span> & React.</p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxSizing: 'border-box',
  },
  header: {
    width: '100%',
    maxWidth: '850px', // Sedikit lebih lebar
    display: 'flex',
    flexDirection: 'column', 
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '50px', // Margin lebih besar
    paddingBottom: '25px',
    borderBottom: '1px solid rgba(0, 198, 255, 0.2)', // Border lebih visible
    animation: 'fadeInEnhanced 0.7s ease-out',
    textAlign: 'center', 
  },
  title: {
    fontSize: 'clamp(2rem, 6vw, 3.2rem)', // Ukuran font lebih besar
    color: '#ffffff',
    margin: '0 0 20px 0', 
    display: 'flex',
    alignItems: 'center',
    gap: '15px', // Jarak antar ikon dan teks
  },
  titleIcon: {
    fontSize: 'clamp(2.2rem, 7vw, 3.5rem)',
    animation: 'pulseEnhanced 2.5s infinite ease-in-out', // Menggunakan pulseEnhanced
    filter: 'drop-shadow(0 0 10px rgba(0,198,255,0.7))' // Efek drop shadow
  },
  titleText: { // Style untuk teks judul agar bisa dianimasikan terpisah
    animation: 'neonTextGlow 3s infinite alternate',
  },
  card: {
    background: 'rgba(30, 40, 70, 0.7)', // Background lebih gelap dan transparan
    backdropFilter: 'blur(12px) saturate(150%)', // Efek glassmorphism lebih kuat
    border: '1px solid rgba(0, 198, 255, 0.25)',
    padding: '30px', // Padding lebih besar
    borderRadius: '20px', // Border radius lebih besar
    marginTop: '30px',
    width: '100%',
    maxWidth: '650px', // Card lebih lebar
    boxShadow: '0 10px 35px 0 rgba(0, 0, 0, 0.3), 0 0 15px rgba(0,198,255,0.1) inset', // Shadow lebih kompleks
    textAlign: 'center',
    transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease', // Transisi lebih menarik
    // Efek hover dipindahkan ke event handler untuk konsistensi
  },
  label: {
    fontSize: 'clamp(1.1rem, 2.8vw, 1.3rem)',
    marginBottom: '15px',
    color: '#21d4fd', // Warna label diubah
    fontWeight: 'bold', // Lebih tebal
    display: 'block', 
    textShadow: '0 0 5px rgba(33,212,253,0.3)',
  },
  greetingText: {
    fontSize: 'clamp(1.4rem, 4.5vw, 2rem)',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: '15px 0 25px 0',
    padding: '20px',
    background: 'linear-gradient(145deg, rgba(0, 198, 255, 0.15), rgba(0, 198, 255, 0.05))', // Gradient background
    borderRadius: '12px',
    minHeight: '60px',
    wordBreak: 'break-all',
    borderLeft: '5px solid #00c6ff',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
    transition: 'all 0.3s ease', // Transisi untuk perubahan teks
  },
  button: {
    padding: '14px 28px', // Padding lebih besar
    margin: '12px 8px',
    border: 'none',
    borderRadius: '10px', // Border radius lebih besar
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 'clamp(0.95rem, 2.2vw, 1.05rem)',
    transition: 'all 0.25s cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Transisi lebih 'bouncy'
    textTransform: 'uppercase',
    letterSpacing: '1.2px',
    outline: 'none',
    position: 'relative', // Untuk efek pseudo-elements jika ditambahkan via CSS
    overflow: 'hidden', // Untuk efek shine jika ditambahkan
  },
  buttonConnect: {
    backgroundColor: '#00c6ff',
    color: '#101528', // Warna teks kontras
    boxShadow: '0 0 12px rgba(0,198,255,0.6), 0 0 20px rgba(0,198,255,0.4), 0 4px 8px rgba(0,0,0,0.2)',
    // Efek hover ditangani via onMouseEnter/Leave
  },
  buttonConnected: {
    backgroundColor: 'transparent',
    color: '#00c6ff',
    border: '2px solid #00c6ff',
    cursor: 'default',
    boxShadow: '0 0 8px rgba(0,198,255,0.3) inset',
  },
  buttonAction: {
    backgroundColor: 'rgba(0, 198, 255, 0.25)',
    color: '#00e0ff', // Warna teks lebih cerah
    border: '1px solid #00c6ff',
    // Efek hover ditangani via onMouseEnter/Leave
  },
  buttonPrimary: {
    backgroundColor: '#00c6ff',
    color: '#101528',
    boxShadow: '0 0 10px #00c6ff, 0 0 18px #00c6ff',
    // Efek hover ditangani via onMouseEnter/Leave
  },
  input: {
    padding: '14px 18px', // Padding lebih besar
    width: 'calc(100% - 38px)', 
    maxWidth: '450px', // Input lebih lebar
    borderRadius: '10px',
    border: '2px solid rgba(0, 198, 255, 0.5)', // Border lebih tebal
    backgroundColor: 'rgba(255, 255, 255, 0.08)', // Background sedikit lebih opaque
    color: '#e8e8e8',
    fontSize: '1.05rem', // Font sedikit lebih besar
    marginBottom: '20px',
    outline: 'none',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease',
    // Efek focus:
    // ':focus': { // Tidak bisa langsung di inline style, tapi transisi akan menghaluskan efek browser default
    //   borderColor: '#00e0ff',
    //   boxShadow: '0 0 12px rgba(0, 198, 255, 0.6), 0 0 0 3px rgba(0,198,255,0.2)',
    //   transform: 'scale(1.01)',
    // },
  },
  errorMessage: {
    backgroundColor: 'rgba(255, 80, 80, 0.2)', // Warna error lebih lembut
    color: '#ff9a9a', // Teks error lebih terang
    border: '1px solid rgba(255, 80, 80, 0.6)',
    padding: '18px',
    borderRadius: '10px',
    textAlign: 'center',
    marginTop: '25px',
    width: '100%',
    maxWidth: '650px',
    animation: 'fadeInEnhanced 0.5s',
    boxShadow: '0 4px 10px rgba(255,0,0,0.2)',
  },
  centeredMessage: {
    textAlign: 'center',
    fontSize: '1.15rem',
    color: '#c0c0c0', // Warna teks lebih terang
  },
  link: {
    color: '#21d4fd', // Warna link diubah
    textDecoration: 'underline', // Garis bawah default
    fontWeight: 'bold',
    transition: 'color 0.3s ease, text-shadow 0.3s ease',
    // ':hover': { // Tidak bisa langsung
    //   color: '#50e3ff',
    //   textShadow: '0 0 5px #50e3ff',
    // }
  },
  footer: {
    width: '100%',
    textAlign: 'center',
    padding: '35px 0 15px 0',
    marginTop: 'auto', 
    fontSize: '0.95rem',
    color: 'rgba(255, 255, 255, 0.6)', // Warna footer lebih terang
    borderTop: '1px solid rgba(0, 198, 255, 0.15)', // Border footer lebih visible
  },
  spinnerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#00c6ff',
    fontSize: '1.25rem', // Font lebih besar
    margin: '25px 0',
  },
  spinner: { // Spinner lebih menarik
    border: '5px solid rgba(0, 198, 255, 0.2)',
    borderTop: '5px solid #00c6ff',
    borderRight: '5px solid #00c6ff', // Tambahan untuk efek visual
    borderRadius: '50%',
    width: '35px', // Ukuran lebih besar
    height: '35px',
    animation: 'spin 0.8s linear infinite', // Spin lebih cepat
    marginRight: '12px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 20, 40, 0.8)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeInEnhanced 0.3s ease',
  },
  modalContent: {
    background: 'linear-gradient(160deg, #1a2a4e, #101830)',
    padding: '35px',
    borderRadius: '18px',
    border: '1px solid #00c6ff',
    boxShadow: '0 15px 50px rgba(0, 198, 255, 0.2), 0 0 30px rgba(0,0,0,0.4)',
    width: '90%',
    maxWidth: '550px',
    textAlign: 'center',
    animation: 'modalEnter 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
  },
  modalTitle: {
    color: '#00e0ff',
    fontSize: '2rem',
    marginBottom: '25px',
    borderBottom: '1px solid rgba(0, 198, 255, 0.3)',
    paddingBottom: '15px',
    textShadow: '0 0 8px rgba(0,224,255,0.5)',
  },
  modalButton: {
    marginTop: '30px',
    backgroundColor: '#00c6ff',
    color: '#101528',
  }
};

export default App;
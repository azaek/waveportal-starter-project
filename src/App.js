import * as React from "react";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import './App.css';
import abi from './utils/WavePortal.json';

export default function App() {

  const [message, setMessage] = useState("");
  const [currentAccount, setCurrentAccount] = useState("");
  const [waving, setWaving] = useState(false);

  const [allWaves, setAllWaves] = useState([]);
  const contractAddress = "0xb620F562069a1376E03487A793956109A2FB441B";
  const contractABI = abi.abi;


  const getAllWaves = async () => {
    try {
      const { ethereum } = window;

      if(ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);
        const waves = await contract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach((wave) => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    let wavePortalContract;
    
    const onNewWave = (from, timestamp, message) => {
      console.log("New wave from: " + from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };

  }, [])

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure metamask is installed");
        return;
      } else {
        console.log("metamask is installed");
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });;

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account: ", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized accounts found");
      }

    } catch (error) {
      console.log("Error: ", error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log("Error: ", error);
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  },[])

  const wave = async () => {
    try {
      const { ethereum } = window;

      if(ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());


        setWaving(true);
        const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000 });
        console.log("Mining...", waveTxn.hash);
        console.log(waveTxn)

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        setWaving(false);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        getAllWaves();

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log("Error: ", error);
    }
  }
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        👋 Hey there!
        </div>

        <div className="bio">
          I am azaek and I do nothing all day except staring at my screen.
        </div>

        <input onChange={(e) => setMessage(e.target.value)} type="text" style={{ marginTop: '10px', padding: '10px', borderRadius: '8px', outline: 'none'}} placeholder="type a message ..." />

        <button className="waveButton" onClick={wave}>
          {
            !waving && 'Wave at Me pls 🥺👉🏻👈🏻 (UwU)'
          }
          {
            waving && 'Waving...'
          }
        </button>

        {
          !currentAccount && (
            <button className="waveButton" onClick={connectWallet}>
              Connect Wallet
            </button>
          )
        }

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}

      </div>
    </div>
  );
}

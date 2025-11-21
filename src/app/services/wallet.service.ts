import { Injectable } from '@angular/core';

declare global {
  interface Window { ethereum?: any; }
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  async connect(): Promise<string> {
    if (!window.ethereum) {
      throw new Error('MetaMask no está instalado');
    }
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) throw new Error('No se obtuvieron cuentas');
    return accounts[0];
  }

  async getAccounts(): Promise<string[]> {
    if (!window.ethereum) return [];
    return await window.ethereum.request({ method: 'eth_accounts' });
  }

  async getChainId(): Promise<string> {
    if (!window.ethereum) return '';
    return await window.ethereum.request({ method: 'eth_chainId' });
  }

  async getBalance(address: string): Promise<string> {
    if (!window.ethereum) return '0';
    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      // Convertir de hex a decimal
      return parseInt(balance, 16).toString();
    } catch (error) {
      console.error('Error obteniendo saldo:', error);
      return '0';
    }
  }

  // Función auxiliar para convertir Wei a ETH
  weiToEth(weiValue: string): string {
    const wei = BigInt(weiValue);
    const eth = Number(wei) / Math.pow(10, 18);
    return eth.toFixed(4);
  }

  async signMessage(message: string): Promise<string> {
    if (!window.ethereum) throw new Error('MetaMask no está disponible');
    const accounts = await this.getAccounts();
    const from = accounts[0];
    if (!from) throw new Error('Cuenta no conectada');
    return await window.ethereum.request({
      method: 'personal_sign',
      params: [message, from]
    });
  }

  async switchNetwork(network: string): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask no está instalado');
    }

    const networkParams: { [key: string]: any } = {
      'holesky': {
        chainId: '0x4268', // 17000 in hex
        chainName: 'Holesky',
        nativeCurrency: {
          name: 'Holesky ETH',
          symbol: 'ETH',
          decimals: 18
        },
        rpcUrls: ['https://holesky.drpc.org'],
        blockExplorerUrls: ['https://eth-holesky.blockscout.com']
      },
      'sepolia': {
        chainId: '0xaa36a7', // 11155111 in hex
        chainName: 'Sepolia',
        nativeCurrency: {
          name: 'Sepolia ETH',
          symbol: 'ETH',
          decimals: 18
        },
        rpcUrls: ['https://sepolia.drpc.org'],
        blockExplorerUrls: ['https://eth-sepolia.blockscout.com']
      },
      'goerli': {
        chainId: '0x5', // 5 in hex
        chainName: 'Goerli',
        nativeCurrency: {
          name: 'Goerli ETH',
          symbol: 'ETH',
          decimals: 18
        },
        rpcUrls: ['https://goerli.infura.io/v3/'],
        blockExplorerUrls: ['https://goerli.etherscan.io/']
      },
      'hoodi':{
        chainId: '0x88bb0',
        chainName: 'Ethereum Hoodi ',
        nativeCurrency:{
          name:'Ethereun Hoodi ',
          symbol:'ETH',
          decimals:'18'
        },
        rpcUrl:['https://hoodi.drpc.org'],
        blockExporerUrls:['wss://hoodi.etherscan.io']
      }
    };

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkParams[network].chainId }],
      });
    } catch (switchError: any) {
      // Este error indica que la cadena no ha sido agregada a MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [networkParams[network]]
          });
        } catch (addError) {
          throw new Error('Error al agregar la red a MetaMask');
        }
      } else {
        throw new Error('Error al cambiar de red');
      }
    }
  }
}
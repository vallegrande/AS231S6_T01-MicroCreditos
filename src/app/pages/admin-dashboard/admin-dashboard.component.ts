import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  account: string | null = null;
  chainId: string | null = null;

  constructor(private wallet: WalletService) {}

  ngOnInit() {
    this.checkConnection();
  }

  async checkConnection() {
    try {
      const accounts = await this.wallet.getAccounts();
      if (accounts && accounts.length > 0) {
        this.account = accounts[0];
        this.chainId = await this.wallet.getChainId();
      }
    } catch (err: any) {
      console.log('No hay conexión previa con MetaMask');
    }
  }

  getNetworkName(chainId: string): string {
    const chainIdMap: { [key: string]: string } = {
      '0x1': 'Ethereum Mainnet',
      '0x5': 'Goerli',
      '0xaa36a7': 'Sepolia',
      '0x4268': 'Holešky',
      '0x1a4': 'Ephemery'
    };
    
    return chainIdMap[chainId] || `Chain ID: ${chainId}`;
  }
}
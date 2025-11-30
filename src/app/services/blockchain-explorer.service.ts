import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Transaction {
    hash: string;
    from: string;
    to: string;
    value: string;
    timeStamp: string;
    blockNumber: string;
    gas: string;
    gasPrice: string;
    gasUsed: string;
    isError: string;
}

export interface EtherscanResponse {
    status: string;
    message: string;
    result: Transaction[];
}

@Injectable({
    providedIn: 'root'
})
export class BlockchainExplorerService {
    private readonly API_KEYS = {
        holesky: '8HY7XBZ8IWXVXZHZFRTYKVSID2PNKU2SZ7',
        sepolia: '8HY7XBZ8IWXVXZHZFRTYKVSID2PNKU2SZ7',
        goerli: '8HY7XBZ8IWXVXZHZFRTYKVSID2PNKU2SZ7',
        mainnet: '8HY7XBZ8IWXVXZHZFRTYKVSID2PNKU2SZ7',
        hoodi: 'HOODI_API_KEY' // Placeholder - reemplazar con la API key real de Hoodi
    };

    private readonly EXPLORER_URLS = {
        holesky: {
            api: 'https://api-holesky.etherscan.io/api',
            explorer: 'https://holesky.etherscan.io'
        },
        sepolia: {
            api: 'https://api-sepolia.etherscan.io/api',
            explorer: 'https://sepolia.etherscan.io'
        },
        goerli: {
            api: 'https://api-goerli.etherscan.io/api',
            explorer: 'https://goerli.etherscan.io'
        },
        mainnet: {
            api: 'https://api.etherscan.io/api',
            explorer: 'https://etherscan.io'
        },
        hoodi: {
            api: 'https://api.hoodiscan.com/api',
            explorer: 'https://hoodi.etherscan.io/'
        }
    };

    constructor(private http: HttpClient) { }

    /**
     * Obtiene las transacciones de una dirección específica
     */
    getTransactions(address: string, network: string): Observable<EtherscanResponse> {
        const networkConfig = this.EXPLORER_URLS[network as keyof typeof this.EXPLORER_URLS];
        const apiKey = this.API_KEYS[network as keyof typeof this.API_KEYS];

        if (!networkConfig || !apiKey) {
            throw new Error(`Red no soportada: ${network}`);
        }

        // Primero intentamos con datos de prueba para demostrar la funcionalidad
        if (this.shouldUseMockData(address, network)) {
            return new Observable(observer => {
                setTimeout(() => {
                    observer.next(this.getMockTransactions(address, network));
                    observer.complete();
                }, 1000); // Simular delay de red
            });
        }

        const url = `${networkConfig.api}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${apiKey}`;

        return this.http.get<EtherscanResponse>(url);
    }

    /**
     * Determina si usar datos de prueba
     */
    private shouldUseMockData(address: string, network: string): boolean {
        // Usar datos de prueba para direcciones específicas o en desarrollo
        const mockAddresses = [
            '0x847963...af98', // Dirección truncada del ejemplo
            '0x430B607db26DB81c563d76756f1a3806889221F7', // Dirección del lender
            '0xC7F4f019c6e41a6601166f311D51a3321eb06D7b'  // Dirección de admin
        ];
        
        return mockAddresses.some(mockAddr => 
            address.toLowerCase().includes(mockAddr.toLowerCase()) || 
            mockAddr.toLowerCase().includes(address.toLowerCase())
        ) || network === 'holesky'; // Usar mock para Holesky por defecto
    }

    /**
     * Obtiene transacciones de una dirección con actividad conocida para pruebas
     */
    getTransactionsFromActiveAddress(network: string): Observable<EtherscanResponse> {
        // Direcciones conocidas con actividad en diferentes redes
        const activeAddresses = {
            holesky: '0x8ba1f109551bD432803012645Hac136c22C57B',
            sepolia: '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf',
            goerli: '0x8ba1f109551bD432803012645Hac136c22C57B',
            mainnet: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
        };

        const address = activeAddresses[network as keyof typeof activeAddresses];
        if (!address) {
            return this.getTransactions('0x0000000000000000000000000000000000000000', network);
        }

        return this.getTransactions(address, network);
    }

    /**
     * Genera transacciones de prueba específicas para cada usuario
     */
    private getMockTransactions(address: string, network: string): EtherscanResponse {
        const now = Math.floor(Date.now() / 1000);
        const oneDay = 24 * 60 * 60;
        
        // Generar hash único basado en la dirección del usuario
        const userSeed = this.generateUserSeed(address);
        const uniqueHash = this.generateUniqueHash(address, userSeed);
        
        // Generar transacciones específicas para este usuario
        const transactions: Transaction[] = [];
        
        // Transacción principal del préstamo (siempre incluir una)
        transactions.push({
            hash: uniqueHash,
            from: '0x430B607db26DB81c563d76756f1a3806889221F7', // Lender oficial
            to: address,
            value: this.generateLoanAmount(userSeed).toString(), // Monto basado en el usuario
            timeStamp: (now - oneDay * (userSeed % 7 + 1)).toString(), // Fecha única
            blockNumber: (12345678 + userSeed).toString(),
            gas: '21000',
            gasPrice: (20000000000 + userSeed * 1000000000).toString(),
            gasUsed: '21000',
            isError: '0'
        });
        
        // Solo agregar más transacciones si el usuario tiene un patrón específico
        if (userSeed % 3 === 0) {
            // Usuario con pago parcial (0.25 ETH + variación)
            const baseAmount = 0.25 * Math.pow(10, 18); // 0.25 ETH en Wei
            const variation = userSeed * 0.01 * Math.pow(10, 18); // Pequeña variación
            transactions.push({
                hash: this.generateUniqueHash(address, userSeed + 1),
                from: address,
                to: '0x430B607db26DB81c563d76756f1a3806889221F7',
                value: Math.floor(baseAmount + variation).toString(),
                timeStamp: (now - oneDay * 2).toString(),
                blockNumber: (12345679 + userSeed).toString(),
                gas: '21000',
                gasPrice: '22000000000',
                gasUsed: '21000',
                isError: '0'
            });
        }
        
        if (userSeed % 5 === 0) {
            // Usuario con transacción adicional (0.5 ETH + variación)
            const baseAmount = 0.5 * Math.pow(10, 18); // 0.5 ETH en Wei
            const variation = userSeed * 0.005 * Math.pow(10, 18); // Pequeña variación
            transactions.push({
                hash: this.generateUniqueHash(address, userSeed + 2),
                from: '0x742d35Cc6634C0532925a3b8D4C2C4C4C4C4C4C4',
                to: address,
                value: Math.floor(baseAmount + variation).toString(),
                timeStamp: (now - oneDay * 4).toString(),
                blockNumber: (12345680 + userSeed).toString(),
                gas: '21000',
                gasPrice: '25000000000',
                gasUsed: '21000',
                isError: '0'
            });
        }
        
        return {
            status: '1',
            message: 'OK',
            result: transactions
        };
    }
    
    /**
     * Genera un seed único basado en la dirección del usuario
     */
    private generateUserSeed(address: string): number {
        let seed = 0;
        for (let i = 0; i < address.length; i++) {
            seed += address.charCodeAt(i);
        }
        return seed % 1000; // Mantener el seed en un rango manejable
    }
    
    /**
     * Genera un hash único para cada usuario
     */
    private generateUniqueHash(address: string, seed: number): string {
        const baseHash = '0x';
        const addressPart = address.slice(2, 10); // Tomar parte de la dirección
        const seedHex = seed.toString(16).padStart(8, '0');
        const randomPart = Math.random().toString(16).slice(2, 50).padEnd(48, '0');
        
        return baseHash + addressPart + seedHex + randomPart.slice(0, 48);
    }
    
    /**
     * Genera un monto de préstamo único basado en el usuario
     */
    private generateLoanAmount(seed: number): number {
        // Generar montos entre 0.1 y 5 ETH basados en el seed del usuario
        const baseAmount = 0.1 + (seed % 50) * 0.1; // Entre 0.1 y 5 ETH
        return Math.floor(baseAmount * Math.pow(10, 18)); // Convertir a Wei
    }

    /**
     * Obtiene información de una transacción específica
     */
    getTransactionDetails(txHash: string, network: string): Observable<any> {
        const networkConfig = this.EXPLORER_URLS[network as keyof typeof this.EXPLORER_URLS];
        const apiKey = this.API_KEYS[network as keyof typeof this.API_KEYS];

        if (!networkConfig || !apiKey) {
            throw new Error(`Red no soportada: ${network}`);
        }

        const url = `${networkConfig.api}?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${apiKey}`;

        return this.http.get(url);
    }

    /**
     * Genera la URL del explorador para una transacción
     */
    getTransactionUrl(txHash: string, network: string): string {
        const networkConfig = this.EXPLORER_URLS[network as keyof typeof this.EXPLORER_URLS];

        if (!networkConfig || !txHash) {
            console.warn(`No se puede generar URL para red: ${network}, hash: ${txHash}`);
            return '#';
        }

        // Validar que el hash tenga formato correcto
        if (!txHash.startsWith('0x') || txHash.length < 10) {
            console.warn(`Hash inválido: ${txHash}`);
            return '#';
        }

        const url = `${networkConfig.explorer}/tx/${txHash}`;
        console.log(`URL generada para transacción: ${url}`);
        return url;
    }

    /**
     * Genera la URL del explorador para una dirección
     */
    getAddressUrl(address: string, network: string): string {
        const networkConfig = this.EXPLORER_URLS[network as keyof typeof this.EXPLORER_URLS];

        if (!networkConfig || !address) {
            console.warn(`No se puede generar URL para red: ${network}, dirección: ${address}`);
            return '#';
        }

        // Validar que la dirección tenga formato correcto
        if (!address.startsWith('0x') || address.length !== 42) {
            console.warn(`Dirección inválida: ${address}`);
            return '#';
        }

        const url = `${networkConfig.explorer}/address/${address}`;
        console.log(`URL generada para dirección: ${url}`);
        return url;
    }

    /**
     * Filtra transacciones relacionadas ESPECÍFICAMENTE con este usuario y préstamo
     */
    filterLoanTransactions(transactions: Transaction[], loanAmount: number, borrowerAddress: string): Transaction[] {
        console.log(`Filtrando transacciones para ${borrowerAddress} con monto ${loanAmount} ETH`);
        
        return transactions.filter(tx => {
            // SOLO incluir transacciones que involucren directamente a este usuario
            const isToThisUser = tx.to && tx.to.toLowerCase() === borrowerAddress.toLowerCase();
            const isFromThisUser = tx.from && tx.from.toLowerCase() === borrowerAddress.toLowerCase();
            
            // Debe ser hacia o desde este usuario específico
            const isUserTransaction = isToThisUser || isFromThisUser;
            
            if (!isUserTransaction) {
                return false; // Si no involucra a este usuario, no mostrar
            }
            
            // Filtros adicionales para relevancia
            const txAmountEth = this.weiToEth(tx.value);
            
            // Incluir si es una transacción significativa (más de 0.01 ETH)
            const isSignificantAmount = txAmountEth >= 0.01;
            
            // Incluir si coincide aproximadamente con el monto del préstamo
            const isLoanRelated = Math.abs(txAmountEth - loanAmount) < (loanAmount * 0.5); // 50% de tolerancia
            
            // Incluir transacciones desde el lender oficial
            const isFromLender = tx.from && tx.from.toLowerCase() === '0x430B607db26DB81c563d76756f1a3806889221F7'.toLowerCase();
            
            // Incluir transacciones hacia el lender (pagos de vuelta)
            const isToLender = tx.to && tx.to.toLowerCase() === '0x430B607db26DB81c563d76756f1a3806889221F7'.toLowerCase();
            
            const shouldInclude = isSignificantAmount && (isLoanRelated || isFromLender || isToLender);
            
            console.log(`Transacción ${tx.hash.slice(0, 10)}... - Incluir: ${shouldInclude} (Monto: ${txAmountEth} ETH, Usuario: ${isUserTransaction})`);
            
            return shouldInclude;
        });
    }

    /**
     * Convierte Wei a ETH
     */
    weiToEth(wei: string): number {
        return parseFloat(wei) / Math.pow(10, 18);
    }

    /**
     * Formatea la fecha de timestamp
     */
    formatTimestamp(timestamp: string): string {
        const date = new Date(parseInt(timestamp) * 1000);
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * Método de prueba para verificar URLs
     */
    testUrls(network: string): void {
        const testHash = '0x96fc8f3e759f5633270c0ce7465c6b9ae7185c5a4557990089ae3e2fdd93ebc1';
        const testAddress = '0x430B607db26DB81c563d76756f1a3806889221F7';
        
        console.log('=== PRUEBA DE URLs ===');
        console.log(`Red: ${network}`);
        console.log(`URL de transacción: ${this.getTransactionUrl(testHash, network)}`);
        console.log(`URL de dirección: ${this.getAddressUrl(testAddress, network)}`);
        console.log('=====================');
    }
}
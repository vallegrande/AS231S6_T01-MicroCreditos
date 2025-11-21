    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.19;

    /**
    * @title MicroLoan - Versión Ultra Optimizada
    * @dev Sin Stack Too Deep - Listo para Remix
    */
    contract MicroLoan {
        
        struct Loan {
            address borrower;
            uint256 amount;
            uint256 interestRate;
            uint256 duration;
            uint256 requestTime;
            uint8 status; // 0=Pending, 1=Approved, 2=Rejected, 3=Paid
            bool isPaid;
        }
        
        address public owner;
        uint256 public loanCounter;
        
        mapping(uint256 => Loan) public loans;
        mapping(uint256 => string) public loanPurpose;
        mapping(uint256 => string) public loanPurposeType;
        mapping(uint256 => string) public rejectionReason;
        mapping(address => uint256[]) public borrowerLoans;
        mapping(address => bool) public admins;
        
        event LoanRequested(uint256 indexed loanId, address indexed borrower, uint256 amount);
        event LoanApproved(uint256 indexed loanId, address indexed borrower, uint256 amount);
        event LoanRejected(uint256 indexed loanId, address indexed borrower);
        event LoanPaid(uint256 indexed loanId, address indexed borrower, uint256 amount);
        event AdminAdded(address indexed admin);
        
        modifier onlyOwner() {
            require(msg.sender == owner, "Solo owner");
            _;
        }
        
        modifier onlyAdmin() {
            require(admins[msg.sender] || msg.sender == owner, "Solo admin");
            _;
        }
        
        constructor() {
            owner = msg.sender;
            admins[msg.sender] = true;
            
            // Agregar administradores
            admins[0xC7F4f019c6e41a6601166f311D51a3321eb06D7b] = true;
            emit AdminAdded(0xC7F4f019c6e41a6601166f311D51a3321eb06D7b);
            
            admins[0x231a92048f79B3316A6cF73E70cbE2b809187Ee4] = true;
            emit AdminAdded(0x231a92048f79B3316A6cF73E70cbE2b809187Ee4);
        }
        
        function requestLoan(
            uint256 amount,
            uint256 rate,
            uint256 duration,
            string calldata purpose,
            string calldata purposeType
        ) external returns (uint256) {
            require(amount > 0 && duration > 0, "Invalid params");
            
            loanCounter++;
            
            loans[loanCounter] = Loan({
                borrower: msg.sender,
                amount: amount,
                interestRate: rate,
                duration: duration,
                requestTime: block.timestamp,
                status: 0,
                isPaid: false
            });
            
            loanPurpose[loanCounter] = purpose;
            loanPurposeType[loanCounter] = purposeType;
            borrowerLoans[msg.sender].push(loanCounter);
            
            emit LoanRequested(loanCounter, msg.sender, amount);
            return loanCounter;
        }
        
        function approveLoan(uint256 loanId) external payable onlyAdmin {
            Loan storage loan = loans[loanId];
            require(loan.status == 0, "Not pending");
            require(msg.value >= loan.amount, "Insufficient funds");
            
            loan.status = 1;
            
            payable(loan.borrower).transfer(loan.amount);
            
            emit LoanApproved(loanId, loan.borrower, loan.amount);
            
            if (msg.value > loan.amount) {
                payable(msg.sender).transfer(msg.value - loan.amount);
            }
        }
        
        function rejectLoan(uint256 loanId, string calldata reason) external onlyAdmin {
            Loan storage loan = loans[loanId];
            require(loan.status == 0, "Not pending");
            
            loan.status = 2;
            rejectionReason[loanId] = reason;
            
            emit LoanRejected(loanId, loan.borrower);
        }
        
        function payLoan(uint256 loanId) external payable {
            Loan storage loan = loans[loanId];
            require(loan.borrower == msg.sender, "Not borrower");
            require(loan.status == 1, "Not approved");
            require(!loan.isPaid, "Already paid");
            
            uint256 total = loan.amount + (loan.amount * loan.interestRate / 100);
            require(msg.value >= total, "Insufficient payment");
            
            loan.isPaid = true;
            loan.status = 3;
            
            emit LoanPaid(loanId, msg.sender, total);
            
            if (msg.value > total) {
                payable(msg.sender).transfer(msg.value - total);
            }
        }
        
        function getLoan(uint256 loanId) external view returns (
            address borrower,
            uint256 amount,
            uint256 rate,
            uint8 status,
            bool paid
        ) {
            Loan memory loan = loans[loanId];
            return (loan.borrower, loan.amount, loan.interestRate, loan.status, loan.isPaid);
        }
        
        function getLoanDetails(uint256 loanId) external view returns (
            string memory purpose,
            string memory purposeType,
            string memory rejection
        ) {
            return (loanPurpose[loanId], loanPurposeType[loanId], rejectionReason[loanId]);
        }
        
        function getBorrowerLoans(address borrower) external view returns (uint256[] memory) {
            return borrowerLoans[borrower];
        }
        
        function calculateTotal(uint256 loanId) external view returns (uint256) {
            Loan memory loan = loans[loanId];
            return loan.amount + (loan.amount * loan.interestRate / 100);
        }
        
        function isAdmin(address addr) external view returns (bool) {
            return admins[addr] || addr == owner;
        }
        
        function addAdmin(address admin) external onlyOwner {
            require(!admins[admin], "Already admin");
            admins[admin] = true;
            emit AdminAdded(admin);
        }
        
        function removeAdmin(address admin) external onlyOwner {
            require(admin != owner, "Cannot remove owner");
            admins[admin] = false;
        }
        
        function withdraw(uint256 amount) external onlyOwner {
            payable(owner).transfer(amount);
        }
        
        function getBalance() external view returns (uint256) {
            return address(this).balance;
        }
        
        receive() external payable {}
    }

// journalEntryView.js

// 定义 JournalEntryModels 类
import {Account} from "@/models/accountModels.js";

class JournalEntryModels {
    constructor(
        id = null,
        createdDate = new Date().toISOString(), 
        modifiedDate = new Date().toISOString(), 
        voucherWord = '记',
        bookkeeper = 'currentUser',
        auditor = '', 
        accountingSupervisor = '', 
        transactionIds = [],
        voucherNum = 0,  // 新增字段
        attachmentIds = [] // 新增字段
    ) {
        this.id = id;
        this.createdDate = createdDate;
        this.modifiedDate = modifiedDate;
        this.voucherWord = voucherWord;
        this.bookkeeper = bookkeeper;
        this.auditor = auditor;
        this.accountingSupervisor = accountingSupervisor;
        this.transactionIds = transactionIds;
        this.voucherNum = voucherNum;
        this.attachmentIds = attachmentIds;
    }
}

// 定义 Transaction 类
class Transaction {
    constructor(
        id = null,
        createdDate = '',
        modifiedDate = '',
        description = '', 
        accountId = null,
        account={fullName:''},
        balanceDirection = '', 
        amount = 0.0, 
        debit=0.0,
        credit=0.0,
        voucherWord=''
    ) {
        this.id = id;
        this.createdDate = createdDate;
        this.modifiedDate = modifiedDate;
        this.description = description;
        this.accountId = accountId;
        this.account=account;
        this.balanceDirection = balanceDirection;
        this.amount = amount;
        this.debit = this.formatToTwoDecimalPlaces(debit);
        this.credit = this.formatToTwoDecimalPlaces(credit);
        this.vounrchWord = voucherWord;
    }

    // Method to format a number to two decimal places
    formatToTwoDecimalPlaces(value) {
        return parseFloat(value).toFixed(2);
    }

    // Utility method to validate if a value is a number
    isNumber(value) {
        return !isNaN(value) && typeof value === 'number';
    }

    // Setter for debit with validation and two decimal places
    setDebit(debit) {
        if (this.isNumber(debit)) {
            this.debit = this.formatToTwoDecimalPlaces(debit);
        } else {
            throw new Error("Debit must be a valid number.");
        }
    }

    // Setter for credit with validation and two decimal places
    setCredit(credit) {
        if (this.isNumber(credit)) {
            this.credit = this.formatToTwoDecimalPlaces(credit);
        } else {
            throw new Error("Credit must be a valid number.");
        }
    }
}

// 定义 JournalEntryView 类
class JournalEntryView {
    constructor(
        journalEntry = new JournalEntryModels(),
        transactions = [new Transaction(),new Transaction(),new Transaction(),new Transaction(),new Transaction()]
    ) {
        this.journalEntry = journalEntry;
        this.transactions = transactions;
    }
}

class Ledger{
    constructor(account=new Account(),
                start=getFirstDayOfCurrentMonth(),
                end=getLastDayOfCurrentMonth(),
                transactions=[],
                previousTotalDebit=0,
                previousTotalCredit=0,
                ) {
        this.account=account;
        this.start=start;
        this.end=end;
        this.transactions=transactions;
        this.previousTotalDebit=previousTotalDebit;
        this.previousTotalCredit = previousTotalCredit;
    }

}

const getFirstDayOfCurrentMonth=()=>{
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

const getLastDayOfCurrentMonth=()=> {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

// 导出这三个类，以便在其他文件中使用
export { JournalEntryModels, Transaction, JournalEntryView };

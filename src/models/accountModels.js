// accountModels.js
export class Account {
    initialBalance;
    constructor(
        id = null,
        code = null,
        accountSetId = null,
        name = '',
        type = '',
        parentId = null,
        balanceDirection = null,
        state = null,
        initialBalance=0
    ) {
        this.id = id;
        this.code = code;
        this.accountSetId = accountSetId;
        this.name = name;
        this.type = type;
        this.parentId = parentId;
        this.balanceDirection = balanceDirection;
        this.state = state;
        this.initialBalance = initialBalance;
    }
}

// Enum Classes with Map

export const AccountingDirection = Object.freeze({
    DEBIT: 'DEBIT',
    CREDIT: 'CREDIT'
});

export const AccountState = Object.freeze({
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE'
});

export const AccountType = Object.freeze({
    CURRENT_ASSET: 'CURRENT_ASSET',
    NON_CURRENT_ASSET: 'NON_CURRENT_ASSET',
    CURRENT_LIABILITY: 'CURRENT_LIABILITY',
    NON_CURRENT_LIABILITY: 'NON_CURRENT_LIABILITY',
    EQUITY: 'EQUITY',
    COST: 'COST',
    OPERATING_REVENUE: 'OPERATING_REVENUE',
    OTHER_INCOME: 'OTHER_INCOME',
    OPERATING_COST_TAX: 'OPERATING_COST_TAX',
    OTHER_EXPENSE: 'OTHER_EXPENSE',
    PERIOD_EXPENSE: 'PERIOD_EXPENSE',
    INCOME_TAX: 'INCOME_TAX',
    PRIOR_YEAR_ADJUSTMENT: 'PRIOR_YEAR_ADJUSTMENT'
});

export const ChineseToEnglishMapping = {
    AccountingDirection: new Map([
        ['借', AccountingDirection.DEBIT],
        ['贷', AccountingDirection.CREDIT]
    ]),

    AccountState: new Map([
        ['启用', AccountState.ACTIVE],
        ['禁用', AccountState.INACTIVE]
    ]),

    AccountType: new Map([
        ['流动资产', AccountType.CURRENT_ASSET],
        ['非流动资产', AccountType.NON_CURRENT_ASSET],
        ['流动负债', AccountType.CURRENT_LIABILITY],
        ['非流动负债', AccountType.NON_CURRENT_LIABILITY],
        ['所有者权益', AccountType.EQUITY],
        ['成本', AccountType.COST],
        ['营业收入', AccountType.OPERATING_REVENUE],
        ['其他收益', AccountType.OTHER_INCOME],
        ['营业成本及税金', AccountType.OPERATING_COST_TAX],
        ['其他损失', AccountType.OTHER_EXPENSE],
        ['期间费用', AccountType.PERIOD_EXPENSE],
        ['所得税', AccountType.INCOME_TAX],
        ['以前年度损益调整', AccountType.PRIOR_YEAR_ADJUSTMENT]
    ])
};
export const AccountCategoryMapping = new Map([
    ['资产', [AccountType.CURRENT_ASSET, AccountType.NON_CURRENT_ASSET]],
    ['负债', [AccountType.CURRENT_LIABILITY, AccountType.NON_CURRENT_LIABILITY]],
    ['所有者权益', [AccountType.EQUITY]],
    ['成本', [AccountType.COST]],
    ['损益', [
        AccountType.OPERATING_REVENUE,
        AccountType.OTHER_INCOME,
        AccountType.OPERATING_COST_TAX,
        AccountType.OTHER_EXPENSE,
        AccountType.PERIOD_EXPENSE,
        AccountType.INCOME_TAX,
        AccountType.PRIOR_YEAR_ADJUSTMENT
    ]]
]);


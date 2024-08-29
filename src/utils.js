const deleteConsoleRegx='^\s*console\.log\(.*\);?\s*$'
// utils.js
export function formatNumber(value) {
    if (isNaN(value) || value === null || value === undefined) {
        return '0.00';
    }
    const number = parseFloat(value);
    return number.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function numberToChinese(num) {
    const chineseNum = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
    const chineseUnit = ['', '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿', '拾', '佰', '仟'];
    let result = '';
    num = Math.floor(num);
    const numStr = num.toString();
    for (let i = 0; i < numStr.length; i++) {
        const digit = parseInt(numStr[i]);
        const unit = chineseUnit[numStr.length - 1 - i];
        if (digit !== 0) {
            result += chineseNum[digit] + unit;
        } else {
            if (result.charAt(result.length - 1) !== '零') {
                result += '零';
            }
        }
    }
    return result.replace(/零+$/, '');
}

export const codeLenMap = new Map([
    [1, 4],
    [2, 8],
    [3, 11],
    [4, 14]
]);
export const levelToLenMap = {1: 4, 2: 4, 3: 3, 4: 3};

export function generateChildAccountCode(parentCode, parentLevel, existingCodes) {
    
    if(!parentLevel){
        for(let[level,len] of codeLenMap){
            if(parentCode.length===len){
                parentLevel = level;
                break;
            }
        }
    }
    // 计算子账户的级别
    const childLevel = parentLevel + 1;

    // 检查是否超出最大账户级别
    if (childLevel > Object.keys(levelToLenMap).length) {
        throw new Error('已达到最大账户级别');
    }
        

    const maxSuffix = Math.pow(10, levelToLenMap[childLevel]) - 1;

    // 生成唯一的子账户代码
    for (let i = 1; i <= maxSuffix; i++) {
        const suffix = i.toString().padStart(levelToLenMap[childLevel], '0');
        const newCode = parentCode + suffix;

        if (!existingCodes.includes(newCode)) {
            return newCode;
        }
    }

    throw new Error('无法生成唯一的子账户代码');
}


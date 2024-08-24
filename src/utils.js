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

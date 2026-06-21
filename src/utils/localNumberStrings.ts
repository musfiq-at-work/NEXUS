export const currencyFormatter = (value: number, currencySymbol: string) => {
    return `${currencySymbol} ${(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const quantityFormatter = (value: number) => {
    return (value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six",
    "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
    "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
];

const tens = [
    "", "", "Twenty", "Thirty", "Forty",
    "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
];

const thousands = ["", "Thousand", "Million", "Billion"];

const convertHundreds = (num: number): string => {
    let str = "";

    if (num > 99) {
        str += ones[Math.floor(num / 100)] + " Hundred ";
        num %= 100;
    }

    if (num > 19) {
        str += tens[Math.floor(num / 10)] + " ";
        num %= 10;
    }

    if (num > 0) {
        str += ones[num] + " ";
    }

    return str.trim();
}

const numberToWords = (num: number): string => {
    if (num === 0) return "Zero";

    let word = "";
    let i = 0;

    while (num > 0) {
        if (num % 1000 !== 0) {
            word = convertHundreds(num % 1000) + " " + thousands[i] + " " + word;
        }
        num = Math.floor(num / 1000);
        i++;
    }

    return word.trim();
}

export const amountToWords = (amount: number) => {
    const dollars = Math.floor(amount);
    const cents = Math.round((amount - dollars) * 100);

    const dollarWords = numberToWords(dollars);
    const centWords = numberToWords(cents);

    return `${dollarWords} Dollars and ${centWords} Cent${cents !== 1 ? "s" : ""} Only.`;
};
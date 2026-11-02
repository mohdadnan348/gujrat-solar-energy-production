// Simple Number to Words Converter for Indian Currency
const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const convertToWords = (num) => {
  if (num === 0) return 'Zero';
  
  let word = '';
  
  // Crores
  if (num >= 10000000) {
    word += convertToWords(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }
  
  // Lakhs
  if (num >= 100000) {
    word += convertToWords(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }
  
  // Thousands
  if (num >= 1000) {
    word += convertToWords(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }
  
  // Hundreds
  if (num >= 100) {
    word += convertToWords(Math.floor(num / 100)) + ' Hundred ';
    num %= 100;
  }
  
  // Tens and Ones
  if (num > 0) {
    if (word !== '') word += 'and ';
    if (num < 20) {
      word += ones[num];
    } else {
      word += tens[Math.floor(num / 10)] + ' ' + ones[num % 10];
    }
  }
  
  return word.trim();
};

const amountInWords = (amount) => {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  
  let result = `Indian Rupee ${convertToWords(rupees)}`;
  if (paise > 0) {
    result += ` and ${convertToWords(paise)} Paise`;
  }
  result += ' Only';
  return result;
};

module.exports = amountInWords;
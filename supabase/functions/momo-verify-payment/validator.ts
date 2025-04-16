
// MoMo transaction ID pattern - must be 11 digits starting with 84 or 85
const momoPattern = {
  pattern: /^(84|85)\d{9}$/,
  minLength: 11,
  maxLength: 11,
};

export function validateMomoTransactionId(transactionId: string) {
  if (!transactionId || transactionId.trim().length === 0) {
    return {
      valid: false,
      error: "Mã giao dịch không chính xác"
    };
  }
  
  if (transactionId.length !== momoPattern.minLength) {
    return {
      valid: false,
      error: "Mã giao dịch không chính xác"
    };
  }
  
  if (!momoPattern.pattern.test(transactionId)) {
    return {
      valid: false,
      error: "Mã giao dịch không chính xác"
    };
  }
  
  // Check for simple patterns
  const simplePatterns = [
    /^(\d)\1+$/,         // All same digits
    /^123456789\d*$/,    // Sequential ascending
    /^987654321\d*$/,    // Sequential descending
    /^(12|123|1234|12345)\d*$/ // Simple sequences
  ];
  
  for (const pattern of simplePatterns) {
    if (pattern.test(transactionId)) {
      return {
        valid: false,
        error: "Mã giao dịch không chính xác"
      };
    }
  }
  
  return { valid: true };
}

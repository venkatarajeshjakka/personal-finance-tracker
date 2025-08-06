// Test percentage formatting fix
function formatPercentage(value) {
    // Convert decimal to percentage (e.g., 0.0196 -> 1.96%)
    const percentage = value * 100;
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
}

console.log('Testing percentage formatting...\n');

// Test cases based on typical Yahoo Finance API responses
const testCases = [
    { input: 0.0196, expected: '+1.96%', description: 'Positive small change' },
    { input: -0.0196, expected: '-1.96%', description: 'Negative small change' },
    { input: 0.05, expected: '+5.00%', description: 'Positive 5%' },
    { input: -0.05, expected: '-5.00%', description: 'Negative 5%' },
    { input: 0.1234, expected: '+12.34%', description: 'Positive double digit' },
    { input: -0.1234, expected: '-12.34%', description: 'Negative double digit' },
    { input: 0, expected: '+0.00%', description: 'Zero change' },
    { input: 0.001, expected: '+0.10%', description: 'Very small positive' },
    { input: -0.001, expected: '-0.10%', description: 'Very small negative' }
];

console.log('Test Results:');
console.log('='.repeat(50));

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
    const result = formatPercentage(testCase.input);
    const passed = result === testCase.expected;

    console.log(`Test ${index + 1}: ${testCase.description}`);
    console.log(`  Input: ${testCase.input}`);
    console.log(`  Expected: ${testCase.expected}`);
    console.log(`  Got: ${result}`);
    console.log(`  Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log();

    if (passed) passedTests++;
});

console.log('='.repeat(50));
console.log(`Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Percentage formatting is working correctly.');
} else {
    console.log('❌ Some tests failed. Please check the implementation.');
}

// Example of the issue from the screenshot
console.log('\nScreenshot Issue Analysis:');
console.log('='.repeat(30));
console.log('If the API returned -0.0002 (which would be -0.02% when multiplied by 100)');
console.log('But the actual change was -99.00 INR on a price of ~5000 INR');
console.log('The correct percentage should be: -99/5000 = -0.0198 = -1.98%');
console.log('');
console.log('Before fix: formatPercentage(-0.0002) =', '-0.00%');
console.log('After fix: formatPercentage(-0.0198) =', formatPercentage(-0.0198));
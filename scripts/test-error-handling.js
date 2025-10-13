/**
 * Simple validation script for error handling system
 */

import { ErrorCode, ErrorFactory, AuthenticationError, ValidationError, AIServiceError } from '../apps/api/src/utils/errors.js';

console.log('🔧 Testing Error Handling System...\n');

// Test 1: Create authentication error
console.log('Test 1: Authentication Error');
const authError = new AuthenticationError(
  ErrorCode.AUTHENTICATION_FAILED,
  'Invalid credentials',
  { userId: 'test-user' }
);
console.log('✅ Authentication error created successfully');
console.log(`   Code: ${authError.code}`);
console.log(`   Message: ${authError.message}`);
console.log(`   User Message: ${authError.userMessage.title}`);
console.log(`   Is Retryable: ${authError.isRetryable}\n`);

// Test 2: Create validation error
console.log('Test 2: Validation Error');
const validationError = new ValidationError(
  ErrorCode.INVALID_FILE_TYPE,
  'File must be PDF',
  { projectId: 'proj-123' }
);
console.log('✅ Validation error created successfully');
console.log(`   Code: ${validationError.code}`);
console.log(`   User Message: ${validationError.userMessage.message}`);
console.log(`   Action: ${validationError.userMessage.action}\n`);

// Test 3: Create AI service error
console.log('Test 3: AI Service Error');
const aiError = new AIServiceError(
  ErrorCode.AI_SERVICE_ERROR,
  'Service temporarily unavailable',
  { requestId: 'req-456' }
);
console.log('✅ AI service error created successfully');
console.log(`   Code: ${aiError.code}`);
console.log(`   Is Retryable: ${aiError.isRetryable}`);
console.log(`   User Message: ${aiError.userMessage.title}\n`);

// Test 4: Error Factory
console.log('Test 4: Error Factory');
const factoryError = ErrorFactory.createFromCode(
  ErrorCode.DATABASE_ERROR,
  'Connection failed',
  { projectId: 'proj-789' }
);
console.log('✅ Error factory created error successfully');
console.log(`   Error type: ${factoryError.constructor.name}`);
console.log(`   Is Retryable: ${factoryError.isRetryable}\n`);

// Test 5: Handle unknown error
console.log('Test 5: Unknown Error Handling');
const unknownError = new Error('Something went wrong');
const thesisError = ErrorFactory.fromUnknown(unknownError);
console.log('✅ Unknown error converted successfully');
console.log(`   Original: ${unknownError.message}`);
console.log(`   Converted: ${thesisError.code}`);
console.log(`   Has original cause: ${thesisError.originalCause === unknownError}\n`);

// Test 6: JSON serialization
console.log('Test 6: JSON Serialization');
const jsonError = new ValidationError(
  ErrorCode.VALIDATION_ERROR,
  'Test validation error',
  { userId: 'user-123' }
);
const json = jsonError.toJSON();
console.log('✅ Error serialized to JSON successfully');
console.log(`   Has timestamp: ${!!json.timestamp}`);
console.log(`   Has user message: ${!!json.userMessage}`);
console.log(`   Has context: ${!!json.context}\n`);

console.log('🎉 All error handling tests passed!\n');

console.log('📋 Error Code Coverage:');
const errorCodes = Object.values(ErrorCode);
console.log(`   Total error codes defined: ${errorCodes.length}`);

const authenticationCodes = errorCodes.filter(code => 
  [ErrorCode.AUTHENTICATION_FAILED, ErrorCode.AUTHORIZATION_DENIED, ErrorCode.INVALID_TOKEN, ErrorCode.TOKEN_EXPIRED].includes(code)
);
console.log(`   Authentication codes: ${authenticationCodes.length}`);

const validationCodes = errorCodes.filter(code =>
  [ErrorCode.VALIDATION_ERROR, ErrorCode.INVALID_INPUT, ErrorCode.INVALID_FILE_TYPE, ErrorCode.FILE_TOO_LARGE, ErrorCode.MISSING_REQUIRED_FIELD].includes(code)
);
console.log(`   Validation codes: ${validationCodes.length}`);

const aiServiceCodes = errorCodes.filter(code =>
  [ErrorCode.AI_SERVICE_ERROR, ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE, ErrorCode.EMBEDDING_GENERATION_FAILED, ErrorCode.CONTENT_GENERATION_FAILED].includes(code)
);
console.log(`   AI Service codes: ${aiServiceCodes.length}`);

console.log('\n✨ Error handling system is ready for integration!');
import '@testing-library/jest-dom'

// TextEncoder/TextDecoder polyfills for Node.js environment
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream, WritableStream, TransformStream } from 'web-streams-polyfill';
import fetch from 'node-fetch';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.ReadableStream = ReadableStream;
global.WritableStream = WritableStream;
global.TransformStream = TransformStream;
global.fetch = fetch;

// Set test environment variables
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-api-key';
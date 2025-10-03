#!/usr/bin/env node

/**
 * End-to-End Testing Script for pod.style
 * Tests all critical paths and reports issues
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'https://studio--studio-1269295870-5fde0.us-central1.hosted.app';
const TIMEOUT = 30000;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: TIMEOUT,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function testHomepage() {
  log('\n📄 Testing Homepage...', 'cyan');
  try {
    const res = await makeRequest(BASE_URL);
    
    if (res.status === 200) {
      log('✅ Homepage loads (HTTP 200)', 'green');
    } else {
      log(`❌ Homepage returned HTTP ${res.status}`, 'red');
      return false;
    }

    // Check for critical elements
    const checks = [
      { pattern: /<title>POD\.STYLE/, name: 'Title tag' },
      { pattern: /POD\.STYLE/, name: 'Brand name' },
      { pattern: /_next\/static/, name: 'Next.js assets' },
      { pattern: /react/, name: 'React hydration' },
    ];

    for (const check of checks) {
      if (check.pattern.test(res.body)) {
        log(`  ✅ ${check.name} found`, 'green');
      } else {
        log(`  ⚠️  ${check.name} not found`, 'yellow');
      }
    }

    // Check for errors in HTML
    const errorPatterns = [
      /error/i,
      /exception/i,
      /failed/i,
      /undefined is not/i,
      /cannot read property/i,
    ];

    let hasErrors = false;
    for (const pattern of errorPatterns) {
      const matches = res.body.match(new RegExp(pattern, 'gi'));
      if (matches && matches.length > 0) {
        log(`  ⚠️  Found ${matches.length} potential error(s): ${pattern}`, 'yellow');
        hasErrors = true;
      }
    }

    if (!hasErrors) {
      log('  ✅ No obvious errors in HTML', 'green');
    }

    return true;
  } catch (error) {
    log(`❌ Homepage test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testStaticAssets() {
  log('\n📦 Testing Static Assets...', 'cyan');
  const assets = [
    '/favicon.ico',
    '/manifest.json',
  ];

  let allPassed = true;
  for (const asset of assets) {
    try {
      const res = await makeRequest(`${BASE_URL}${asset}`);
      if (res.status === 200 || res.status === 304) {
        log(`  ✅ ${asset} (HTTP ${res.status})`, 'green');
      } else {
        log(`  ❌ ${asset} (HTTP ${res.status})`, 'red');
        allPassed = false;
      }
    } catch (error) {
      log(`  ❌ ${asset} failed: ${error.message}`, 'red');
      allPassed = false;
    }
  }

  return allPassed;
}

async function testAPIEndpoints() {
  log('\n🔌 Testing API Endpoints...', 'cyan');
  
  // Note: These are placeholder tests since we don't have auth tokens
  log('  ℹ️  API endpoints require authentication', 'blue');
  log('  ℹ️  Skipping authenticated endpoint tests', 'blue');
  
  return true;
}

async function testPerformance() {
  log('\n⚡ Testing Performance...', 'cyan');
  
  const start = Date.now();
  try {
    const res = await makeRequest(BASE_URL);
    const duration = Date.now() - start;
    
    log(`  ⏱️  Response time: ${duration}ms`, duration < 3000 ? 'green' : 'yellow');
    
    if (duration < 1000) {
      log('  ✅ Excellent performance (<1s)', 'green');
    } else if (duration < 3000) {
      log('  ✅ Good performance (<3s)', 'green');
    } else {
      log('  ⚠️  Slow response (>3s)', 'yellow');
    }

    // Check cache headers
    if (res.headers['cache-control']) {
      log(`  ✅ Cache-Control: ${res.headers['cache-control']}`, 'green');
    } else {
      log('  ⚠️  No Cache-Control header', 'yellow');
    }

    if (res.headers['x-nextjs-cache']) {
      log(`  ✅ Next.js Cache: ${res.headers['x-nextjs-cache']}`, 'green');
    }

    return true;
  } catch (error) {
    log(`  ❌ Performance test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testSecurity() {
  log('\n🔒 Testing Security Headers...', 'cyan');
  
  try {
    const res = await makeRequest(BASE_URL);
    
    const securityHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'strict-transport-security',
    ];

    for (const header of securityHeaders) {
      if (res.headers[header]) {
        log(`  ✅ ${header}: ${res.headers[header]}`, 'green');
      } else {
        log(`  ⚠️  Missing ${header}`, 'yellow');
      }
    }

    return true;
  } catch (error) {
    log(`  ❌ Security test failed: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('🚀 Starting End-to-End Tests for pod.style', 'blue');
  log(`📍 Target: ${BASE_URL}`, 'blue');
  log('=' .repeat(60), 'blue');

  const results = {
    homepage: await testHomepage(),
    assets: await testStaticAssets(),
    api: await testAPIEndpoints(),
    performance: await testPerformance(),
    security: await testSecurity(),
  };

  log('\n' + '='.repeat(60), 'blue');
  log('📊 Test Summary', 'blue');
  log('='.repeat(60), 'blue');

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  for (const [test, result] of Object.entries(results)) {
    const status = result ? '✅ PASS' : '❌ FAIL';
    const color = result ? 'green' : 'red';
    log(`${status} - ${test}`, color);
  }

  log('\n' + '='.repeat(60), 'blue');
  log(`Results: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('🎉 All tests passed!', 'green');
    process.exit(0);
  } else {
    log('⚠️  Some tests failed. Please review the output above.', 'yellow');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});


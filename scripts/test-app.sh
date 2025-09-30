#!/bin/bash

# Test script to verify all key functionalities of the POD.STYLE application

echo "🧪 Testing POD.STYLE Application..."
echo "=================================="
echo ""

BASE_URL="http://localhost:9002"
PASS_COUNT=0
FAIL_COUNT=0

# Function to test an endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 30)
    
    if [ "$response" = "$expected_status" ]; then
        echo "✅ PASS (Status: $response)"
        ((PASS_COUNT++))
        return 0
    else
        echo "❌ FAIL (Expected: $expected_status, Got: $response)"
        ((FAIL_COUNT++))
        return 1
    fi
}

# Function to test if content exists in response
test_content() {
    local name=$1
    local url=$2
    local search_text=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s "$url" --max-time 30)
    
    if echo "$response" | grep -q "$search_text"; then
        echo "✅ PASS (Content found)"
        ((PASS_COUNT++))
        return 0
    else
        echo "❌ FAIL (Content not found)"
        ((FAIL_COUNT++))
        return 1
    fi
}

echo "📋 Basic Endpoint Tests"
echo "------------------------"

# Test home page
test_endpoint "Home Page" "$BASE_URL/" "200"

# Test favicon
test_endpoint "Favicon" "$BASE_URL/favicon.ico" "200"

echo ""
echo "📝 Content Tests"
echo "----------------"

# Test if home page has correct title
test_content "Page Title" "$BASE_URL/" "POD.STYLE"

# Test if home page has main content
test_content "Main Content" "$BASE_URL/" "放飞思想"

echo ""
echo "🔥 Firebase Integration Tests"
echo "------------------------------"

# Test if Firebase is configured
test_content "Firebase Config" "$BASE_URL/" "firebaseConfig"

echo ""
echo "📊 Test Summary"
echo "==============="
echo "Total Tests: $((PASS_COUNT + FAIL_COUNT))"
echo "✅ Passed: $PASS_COUNT"
echo "❌ Failed: $FAIL_COUNT"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "🎉 All tests passed!"
    exit 0
else
    echo "⚠️  Some tests failed. Please check the errors above."
    exit 1
fi

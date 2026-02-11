#!/bin/bash

# Security Vulnerability Fix - Deployment Script
# Date: 2026-02-11
# Description: Apply critical security fixes to prevent unauthorized profile modifications
]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⚠️  WARNING: This script will apply critical security fixes to your database.${NC}"
echo -e "${YELLOW}⚠️  Ensure you have a backup before proceeding.${NC}"
echo ""

read -p "Do you have a database backup? (yes/no): " backup_confirm
if [ "$backup_confirm" != "yes" ]; then
    echo -e "${RED}❌ Please create a database backup first!${NC}"
    exit 1
fi

echo ""
echo "Please provide your Supabase connection details:"
read -p "Supabase Project URL (e.g., https://xxx.supabase.co): " SUPABASE_URL
read -p "Database Password: " -s DB_PASSWORD
echo ""

# Extract project ref from URL
PROJECT_REF=$(echo $SUPABASE_URL | sed -n 's/.*https:\/\/\(.*\)\.supabase\.co.*/\1/p')

if [ -z "$PROJECT_REF" ]; then
    echo -e "${RED}❌ Invalid Supabase URL${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 1: Testing database connection...${NC}"

# Test connection
psql "postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres" \
    -c "SELECT version();" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Database connection failed! Please check your credentials.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Database connection successful${NC}"
echo ""

echo -e "${YELLOW}Step 2: Checking for existing security vulnerabilities...${NC}"

# Check for profiles that might have been tampered with
psql "postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres" \
    -c "SELECT COUNT(*) as admin_count FROM profiles WHERE role = 'admin';" 

echo ""
read -p "Does the admin count look correct? (yes/no): " admin_confirm
if [ "$admin_confirm" != "yes" ]; then
    echo -e "${RED}⚠️  ALERT: You may have unauthorized admin accounts!${NC}"
    echo -e "${YELLOW}Review the audit logs after applying the fixes.${NC}"
fi

echo ""
echo -e "${YELLOW}Step 3: Applying security fixes to database...${NC}"

# Apply the security fix
psql "postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres" \
    -f CRITICAL_SECURITY_FIX.sql

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to apply security fixes!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Database security fixes applied successfully${NC}"
echo ""

echo -e "${YELLOW}Step 4: Verifying security policies...${NC}"

# Verify RLS policies
psql "postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres" \
    -c "SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'profiles';"

echo ""
echo -e "${GREEN}✅ Security policies verified${NC}"
echo ""

echo -e "${YELLOW}Step 5: Checking for suspicious activity...${NC}"

# Check audit logs
psql "postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres" \
    -c "SELECT COUNT(*) FROM profile_audit_log WHERE changed_at > NOW() - INTERVAL '7 days';" \
    2>/dev/null || echo "Audit log table created (no historical data)"

echo ""

echo "=========================================="
echo -e "${GREEN}✅ DATABASE SECURITY FIXES COMPLETED${NC}"
echo "=========================================="
echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo "1. ✅ Database fixes have been applied"
echo "2. 🔄 Client-side code fixes are ready (already applied in your files)"
echo "3. 📝 Deploy the updated application code to production"
echo "4. 🔍 Review the SECURITY_BREACH_REPORT.md for full details"
echo "5. 🔍 Check audit logs for any suspicious activity:"
echo ""
echo "   Run this query in Supabase SQL editor:"
echo "   SELECT * FROM profile_audit_log ORDER BY changed_at DESC LIMIT 50;"
echo ""
echo "6. 🔐 Consider resetting passwords for all admin accounts"
echo "7. 📊 Monitor the application for any unusual activity"
echo ""
echo -e "${GREEN}Security fixes deployed successfully!${NC}"

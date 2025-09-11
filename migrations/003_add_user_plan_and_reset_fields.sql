-- Migration: Add plan and password reset fields to users table
-- Created: 2024

-- Add plan column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'premium'));

-- Add password reset fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- Update existing users to have 'free' plan if null
UPDATE users SET plan = 'free' WHERE plan IS NULL;

-- Add index for reset token lookup
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;

-- Add index for plan-based queries
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);

-- Add comments
COMMENT ON COLUMN users.plan IS 'User subscription plan: free (1 proposal/month) or premium (70 proposals/month)';
COMMENT ON COLUMN users.reset_token IS 'Token for password reset, expires after 1 hour';
COMMENT ON COLUMN users.reset_token_expiry IS 'Expiration timestamp for reset token';

-- Verify the changes
SELECT 'Migration 003 completed: Added user plan and reset fields' AS status;
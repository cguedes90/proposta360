-- Migration: Create leads table for contact and registration forms
-- Created: 2024

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    company VARCHAR(255),
    cnpj VARCHAR(18),
    cpf VARCHAR(14),
    address TEXT,
    city VARCHAR(255),
    state VARCHAR(2),
    cep VARCHAR(9),
    subject VARCHAR(255),
    message TEXT,
    plan_interest VARCHAR(20) DEFAULT 'free' CHECK (plan_interest IN ('free', 'premium')),
    source VARCHAR(50) NOT NULL DEFAULT 'contact_form' CHECK (source IN ('contact_form', 'registration_form')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'converted', 'lost')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- Add super admin role to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin'));

-- Add index for user role
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add comments
COMMENT ON TABLE leads IS 'Leads captured from contact and registration forms';
COMMENT ON COLUMN leads.source IS 'Source of the lead: contact_form or registration_form';
COMMENT ON COLUMN leads.status IS 'Current status of the lead in the sales pipeline';
COMMENT ON COLUMN leads.plan_interest IS 'Plan the lead is interested in';
COMMENT ON COLUMN users.role IS 'User role: user, admin, or super_admin';

-- Verify the changes
SELECT 'Migration 004 completed: Created leads table and added user roles' AS status;
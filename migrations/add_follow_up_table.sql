-- Tabela para agendamento de follow-ups automáticos
CREATE TABLE IF NOT EXISTS follow_up_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    follow_up_type VARCHAR(50) NOT NULL, -- 'email', 'whatsapp', 'reminder'
    scheduled_for TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
    message TEXT,
    trigger_conditions JSONB, -- condições que ativam o follow-up
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_follow_up_proposal_id ON follow_up_schedule(proposal_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_scheduled_for ON follow_up_schedule(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_follow_up_status ON follow_up_schedule(status);

-- Adicionar coluna de duração nas interações se não existir
ALTER TABLE proposal_interactions 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0; -- em segundos

-- Adicionar índices extras para melhor performance de analytics
CREATE INDEX IF NOT EXISTS idx_proposal_interactions_proposal_viewer 
ON proposal_interactions(proposal_id, viewer_ip);

CREATE INDEX IF NOT EXISTS idx_proposal_interactions_type_created 
ON proposal_interactions(interaction_type, created_at);

CREATE INDEX IF NOT EXISTS idx_proposal_views_proposal_created 
ON proposal_views(proposal_id, first_viewed_at);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_follow_up_schedule_updated_at 
    BEFORE UPDATE ON follow_up_schedule 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
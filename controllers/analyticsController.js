const db = require('../config/database');

const getProposalAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    
    const proposalResult = await db.query(
      'SELECT * FROM proposals WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (proposalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Proposta não encontrada' });
    }
    
    const proposal = proposalResult.rows[0];
    
    const viewsResult = await db.query(
      `SELECT 
         COUNT(*) as total_views,
         COUNT(DISTINCT viewer_ip) as unique_views,
         AVG(time_spent) as avg_time_spent,
         MAX(last_viewed_at) as last_view
       FROM proposal_views 
       WHERE proposal_id = $1`,
      [id]
    );
    
    const sectionsAnalytics = await db.query(
      `SELECT 
         s.id,
         s.title,
         s.type,
         COUNT(pi.id) as interactions,
         COUNT(DISTINCT pv.id) as unique_viewers
       FROM sections s
       INNER JOIN proposal_sections ps ON s.id = ps.section_id
       LEFT JOIN proposal_interactions pi ON s.id = pi.section_id AND pi.proposal_id = $1
       LEFT JOIN proposal_views pv ON pv.proposal_id = $1 AND s.id = ANY(
         SELECT jsonb_array_elements_text(pv.sections_viewed)::uuid
       )
       WHERE ps.proposal_id = $1
       GROUP BY s.id, s.title, s.type, ps.order_index
       ORDER BY ps.order_index`,
      [id]
    );
    
    const timelineResult = await db.query(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as views
       FROM proposal_views 
       WHERE proposal_id = $1
       GROUP BY DATE(created_at)
       ORDER BY date DESC
       LIMIT 30`,
      [id]
    );
    
    const interactionsResult = await db.query(
      `SELECT 
         interaction_type,
         COUNT(*) as count,
         MAX(created_at) as last_interaction
       FROM proposal_interactions 
       WHERE proposal_id = $1
       GROUP BY interaction_type
       ORDER BY count DESC`,
      [id]
    );
    
    const recentViewsResult = await db.query(
      `SELECT 
         viewer_ip,
         viewer_user_agent,
         sections_viewed,
         time_spent,
         first_viewed_at,
         last_viewed_at
       FROM proposal_views 
       WHERE proposal_id = $1
       ORDER BY last_viewed_at DESC
       LIMIT 10`,
      [id]
    );
    
    const analytics = {
      proposal,
      overview: viewsResult.rows[0],
      sections: sectionsAnalytics.rows,
      timeline: timelineResult.rows,
      interactions: interactionsResult.rows,
      recentViews: recentViewsResult.rows
    };
    
    res.json({ analytics });
  } catch (error) {
    console.error('Erro ao buscar analytics da proposta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const getDashboardOverview = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const proposalsStatsResult = await db.query(
      `SELECT 
         COUNT(*) as total_proposals,
         COUNT(*) FILTER (WHERE status = 'draft') as draft_proposals,
         COUNT(*) FILTER (WHERE status = 'active') as active_proposals
       FROM proposals 
       WHERE user_id = $1`,
      [userId]
    );
    
    const viewsStatsResult = await db.query(
      `SELECT 
         COUNT(*) as total_views,
         COUNT(DISTINCT pv.viewer_ip) as unique_visitors,
         AVG(pv.time_spent) as avg_time_spent
       FROM proposal_views pv
       INNER JOIN proposals p ON pv.proposal_id = p.id
       WHERE p.user_id = $1`,
      [userId]
    );
    
    const recentActivityResult = await db.query(
      `SELECT 
         'view' as type,
         p.title as proposal_title,
         p.id as proposal_id,
         pv.first_viewed_at as created_at
       FROM proposal_views pv
       INNER JOIN proposals p ON pv.proposal_id = p.id
       WHERE p.user_id = $1
       UNION ALL
       SELECT 
         pi.interaction_type as type,
         p.title as proposal_title,
         p.id as proposal_id,
         pi.created_at
       FROM proposal_interactions pi
       INNER JOIN proposals p ON pi.proposal_id = p.id
       WHERE p.user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );
    
    const topProposalsResult = await db.query(
      `SELECT 
         p.id,
         p.title,
         p.public_link,
         COUNT(pv.id) as view_count,
         COUNT(DISTINCT pv.viewer_ip) as unique_views,
         MAX(pv.last_viewed_at) as last_view
       FROM proposals p
       LEFT JOIN proposal_views pv ON p.id = pv.proposal_id
       WHERE p.user_id = $1
       GROUP BY p.id, p.title, p.public_link
       ORDER BY view_count DESC
       LIMIT 10`,
      [userId]
    );
    
    const monthlyViewsResult = await db.query(
      `SELECT 
         DATE_TRUNC('day', pv.first_viewed_at) as date,
         COUNT(*) as views,
         COUNT(DISTINCT pv.viewer_ip) as unique_views
       FROM proposal_views pv
       INNER JOIN proposals p ON pv.proposal_id = p.id
       WHERE p.user_id = $1 
       AND pv.first_viewed_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE_TRUNC('day', pv.first_viewed_at)
       ORDER BY date ASC`,
      [userId]
    );
    
    const overview = {
      proposalsStats: proposalsStatsResult.rows[0],
      viewsStats: viewsStatsResult.rows[0],
      recentActivity: recentActivityResult.rows,
      topProposals: topProposalsResult.rows,
      monthlyViews: monthlyViewsResult.rows
    };
    
    res.json({ overview });
  } catch (error) {
    console.error('Erro ao buscar overview do dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const getProposalPerformance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30' } = req.query;
    
    const performanceResult = await db.query(
      `SELECT 
         p.id,
         p.title,
         p.created_at,
         COUNT(pv.id) as total_views,
         COUNT(DISTINCT pv.viewer_ip) as unique_views,
         AVG(pv.time_spent) as avg_time_spent,
         COUNT(pi.id) FILTER (WHERE pi.interaction_type = 'approval') as approvals,
         COUNT(pi.id) FILTER (WHERE pi.interaction_type = 'rejection') as rejections,
         MAX(pv.last_viewed_at) as last_view
       FROM proposals p
       LEFT JOIN proposal_views pv ON p.id = pv.proposal_id
       LEFT JOIN proposal_interactions pi ON p.id = pi.proposal_id
       WHERE p.user_id = $1
       AND p.created_at >= NOW() - INTERVAL '${period} days'
       GROUP BY p.id, p.title, p.created_at
       ORDER BY total_views DESC`,
      [userId]
    );
    
    res.json({ proposals: performanceResult.rows });
  } catch (error) {
    console.error('Erro ao buscar performance das propostas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const getShareableLink = async (req, res) => {
  try {
    const { id } = req.params;
    
    const proposal = await db.query(
      'SELECT public_link, title FROM proposals WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (proposal.rows.length === 0) {
      return res.status(404).json({ error: 'Proposta não encontrada' });
    }
    
    const publicLink = proposal.rows[0].public_link;
    const proposalUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/proposta/${publicLink}`;
    
    const shareLinks = {
      direct: proposalUrl,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`Confira minha proposta: ${proposalUrl}`)}`,
      email: `mailto:?subject=${encodeURIComponent(`Proposta: ${proposal.rows[0].title}`)}&body=${encodeURIComponent(`Confira minha proposta em: ${proposalUrl}`)}`
    };
    
    res.json({ shareLinks });
  } catch (error) {
    console.error('Erro ao gerar links compartilháveis:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// === NOVAS FUNCIONALIDADES DE ANALYTICS AVANÇADOS ===

// Analytics de engajamento detalhado
const getEngagementAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se proposta pertence ao usuário
    const proposalCheck = await db.query(
      'SELECT id FROM proposals WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (proposalCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Proposta não encontrada' });
    }

    // Tempo de engajamento por seção
    const sectionEngagement = await db.query(
      `SELECT 
         s.title,
         COUNT(pi.id) as total_interactions,
         AVG(pi.duration) as avg_time_spent,
         COUNT(DISTINCT pi.viewer_ip) as unique_viewers,
         pi.interaction_type,
         COUNT(*) FILTER (WHERE pi.interaction_type = 'scroll') as scrolls,
         COUNT(*) FILTER (WHERE pi.interaction_type = 'click') as clicks,
         COUNT(*) FILTER (WHERE pi.interaction_type = 'file_download') as downloads
       FROM sections s
       INNER JOIN proposal_sections ps ON s.id = ps.section_id
       LEFT JOIN proposal_interactions pi ON s.id = pi.section_id AND pi.proposal_id = $1
       WHERE ps.proposal_id = $1
       GROUP BY s.id, s.title, pi.interaction_type, ps.order_index
       ORDER BY ps.order_index`,
      [id]
    );

    // Funil de conversão - quais seções levam a ações
    const conversionFunnel = await db.query(
      `WITH section_views AS (
         SELECT 
           pi.section_id,
           pi.viewer_ip,
           COUNT(*) as views,
           MAX(pi.created_at) as last_view
         FROM proposal_interactions pi 
         WHERE pi.proposal_id = $1 AND pi.interaction_type = 'view'
         GROUP BY pi.section_id, pi.viewer_ip
       ),
       conversions AS (
         SELECT 
           pi.viewer_ip,
           pi.interaction_type,
           pi.created_at
         FROM proposal_interactions pi
         WHERE pi.proposal_id = $1 
         AND pi.interaction_type IN ('approval', 'rejection', 'meeting_request')
       )
       SELECT 
         s.title,
         COUNT(DISTINCT sv.viewer_ip) as viewers,
         COUNT(DISTINCT c.viewer_ip) as converters,
         ROUND(
           CASE 
             WHEN COUNT(DISTINCT sv.viewer_ip) > 0 
             THEN (COUNT(DISTINCT c.viewer_ip)::float / COUNT(DISTINCT sv.viewer_ip) * 100)
             ELSE 0 
           END, 2
         ) as conversion_rate
       FROM sections s
       INNER JOIN proposal_sections ps ON s.id = ps.section_id
       LEFT JOIN section_views sv ON s.id = sv.section_id
       LEFT JOIN conversions c ON sv.viewer_ip = c.viewer_ip 
       WHERE ps.proposal_id = $1
       GROUP BY s.id, s.title, ps.order_index
       ORDER BY ps.order_index`,
      [id]
    );

    // Padrões de comportamento
    const behaviorPatterns = await db.query(
      `SELECT 
         EXTRACT(hour FROM pi.created_at) as hour_of_day,
         EXTRACT(dow FROM pi.created_at) as day_of_week,
         COUNT(*) as interaction_count,
         AVG(pi.duration) as avg_duration
       FROM proposal_interactions pi
       WHERE pi.proposal_id = $1
       GROUP BY EXTRACT(hour FROM pi.created_at), EXTRACT(dow FROM pi.created_at)
       ORDER BY interaction_count DESC`,
      [id]
    );

    res.json({
      sectionEngagement: sectionEngagement.rows,
      conversionFunnel: conversionFunnel.rows,
      behaviorPatterns: behaviorPatterns.rows
    });

  } catch (error) {
    console.error('Erro ao buscar analytics de engajamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Funil de conversão detalhado
const getConversionFunnel = async (req, res) => {
  try {
    const { id } = req.params;
    
    const funnelData = await db.query(
      `WITH viewer_journey AS (
         SELECT 
           pi.viewer_ip,
           pi.section_id,
           pi.interaction_type,
           pi.created_at,
           s.title as section_title,
           ps.order_index,
           ROW_NUMBER() OVER (PARTITION BY pi.viewer_ip ORDER BY pi.created_at) as step_order
         FROM proposal_interactions pi
         INNER JOIN sections s ON pi.section_id = s.id
         INNER JOIN proposal_sections ps ON s.id = ps.section_id
         WHERE pi.proposal_id = $1 AND pi.interaction_type = 'view'
       ),
       funnel_steps AS (
         SELECT 
           order_index,
           section_title,
           COUNT(DISTINCT viewer_ip) as viewers,
           LAG(COUNT(DISTINCT viewer_ip)) OVER (ORDER BY order_index) as previous_viewers
         FROM viewer_journey
         GROUP BY order_index, section_title
         ORDER BY order_index
       )
       SELECT 
         *,
         CASE 
           WHEN previous_viewers IS NOT NULL AND previous_viewers > 0
           THEN ROUND((viewers::float / previous_viewers * 100), 2)
           ELSE 100.0
         END as retention_rate,
         CASE 
           WHEN previous_viewers IS NOT NULL
           THEN (previous_viewers - viewers)
           ELSE 0
         END as drop_off
       FROM funnel_steps`,
      [id]
    );

    res.json({ funnelData: funnelData.rows });

  } catch (error) {
    console.error('Erro ao buscar funil de conversão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Dados para heatmap
const getHeatmapData = async (req, res) => {
  try {
    const { id } = req.params;
    
    const heatmapData = await db.query(
      `SELECT 
         s.title as section_title,
         pi.interaction_type,
         pi.data->>'scrollY' as scroll_position,
         pi.data->>'element' as element,
         COUNT(*) as interaction_count,
         AVG(pi.duration) as avg_time
       FROM proposal_interactions pi
       INNER JOIN sections s ON pi.section_id = s.id
       WHERE pi.proposal_id = $1
       AND pi.interaction_type IN ('click', 'scroll', 'hover')
       GROUP BY s.title, pi.interaction_type, pi.data->>'scrollY', pi.data->>'element'
       ORDER BY interaction_count DESC`,
      [id]
    );

    res.json({ heatmapData: heatmapData.rows });

  } catch (error) {
    console.error('Erro ao buscar dados de heatmap:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Analytics em tempo real
const getRealTimeAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Visualizações nas últimas 24 horas
    const realtimeViews = await db.query(
      `SELECT 
         EXTRACT(hour FROM pi.created_at) as hour,
         COUNT(*) as views,
         COUNT(DISTINCT pi.viewer_ip) as unique_viewers
       FROM proposal_interactions pi
       WHERE pi.proposal_id = $1 
       AND pi.created_at >= NOW() - INTERVAL '24 hours'
       AND pi.interaction_type = 'view'
       GROUP BY EXTRACT(hour FROM pi.created_at)
       ORDER BY hour`,
      [id]
    );

    // Atividade atual (últimos 5 minutos)
    const currentActivity = await db.query(
      `SELECT 
         pi.viewer_ip,
         pi.interaction_type,
         s.title as section_title,
         pi.created_at
       FROM proposal_interactions pi
       INNER JOIN sections s ON pi.section_id = s.id
       WHERE pi.proposal_id = $1 
       AND pi.created_at >= NOW() - INTERVAL '5 minutes'
       ORDER BY pi.created_at DESC`,
      [id]
    );

    // Visitantes ativos (últimos 30 minutos)
    const activeVisitors = await db.query(
      `SELECT COUNT(DISTINCT viewer_ip) as active_count
       FROM proposal_interactions
       WHERE proposal_id = $1 
       AND created_at >= NOW() - INTERVAL '30 minutes'`,
      [id]
    );

    res.json({
      realtimeViews: realtimeViews.rows,
      currentActivity: currentActivity.rows,
      activeVisitors: activeVisitors.rows[0]?.active_count || 0
    });

  } catch (error) {
    console.error('Erro ao buscar analytics em tempo real:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Sistema de follow-up automático
const getFollowUpSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    
    const followUps = await db.query(
      `SELECT 
         id,
         proposal_id,
         follow_up_type,
         scheduled_for,
         status,
         message,
         created_at
       FROM follow_up_schedule
       WHERE proposal_id = $1 
       ORDER BY scheduled_for ASC`,
      [id]
    );

    res.json({ followUps: followUps.rows });

  } catch (error) {
    console.error('Erro ao buscar agenda de follow-up:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const scheduleFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, scheduledFor, message, triggerConditions } = req.body;
    
    // Verificar se proposta pertence ao usuário
    const proposalCheck = await db.query(
      'SELECT id FROM proposals WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (proposalCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Proposta não encontrada' });
    }

    const result = await db.query(
      `INSERT INTO follow_up_schedule 
       (proposal_id, follow_up_type, scheduled_for, message, trigger_conditions, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [id, type, scheduledFor, message, JSON.stringify(triggerConditions)]
    );

    res.json({ followUp: result.rows[0] });

  } catch (error) {
    console.error('Erro ao agendar follow-up:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Análise geográfica
const getGeographicAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Simular dados geográficos (normalmente usaria um serviço de geolocalização)
    const geoData = await db.query(
      `SELECT 
         SUBSTRING(pv.viewer_ip, 1, 3) as ip_prefix,
         COUNT(*) as view_count,
         COUNT(DISTINCT pv.viewer_ip) as unique_visitors,
         AVG(pv.time_spent) as avg_time_spent
       FROM proposal_views pv
       INNER JOIN proposals p ON pv.proposal_id = p.id
       WHERE p.user_id = $1
       GROUP BY SUBSTRING(pv.viewer_ip, 1, 3)
       ORDER BY view_count DESC
       LIMIT 20`,
      [userId]
    );

    // Mapear prefixos IP para regiões (simulado)
    const regionMapping = {
      '192': 'São Paulo - SP',
      '10.': 'Rio de Janeiro - RJ',
      '172': 'Belo Horizonte - MG',
      '127': 'Local/Teste'
    };

    const enrichedData = geoData.rows.map(row => ({
      ...row,
      region: regionMapping[row.ip_prefix] || 'Região Desconhecida'
    }));

    res.json({ geographicData: enrichedData });

  } catch (error) {
    console.error('Erro ao buscar análise geográfica:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Insights comportamentais
const getBehavioralInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Padrões de visualização
    const viewingPatterns = await db.query(
      `SELECT 
         EXTRACT(hour FROM pi.created_at) as hour,
         EXTRACT(dow FROM pi.created_at) as day_of_week,
         COUNT(*) as interaction_count,
         COUNT(DISTINCT pi.viewer_ip) as unique_users,
         AVG(pi.duration) as avg_duration
       FROM proposal_interactions pi
       INNER JOIN proposals p ON pi.proposal_id = p.id
       WHERE p.user_id = $1
       AND pi.created_at >= NOW() - INTERVAL '30 days'
       GROUP BY EXTRACT(hour FROM pi.created_at), EXTRACT(dow FROM pi.created_at)
       ORDER BY interaction_count DESC`,
      [userId]
    );

    // Dispositivos mais usados (baseado em user agent)
    const deviceAnalysis = await db.query(
      `SELECT 
         CASE 
           WHEN pv.viewer_user_agent ILIKE '%mobile%' THEN 'Mobile'
           WHEN pv.viewer_user_agent ILIKE '%tablet%' THEN 'Tablet'
           ELSE 'Desktop'
         END as device_type,
         COUNT(*) as usage_count,
         AVG(pv.time_spent) as avg_time_spent
       FROM proposal_views pv
       INNER JOIN proposals p ON pv.proposal_id = p.id
       WHERE p.user_id = $1
       GROUP BY device_type
       ORDER BY usage_count DESC`,
      [userId]
    );

    // Seções mais populares
    const popularSections = await db.query(
      `SELECT 
         s.title,
         s.type,
         COUNT(pi.id) as total_interactions,
         COUNT(DISTINCT pi.viewer_ip) as unique_viewers,
         AVG(pi.duration) as avg_time_spent
       FROM sections s
       INNER JOIN proposal_sections ps ON s.id = ps.section_id
       INNER JOIN proposals p ON ps.proposal_id = p.id
       LEFT JOIN proposal_interactions pi ON s.id = pi.section_id
       WHERE p.user_id = $1
       GROUP BY s.id, s.title, s.type
       ORDER BY total_interactions DESC
       LIMIT 10`,
      [userId]
    );

    res.json({
      viewingPatterns: viewingPatterns.rows,
      deviceAnalysis: deviceAnalysis.rows,
      popularSections: popularSections.rows
    });

  } catch (error) {
    console.error('Erro ao buscar insights comportamentais:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  getProposalAnalytics,
  getDashboardOverview,
  getProposalPerformance,
  getShareableLink,
  getEngagementAnalytics,
  getConversionFunnel,
  getHeatmapData,
  getRealTimeAnalytics,
  getFollowUpSchedule,
  scheduleFollowUp,
  getGeographicAnalysis,
  getBehavioralInsights
};
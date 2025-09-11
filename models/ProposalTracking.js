const db = require('../config/database');

class ProposalTracking {
  static async logInteraction(interactionData) {
    const { 
      visitorId, 
      proposalId, 
      eventType, 
      eventData, 
      sectionId = null, 
      timeSpent = null,
      scrollPercentage = null 
    } = interactionData;
    
    const result = await db.query(
      `INSERT INTO proposal_visitor_interactions 
       (visitor_id, proposal_id, event_type, event_data, section_id, time_spent, scroll_percentage) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [visitorId, proposalId, eventType, JSON.stringify(eventData), sectionId, timeSpent, scrollPercentage]
    );
    
    return result.rows[0];
  }

  static async getProposalAnalytics(proposalId) {
    // Estatísticas gerais
    const statsResult = await db.query(`
      SELECT 
        COUNT(DISTINCT pv.id) as unique_visitors,
        COUNT(pi.id) as total_interactions,
        AVG(pi.time_spent) as avg_time_spent,
        AVG(pi.scroll_percentage) as avg_scroll_percentage,
        MAX(pv.last_activity_at) as last_visit
      FROM proposal_visitors pv
      LEFT JOIN proposal_visitor_interactions pi ON pv.id = pi.visitor_id
      WHERE pv.proposal_id = $1
    `, [proposalId]);

    // Visitantes detalhados
    const visitorsResult = await db.query(`
      SELECT 
        pv.*,
        COUNT(pi.id) as interaction_count,
        SUM(pi.time_spent) as total_time_spent,
        MAX(pi.scroll_percentage) as max_scroll_percentage,
        MIN(pi.created_at) as first_interaction,
        MAX(pi.created_at) as last_interaction
      FROM proposal_visitors pv
      LEFT JOIN proposal_visitor_interactions pi ON pv.id = pi.visitor_id
      WHERE pv.proposal_id = $1
      GROUP BY pv.id
      ORDER BY pv.first_visit_at DESC
    `, [proposalId]);

    // Interações por seção
    const sectionsResult = await db.query(`
      SELECT 
        pi.section_id,
        COUNT(pi.id) as view_count,
        AVG(pi.time_spent) as avg_time_spent,
        AVG(pi.scroll_percentage) as avg_scroll_percentage
      FROM proposal_visitor_interactions pi
      WHERE pi.proposal_id = $1 AND pi.section_id IS NOT NULL
      GROUP BY pi.section_id
      ORDER BY view_count DESC
    `, [proposalId]);

    // Timeline de atividades
    const timelineResult = await db.query(`
      SELECT 
        pi.*,
        pv.full_name as visitor_name,
        pv.company as visitor_company
      FROM proposal_visitor_interactions pi
      INNER JOIN proposal_visitors pv ON pi.visitor_id = pv.id
      WHERE pi.proposal_id = $1
      ORDER BY pi.created_at DESC
      LIMIT 50
    `, [proposalId]);

    return {
      stats: statsResult.rows[0],
      visitors: visitorsResult.rows,
      sections: sectionsResult.rows,
      timeline: timelineResult.rows
    };
  }

  static async getRealtimeVisitors(proposalId) {
    const result = await db.query(`
      SELECT 
        pv.*,
        pi.created_at as last_interaction
      FROM proposal_visitors pv
      INNER JOIN proposal_visitor_interactions pi ON pv.id = pi.visitor_id
      WHERE pv.proposal_id = $1 
        AND pi.created_at > NOW() - INTERVAL '5 minutes'
      ORDER BY pi.created_at DESC
    `, [proposalId]);

    return result.rows;
  }

  static async logPageView(visitorId, proposalId, page, referrer = null) {
    return this.logInteraction({
      visitorId,
      proposalId,
      eventType: 'page_view',
      eventData: { page, referrer }
    });
  }

  static async logSectionView(visitorId, proposalId, sectionId, timeSpent = null) {
    return this.logInteraction({
      visitorId,
      proposalId,
      eventType: 'section_view',
      eventData: { section_id: sectionId },
      sectionId,
      timeSpent
    });
  }

  static async logScroll(visitorId, proposalId, scrollPercentage) {
    return this.logInteraction({
      visitorId,
      proposalId,
      eventType: 'scroll',
      eventData: { scroll_percentage: scrollPercentage },
      scrollPercentage
    });
  }

  static async logDownload(visitorId, proposalId, fileName) {
    return this.logInteraction({
      visitorId,
      proposalId,
      eventType: 'download',
      eventData: { file_name: fileName }
    });
  }

  static async logClick(visitorId, proposalId, element, elementText = null) {
    return this.logInteraction({
      visitorId,
      proposalId,
      eventType: 'click',
      eventData: { element, element_text: elementText }
    });
  }
}

module.exports = ProposalTracking;
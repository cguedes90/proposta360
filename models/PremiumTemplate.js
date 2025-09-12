const db = require('../config/database');

class PremiumTemplate {
  
  // Verificar se usuário tem acesso a template premium
  static async hasAccess(userId, templateId) {
    try {
      const result = await db.query(`
        SELECT tp.id, tp.payment_status, tp.expires_at, t.is_premium
        FROM template_purchases tp
        JOIN templates t ON t.id = tp.template_id
        WHERE tp.user_id = $1 AND tp.template_id = $2 AND tp.payment_status = 'completed'
      `, [userId, templateId]);

      if (result.rows.length === 0) return false;

      const purchase = result.rows[0];
      
      // Verificar se ainda não expirou (se tiver data de expiração)
      if (purchase.expires_at && new Date(purchase.expires_at) < new Date()) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao verificar acesso:', error);
      return false;
    }
  }

  // Adicionar template ao carrinho
  static async addToCart(userId, templateId) {
    try {
      // Verificar se já possui o template
      const hasAccess = await this.hasAccess(userId, templateId);
      if (hasAccess) {
        throw new Error('Você já possui este template');
      }

      // Verificar se template existe e é premium
      const templateResult = await db.query(`
        SELECT id, name, price, is_premium 
        FROM templates 
        WHERE id = $1 AND is_premium = true AND is_active = true
      `, [templateId]);

      if (templateResult.rows.length === 0) {
        throw new Error('Template não encontrado ou não é premium');
      }

      // Adicionar ao carrinho
      await db.query(`
        INSERT INTO shopping_cart (user_id, template_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, template_id) DO NOTHING
      `, [userId, templateId]);

      return { success: true, message: 'Template adicionado ao carrinho' };
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      throw error;
    }
  }

  // Remover template do carrinho
  static async removeFromCart(userId, templateId) {
    try {
      await db.query(`
        DELETE FROM shopping_cart 
        WHERE user_id = $1 AND template_id = $2
      `, [userId, templateId]);

      return { success: true, message: 'Template removido do carrinho' };
    } catch (error) {
      console.error('Erro ao remover do carrinho:', error);
      throw error;
    }
  }

  // Obter carrinho do usuário
  static async getCart(userId) {
    try {
      const result = await db.query(`
        SELECT 
          sc.id as cart_id,
          sc.added_at,
          t.id,
          t.name,
          t.description,
          t.category,
          t.industry,
          t.thumbnail_url,
          t.price,
          t.tags
        FROM shopping_cart sc
        JOIN templates t ON t.id = sc.template_id
        WHERE sc.user_id = $1 AND t.is_active = true
        ORDER BY sc.added_at DESC
      `, [userId]);

      const items = result.rows;
      const total = items.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);

      return {
        items,
        total: total.toFixed(2),
        count: items.length
      };
    } catch (error) {
      console.error('Erro ao obter carrinho:', error);
      throw error;
    }
  }

  // Aplicar cupom de desconto
  static async applyCoupon(userId, couponCode) {
    try {
      const cart = await this.getCart(userId);
      if (cart.count === 0) {
        throw new Error('Carrinho vazio');
      }

      // Verificar se cupom é válido
      const couponResult = await db.query(`
        SELECT * FROM discount_coupons
        WHERE code = $1 AND is_active = true 
        AND (valid_until IS NULL OR valid_until > CURRENT_TIMESTAMP)
        AND current_uses < max_uses
        AND $2 >= min_purchase_amount
      `, [couponCode, parseFloat(cart.total)]);

      if (couponResult.rows.length === 0) {
        throw new Error('Cupom inválido, expirado ou valor mínimo não atingido');
      }

      const coupon = couponResult.rows[0];
      let discount = 0;

      if (coupon.discount_type === 'percentage') {
        discount = (parseFloat(cart.total) * parseFloat(coupon.discount_value)) / 100;
      } else {
        discount = parseFloat(coupon.discount_value);
      }

      // Garantir que desconto não seja maior que o total
      discount = Math.min(discount, parseFloat(cart.total));

      return {
        coupon: {
          code: coupon.code,
          description: coupon.description,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value
        },
        discount: discount.toFixed(2),
        originalTotal: cart.total,
        finalTotal: (parseFloat(cart.total) - discount).toFixed(2)
      };
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error);
      throw error;
    }
  }

  // Processar compra
  static async processPurchase(userId, paymentData) {
    try {
      const { paymentMethod, paymentId, couponCode } = paymentData;
      
      const cart = await this.getCart(userId);
      if (cart.count === 0) {
        throw new Error('Carrinho vazio');
      }

      let finalTotal = parseFloat(cart.total);
      let couponData = null;

      // Aplicar cupom se fornecido
      if (couponCode) {
        const couponResult = await this.applyCoupon(userId, couponCode);
        finalTotal = parseFloat(couponResult.finalTotal);
        couponData = couponResult.coupon;
      }

      // Iniciar transação
      await db.query('BEGIN');

      const purchaseIds = [];

      // Criar uma compra para cada template no carrinho
      for (const item of cart.items) {
        const purchaseResult = await db.query(`
          INSERT INTO template_purchases (
            user_id, template_id, purchase_amount, payment_method, 
            payment_status, payment_id
          )
          VALUES ($1, $2, $3, $4, 'completed', $5)
          RETURNING id
        `, [userId, item.id, item.price, paymentMethod, paymentId]);

        purchaseIds.push(purchaseResult.rows[0].id);
      }

      // Registrar uso do cupom se aplicado
      if (couponData) {
        // Atualizar contador de uso do cupom
        await db.query(`
          UPDATE discount_coupons 
          SET current_uses = current_uses + 1
          WHERE code = $1
        `, [couponCode]);

        // Registrar uso para cada compra
        for (const purchaseId of purchaseIds) {
          await db.query(`
            INSERT INTO coupon_usage (coupon_id, user_id, purchase_id, discount_applied)
            SELECT id, $1, $2, $3
            FROM discount_coupons
            WHERE code = $4
          `, [userId, purchaseId, (finalTotal - parseFloat(cart.total)) / purchaseIds.length, couponCode]);
        }
      }

      // Limpar carrinho
      await db.query('DELETE FROM shopping_cart WHERE user_id = $1', [userId]);

      await db.query('COMMIT');

      return {
        success: true,
        purchaseIds,
        totalAmount: finalTotal,
        templatesCount: cart.count,
        message: 'Compra realizada com sucesso!'
      };

    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Erro ao processar compra:', error);
      throw error;
    }
  }

  // Obter templates comprados pelo usuário
  static async getPurchased(userId) {
    try {
      const result = await db.query(`
        SELECT 
          tp.id as purchase_id,
          tp.purchased_at,
          tp.purchase_amount,
          t.id,
          t.name,
          t.description,
          t.category,
          t.industry,
          t.thumbnail_url,
          t.preview_url,
          t.tags
        FROM template_purchases tp
        JOIN templates t ON t.id = tp.template_id
        WHERE tp.user_id = $1 AND tp.payment_status = 'completed'
        ORDER BY tp.purchased_at DESC
      `, [userId]);

      return result.rows;
    } catch (error) {
      console.error('Erro ao obter templates comprados:', error);
      throw error;
    }
  }

  // Estatísticas de vendas (admin)
  static async getSalesStats() {
    try {
      const result = await db.query(`
        SELECT 
          COUNT(*) as total_sales,
          SUM(purchase_amount) as total_revenue,
          AVG(purchase_amount) as average_sale,
          COUNT(DISTINCT user_id) as unique_customers,
          COUNT(DISTINCT template_id) as templates_sold
        FROM template_purchases
        WHERE payment_status = 'completed'
          AND purchased_at >= CURRENT_DATE - INTERVAL '30 days'
      `);

      const topTemplates = await db.query(`
        SELECT 
          t.name,
          t.price,
          COUNT(tp.id) as sales_count,
          SUM(tp.purchase_amount) as revenue
        FROM template_purchases tp
        JOIN templates t ON t.id = tp.template_id
        WHERE tp.payment_status = 'completed'
          AND tp.purchased_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY t.id, t.name, t.price
        ORDER BY sales_count DESC
        LIMIT 10
      `);

      return {
        overview: result.rows[0],
        topTemplates: topTemplates.rows
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }
}

module.exports = PremiumTemplate;
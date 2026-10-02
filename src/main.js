/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
    const { sale_price, quantity, discount } = purchase;
    const discountFactor = 1 - ((discount || 0) / 100);
        return sale_price * quantity * discountFactor; 
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {

    // @TODO: Расчет бонуса от позиции в рейтинге

    const { profit } = seller;

  if (index === 0) {
    return profit * 0.15;
  } else if (index === 1 || index === 2) {
    return profit * 0.10;
  } else if (index === total - 1) {
    return 0;
  } else {
    return profit * 0.05;
  }
} 

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    
 // @TODO: Проверка входных данных
   if (
  !data ||
  !Array.isArray(data.sellers) ||
  !Array.isArray(data.products) ||
  !Array.isArray(data.purchase_records) ||
  data.sellers.length === 0 ||
  data.products.length === 0 ||
  data.purchase_records.length === 0
) {
  throw new Error("Некорректные входные данные");
} 
// @TODO: Проверка наличия опций
    if (!options || typeof options !== 'object') {throw new Error('Опции должны быть объектом');}
    const { calculateRevenue, calculateBonus } = options;
        if (!calculateRevenue || !calculateBonus) {
        throw new Error('В опциях должны быть указаны функции calculateRevenue и calculateBonus');
    }

        if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('calculateRevenue и calculateBonus должны быть функциями');
    } 

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({ 
        seller_id: seller.id, 
        name: `${seller.first_name} ${seller.last_name}`, 
        revenue: 0, 
        profit: 0, 
        sales_count: 0, 
        products_sold: {} 
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    const productIndex = {}; 
        data.products.forEach(product => { productIndex[product.sku] = product; });
    const sellerIndex = {}; 
    sellerStats.forEach(seller => { sellerIndex[seller.seller_id] = seller; }); 

    // @TODO: Расчет выручки и прибыли для каждого продавца
data.purchase_records.forEach(record => { 
    const sellerId = record.seller_id; 
    const sellerStat = sellerIndex[sellerId];
    
    if (!sellerStat) return;

    sellerStat.sales_count += 1;
    sellerStat.revenue += record.total_amount;

record.items.forEach(item => {
      const product = productIndex[item.sku];
      if (!product) return;

      // Считаем прибыль для каждого товара отдельно
      const revenue = calculateRevenue(item, product);
      
      if (product.purchase_price) {
        const costAmount = product.purchase_price * item.quantity;
        sellerStat.profit += (revenue - costAmount);
      }

      const sku = item.sku;
      if (!sellerStat.products_sold[sku]) {
        sellerStat.products_sold[sku] = 0;
      }
      sellerStat.products_sold[sku] += item.quantity;
    });
  });

  // 6. Сортировка продавцов по прибыли (убывание)
  sellerStats.sort((a, b) => b.profit - a.profit);

  // 7. Назначение премий и формирование топ-товаров
  const totalSellers = sellerStats.length;

  sellerStats.forEach((seller, index) => {
    const fullSellerData = sellerIndex[seller.seller_id];
    const bonusInRubles = calculateBonus(index, totalSellers, fullSellerData);
    seller.bonus = +bonusInRubles.toFixed(2);

    // Округляем бонус до 2 знаков
    seller.bonus = +bonusInRubles.toFixed(2);

    //  ИСПРАВЛЕНИЕ СОРТИРОВКИ: Сначала сортируем пары [sku, quantity], потом мапим в объекты
    const topProducts = Object.entries(seller.products_sold)
      .sort((a, b) => b[1] - a[1]) // Сортируем по количеству (второй элемент пары)
      .slice(0, 10)                // Берем топ-10
      .map(([sku, quantity]) => ({ sku, quantity })); // Превращаем в объекты

    seller.top_products = topProducts;
  });

  return sellerStats.map(seller => ({
    seller_id: seller.seller_id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: +seller.bonus.toFixed(2)
  }));
}
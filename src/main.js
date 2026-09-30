/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
      const { sale_price, quantity } = purchase;
       return sale_price * quantity;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller, profit) {
    // @TODO: Расчет бонуса от позиции в рейтинге

    let percent = 0;
    if (index === 0) { 
        percent = 15; 
    } else if (index === 1 || index === 2) { 
        percent = 10; 
    } else if (index === total - 1) { 
        percent = 0; 
    } else { percent = 5; 

    }
   return profit * (percent / 100);
} 
    

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    
    // @TODO: Проверка входных данных
        if ( !data 
            || !Array.isArray(data.purchase_records) 
            || !Array.isArray(data.products) 
            || !Array.isArray(data.sellers) 
            || data.purchase_records.length === 0 
            || data.products.length === 0 
            || data.sellers.length === 0 
        ) { throw new Error('Некорректные входные данные'); 
    } 
    // @TODO: Проверка наличия опций
        if (!options || typeof options !== 'object') {
        throw new Error('Опции должны быть объектом');
    }
        const { calculateRevenue, calculateBonus } = options;
        if (!calculateRevenue || !calculateBonus) {
        throw new Error('В опциях должны быть указаны функции calculateRevenue и calculateBonus');
    }

        if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('calculateRevenue и calculateBonus должны быть функциями');
    } 

    // @TODO: Индексация продавцов и товаров для быстрого доступа
        const productsMap = {}; 
        data.products.forEach(product => { productsMap[product.sku] = product; });
        const sellersMap = {}; 
        data.sellers.forEach(seller => { sellersMap[seller.id] = seller;
        });

    // @TODO: Подготовка промежуточных данных для сбора статистики
        const sellerStats = data.sellers.map(seller => ({ 
            seller_id: seller.id, 
            name: `${seller.first_name} ${seller.last_name}`, 
            revenue: 0, 
            profit: 0, 
            sales_count: 0, 
            products_sold: {} }));
        const statsMap = {}; 
    sellerStats.forEach(stat => { 
    statsMap[stat.seller_id] = stat; });

    // @TODO: Расчет выручки и прибыли для каждого продавца
       data.purchase_records.forEach(receipt => {
    receipt.items.forEach(item => {
      const product = productsMap[item.sku];
      const sellerId = receipt.seller_id;
      const sellerStat = statsMap[sellerId];

      // --- ПРОВЕРКИ ДЛЯ ОТЛАДКИ ---
      if (!sellerStat || !product)
        return; 
       

      // Считаем выручку за эту одну покупку
        const revenue = calculateRevenue(item, product);
      sellerStat.revenue += revenue;

      // Считаем прибыль (Выручка - Себестоимость)
      if (product && product.purchase_price) {
        const costAmount = product.purchase_price * item.quantity;
        sellerStat.profit += (revenue - costAmount);
      }

      // Увеличиваем счетчик проданных позиций
        sellerStat.sales_count += 1;
         // Накопление товаров для топ-листа
      const sku = item.sku;
      if (!sellerStat.products_sold[sku]) {
        sellerStat.products_sold[sku] = 0;
      }
      sellerStat.products_sold[sku] += item.quantity;
    }); 
  }); 

    // @TODO: Сортировка продавцов по прибыли
       sellerStats.sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования
        const totalSellers = sellerStats.length; 
        const result = [];

           sellerStats.forEach((stat, index) => {
        const fullSellerData = sellersMap[stat.seller_id];
    
        const name = fullSellerData 
      ? `${fullSellerData.first_name} ${fullSellerData.last_name}` 
      : 'Unknown Seller';

    const bonus = calculateBonus(index, totalSellers, fullSellerData, stat.profit);

        const topProducts = Object.entries(stat.products_sold)
      .sort((a, b) => b[1] - a[1]) 
      .slice(0, 10)                
      .map(entry => entry[0]);

    // @TODO: Подготовка итоговой коллекции с нужными полями
    result.push({
      seller_id: stat.seller_id,
      name: name,
      revenue: +stat.revenue.toFixed(2),
      profit: +stat.profit.toFixed(2),
      sales_count: stat.sales_count,
      top_products: topProducts,
      bonus: +bonus.toFixed(2) 
    });
  });

  return result;
}
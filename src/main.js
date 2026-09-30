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
    if (!seller) return 0;
  
    if (index === 0) 
        return 15; 
    if (index === 1 || index === 2) 
        return 10; 
    if (index === total - 1) 
        return 0;
    return 5;  
} 

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    
    // @TODO: Проверка входных данных
        if (!data 
            || !Array.isArray(data.purchase_records) 
            || !Array.isArray(data.products) 
            || !Array.isArray(data.sellers)) { 
                throw new Error('Некорректные входные данные'); } 
                if (data.purchase_records.length === 0 
                    || data.products.length === 0 
                    || data.sellers.length === 0) { 
            throw new Error('Пустые массивы данных'); 
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
        const productIndex = {}; 
        data.products.forEach(product => { productIndex[product.sku] = product; });
        const sellerIndex = {}; 
        data.sellers.forEach(seller => { sellerIndex[seller.id] = seller; });

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
         // 5. Сбор данных (Двойной цикл)
  data.purchase_records.forEach(receipt => {
    const sellerId = receipt.seller_id;
    const sellerStat = statsMap[sellerId];

    // Защита: если продавец не найден, пропускаем чек
    if (!sellerStat) return;

    // ✅ ИСПРАВЛЕНИЕ: Считаем количество продаж (чеков) ОДИН РАЗ за весь чек
    sellerStat.sales_count += 1;

    receipt.items.forEach(item => {
      const product = productIndex[item.sku];
      
      // Защита: если товара нет, пропускаем позицию
      if (!product) return;

      // Считаем выручку
      const revenue = calculateRevenue(item, product);
      sellerStat.revenue += revenue;

      // Считаем прибыль (Выручка - Себестоимость)
      if (product.purchase_price) {
        const costAmount = product.purchase_price * item.quantity;
        sellerStat.profit += (revenue - costAmount);
      }

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

        sellerStats.forEach((seller, index) => {
    const fullSellerData = sellerIndex[seller.seller_id];
    const percent = calculateBonus(index, totalSellers, fullSellerData);
    const bonusInRubles = seller.profit * (percent / 100);
  
  seller.bonus = +bonusInRubles.toFixed(2);

    const topProducts = Object.entries(seller.products_sold)
    .sort((a, b) => b[1] - a[1]) 
    .slice(0, 10)                
    .map(entry => ({ sku: entry[0], quantity: entry[1] }));

  seller.top_products = topProducts;
}); 
    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.seller_id,
        name: seller.name,
        revenue: seller.revenue, 
        profit: seller.profit,
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: seller.bonus
  }));
}
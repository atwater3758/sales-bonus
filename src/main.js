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

   const { profit } = seller;

  if (index === 0) return 15;
  if (index === 1 || index === 2) return 10;
  if (index === total - 1) return 0;
  
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
    if (!data || 
        !Array.isArray(data.purchase_records) || 
        !Array.isArray(data.products) || 
        !Array.isArray(data.sellers) || 
        data.purchase_records.length === 0 || 
        data.products.length === 0 || 
        data.sellers.length === 0) { 
            throw new Error('Некорректные входные данные'); } 
// @TODO: Проверка наличия опций
    if (!options || typeof options !== 'object') {throw new Error('Опции должны быть объектом');}
    const { calculateRevenue, calculateBonus } = options;
        if (!calculateRevenue || !calculateBonus) {
        throw new Error('В опциях должны быть указаны функции calculateRevenue и calculateBonus');
    }

        if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('calculateRevenue и calculateBonus должны быть функциями');
    } 

// @TODO: Индексация продавцов и товаров для быстрого доступа

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({ 
        seller_id: seller.id, 
        name: `${seller.first_name} ${seller.last_name}`, 
        revenue: 0, 
        profit: 0, 
        sales_count: 0, 
        products_sold: {} 
    }));

    const sellerIndex = sellerStats.reduce((acc, seller) => {
        acc[seller.seller_id] = seller;
        return acc;
    }, {});

// productIndex: ключ = sku, значение = товар
    const productIndex = data.products.reduce((acc, product) => {
        acc[product.sku] = product;
        return acc;
    }, {}); 

    // @TODO: Расчет выручки и прибыли для каждого продавца
data.purchase_records.forEach(record => {
  const sellerId = record.seller_id;
  const sellerStat = sellerIndex[sellerId];

  if (!sellerStat) return;

  sellerStat.sales_count += 1;

  record.items.forEach(item => {
    const product = productIndex[item.sku];
    if (!product) return;

    const revenue = calculateRevenue(item, product);
    sellerStat.revenue += revenue;

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
    .map(([sku, quantity]) => ({ sku, quantity}));

  seller.top_products = topProducts;
}); 
    // @TODO: Подготовка итоговой коллекции с нужными полями
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
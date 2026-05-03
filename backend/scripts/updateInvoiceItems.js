const sequelize = require('../src/config/database');
const { Invoice, Product } = require('../src/models');

async function updateInvoiceItems() {
  try {
    // Récupérer le bon produit
    const realProduct = await Product.findOne({ where: { name: 'Casque Bluetooth' } });
    
    if (!realProduct) {
      console.log('❌ Produit "Casque Bluetooth" non trouvé !');
      return;
    }
    
    console.log(`✅ Produit trouvé : ${realProduct.name} (ID: ${realProduct.id})`);
    console.log(`   Catégorie : ${realProduct.category}`);
    console.log(`   Description : ${realProduct.description}`);
    
    // Récupérer toutes les factures
    const invoices = await Invoice.findAll();
    
    if (invoices.length === 0) {
      console.log('📋 Aucune facture trouvée');
      return;
    }
    
    for (const invoice of invoices) {
      console.log(`\n📄 Facture : ${invoice.number}`);
      console.log(`   Items avant :`, JSON.stringify(invoice.items, null, 2));
      
      let modified = false;
      let items = invoice.items;
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Si l'article est "Informatique" ou si le produit n'a pas de nom correct
        if (item.productName === 'Informatique' || item.productName === 'Produit') {
          items[i] = {
            ...item,
            productId: realProduct.id,
            productName: realProduct.name,
            productDescription: realProduct.category || 'Informatique',
            unitPrice: parseFloat(realProduct.price),
            taxRate: parseFloat(realProduct.taxRate),
            subtotal: parseFloat(realProduct.price) * item.quantity,
            taxAmount: (parseFloat(realProduct.price) * item.quantity) * parseFloat(realProduct.taxRate) / 100,
            total: (parseFloat(realProduct.price) * item.quantity) * (1 + parseFloat(realProduct.taxRate) / 100)
          };
          modified = true;
        }
      }
      
      if (modified) {
        // Recalculer les totaux de la facture
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        const taxTotal = items.reduce((sum, item) => sum + item.taxAmount, 0);
        const total = items.reduce((sum, item) => sum + item.total, 0);
        
        invoice.items = items;
        invoice.subtotal = subtotal;
        invoice.taxTotal = taxTotal;
        invoice.total = total;
        
        await invoice.save();
        console.log(`   ✅ Facture ${invoice.number} mise à jour`);
        console.log(`   Nouveau total : ${total} FCFA`);
      } else {
        console.log(`   ℹ️ Aucune modification nécessaire`);
      }
    }
    
    console.log('\n🎉 Mise à jour terminée !');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await sequelize.close();
  }
}

updateInvoiceItems();
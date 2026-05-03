const sequelize = require('../src/config/database');
const { Invoice, Product } = require('../src/models');

async function fixExistingInvoice() {
  try {
    // 1. Trouver le vrai produit "Casque Bluetooth"
    const realProduct = await Product.findOne({ where: { name: 'Casque Bluetooth' } });
    
    if (!realProduct) {
      console.log('❌ Produit "Casque Bluetooth" non trouvé !');
      return;
    }
    
    console.log(`✅ Produit trouvé : ${realProduct.name} (ID: ${realProduct.id})`);
    
    // 2. Trouver toutes les factures avec l'ancien produit "Informatique"
    const invoices = await Invoice.findAll();
    
    for (const invoice of invoices) {
      let items = invoice.items;
      let modified = false;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].productName === 'Informatique') {
          items[i].productId = realProduct.id;
          items[i].productName = realProduct.name;
          items[i].productDescription = realProduct.category || realProduct.description;
          modified = true;
        }
      }
      
      if (modified) {
        invoice.items = items;
        await invoice.save();
        console.log(`✅ Facture ${invoice.number} corrigée`);
      }
    }
    
    console.log('🎉 Terminé !');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await sequelize.close();
  }
}

fixExistingInvoice();
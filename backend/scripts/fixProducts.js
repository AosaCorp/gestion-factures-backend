const sequelize = require('../src/config/database');

async function fixProducts() {
  try {
    console.log('📦 Mise à jour des produits...');
    
    // 1. Vérifier les produits existants
    const [products] = await sequelize.query(`
      SELECT id, name, description, category FROM Products
    `);
    
    console.log(`📋 ${products.length} produit(s) trouvé(s)`);
    
    for (const product of products) {
      let updated = false;
      let updateFields = [];
      
      // Si category est vide mais description existe
      if (!product.category && product.description) {
        updateFields.push(`category = '${product.description.replace(/'/g, "''")}'`);
        updated = true;
        console.log(`   Produit ${product.id} : category ← "${product.description}"`);
      }
      
      // Si le nom du produit est "Informatique" (c'est une catégorie, pas un produit)
      if (product.name === 'Informatique') {
        console.log(`   ⚠️ Produit ${product.id} s'appelle "Informatique" - à renommer manuellement`);
      }
      
      if (updated) {
        await sequelize.query(`
          UPDATE Products 
          SET ${updateFields.join(', ')}
          WHERE id = ${product.id}
        `);
        console.log(`   ✅ Produit ${product.id} mis à jour`);
      }
    }
    
    // 2. Afficher un exemple concret
    const [sample] = await sequelize.query(`
      SELECT name, description, category FROM Products LIMIT 1
    `);
    
    if (sample.length > 0) {
      console.log('\n📌 Exemple de produit après mise à jour :');
      console.log(`   Nom : ${sample[0].name}`);
      console.log(`   Description : ${sample[0].description}`);
      console.log(`   Catégorie : ${sample[0].category}`);
    }
    
    console.log('\n🎉 Mise à jour terminée !');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await sequelize.close();
  }
}

fixProducts();
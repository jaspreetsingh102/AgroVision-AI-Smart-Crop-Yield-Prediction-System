// AgroMarket — Home Page Logic

document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedProducts();
  initCategoryCards();
  initScrollAnimations();
});

// === LOAD FEATURED PRODUCTS FROM SUPABASE ===
async function loadFeaturedProducts() {
  const grid = document.getElementById('featuredProductsGrid');
  if (!grid) return;

  // Show skeleton loaders
  grid.innerHTML = Array(4).fill('').map(() => `
    <div class="product-card">
      <div class="product-card-image skeleton" style="height:200px"></div>
      <div class="product-card-body">
        <div class="skeleton" style="height:14px;width:60%;margin-bottom:0.5rem"></div>
        <div class="skeleton" style="height:18px;width:90%;margin-bottom:0.5rem"></div>
        <div class="skeleton" style="height:22px;width:40%;margin-bottom:0.75rem"></div>
        <div class="skeleton" style="height:14px;width:70%"></div>
      </div>
    </div>
  `).join('');

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*, seller("Shop_name")') // Updated to match new schema (case-sensitive)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) throw error;

    if (products && products.length > 0) {
      renderProductCards(grid, products);
    } else {
      renderDemoProducts(grid);
    }
  } catch (err) {
    console.log('Using demo products:', err.message);
    renderDemoProducts(grid);
  }
}

// === RENDER PRODUCT CARDS ===
function renderProductCards(container, products) {
  container.innerHTML = products.map(product => createProductCard(product)).join('');
}

function createProductCard(product) {
  const hasDiscount = product.discount_price && product.discount_price < product.price;
  const discountPct = hasDiscount ? Math.round((1 - product.discount_price / product.price) * 100) : 0;
  const displayPrice = hasDiscount ? product.discount_price : product.price;
  const imageUrl = product.img_url || 'https://placehold.co/600x400/22c55e/white?text=No+Image'; // No change needed here
  const sellerName = product.seller?.Shop_name || 'AgroMarket'; // Updated to match new schema
  const categoryColors = {
    fertilizer: 'badge-emerald',
    seed: 'badge-gold',
    pesticide: 'badge-rose',
    tool: 'badge-teal',
    organic: 'badge-emerald'
  };

  return `
    <a href="product-detail.html?id=${product.id}" class="product-card">
      <div class="product-card-image">
        <img src="${imageUrl}" alt="${product.name}" loading="lazy"
             onerror="this.onerror=null;this.src='https://placehold.co/600x400/22c55e/white?text=No+Image'">
        ${hasDiscount ? `<span class="badge badge-gold"><i class="fas fa-bolt"></i> ${discountPct}% OFF</span>` : ''}
        <button class="product-wishlist-btn" onclick="event.preventDefault(); event.stopPropagation();" aria-label="Add to wishlist">
          <i class="far fa-heart"></i>
        </button>
      </div>
      <div class="product-card-body">
        <div class="product-card-category">${product.category || 'General'}</div>
        <h3>${product.name}</h3>
        <div class="product-card-price">
          <span class="current">${formatPrice(displayPrice)}</span>
          ${hasDiscount ? `<span class="original">${formatPrice(product.price)}</span>` : ''}
        </div>
        <div class="product-card-footer">
          <div class="product-card-seller">
            <i class="fas fa-store"></i> ${sellerName}
          </div>
          <div class="product-card-rating">
            <i class="fas fa-star"></i>
            <span>4.5</span>
          </div>
        </div>
      </div>
    </a>
  `;
}

// === DEMO PRODUCTS (Fallback) ===
function renderDemoProducts(container) {
  const demoProducts = [
    {
      id: 'demo-1',
      name: 'NPK 20-20-20 Fertilizer – Premium Quality',
      category: 'Fertilizer',
      price: 1200,
      discount_price: 999,
      img_url: 'https://placehold.co/600x400/22c55e/white?text=Fertilizer',
      sellers: { shop_name: 'Krishna Agro' }
    },
    {
      id: 'demo-2',
      name: 'Hybrid Wheat Seeds – HD 3226 Certified',
      category: 'Seed',
      price: 850,
      discount_price: null,
      img_url: 'https://placehold.co/600x400/22c55e/white?text=Seeds',
      sellers: { shop_name: 'Punjab Seeds Co.' }
    },
    {
      id: 'demo-3',
      name: 'Neem Oil Organic Pesticide – 1 Litre',
      category: 'Pesticide',
      price: 450,
      discount_price: 375,
      img_url: 'https://placehold.co/600x400/22c55e/white?text=Pesticide',
      sellers: { shop_name: 'GreenGuard' }
    },
    {
      id: 'demo-4',
      name: 'Drip Irrigation Kit – 100 Plants',
      category: 'Tool',
      price: 3500,
      discount_price: 2999,
      img_url: 'https://placehold.co/600x400/22c55e/white?text=Tools',
      sellers: { shop_name: 'FarmTech India' }
    },
    {
      id: 'demo-5',
      name: 'Vermicompost Organic Manure – 25kg',
      category: 'Organic',
      price: 600,
      discount_price: 520,
      img_url: 'https://placehold.co/600x400/22c55e/white?text=Organic',
      sellers: { shop_name: 'EcoFarm' }
    },
    {
      id: 'demo-6',
      name: 'Mustard Seeds – Pusa Bold Variety',
      category: 'Seed',
      price: 320,
      discount_price: null,
      img_url: 'https://placehold.co/600x400/22c55e/white?text=Seeds',
      sellers: { shop_name: 'Haryana Agri Store' }
    },
    {
      id: 'demo-7',
      name: 'DAP Fertilizer – 50kg Bag',
      category: 'Fertilizer',
      price: 1350,
      discount_price: 1199,
      img_url: 'https://placehold.co/600x400/22c55e/white?text=Fertilizer',
      sellers: { shop_name: 'Kisan Bazaar' }
    },
    {
      id: 'demo-8',
      name: 'Hand Sprayer Pump – 16L Capacity',
      category: 'Tool',
      price: 1800,
      discount_price: 1499,
      img_url: 'https://placehold.co/600x400/22c55e/white?text=Tools',
      sellers: { shop_name: 'AgriTools Hub' }
    }
  ];

  renderProductCards(container, demoProducts);
}

// === CATEGORY CARD CLICKS ===
function initCategoryCards() {
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const category = card.dataset.category;
      if (category) {
        window.location.href = `products.html?category=${category}`;
      }
    });
  });
}

// === SCROLL ANIMATIONS (Intersection Observer) ===
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-slide-up');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.categories-section, .featured-section, .how-section, .cta-section').forEach(section => {
    section.style.opacity = '0';
    observer.observe(section);
  });
}

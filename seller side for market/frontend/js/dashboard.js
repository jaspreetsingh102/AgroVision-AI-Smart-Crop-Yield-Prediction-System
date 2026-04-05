document.addEventListener('DOMContentLoaded', async () => {
  // 1. Check if seller is logged in
  if (!requireSellerLogin()) return;
  const seller = getSellerSession();

  // 2. Initial Data Load
  // Support both 'seller_id' and 'id' for compatibility
  const sellerId = seller ? (seller.seller_id || seller.id) : null;
  if (sellerId) {
    await loadDashboardData(sellerId);
  }

  // 3. Modal Logic
  const modal = document.getElementById("productModal");
  const openBtn = document.getElementById("openModalBtn");
  const closeBtn = document.querySelector(".close-btn");
  const form = document.getElementById("addProductForm");

  if (openBtn) openBtn.onclick = () => modal.style.display = "flex";
  if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
  window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };

  // 4. Handle Form Submission
  form.onsubmit = async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalBtnText = btn.textContent;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
      const imageFile = document.getElementById('pImage').files[0];
      let uploadedImageUrl = null;

      // Upload image if provided
      if (imageFile) {
        try {
          uploadedImageUrl = await uploadImage(imageFile, 'product-images');
        } catch (imgErr) {
          console.warn("Image upload failed, proceeding without image:", imgErr);
        }
      }

      // Prepare product record based on your SQL schema
      const productData = {
        seller_id: sellerId, // Auto-incremented ID from the seller session
        name: document.getElementById('pName').value.trim(),
        category: document.getElementById('pCategory').value,
        price: parseFloat(document.getElementById('pPrice').value),
        stock: parseInt(document.getElementById('pStock').value),
        description: document.getElementById('pDesc').value.trim(),
        img_url: uploadedImageUrl,
        is_active: document.getElementById('pStatus').value === 'true'
      };

      // Insert into public.products
      const { error } = await supabase.from('products').insert([productData]);
      if (error) {
        console.error("Supabase Insertion Error:", error);
        throw new Error(error.message);
      }

      showToast('Product added successfully!', 'success');
      

      // Reset and Refresh
      form.reset();
      if (modal) modal.style.display = "none";
      await loadDashboardData(sellerId);

    } catch (err) {
      console.error('Submission error:', err);
      showToast(err.message || 'Failed to add product', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalBtnText;
    }
  };

});

async function loadDashboardData(sellerId) {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch real order data for stats
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('total_amount, status')
      .eq('seller_id', sellerId);

    if (orderError) throw orderError;

    updateStats(products, orders);
    renderProductTable(products);

  } catch (err) {
    console.error('Error loading dashboard:', err.message);
    showToast('Failed to load products', 'error');
  }
}

function updateStats(products, orders = []) {
  const totalProducts = products.length;
  const lowStockItems = products.filter(p => p.stock < 10).length;
  const totalOrders = orders.length;
  const revenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
  
  // Update UI cards
  document.getElementById('statTotalProducts').textContent = totalProducts;
  document.getElementById('statTotalOrders').textContent = totalOrders;
  document.getElementById('statTotalRevenue').textContent = formatPrice(revenue);
  
  const lowStockEl = document.getElementById('statLowStock');
  lowStockEl.textContent = lowStockItems;

  // Add visual warning if low stock exists
  if (lowStockItems > 0) {
    lowStockEl.parentElement.classList.add('warning');
  } else {
    lowStockEl.parentElement.classList.remove('warning');
  }
}

window.handleLogout = () => showLogoutConfirm();

function renderProductTable(products) {
  const tableBody = document.getElementById("productTable");
  tableBody.innerHTML = '';

  if (products.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5">No products found. Start selling!</td></tr>';
    return;
  }

  products.forEach(product => {
    const row = document.createElement("tr");
    const isLowStock = product.stock < 10;
    const statusText = product.is_active ? (isLowStock ? 'Low Stock' : 'Active') : 'Inactive';
    const statusClass = !product.is_active ? 'inactive' : (isLowStock ? 'lowstock' : 'instock');

    row.innerHTML = `
      <td style="text-align: left; display: flex; align-items: center; gap: 12px;">
        <img src="${product.img_url || 'https://placehold.co/400x400/22c55e/white?text=Agro'}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;" onerror="this.onerror=null;this.src='https://placehold.co/400x400/22c55e/white?text=Agro';">
        <div style="font-weight: 500;">${product.name}</div>
      </td>
      <td><span class="badge-emerald">${product.category}</span></td>
      <td>${formatPrice(product.price)}</td>
      <td>${product.stock}</td>
      <td><span class="status ${statusClass}">${statusText}</span></td>
    `;
    tableBody.appendChild(row);
  });
}
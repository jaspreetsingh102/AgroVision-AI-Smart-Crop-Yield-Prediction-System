document.addEventListener('DOMContentLoaded', async () => {
  if (!requireSellerLogin()) return;
  const seller = getSellerSession();
  const sellerId = seller.seller_id || seller.id;

  let allProducts = [];

  // 1. Initial Load
  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    
    if (error) {
      showToast('Error loading products', 'error');
      return;
    }
    allProducts = data;
    renderTable(allProducts);
  }

  await fetchProducts();

  // 2. Search Logic
  const searchInput = document.getElementById('productSearch');
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allProducts.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.category.toLowerCase().includes(term)
    );
    renderTable(filtered);
  });

  // 3. Render Table
  function renderTable(products) {
    const tableBody = document.getElementById('manageProductTable');
    tableBody.innerHTML = products.length ? '' : '<tr><td colspan="6">No products found.</td></tr>';

    products.forEach(product => {
      const row = document.createElement('tr');
      const isLowStock = product.stock < 10;
      
      row.innerHTML = `
        <td style="text-align: left; display: flex; align-items: center; gap: 12px;">
          <img src="${product.img_url || 'https://placehold.co/400x400/22c55e/white?text=Agro'}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;">
          <div style="font-weight: 500;">${product.name}</div>
        </td>
        <td><span class="badge-emerald">${product.category}</span></td>
        <td>${formatPrice(product.price)}</td>
        <td>${product.stock}</td>
        <td><span class="status ${product.is_active ? (isLowStock ? 'lowstock' : 'instock') : 'inactive'}">
          ${product.is_active ? (isLowStock ? 'Low Stock' : 'Active') : 'Inactive'}
        </span></td>
        <td>
          <button class="action-btn btn-delete" data-id="${product.id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  // Optimized Delete Logic using Event Delegation
  document.getElementById('manageProductTable').addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-delete');
    if (!btn) return;

    if (confirm('Are you sure you want to delete this product?')) {
      const id = btn.dataset.id;
      try {
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
        const result = await res.json();
        
        if (!res.ok) throw new Error(result.error || 'Delete failed');

        showToast('Product deleted', 'success');
        fetchProducts(); // Refresh the table
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  });

  // 4. Reuse Add Product Modal Logic
  const modal = document.getElementById("productModal");
  document.getElementById("openModalBtn").onclick = () => modal.style.display = "flex";
  document.querySelector(".close-btn").onclick = () => modal.style.display = "none";
  
  document.getElementById('addProductForm').onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const productData = {
      seller_id: sellerId,
      name: document.getElementById('pName').value.trim(),
      category: document.getElementById('pCategory').value,
      price: parseFloat(document.getElementById('pPrice').value),
      stock: parseInt(document.getElementById('pStock').value),
      description: document.getElementById('pDesc').value.trim(),
      is_active: true
    };

    const { error } = await supabase.from('products').insert([productData]);
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Added!', 'success');
      form.reset();
      modal.style.display = "none";
      fetchProducts();
    }
  };
});

window.handleLogout = () => showLogoutConfirm();
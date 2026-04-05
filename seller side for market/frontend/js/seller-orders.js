document.addEventListener('DOMContentLoaded', async () => {
  if (!requireSellerLogin()) return;
  const seller = getSellerSession();
  const sellerId = seller.seller_id || seller.id;

  async function fetchOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          price,
          products (name)
        ),
        Client (
          Username,
          Gmail
        )
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) {
      showToast('Error loading orders', 'error');
      return;
    }
    renderOrders(data);
  }

  function generateShortId(index) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letterIndex = Math.floor(index / 100);
    const letter = letters[letterIndex % 26];
    const digits = (index % 100).toString().padStart(2, '0');
    return `${letter}${digits}`;
  }

  function renderOrders(orders) {
    const tableBody = document.getElementById('ordersTableBody');
    tableBody.innerHTML = orders.length ? '' : '<tr><td colspan="6">No orders found yet.</td></tr>';

    orders.forEach((order, index) => {
      const row = document.createElement('tr');
      const date = new Date(order.created_at).toLocaleDateString();
      const chronologicalIndex = orders.length - index;
      const shortId = generateShortId(chronologicalIndex);
      
      row.innerHTML = `
        <td>
          <span style="font-weight: 500;" title="${order.id}">#${shortId}</span>
          <button class="action-btn" onclick="copyToClipboard('${order.id}')" title="Copy real Order ID" style="margin-left: 8px; font-size: 10px; background: transparent; border: 1px solid #334155; color: #94a3b8; padding: 3px 6px; border-radius: 4px;">
            <i class="far fa-copy"></i>
          </button>
        </td>
        <td style="text-align: left;">
          <strong>${(order.Client && order.Client.Username) || order.customer_name || order.name || 'N/A'}</strong>
          <div class="order-details">${(order.Client && order.Client.Gmail) || order.customer_email || order.email || ''}</div>
        </td>
        <td>${formatPrice(order.total_amount)}</td>
        <td>${date}</td>
        <td>
          <select class="status-select" onchange="updateOrderStatus('${order.id}', this.value, '${shortId}')">
            <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed</option>
            <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <button class="action-btn" onclick="showToast('Invoice feature coming soon!', 'info')">
            <i class="fas fa-file-invoice"></i>
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  window.updateOrderStatus = async (orderId, newStatus, shortId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const result = await response.json();

      if (!response.ok) {
        showToast(result.error || 'Update failed', 'error');
      } else {
        showToast(`Order #${shortId || orderId.substring(0,6).toUpperCase()} marked as ${newStatus}`, 'success');
      }
    } catch (err) {
      showToast('Network error — could not update order', 'error');
    }
  };

  window.copyToClipboard = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Order ID copied to clipboard!', 'success');
      }).catch(err => {
        showToast('Failed to copy ID', 'error');
      });
    } else {
      // Fallback for non-HTTPS network IPs where clipboard API is blocked
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        showToast('Order ID copied to clipboard!', 'success');
      } catch (err) {
        showToast('Failed to copy ID', 'error');
      }
      textArea.remove();
    }
  };

  await fetchOrders();
});

window.handleLogout = () => showLogoutConfirm();
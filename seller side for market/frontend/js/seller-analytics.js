document.addEventListener('DOMContentLoaded', async () => {
    if (!requireSellerLogin()) return;
    const seller = getSellerSession();
    const sellerId = seller.seller_id || seller.id;

    async function fetchAnalytics() {
        // Fetch all non-cancelled orders for this seller
        const { data, error } = await supabase
            .from('orders')
            .select('created_at, total_amount, status')
            .eq('seller_id', sellerId)
            .neq('status', 'Cancelled');

        if (error) {
            showToast('Error loading analytics data', 'error');
            return;
        }

        processAndRenderCharts(data);
    }

    function processAndRenderCharts(orders) {
        // Calculate top metrics
        const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        const totalOrders = orders.length;
        const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        document.getElementById('totalRevenue').textContent = formatPrice(totalRevenue);
        document.getElementById('totalOrders').textContent = totalOrders;
        document.getElementById('avgOrder').textContent = formatPrice(avgOrder);

        // Group revenue by date
        const salesByDate = {};
        orders.forEach(o => {
            const d = new Date(o.created_at);
            // Format as YYYY-MM-DD
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            if (!salesByDate[dateStr]) salesByDate[dateStr] = 0;
            salesByDate[dateStr] += Number(o.total_amount || 0);
        });

        const sortedDates = Object.keys(salesByDate).sort();
        const chartData = sortedDates.map(date => salesByDate[date]);

        // Render Chart using Chart.js
        const ctx = document.getElementById('salesChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedDates, // The X-Axis (Dates)
                datasets: [{
                    label: 'Revenue (₹)',
                    data: chartData,     // The Y-Axis (Sales amounts)
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3 // Smooth curves
                }]
            }
        });
    }

    await fetchAnalytics();
});

window.handleLogout = () => showLogoutConfirm();
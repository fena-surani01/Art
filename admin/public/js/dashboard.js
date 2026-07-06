document.addEventListener('DOMContentLoaded', () => {
    const filterSelect = document.getElementById('dateFilter');

    if (!filterSelect) return;

    // Fetch initial data
    fetchDashboardStats(filterSelect.value);

    // Fetch data on filter change
    filterSelect.addEventListener('change', (e) => {
        fetchDashboardStats(e.target.value);
    });

    const refreshBtn = document.getElementById('refreshDashboardBtn');
    const refreshIcon = document.getElementById('refreshIcon');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            if (refreshIcon) refreshIcon.classList.add('spin-anim');
            await fetchDashboardStats(filterSelect.value);
            setTimeout(() => {
                if (refreshIcon) refreshIcon.classList.remove('spin-anim');
            }, 500);
        });
    }
});

let adminChartInstance = null;

async function fetchDashboardStats(filter) {
    try {
        const response = await fetch(`/admin/api/dashboard/stats?filter=${filter}`);
        const data = await response.json();

        if (data.success) {
            
            if (window.USER_ROLE === 'artist') {
                animateValue('artist-total', data.stats.customRequests.total_assigned);
                animateValue('artist-pending', data.stats.customRequests.pending_requests);
                animateValue('artist-working', data.stats.customRequests.working_requests);
                animateValue('artist-completed', data.stats.customRequests.completed_requests);
                animateValue('artist-reviews', data.stats.reviews.count);
            } else {
                animateValue('stat-arts', data.stats.totalArts.count);
                animateValue('stat-artists', data.stats.artistLive.total);
                animateValue('stat-users', data.stats.userLive.total);
                
                animateValue('live-art-total', data.stats.artistLive.total);
                animateValue('live-art-online', data.stats.artistLive.online);
                animateValue('live-art-present', data.stats.artistLive.present);
                animateValue('live-art-break', data.stats.artistLive.on_break);
                animateValue('live-art-leave', data.stats.artistLive.full_leave);
                animateValue('live-art-half', data.stats.artistLive.half_leave);
                
                animateValue('live-user-total', data.stats.userLive.total);
                animateValue('live-user-online', data.stats.userLive.online);
                animateValue('stat-total-orders', data.stats.orders.total_orders);
                animateValue('stat-pending', data.stats.orders.pending_orders);
                animateValue('stat-delivered', data.stats.orders.delivered_orders);
                animateValue('stat-reviews', data.stats.reviews.count);
                animateValue('stat-custom', data.stats.customRequests.total_requests);
                animateValue('stat-custom-pending', data.stats.customRequests.pending_requests);
                animateValue('stat-custom-completed', data.stats.customRequests.completed_requests);

                // Update Chart
                const ctx = document.getElementById('adminChart');
                if (ctx) {
                    if (adminChartInstance) {
                        adminChartInstance.destroy();
                    }
                    adminChartInstance = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: ['Pending Orders', 'Delivered Orders', 'Pending Art Req', 'Completed Art Req'],
                            datasets: [{
                                label: 'Activity Breakdown',
                                data: [
                                    data.stats.orders.pending_orders,
                                    data.stats.orders.delivered_orders,
                                    data.stats.customRequests.pending_requests,
                                    data.stats.customRequests.completed_requests
                                ],
                                backgroundColor: [
                                    'rgba(41, 74, 112, 0.8)',
                                    'rgba(41, 74, 112, 0.6)',
                                    'rgba(41, 74, 112, 0.4)',
                                    'rgba(41, 74, 112, 0.2)'
                                ],
                                borderColor: [
                                    'rgba(41, 74, 112, 1)',
                                    'rgba(41, 74, 112, 1)',
                                    'rgba(41, 74, 112, 1)',
                                    'rgba(41, 74, 112, 1)'
                                ],
                                borderWidth: 1,
                                borderRadius: 5
                            }]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: { precision: 0 }
                                }
                            }
                        }
                    });
                }
            }

        } else {
            console.error('Failed to load stats');
        }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
}

function animateValue(id, end) {
    const obj = document.getElementById(id);
    if (!obj) return;
    
    const start = parseInt(obj.innerText) || 0;
    const duration = 500; // ms
    let startTimestamp = null;
    
    const endVal = parseInt(end) || 0;

    if (start === endVal) {
        obj.innerText = endVal;
        return;
    }

    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // Easing function (easeOutQuad)
        const easeOut = progress * (2 - progress);
        
        obj.innerText = Math.floor(easeOut * (endVal - start) + start);
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerText = endVal;
        }
    };
    
    window.requestAnimationFrame(step);
}

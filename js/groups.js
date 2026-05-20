document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.querySelector('#groups-table tbody');
    const searchInput = document.getElementById('search-groups');
    
    let groups = [];
    try {
        const res = await fetch('data/groups.json');
        if (res.ok) groups = await res.json();
    } catch (e) {
        console.error("Failed to load groups", e);
    }

    const renderTable = (data) => {
        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3">No groups found.</td></tr>';
            return;
        }
        data.forEach(g => {
            const tr = document.createElement('tr');
            const desc = g.description ? (g.description.length > 200 ? g.description.substring(0, 200) + '...' : g.description) : 'No description available';
            const locationsCount = g.locations ? g.locations.length : 0;
            const activeLocations = g.locations ? g.locations.filter(l => l.available).length : 0;
            const badgeStyle = activeLocations > 0 ? 'color: #34d399; background: rgba(52, 211, 153, 0.15); border-color: rgba(52, 211, 153, 0.3);' : '';
            
            tr.innerHTML = `
                <td><strong><a href="group.html?name=${encodeURIComponent(g.name || '')}" class="url-link">${g.name || 'Unknown'}</a></strong></td>
                <td><small style="color: #94a3b8;">${desc}</small></td>
                <td><span class="group-badge" style="${badgeStyle}">${activeLocations} / ${locationsCount} active</span></td>
            `;
            tbody.appendChild(tr);
        });
    };

    renderTable(groups);

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = groups.filter(g => {
                const name = (g.name || '').toLowerCase();
                const desc = (g.description || '').toLowerCase();
                return name.includes(query) || desc.includes(query);
            });
            renderTable(filtered);
        });
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.querySelector('#groups-table tbody');
    const searchInput = document.getElementById('search-groups');
    
    let groups = [];
    try {
        const res = await fetch('data/groups.json');
        if (res.ok) {
            const data = await res.json();
            groups = data.groups || (Array.isArray(data) ? data : []);
        }
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
            const groupName = g.group || g.name || 'Unknown';
            const altName = g.altname || 'None';
            const victimsCount = g.victims !== undefined ? g.victims : 0;
            
            tr.innerHTML = `
                <td><strong><a href="group.html?name=${encodeURIComponent(groupName)}" class="url-link">${groupName}</a></strong></td>
                <td><small style="color: #94a3b8;">Alt Name: ${altName}</small></td>
                <td><span class="group-badge" style="color: #38bdf8; background: rgba(56, 189, 248, 0.15); border-color: rgba(56, 189, 248, 0.3);">${victimsCount} victims</span></td>
            `;
            tbody.appendChild(tr);
        });
    };

    renderTable(groups);

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = groups.filter(g => {
                const name = (g.group || g.name || '').toLowerCase();
                const alt = (g.altname || '').toLowerCase();
                return name.includes(query) || alt.includes(query);
            });
            renderTable(filtered);
        });
    }
});

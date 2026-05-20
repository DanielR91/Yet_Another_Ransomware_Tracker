document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.querySelector('#victims-table tbody');
    const searchInput = document.getElementById('search-victims');
    
    let victims = [];
    try {
        const res = await fetch('data/recentvictims.json');
        if (res.ok) victims = await res.json();
    } catch (e) {
        console.error("Failed to load victims", e);
    }

    const renderTable = (data) => {
        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No victims found.</td></tr>';
            return;
        }
        data.forEach(v => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${v.victim || v.post_title || 'Unknown'}</strong></td>
                <td><a href="group.html?name=${encodeURIComponent(v.group || v.group_name || '')}" class="group-badge" style="text-decoration: none;">${v.group || v.group_name || 'Unknown'}</a></td>
                <td>${v.attackdate || v.discovered || 'N/A'}</td>
                <td>${v.country || 'N/A'}</td>
                <td>${v.url ? `<a href="${v.url}" target="_blank" class="url-link">Link <i class="fa-solid fa-external-link-alt" style="font-size:0.7em;"></i></a>` : 'N/A'}</td>
            `;
            tbody.appendChild(tr);
        });
    };

    renderTable(victims);

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = victims.filter(v => {
                const title = (v.victim || v.post_title || '').toLowerCase();
                const group = (v.group || v.group_name || '').toLowerCase();
                const country = (v.country || '').toLowerCase();
                return title.includes(query) || group.includes(query) || country.includes(query);
            });
            renderTable(filtered);
        });
    }
});

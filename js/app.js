document.addEventListener('DOMContentLoaded', async () => {
    // 1. Fetch Data
    const [recentVictimsRes, groupsRes, statsRes, sectorsRes, secRes, pressRes] = await Promise.all([
        fetch('data/recentvictims.json').catch(() => null),
        fetch('data/groups.json').catch(() => null),
        fetch('data/stats.json').catch(() => null),
        fetch('data/sectors.json').catch(() => null),
        fetch('data/8k.json').catch(() => null),
        fetch('data/press.json').catch(() => null)
    ]);

    let victims = [], groups = [], stats = {}, sectors = [], sec8k = [], press = [];

    if (recentVictimsRes && recentVictimsRes.ok) victims = await recentVictimsRes.json();
    if (groupsRes && groupsRes.ok) groups = await groupsRes.json();
    if (statsRes && statsRes.ok) stats = await statsRes.json();
    if (sectorsRes && sectorsRes.ok) sectors = await sectorsRes.json();
    if (secRes && secRes.ok) sec8k = await secRes.json();
    if (pressRes && pressRes.ok) press = await pressRes.json();

    // Update time based on last victim
    if (victims.length > 0) {
        const latestDate = victims.reduce((latest, v) => {
            return (v.discovered && v.discovered > latest) ? v.discovered : latest;
        }, victims[0].discovered || victims[0].attackdate || '');
        document.getElementById('update-time').textContent = latestDate ? latestDate.split(' ')[0] : 'Just now';
    }

    // 2. Populate Metrics (from stats if available, else fallback)
    document.getElementById('total-victims').textContent = (stats && stats.stats && stats.stats.victims) ? stats.stats.victims : victims.length;
    document.getElementById('active-groups').textContent = (stats && stats.stats && stats.stats.groups) ? stats.stats.groups : groups.length;
    document.getElementById('press-count').textContent = (stats && stats.stats && stats.stats.press) ? stats.stats.press : press.length;

    // 3. Populate Victims Table (Top 5 only)
    const tbody = document.querySelector('#victims-table tbody');
    if (tbody) {
        tbody.innerHTML = '';
        victims.slice(0, 5).forEach(v => {
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
    }

    // 4. Populate Groups Table (Top 5 only)
    const groupsTbody = document.querySelector('#groups-table tbody');
    if (groupsTbody) {
        groupsTbody.innerHTML = '';
        groups.slice(0, 5).forEach(g => {
            const tr = document.createElement('tr');
            const desc = g.description ? (g.description.length > 100 ? g.description.substring(0, 100) + '...' : g.description) : 'No description available';
            const locationsCount = g.locations ? g.locations.length : 0;
            const activeLocations = g.locations ? g.locations.filter(l => l.available).length : 0;
            const badgeStyle = activeLocations > 0 ? 'color: #34d399; background: rgba(52, 211, 153, 0.15); border-color: rgba(52, 211, 153, 0.3);' : '';
            tr.innerHTML = `
                <td><strong><a href="group.html?name=${encodeURIComponent(g.name || '')}" class="url-link">${g.name || 'Unknown'}</a></strong></td>
                <td><small style="color: #94a3b8;">${desc}</small></td>
                <td><span class="group-badge" style="${badgeStyle}">${activeLocations} / ${locationsCount} active</span></td>
            `;
            groupsTbody.appendChild(tr);
        });
    }

    // 5. Render Charts (Chart.js)
    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = "'Inter', sans-serif";

        // Group Chart
        const groupCtx = document.getElementById('groupChart');
        if (groupCtx) {
            const groupCounts = {};
            victims.forEach(v => {
                const g = v.group || v.group_name || 'Unknown';
                groupCounts[g] = (groupCounts[g] || 0) + 1;
            });
            const sortedGroups = Object.entries(groupCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
            new Chart(groupCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: sortedGroups.map(g => g[0]),
                    datasets: [{
                        data: sortedGroups.map(g => g[1]),
                        backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
                        borderWidth: 0, hoverOffset: 10
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } }, cutout: '70%' }
            });
        }

        // Countries Chart
        const countryCtx = document.getElementById('countryChart');
        if (countryCtx) {
            const countryCounts = {};
            victims.forEach(v => {
                if(v.country) countryCounts[v.country] = (countryCounts[v.country] || 0) + 1;
            });
            const sortedCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
            new Chart(countryCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: sortedCountries.map(c => c[0]),
                    datasets: [{
                        label: 'Victims', data: sortedCountries.map(c => c[1]),
                        backgroundColor: 'rgba(59, 130, 246, 0.7)', borderColor: '#3b82f6', borderWidth: 1, borderRadius: 4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } } }
            });
        }

        // Sectors Chart
        const sectorCtx = document.getElementById('sectorChart');
        if (sectorCtx && sectors.length > 0) {
            const topSectors = sectors.sort((a, b) => b.count - a.count).slice(0, 5);
            new Chart(sectorCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: topSectors.map(s => s.sector),
                    datasets: [{
                        data: topSectors.map(s => s.count),
                        backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'],
                        borderWidth: 0, hoverOffset: 10
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } }, cutout: '70%' }
            });
        } else if (sectorCtx) {
            sectorCtx.outerHTML = '<p>No sector data available yet.</p>';
        }
    }

    // 6. SEC Feed
    const secFeed = document.getElementById('sec-feed');
    if (secFeed) {
        if (sec8k && sec8k.length > 0) {
            secFeed.innerHTML = sec8k.slice(0, 20).map(s => `
                <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding: 0.8rem 0;">
                    <div style="color: var(--accent-secondary); font-weight: bold;">${s.companyName} (${s.ticker || s.cik})</div>
                    <div><small>${s.dateFiled} - Item ${s.item}</small></div>
                    <div style="margin-top: 0.5rem;"><a href="${s.linkToTxt}" target="_blank" class="url-link">View Filing</a></div>
                </div>
            `).join('');
        } else {
            secFeed.innerHTML = '<p>No 8-K disclosures available.</p>';
        }
    }

    // 7. Press Feed
    const pressFeed = document.getElementById('press-feed');
    if (pressFeed) {
        if (press && press.length > 0) {
            pressFeed.innerHTML = press.slice(0, 20).map(p => `
                <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding: 0.8rem 0;">
                    <div style="color: var(--accent-primary); font-weight: bold;"><a href="${p.url}" target="_blank" style="color: inherit; text-decoration: none;">${p.title || 'Press Release'}</a></div>
                    <div><small>${p.date} ${p.country ? '- ' + p.country : ''}</small></div>
                    ${p.infostealer && p.infostealer.users ? `<div style="margin-top: 0.5rem;"><span class="group-badge" style="color: #f59e0b; border-color: rgba(245,158,11,0.3); background: rgba(245,158,11,0.1);"><i class="fa-solid fa-key"></i> ${p.infostealer.users} compromised credentials</span></div>` : ''}
                </div>
            `).join('');
        } else {
            pressFeed.innerHTML = '<p>No press intelligence available.</p>';
        }
    }

});

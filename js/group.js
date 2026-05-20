document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const groupName = urlParams.get('name');

    if (!groupName) {
        document.getElementById('group-title').textContent = "Group Not Found";
        document.getElementById('group-description').textContent = "No group name provided in the URL.";
        return;
    }

    document.title = `${groupName.toUpperCase()} - Ransomware Group`;

    const fetchJson = async (file) => {
        try {
            const res = await fetch(`data/groups/${encodeURIComponent(groupName)}/${file}`);
            if (!res.ok) return null;
            return await res.json();
        } catch {
            return null;
        }
    };

    const [infoData, victimsRaw, iocsRaw, yaraRaw, negotiationsRaw, notesListRaw] = await Promise.all([
        fetchJson('info.json'),
        fetchJson('victims.json'),
        fetchJson('iocs.json'),
        fetchJson('yara.json'),
        fetchJson('negotiations.json'),
        fetchJson('notes_list.json')
    ]);

    const info = infoData;
    const victims = victimsRaw ? (victimsRaw.victims || (Array.isArray(victimsRaw) ? victimsRaw : [])) : [];
    const iocs = iocsRaw ? (iocsRaw.iocs || iocsRaw) : null;
    const yara = yaraRaw ? (yaraRaw.rules || (Array.isArray(yaraRaw) ? yaraRaw : [])) : [];
    const negotiations = negotiationsRaw ? (negotiationsRaw.chats || (Array.isArray(negotiationsRaw) ? negotiationsRaw : [])) : [];
    const notesList = notesListRaw ? (notesListRaw.ransomnotes || (Array.isArray(notesListRaw) ? notesListRaw : [])) : [];

    // Populate Info
    if (info) {
        document.getElementById('group-title').textContent = info.name || groupName.toUpperCase();
        document.getElementById('group-description').textContent = info.description || 'No description available.';
        document.getElementById('first-seen').textContent = info.firstseen || 'Unknown';
        document.getElementById('last-seen').textContent = info.lastseen || 'Unknown';
        document.getElementById('group-victim-count').textContent = info.victims || '0';

        const sitesList = document.getElementById('leak-sites');
        if (info.locations && info.locations.length > 0) {
            sitesList.innerHTML = info.locations.map(l => {
                const statusColor = l.available ? '#34d399' : '#ef4444';
                const statusText = l.available ? 'Online' : 'Offline';
                return `<li><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${statusColor};margin-right:8px;"></span><a href="${l.slug}" target="_blank" class="url-link" style="word-break:break-all;">${l.fqdn}</a> <small>(${statusText})</small></li>`;
            }).join('');
        } else {
            sitesList.innerHTML = '<li>No known leak sites.</li>';
        }

        const toolsCves = document.getElementById('tools-cves');
        let tcHtml = '';
        if (info.tools && info.tools.length > 0) {
            tcHtml += `<p><strong>Tools:</strong> ${info.tools.join(', ')}</p>`;
        }
        if (info.vulnerabilities && info.vulnerabilities.length > 0) {
            tcHtml += `<p class="mt-4"><strong>CVEs:</strong> ${info.vulnerabilities.map(v => v.cve).join(', ')}</p>`;
        }
        toolsCves.innerHTML = tcHtml || 'No tools or CVEs listed.';
    } else {
        document.getElementById('group-title').textContent = groupName.toUpperCase();
        document.getElementById('group-description').textContent = "Detailed info not synced yet.";
    }

    // Populate Victims
    const tbody = document.querySelector('#group-victims-table tbody');
    if (victims && victims.length > 0) {
        tbody.innerHTML = '';
        victims.forEach(v => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${v.victim || v.post_title || 'Unknown'}</strong></td>
                <td>${v.attackdate || v.discovered || 'N/A'}</td>
                <td>${v.country || 'N/A'}</td>
                <td>${v.activity || 'N/A'}</td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="4">No victims found for this group.</td></tr>';
    }

    // Populate IOCs
    const iocsContent = document.getElementById('iocs-content');
    if (iocs && Object.keys(iocs).length > 0 && !iocs.error) {
        let html = '';
        for (const [type, indicators] of Object.entries(iocs)) {
            if (Array.isArray(indicators) && indicators.length > 0) {
                html += `<div style="margin-bottom: 1rem;"><strong>${type.toUpperCase()}</strong>: <div style="background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 4px; font-family: monospace; font-size: 0.85rem; max-height: 200px; overflow-y: auto;">${indicators.join('<br>')}</div></div>`;
            }
        }
        iocsContent.innerHTML = html || 'No concrete IOCs provided.';
    } else {
        iocsContent.innerHTML = 'No IOCs found for this group.';
    }

    // Populate Negotiations
    const negContent = document.getElementById('negotiations-content');
    if (negotiations && negotiations.length > 0) {
        let nHtml = `<div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:1rem;">`;
        negotiations.forEach(n => {
            nHtml += `<button class="neg-btn" data-id="${n.id}" style="padding: 5px 10px; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.5); color: #fff; border-radius: 4px; cursor: pointer;">Chat: ${n.id}</button>`;
        });
        nHtml += `</div><div id="chat-viewer" style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 4px; display:none; max-height: 400px; overflow-y: auto;"></div>`;
        negContent.innerHTML = nHtml;

        document.querySelectorAll('.neg-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const chatId = e.target.getAttribute('data-id');
                const chatViewer = document.getElementById('chat-viewer');
                chatViewer.style.display = 'block';
                chatViewer.innerHTML = 'Loading chat...';
                
                const chatData = await fetchJson(`chat_${chatId}.json`);
                if (chatData) {
                    let cHtml = `<h4>Chat Info</h4>`;
                    cHtml += `<p>Initial Ransom: ${chatData.initialransom || 'N/A'}</p>`;
                    cHtml += `<p>Negotiated Ransom: ${chatData.negotiatedransom || 'N/A'}</p>`;
                    cHtml += `<p>Paid: ${chatData.paid ? 'Yes' : 'No'}</p><hr style="border-color: rgba(255,255,255,0.1); margin: 10px 0;">`;
                    if (chatData.messages && chatData.messages.length > 0) {
                        chatData.messages.forEach(m => {
                            cHtml += `<div style="margin-bottom: 10px;"><strong>${m.role || 'Unknown'}</strong>: <br><span style="color:#cbd5e1;">${m.message || m.text || m.content || JSON.stringify(m)}</span></div>`;
                        });
                    }
                    chatViewer.innerHTML = cHtml;
                } else {
                    chatViewer.innerHTML = 'Failed to load chat data. Full sync might not have run.';
                }
            });
        });
    } else {
        negContent.innerHTML = 'No negotiation chats found.';
    }

    // Populate Ransom Notes
    const notesContent = document.getElementById('notes-content');
    if (notesList && notesList.length > 0) {
        let ntHtml = `<div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:1rem;">`;
        notesList.forEach(nt => {
            ntHtml += `<button class="note-btn" data-id="${nt}" style="padding: 5px 10px; background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.5); color: #fff; border-radius: 4px; cursor: pointer;">Note: ${nt}</button>`;
        });
        ntHtml += `</div><div id="note-viewer" style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 4px; font-family: monospace; white-space: pre-wrap; display:none; max-height: 400px; overflow-y: auto;"></div>`;
        notesContent.innerHTML = ntHtml;

        document.querySelectorAll('.note-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const noteId = e.target.getAttribute('data-id');
                const noteViewer = document.getElementById('note-viewer');
                noteViewer.style.display = 'block';
                noteViewer.innerHTML = 'Loading note...';
                
                const noteData = await fetchJson(`note_${noteId}.json`);
                if (noteData && noteData.content) {
                    noteViewer.textContent = noteData.content;
                } else {
                    noteViewer.innerHTML = 'Failed to load note data. Full sync might not have run.';
                }
            });
        });
    } else {
        notesContent.innerHTML = 'No ransom notes found.';
    }

    // Populate YARA
    const yaraContent = document.getElementById('yara-content');
    if (yara && yara.length > 0) {
        let yHtml = '';
        yara.forEach(y => {
            yHtml += `<h5 style="margin-bottom: 0.5rem; color: var(--accent-primary);">${y.filename || 'Rule'}</h5>`;
            yHtml += `<pre style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 4px; color: #a3e635; font-size: 0.85rem; overflow-x: auto; margin-bottom: 1rem;"><code>${y.content || JSON.stringify(y)}</code></pre>`;
        });
        yaraContent.innerHTML = yHtml;
    } else {
        yaraContent.innerHTML = 'No YARA rules found.';
    }
});

(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);
    const getBase = () => $('baseUrl').value.trim().replace(/\/+$/, '');
    const setStatus = (msg) => $('status').textContent = msg;
    const unwrap = (x) => (x && typeof x === 'object' && 'data' in x) ? x.data : x;

    const ep = {
        docs: (b) => b + '/docs',
        upload: (b) => b + '/upload',
        uploadFile: (b) => b + '/upload/file',
        ranking: (b, id) => b + '/matches/' + encodeURIComponent(id) + '/ranking',
        teams: (b, id) => b + '/matches/' + encodeURIComponent(id) + '/teams',
        global: (b, l, o) => b + '/players/global-ranking?limit=' + l + '&offset=' + o,
    };

    const awardsText = (a) => {
        if (!a) return '';
        return [a.invincible && 'Invencível', a.fiveInOneMinute && '5 em 1 min']
            .filter(Boolean)
            .join(' | ');
    };

    function renderWinner(w) {
        const el = $('winner');
        if (!w) { el.style.display = 'none'; el.textContent = ''; return; }
        el.textContent = 'Vencedor: ' + (w.player || '-') + (w.favoriteWeapon ? ' • arma: ' + w.favoriteWeapon : '');
        el.style.display = 'inline-block';
    }

    function renderRanking(rows) {
        const table = $('ranking');
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = (rows || []).map(r =>
            '<tr>' +
            '<td>' + r.player + '</td>' +
            '<td>' + r.frags + '</td>' +
            '<td>' + r.deaths + '</td>' +
            '<td>' + r.maxStreak + '</td>' +
            '<td>' + awardsText(r.awards) + '</td>' +
            '</tr>'
        ).join('');
        table.style.display = rows && rows.length ? 'table' : 'none';
    }

    function renderTeamsForm(players, matchId) {
        const wrap = $('teamsWrap');
        const actions = $('teamsActions');

        if (!players || players.length === 0) {
            wrap.textContent = 'Busque o ranking para carregar jogadores.';
            actions.style.display = 'none';
            return;
        }

        wrap.innerHTML = players.map(p =>
            '<div class="row" style="margin-bottom:6px">' +
            '<label class="field" style="flex:1 1 280px">Jogador' +
            '<input type="text" data-player readonly value="' + p + '">' +
            '</label>' +
            '<label class="field" style="flex:1 1 200px">Time' +
            '<input type="text" data-team placeholder="Ex.: Red">' +
            '</label>' +
            '</div>'
        ).join('');

        actions.style.display = 'flex';

        $('saveTeams').onclick = async function () {
            const rows = Array.from(wrap.querySelectorAll('div.row'));
            const assignments = rows.map(r => ({
                playerName: r.querySelector('input[data-player]').value.trim(),
                teamName: r.querySelector('input[data-team]').value.trim(),
            })).filter(x => x.playerName && x.teamName);

            $('teamsMsg').textContent = '';
            setStatus('Salvando times...');
            try {
                const res = await fetch(ep.teams(getBase(), matchId), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ matchId, assignments }),
                });
                const data = unwrap(await res.json());
                if (!res.ok) throw new Error((data && data.message) || res.statusText);
                $('teamsMsg').textContent = 'Times salvos.';
                setStatus('OK');
            } catch (err) {
                $('teamsMsg').textContent = 'Erro: ' + (err && err.message ? err.message : err);
                setStatus('Erro');
            }
        };
    }

    async function doUploadText() {
        $('uploadMsg').textContent = '';
        setStatus('Enviando...');
        try {
            const res = await fetch(ep.upload(getBase()), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: $('logText').value }),
            });
            const data = unwrap(await res.json());
            const matches = (data && data.matches) || [];
            if (matches.length) {
                const ids = matches.map(m => m.matchId || m.id).filter(Boolean);
                $('uploadMsg').textContent = 'IDs: ' + ids.join(', ');
                if (ids[0]) $('matchId').value = ids[0];
            } else {
                $('uploadMsg').textContent = 'Upload ok. Informe o Match ID e clique em Buscar.';
            }
            setStatus('OK');
        } catch (err) {
            $('uploadMsg').textContent = 'Erro: ' + (err && err.message ? err.message : err);
            setStatus('Erro');
        }
    }

    async function doUploadFile() {
        const f = $('logFile').files[0];
        if (!f) { alert('Selecione um arquivo'); return; }
        $('uploadMsg').textContent = '';
        setStatus('Enviando...');
        const fd = new FormData(); fd.append('file', f);
        try {
            const res = await fetch(ep.uploadFile(getBase()), { method: 'POST', body: fd });
            const data = unwrap(await res.json());
            const matches = (data && data.matches) || [];
            if (matches.length) {
                const ids = matches.map(m => m.matchId || m.id).filter(Boolean);
                $('uploadMsg').textContent = 'IDs: ' + ids.join(', ');
                if (ids[0]) $('matchId').value = ids[0];
            } else {
                $('uploadMsg').textContent = 'Upload ok. Informe o Match ID e clique em Buscar.';
            }
            setStatus('OK');
        } catch (err) {
            $('uploadMsg').textContent = 'Erro: ' + (err && err.message ? err.message : err);
            setStatus('Erro');
        }
    }

    async function loadRanking() {
        const id = $('matchId').value.trim();
        if (!id) { alert('Informe o Match ID'); return; }
        setStatus('Carregando...');
        try {
            const res = await fetch(ep.ranking(getBase(), id));
            const data = unwrap(await res.json());
            renderWinner(data && data.winner ? data.winner : null);
            renderRanking(data && data.ranking ? data.ranking : []);
            const players = (data && data.ranking ? data.ranking : []).map(r => r.player);
            renderTeamsForm(players, id);
            setStatus('OK');
        } catch (err) {
            renderWinner(null);
            renderRanking([]);
            $('teamsWrap').textContent = 'Erro ao carregar ranking.';
            setStatus('Erro');
        }
    }

    async function loadGlobal(limit, offset) {
        setStatus('Carregando...');
        try {
            const res = await fetch(ep.global(getBase(), limit, offset));
            const data = unwrap(await res.json());
            const items = (data && data.items) || [];
            const table = $('global');
            const tbody = table.querySelector('tbody');
            tbody.innerHTML = items.map((it, i) => {
                const kd = Number(it.kd ?? 0).toFixed(2);
                return '<tr>' +
                    '<td>' + (offset + i + 1) + '</td>' +
                    '<td>' + it.player + '</td>' +
                    '<td>' + it.totalFrags + '</td>' +
                    '<td>' + it.totalDeaths + '</td>' +
                    '<td>' + kd + '</td>' +
                    '<td>' + it.wins + '</td>' +
                    '<td>' + it.bestStreak + '</td>' +
                    '</tr>';
            }).join('');
            table.style.display = items.length ? 'table' : 'none';
            $('globalMsg').textContent = 'Total: ' + (data && data.total != null ? data.total : items.length);
            setStatus('OK');
        } catch (err) {
            $('globalMsg').textContent = 'Erro: ' + (err && err.message ? err.message : err);
            setStatus('Erro');
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        if ($('baseUrl') && !$('baseUrl').value) {
            $('baseUrl').value = window.location.origin;
        }
        $('openDocs').onclick = () => window.open(ep.docs(getBase()), '_blank');
        $('doUploadText').onclick = doUploadText;
        $('doUploadFile').onclick = doUploadFile;
        $('loadRanking').onclick = loadRanking;
        $('loadGlobal').onclick = function () {
            const limit = Math.max(1, parseInt($('limit').value || '20', 10));
            const offset = Math.max(0, parseInt($('offset').value || '0', 10));
            loadGlobal(limit, offset);
        };
        $('prev').onclick = function () {
            const limit = Math.max(1, parseInt($('limit').value || '20', 10));
            const offset = Math.max(0, parseInt($('offset').value || '0', 10) - limit);
            $('offset').value = String(offset);
            loadGlobal(limit, offset);
        };
        $('next').onclick = function () {
            const limit = Math.max(1, parseInt($('limit').value || '20', 10));
            const offset = Math.max(0, parseInt($('offset').value || '0', 10) + limit);
            $('offset').value = String(offset);
            loadGlobal(limit, offset);
        };
    });
})();

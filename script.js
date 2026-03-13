/**
 * THE HUSTLE CULTURE - CORE ENGINE
 * Algorithmic Strategy: Brute-Force Power Set Validation
 * Reasoning: Since N is typically < 20, 2^N is the only way to guarantee 100% 
 * accuracy with state-dependent capacity (Fatigue Rule).
 */

document.getElementById('add-project').addEventListener('click', () => {
    const container = document.getElementById('project-inputs');
    const newRow = container.children[0].cloneNode(true);
    newRow.querySelectorAll('input').forEach(i => i.value = '');
    container.appendChild(newRow);
});

document.getElementById('calculate-btn').addEventListener('click', () => {
    const rawProjects = Array.from(document.querySelectorAll('.project-row')).map((row, i) => ({
        id: i,
        name: row.querySelector('.p-name').value || `PROJ-${i+1}`,
        start: parseInt(row.querySelector('.p-start').value),
        end: parseInt(row.querySelector('.p-end').value),
        cost: parseInt(row.querySelector('.p-cost').value),
        reward: parseInt(row.querySelector('.p-reward').value)
    })).filter(p => !isNaN(p.start) && p.reward > 0);

    if (rawProjects.length === 0) return;

    // 1. Generate all possible project combinations
    const getSubsets = (arr) => arr.reduce((subsets, value) => subsets.concat(subsets.map(set => [value, ...set])), [[]]);
    const allOptions = getSubsets(rawProjects);
    
    let globalBest = { revenue: 0, subset: [], log: [] };

    // 2. Validate every single world-line
    allOptions.forEach(subset => {
        const result = runSimulation(subset);
        if (result.isValid && result.revenue > globalBest.revenue) {
            globalBest = result;
        }
    });

    renderDashboard(globalBest);
});

function runSimulation(subset) {
    let energy = 100;
    let revenue = 0;
    let log = [];
    
    // Determine timeline range
    const maxDay = subset.length > 0 ? Math.max(...subset.map(p => p.end)) : 0;

    for (let d = 1; d <= maxDay; d++) {
        const active = subset.filter(p => d >= p.start && d <= p.end);
        const dailyCost = active.reduce((acc, p) => acc + p.cost, 0);
        
        const startEnergy = energy;
        if (dailyCost > startEnergy) return { isValid: false }; // Exhausted!
        
        const endEnergy = startEnergy - dailyCost;
        log.push({ day: d, start: startEnergy, cost: dailyCost, end: endEnergy });
        
        // Recharge 80, cap at 100
        energy = Math.min(100, endEnergy + 80);
    }

    revenue = subset.reduce((acc, p) => acc + p.reward, 0);
    return { isValid: true, revenue, subset, log };
}

function renderDashboard(res) {
    const area = document.getElementById('results-area');
    area.classList.remove('results-hidden');
    area.classList.add('results-visible');
    
    document.getElementById('total-reward-display').innerText = `$${res.revenue.toLocaleString()}`;
    
    document.getElementById('selected-projects-list').innerHTML = res.subset
        .map(p => `<li><strong>${p.name}</strong><br><small style="color:var(--dim)">Yield: $${p.reward} | Impact: ${p.cost}u/day</small></li>`)
        .join('');

    document.getElementById('capacity-log').innerHTML = res.log.map(l => `
        <div class="log-entry">
            <span>DAY ${l.day.toString().padStart(2, '0')}</span>
            <span style="color:var(--green)">⚡ ${l.start}u</span>
            <span style="color:var(--copper)">-${l.cost}u</span>
        </div>
    `).join('');
    
    window.scrollTo({ top: area.offsetTop - 50, behavior: 'smooth' });
}

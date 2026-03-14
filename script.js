document.getElementById('add-project').addEventListener('click', () => {
    const container = document.getElementById('project-inputs');
    const newRow = container.children[0].cloneNode(true);
    newRow.querySelectorAll('input').forEach(i => i.value = '');
    container.appendChild(newRow);
});

document.getElementById('calculate-btn').addEventListener('click', () => {
    const rawProjects = Array.from(document.querySelectorAll('.project-row')).map((row, i) => {
        // ERROR FIX: Ensure all numbers are positive using Math.abs and default to 0
        const start = Math.abs(parseInt(row.querySelector('.p-start').value)) || 0;
        const end = Math.abs(parseInt(row.querySelector('.p-end').value)) || 0;
        const cost = Math.abs(parseInt(row.querySelector('.p-cost').value)) || 0;
        const reward = Math.abs(parseInt(row.querySelector('.p-reward').value)) || 0;

        return {
            id: i,
            name: row.querySelector('.p-name').value || `PROJ-${i+1}`,
            start: start,
            end: Math.max(start, end), // Ensure end day isn't before start day
            cost: cost,
            reward: reward
        };
    }).filter(p => p.start > 0 && p.reward > 0);

    if (rawProjects.length === 0) {
        alert("Bhai, enter valid project data first!");
        return;
    }

    const getSubsets = (arr) => arr.reduce((subsets, value) => subsets.concat(subsets.map(set => [value, ...set])), [[]]);
    const allOptions = getSubsets(rawProjects);
    
    let globalBest = { revenue: 0, subset: [], log: [] };

    allOptions.forEach(subset => {
        const result = runSimulation(subset);
        if (result.isValid && result.revenue > globalBest.revenue) {
            globalBest = result;
        }
    });

    if (globalBest.revenue === 0) {
        alert("Logic Alert: No combination is possible without burning out! Reduce cost or separate the dates.");
    } else {
        renderDashboard(globalBest);
    }
});

function runSimulation(subset) {
    let energy = 100;
    let log = [];
    const maxDay = subset.length > 0 ? Math.max(...subset.map(p => p.end)) : 0;
    const minDay = Math.min(...subset.map(p => p.start));

    for (let d = 1; d <= maxDay; d++) {
        const active = subset.filter(p => d >= p.start && d <= p.end);
        const dailyCost = active.reduce((acc, p) => acc + p.cost, 0);
        
        const startEnergy = energy;
        if (dailyCost > startEnergy) return { isValid: false }; // DAA Logic: Constraint Violated
        
        const postWorkEnergy = startEnergy - dailyCost;
        // Recharge logic
        const rechargedEnergy = Math.min(100, postWorkEnergy + 80);
        
        log.push({ 
            day: d, 
            start: startEnergy, 
            cost: dailyCost, 
            afterRest: rechargedEnergy 
        });
        
        energy = rechargedEnergy;
    }

    const revenue = subset.reduce((acc, p) => acc + p.reward, 0);
    return { isValid: true, revenue, subset, log };
}

function renderDashboard(res) {
    const area = document.getElementById('results-area');
    area.classList.remove('results-hidden');
    area.classList.add('results-visible');
    
    document.getElementById('total-reward-display').innerText = `$${res.revenue.toLocaleString()}`;
    document.getElementById('logic-summary').innerText = `Calculated across ${res.log.length} days using Power Set Optimization.`;
    
    document.getElementById('selected-projects-list').innerHTML = res.subset
        .map(p => `<li><strong>${p.name}</strong><br><small style="color:var(--dim)">Day ${p.start}-${p.end} | Cost: ${p.cost}u/day</small></li>`)
        .join('');

    document.getElementById('capacity-log').innerHTML = res.log.map(l => `
        <div class="log-entry">
            <span>DAY ${l.day}</span>
            <span style="color:var(--text)">${l.start}u</span>
            <span style="color:var(--copper)">-${l.cost}u</span>
            <span style="color:var(--green)">⚡${l.afterRest}u</span>
        </div>
    `).join('');
    
    window.scrollTo({ top: area.offsetTop - 50, behavior: 'smooth' });
}

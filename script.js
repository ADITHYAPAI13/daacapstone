document.getElementById('add-project').addEventListener('click', () => {
    const row = document.querySelector('.project-row').cloneNode(true);
    row.querySelectorAll('input').forEach(input => input.value = '');
    document.getElementById('project-inputs').appendChild(row);
});

document.getElementById('calculate-btn').addEventListener('click', startOptimization);

function startOptimization() {
    // 1. Collect & Sanitize Inputs
    const projects = Array.from(document.querySelectorAll('.project-row')).map((row, i) => {
        const startRaw = parseInt(row.querySelector('.p-start').value);
        const endRaw = parseInt(row.querySelector('.p-end').value);
        const costRaw = parseInt(row.querySelector('.p-cost').value);
        const rewardRaw = parseInt(row.querySelector('.p-reward').value);

        // Sanitize: No negative days, costs, or rewards. End must be >= start.
        const start = Math.max(1, Math.abs(startRaw) || 0);
        const end = Math.max(start, Math.abs(endRaw) || 0);
        const cost = Math.abs(costRaw) || 0;
        const reward = Math.abs(rewardRaw) || 0;

        return {
            id: i,
            name: row.querySelector('.p-name').value || `Project ${i + 1}`,
            start, end, cost, reward
        };
    }).filter(p => p.reward > 0);

    if (projects.length === 0) return alert("Please enter valid positive project data.");

    const maxDay = Math.max(...projects.map(p => p.end), 0);

    // 2. DAA Algorithm: Exhaustive Power Set (2^N)
    const combinations = (arr) => arr.reduce((subsets, value) => 
        subsets.concat(subsets.map(set => [value, ...set])), [[]]
    );
    
    const allSchedules = combinations(projects);
    let bestResult = { revenue: 0, subset: [], log: [] };

    allSchedules.forEach(subset => {
        const sim = simulate(subset, maxDay);
        if (sim.isValid && sim.revenue > bestResult.revenue) {
            bestResult = sim;
        }
    });

    displayResults(bestResult);
}

function simulate(subset, maxDay) {
    let currentEnergy = 100;
    let dailyLog = [];

    for (let day = 1; day <= maxDay; day++) {
        const active = subset.filter(p => day >= p.start && day <= p.end);
        const dailyCost = active.reduce((sum, p) => sum + p.cost, 0);
        
        const energyAtStart = currentEnergy;
        
        // Burnout Condition
        if (dailyCost > energyAtStart) return { isValid: false };
        
        const energyAtEnd = energyAtStart - dailyCost;
        dailyLog.push({ day, start: energyAtStart, cost: dailyCost, end: energyAtEnd });

        // Fatigue recovery rule (+80 units, cap 100)
        currentEnergy = Math.min(100, energyAtEnd + 80);
    }

    const totalRevenue = subset.reduce((sum, p) => sum + p.reward, 0);
    return { isValid: true, revenue: totalRevenue, subset, log: dailyLog };
}

function displayResults(res) {
    const area = document.getElementById('results-area');
    area.className = 'results-visible';
    
    document.getElementById('total-reward-display').innerText = `$${res.revenue.toLocaleString()}`;
    
    const list = document.getElementById('selected-projects-list');
    list.innerHTML = res.subset.length > 0 
        ? res.subset.map(p => `<li><strong>${p.name}</strong><br><small>Reward: $${p.reward} | Cost: ${p.cost}u/day</small></li>`).join('')
        : "<li>No valid schedule fits your energy limit.</li>";

    const log = document.getElementById('capacity-log');
    log.innerHTML = res.log.map(s => `
        <div class="log-entry">
            <span>Day ${s.day}</span>
            <span style="color:var(--sage)">⚡ ${s.start} → ${s.end}</span>
            <span style="color:var(--accent-copper)">-${s.cost}u</span>
        </div>
    `).join('');
    
    area.scrollIntoView({ behavior: 'smooth' });
}

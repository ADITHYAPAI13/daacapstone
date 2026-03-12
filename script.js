document.getElementById('add-project').addEventListener('click', () => {
    const row = document.querySelector('.project-row').cloneNode(true);
    row.querySelectorAll('input').forEach(input => input.value = '');
    document.getElementById('project-inputs').appendChild(row);
});

document.getElementById('calculate-btn').addEventListener('click', startOptimization);

function startOptimization() {
    // Collect Inputs
    const projects = Array.from(document.querySelectorAll('.project-row')).map((row, i) => ({
        id: i,
        name: row.querySelector('.p-name').value || `Project ${i + 1}`,
        start: parseInt(row.querySelector('.p-start').value),
        end: parseInt(row.querySelector('.p-end').value),
        cost: parseInt(row.querySelector('.p-cost').value),
        reward: parseInt(row.querySelector('.p-reward').value)
    })).filter(p => !isNaN(p.start) && !isNaN(p.reward) && p.reward > 0);

    if (projects.length === 0) return alert("Please enter valid project data.");

    const maxDay = Math.max(...projects.map(p => p.end), 0);

    // DAA ALGORITHM: Power Set Approach
    // Generating all possible combinations 2^N to ensure global maximum.
    const combinations = (arr) => arr.reduce((subsets, value) => subsets.concat(subsets.map(set => [value, ...set])), [[]]);
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

/**
 * State Validation Logic
 * Follows the "Fatigue Rule": Start 100, Recharge +80 (Max 100)
 */
function simulate(subset, maxDay) {
    let currentEnergy = 100;
    let totalRevenue = 0;
    let dailyLog = [];

    for (let day = 1; day <= maxDay; day++) {
        const active = subset.filter(p => day >= p.start && day <= p.end);
        const dailyCost = active.reduce((sum, p) => sum + p.cost, 0);
        
        const energyAtStart = currentEnergy;
        
        // FEASIBILITY CHECK
        if (dailyCost > energyAtStart) return { isValid: false };
        
        const energyAtEnd = energyAtStart - dailyCost;
        dailyLog.push({ day, start: energyAtStart, cost: dailyCost, end: energyAtEnd });

        // OVERNIGHT RECHARGE
        currentEnergy = Math.min(100, energyAtEnd + 80);
    }

    totalRevenue = subset.reduce((sum, p) => sum + p.reward, 0);
    return { isValid: true, revenue: totalRevenue, subset, log: dailyLog };
}

function displayResults(res) {
    const area = document.getElementById('results-area');
    area.className = 'results-visible';
    
    document.getElementById('total-reward-display').innerText = `$${res.revenue}`;
    
    const list = document.getElementById('selected-projects-list');
    list.innerHTML = res.subset.length > 0 
        ? res.subset.map(p => `<li><strong>${p.name}</strong><br><small>Earned: $${p.reward}</small></li>`).join('')
        : "<li>No valid schedule found.</li>";

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

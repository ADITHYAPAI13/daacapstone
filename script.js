document.getElementById('add-project').addEventListener('click', () => {
    const row = document.querySelector('.project-row').cloneNode(true);
    row.querySelectorAll('input').forEach(input => input.value = '');
    document.getElementById('project-inputs').appendChild(row);
});

document.getElementById('calculate-btn').addEventListener('click', startOptimization);

function startOptimization() {
    const projects = Array.from(document.querySelectorAll('.project-row')).map(row => ({
        name: row.querySelector('.p-name').value,
        start: parseInt(row.querySelector('.p-start').value),
        end: parseInt(row.querySelector('.p-end').value),
        cost: parseInt(row.querySelector('.p-cost').value),
        reward: parseInt(row.querySelector('.p-reward').value)
    })).filter(p => p.name && !isNaN(p.reward));

    const maxDay = Math.max(...projects.map(p => p.end), 0);
    const memo = new Map();

    /**
     * Recursive solver with Memoization
     * @param {number} idx - Current project index being considered
     * @param {Array} currentSchedule - Array of currently selected projects
     */
    function solve(idx, currentSchedule) {
        if (idx === projects.length) {
            return calculateFeasibility(currentSchedule, maxDay);
        }

        const stateKey = `${idx}-${currentSchedule.map(p => p.name).sort().join(',')}`;
        if (memo.has(stateKey)) return memo.get(stateKey);

        // Option 1: Skip project
        const resSkip = solve(idx + 1, currentSchedule);

        // Option 2: Take project (if possible within daily limits)
        const resTake = solve(idx + 1, [...currentSchedule, projects[idx]]);

        const best = resTake.totalReward > resSkip.totalReward ? resTake : resSkip;
        memo.set(stateKey, best);
        return best;
    }

    const result = solve(0, []);
    displayResults(result, maxDay);
}

function calculateFeasibility(selectedProjects, maxDay) {
    let totalReward = 0;
    let dailyStats = [];
    let currentEnergy = 100;

    for (let day = 1; day <= maxDay; day++) {
        const startEnergy = currentEnergy;
        const activeProjects = selectedProjects.filter(p => day >= p.start && day <= p.end);
        const dailyCost = activeProjects.reduce((sum, p) => sum + p.cost, 0);

        if (dailyCost > startEnergy) {
            return { totalReward: -Infinity }; // Invalid path
        }

        const endEnergy = startEnergy - dailyCost;
        dailyStats.push({ day, startEnergy, dailyCost, endEnergy });
        
        // Overnight Recharge: Recover 80, max 100
        currentEnergy = Math.min(100, endEnergy + 80);
    }

    totalReward = selectedProjects.reduce((sum, p) => sum + p.reward, 0);
    return { totalReward, selectedProjects, dailyStats };
}

function displayResults(result, maxDay) {
    const area = document.getElementById('results-area');
    area.className = 'results-visible';
    
    document.getElementById('total-reward-display').innerText = `$${result.totalReward}`;
    
    const list = document.getElementById('selected-projects-list');
    list.innerHTML = result.selectedProjects.map(p => 
        `<li><strong>${p.name}</strong> (Day ${p.start}-${p.end}) - Reward: $${p.reward}</li>`
    ).join('');

    const log = document.getElementById('capacity-log');
    log.innerHTML = result.dailyStats.map(s => `
        <div class="log-entry">
            <span>Day ${s.day}</span>
            <span>Energy: ${s.startEnergy} → ${s.endEnergy}</span>
            <span style="color: var(--accent-copper)">Cost: -${s.dailyCost}</span>
        </div>
    `).join('');
}
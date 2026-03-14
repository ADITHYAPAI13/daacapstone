document.getElementById('add-project').addEventListener('click', () => {
    const row = document.querySelector('.project-row').cloneNode(true);
    row.querySelectorAll('input').forEach(input => input.value = '');
    document.getElementById('project-inputs').appendChild(row);
});

document.getElementById('calculate-btn').addEventListener('click', startOptimization);

function startOptimization() {
    // 1. Data Collection & Sanitization
    const projects = Array.from(document.querySelectorAll('.project-row')).map((row, index) => ({
        id: index,
        name: row.querySelector('.p-name').value || `Task ${index + 1}`,
        start: parseInt(row.querySelector('.p-start').value),
        end: parseInt(row.querySelector('.p-end').value),
        cost: parseInt(row.querySelector('.p-cost').value),
        reward: parseInt(row.querySelector('.p-reward').value)
    })).filter(p => !isNaN(p.start) && !isNaN(p.reward) && p.reward > 0);

    if (projects.length === 0) {
        alert("Please enter valid project data.");
        return;
    }

    const maxDay = Math.max(...projects.map(p => p.end), 0);
    
    /**
     * DAA ALGORITHM: Power Set Exploration with Feasibility Constraint
     * We evaluate every possible combination of projects (2^N)
     * and validate each against the Dynamic Capacity Rule (+80 recharge).
     */
    const getAllCombinations = (arr) => {
        return arr.reduce((subsets, value) => subsets.concat(subsets.map(set => [value, ...set])), [[]]);
    };

    const projectCombinations = getAllCombinations(projects);
    let bestSchedule = { totalReward: 0, selectedProjects: [], dailyStats: [] };

    projectCombinations.forEach(subset => {
        const simulation = validateSchedule(subset, maxDay);
        
        if (simulation.isPossible && simulation.totalReward > bestSchedule.totalReward) {
            bestSchedule = simulation;
        }
    });

    displayResults(bestSchedule);
}

/**
 * The State Tracking Engine
 * Simulates daily energy drain and overnight recovery.
 */
function validateSchedule(subset, maxDay) {
    let currentEnergy = 100; // Base Capacity
    let totalReward = 0;
    let dailyStats = [];
    
    // We must check every day from Day 1 to the end of the timeline
    for (let day = 1; day <= maxDay; day++) {
        const activeProjects = subset.filter(p => day >= p.start && day <= p.end);
        const dailyCost = activeProjects.reduce((sum, p) => sum + p.cost, 0);
        
        const startOfDayEnergy = currentEnergy;
        
        // FAIL CONDITION: Cost exceeds available cognitive capacity
        if (dailyCost > startOfDayEnergy) {
            return { isPossible: false, totalReward: -1 };
        }
        
        const endOfDayEnergy = startOfDayEnergy - dailyCost;
        dailyStats.push({
            day,
            start: startOfDayEnergy,
            cost: dailyCost,
            end: endOfDayEnergy
        });
        
        // THE RECHARGE RULE: Recover 80 units, cap at 100
        currentEnergy = Math.min(100, endOfDayEnergy + 80);
    }
    
    totalReward = subset.reduce((sum, p) => sum + p.reward, 0);
    return {
        isPossible: true,
        totalReward,
        selectedProjects: subset,
        dailyStats
    };
}

function displayResults(result) {
    const area = document.getElementById('results-area');
    area.classList.remove('results-hidden');
    area.classList.add('results-visible');
    
    document.getElementById('total-reward-display').innerText = `$${result.totalReward}`;
    
    const list = document.getElementById('selected-projects-list');
    list.innerHTML = result.selectedProjects.length > 0 
        ? result.selectedProjects.map(p => `<li><strong>${p.name}</strong> (Reward: $${p.reward})</li>`).join('')
        : "<li>No valid combination found for this energy limit.</li>";

    const log = document.getElementById('capacity-log');
    log.innerHTML = result.dailyStats.map(s => `
        <div class="log-entry">
            <span>Day ${s.day}</span>
            <span>⚡ ${s.start} → ${s.end}</span>
            <span style="color: var(--accent-copper)">Cost: ${s.cost}</span>
        </div>
    `).join('');
    
    // Smooth scroll to results
    area.scrollIntoView({ behavior: 'smooth' });
}

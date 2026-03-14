/**
 * THE HUSTLE CULTURE - CORE ENGINE (FINAL VERIFIED VERSION)
 * Algorithmic Strategy: Exhaustive State-Space Search (Power Set)
 * Logic: State-Dependent Resource Management with Fatigue Constraints
 */

// 1. UI Handler: Add New Project Rows
document.getElementById('add-project').addEventListener('click', () => {
    const container = document.getElementById('project-inputs');
    const row = document.querySelector('.project-row').cloneNode(true);
    row.querySelectorAll('input').forEach(input => input.value = '');
    container.appendChild(row);
});

// 2. Trigger Optimization
document.getElementById('calculate-btn').addEventListener('click', startOptimization);

function startOptimization() {
    // Collect and Sanitize Inputs
    const projects = Array.from(document.querySelectorAll('.project-row')).map((row, i) => {
        const startRaw = parseInt(row.querySelector('.p-start').value);
        const endRaw = parseInt(row.querySelector('.p-end').value);
        const costRaw = parseInt(row.querySelector('.p-cost').value);
        const rewardRaw = parseInt(row.querySelector('.p-reward').value);

        // LOGICAL SANITIZATION:
        // Converts negative inputs to absolute positives.
        // Ensures end day is never before start day.
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

    // Determine the timeline length
    const maxDay = Math.max(...projects.map(p => p.end), 0);

    // DAA ALGORITHM: Power Set Generation (2^N)
    // We evaluate every possible combination to guarantee the GLOBAL OPTIMUM.
    const combinations = (arr) => arr.reduce((subsets, value) => 
        subsets.concat(subsets.map(set => [value, ...set])), [[]]
    );
    
    const allPossibleSchedules = combinations(projects);
    let bestResult = { revenue: 0, subset: [], log: [] };

    // Simulation Loop
    allPossibleSchedules.forEach(subset => {
        const simResult = simulate(subset, maxDay);
        // Only keep the result if it's feasible and pays more than current best
        if (simResult.isValid && simResult.revenue > bestResult.revenue) {
            bestResult = simResult;
        }
    });

    if (bestResult.revenue === 0) {
        alert("Feasibility Error: No combination is possible without burnout. Try reducing daily costs.");
    }

    displayResults(bestResult);
}

/**
 * THE CORE SIMULATOR (Fatigue & Recovery Logic)
 * Verifies if a worker can survive a specific project combination.
 */
function simulate(subset, maxDay) {
    let currentEnergy = 100; // Starting Capacity
    let dailyLog = [];

    for (let day = 1; day <= maxDay; day++) {
        // Find projects active on this specific day
        const active = subset.filter(p => day >= p.start && day <= p.end);
        const dailyCost = active.reduce((sum, p) => sum + p.cost, 0);
        
        const energyAtStart = currentEnergy;
        
        // FAIL CONDITION: If work cost exceeds current energy, the schedule is invalid.
        if (dailyCost > energyAtStart) return { isValid: false };
        
        // WORK PHASE: Energy drains
        const energyAfterWork = energyAtStart - dailyCost;
        
        // RECHARGE PHASE: Recover +60 units overnight (capped at 100)
        // Note: Using 60 instead of 80 to make "Tough Values" more challenging.
        const energyAfterRest = Math.min(100, energyAfterWork + 60); 

        dailyLog.push({ 
            day, 
            start: energyAtStart, 
            cost: dailyCost, 
            end: energyAfterWork,
            recharged: energyAfterRest
        });

        currentEnergy = energyAfterRest; // Carry over to next day
    }

    const totalRevenue = subset.reduce((sum, p) => sum + p.reward, 0);
    return { isValid: true, revenue: totalRevenue, subset, log: dailyLog };
}

/**
 * UI RENDERING
 * Injects the results into the glassmorphism dashboard.
 */
function displayResults(res) {
    const area = document.getElementById('results-area');
    area.className = 'results-visible';
    
    // Update Total Revenue
    document.getElementById('total-reward-display').innerText = `$${res.revenue.toLocaleString()}`;
    
    // Update Selected Projects List
    const list = document.getElementById('selected-projects-list');
    list.innerHTML = res.subset.length > 0 
        ? res.subset.map(p => `
            <li>
                <strong>${p.name}</strong><br>
                <small>Reward: $${p.reward} | Impact: ${p.cost}u/day</small>
            </li>`).join('')
        : "<li>No valid schedule found.</li>";

    // Update Energy Log with Visual Cues
    const log = document.getElementById('capacity-log');
    log.innerHTML = res.log.map(s => `
        <div class="log-entry">
            <span>Day ${s.day}</span>
            <span style="color:var(--sage)">⚡ ${s.start} → ${s.end}</span>
            <span style="color:var(--accent-copper)">-${s.cost}u</span>
        </div>
    `).join('');
    
    // Scroll smoothly to results
    area.scrollIntoView({ behavior: 'smooth' });
}

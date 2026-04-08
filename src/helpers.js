const VOWELS = 'aeiou';
const CONSONANTS = 'bcdfghjklmnpqrstvwxyz';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function formatCR(amount, symbol = '₹') {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (amount < 0) return `(${symbol}${formatted})`;
  return `${symbol}${formatted}`;
}

export function generateName(existingNames) {
  let attempts = 0;
  while (attempts < 1000) {
    attempts++;
    let name = '';
    for (let i = 0; i < 5; i++) {
      const pool = i % 2 === 0 ? CONSONANTS : VOWELS;
      name += pool[Math.floor(Math.random() * pool.length)];
    }
    name = name[0].toUpperCase() + name.slice(1);
    const initial = LETTERS[Math.floor(Math.random() * 26)];
    const fullName = `${name} ${initial}.`;
    if (!existingNames.has(fullName)) return fullName;
  }
  return `Agent ${Math.floor(Math.random() * 9999)}`;
}

export function generateCompanyName() {
  let name = '';
  for (let i = 0; i < 7; i++) {
    const pool = i % 2 === 0 ? CONSONANTS : VOWELS;
    name += pool[Math.floor(Math.random() * pool.length)];
  }
  return name[0].toUpperCase() + name.slice(1);
}

function weightedRandom(weights) {
  let r = Math.random();
  for (const [value, prob] of weights) {
    r -= prob;
    if (r <= 0) return value;
  }
  return weights[weights.length - 1][0];
}

export function generatePersonality() {
  const salaryPriority = weightedRandom([
    [1, 0.05], [2, 0.05],
    [3, 0.20], [4, 0.20], [5, 0.20], [6, 0.20],
    [7, 0.03], [8, 0.03],
    [9, 0.02], [10, 0.02],
  ]);
  const restlessness = weightedRandom([
    [1, 0.05],
    [2, 0.20], [3, 0.20], [4, 0.20], [5, 0.20],
    [6, 0.04], [7, 0.04],
    [8, 0.023], [9, 0.023], [10, 0.024],
  ]);
  return { salaryPriority, restlessness };
}

export function generateInitialEmployees(count) {
  const names = new Set();
  const employees = [];
  for (let i = 0; i < count; i++) {
    const name = generateName(names);
    names.add(name);
    employees.push({
      id: i + 1,
      name,
      salary: 50000,
      previousSalary: 50000,
      status: 'Active',
      joinedWeek: 1,
      assignment: null,
      personality: generatePersonality(),
      happiness: 100,
      lastHappinessUpdate: 1,
    });
  }
  return employees;
}

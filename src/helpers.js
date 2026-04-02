const VOWELS = 'aeiou';
const CONSONANTS = 'bcdfghjklmnpqrstvwxyz';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function formatCR(amount) {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (amount < 0) return `(CR ${formatted})`;
  return `CR ${formatted}`;
}

export function generateName(existingNames) {
  let attempts = 0;
  while (attempts < 1000) {
    attempts++;
    // CVCVC format
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
  // CVCVCVC format
  let name = '';
  for (let i = 0; i < 7; i++) {
    const pool = i % 2 === 0 ? CONSONANTS : VOWELS;
    name += pool[Math.floor(Math.random() * pool.length)];
  }
  return name[0].toUpperCase() + name.slice(1);
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
      role: 'Unassigned',
      status: 'Active',
      joinedWeek: 1,
      assignment: null,
    });
  }
  return employees;
}
